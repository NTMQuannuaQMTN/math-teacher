#!/usr/bin/env node
/**
 * End-to-end API smoke test against a running Worker (default: wrangler dev
 * with OCR_PROVIDER=mock). Exercises the happy path plus the main failure,
 * security, and idempotency paths. Exits non-zero on the first failure.
 *
 *   npm run dev            # in another terminal
 *   npm run smoke          # or: API_URL=http://... node scripts/smoke.mjs
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = process.env.API_URL ?? "http://localhost:8787";
const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(join(here, "../../tools/ocr-eval/fixtures", name));
const token = () => randomBytes(32).toString("base64url");

const deviceA = token();
const deviceB = token();
let passed = 0;

function check(condition, label, detail) {
  if (!condition) {
    console.error(`✗ ${label}`);
    if (detail !== undefined) console.error(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
    process.exit(1);
  }
  passed += 1;
  console.log(`✓ ${label}`);
}

async function call(method, path, { device = deviceA, body, headers = {} } = {}) {
  const res = await fetch(API + path, {
    method,
    body,
    headers: { ...(device ? { authorization: `Bearer ${device}` } : {}), ...headers },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON (image) responses
  }
  return { status: res.status, json, headers: res.headers };
}

function upload(bytes, { device, key = token(), scenario, type = "image/jpeg", source = "camera" } = {}) {
  const form = new FormData();
  form.append("image", new Blob([bytes], { type }), "photo.jpg");
  form.append("source", source);
  const headers = { "Idempotency-Key": key };
  if (scenario) headers["X-Mock-Scenario"] = scenario;
  return call("POST", "/v1/scans", { device, body: form, headers });
}

function png(width, height) {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]).copy(b);
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

// --- health & auth --------------------------------------------------------
check((await call("GET", "/health", { device: null })).status === 200, "health endpoint responds");
const noAuth = await call("GET", "/v1/scans", { device: null });
check(noAuth.status === 401 && noAuth.json?.error?.code === "unauthorized", "requests without a device token are rejected");
check((await call("GET", "/v1/scans", { device: "short" })).status === 401, "malformed device tokens are rejected");

// --- happy path: upload → OCR → confirm → history --------------------------
const key = token();
const created = await upload(fixture("02-quadratic-vi.jpg"), { key });
check(created.status === 201, "upload returns 201", created.json);
const scan = created.json.scan;
check(scan.status === "draft" && scan.ocr && scan.ocr.formattedText.length > 0, "new scan is a draft with OCR text", scan);
check(scan.ocr.provider === "mock", "mock provider is clearly labelled");
check(scan.image.width === 1406 && scan.image.height === 342, "server reads real image dimensions");
check(!("owner_id" in scan) && !JSON.stringify(scan).includes("scans/"), "response leaks no owner id or storage key");

const img = await fetch(scan.image.url);
check(img.status === 200 && img.headers.get("content-type") === "image/jpeg", "signed image URL serves the image");
check(img.headers.get("x-content-type-options") === "nosniff", "image response has nosniff");

const replay = await upload(fixture("02-quadratic-vi.jpg"), { key });
check(replay.status === 200 && replay.json.scan.id === scan.id, "retrying with the same idempotency key returns the same scan");

const drafts = await call("GET", "/v1/scans?status=draft");
check(drafts.json.items.some((s) => s.id === scan.id), "draft appears in the unfinished list");
check(!(await call("GET", "/v1/scans")).json.items.some((s) => s.id === scan.id), "draft is not in history yet");

const emptyConfirm = await call("POST", `/v1/scans/${scan.id}/confirm`, {
  body: JSON.stringify({ text: "   \n " }),
  headers: { "content-type": "application/json" },
});
check(emptyConfirm.status === 400 && emptyConfirm.json.error.code === "empty_text", "empty problem text is rejected");

const tooLong = await call("POST", `/v1/scans/${scan.id}/confirm`, {
  body: JSON.stringify({ text: "x".repeat(6001) }),
  headers: { "content-type": "application/json" },
});
check(tooLong.status === 400 && tooLong.json.error.code === "text_too_long", "overlong problem text is rejected");

const editedText = "Bài 1. Giải phương trình:\n$$x^{2} + 5x + 6 = 0$$\n(đã sửa)";
const confirmed = await call("POST", `/v1/scans/${scan.id}/confirm`, {
  body: JSON.stringify({ text: editedText.normalize("NFD") }),
  headers: { "content-type": "application/json" },
});
check(confirmed.status === 200 && confirmed.json.scan.status === "confirmed", "confirm saves the problem", confirmed.json);
check(confirmed.json.scan.problem.text === editedText, "saved text is NFC-normalized (Vietnamese diacritics preserved)");
check(confirmed.json.scan.problem.edited === true, "edit is recorded");

const history = await call("GET", "/v1/scans?status=confirmed");
check(history.json.items[0]?.id === scan.id, "confirmed problem is at the top of history");
check((await call("GET", `/v1/scans/${scan.id}`)).json.scan.problem.text === editedText, "saved problem can be opened");

const retryConfirmed = await call("POST", `/v1/scans/${scan.id}/ocr`);
check(retryConfirmed.status === 400, "OCR retry is refused for a saved problem");

// --- isolation between devices --------------------------------------------
check((await call("GET", `/v1/scans/${scan.id}`, { device: deviceB })).status === 404, "another device cannot read the scan");
check(
  (await call("POST", `/v1/scans/${scan.id}/confirm`, {
    device: deviceB,
    body: JSON.stringify({ text: "hijack" }),
    headers: { "content-type": "application/json" },
  })).status === 404,
  "another device cannot modify the scan",
);
check((await call("DELETE", `/v1/scans/${scan.id}`, { device: deviceB })).status === 404, "another device cannot delete the scan");
check((await call("GET", "/v1/scans", { device: deviceB })).json.items.length === 0, "another device sees an empty history");
check(
  (await upload(fixture("02-quadratic-vi.jpg"), { key, device: deviceB })).json.scan.id !== scan.id,
  "idempotency keys are scoped per device",
);

// --- invalid uploads ------------------------------------------------------
const notImage = await upload(Buffer.from("<html><script>alert(1)</script></html>"), { type: "image/jpeg" });
check(notImage.status === 415 && notImage.json.error.code === "unsupported_image_type", "a non-image labelled image/jpeg is rejected");
const tiny = await upload(png(40, 40), { type: "image/png" });
check(tiny.status === 400 && tiny.json.error.code === "image_too_small", "a tiny image is rejected");
const huge = await upload(Buffer.alloc(9 * 1024 * 1024, 1));
check(huge.status === 413 && huge.json.error.code === "image_too_large", "an oversized upload is rejected");
const noFile = await call("POST", "/v1/scans", { body: new FormData() });
check(noFile.status === 400 && noFile.json.error.code === "missing_image", "a missing file is rejected");
const badKey = await call("POST", "/v1/scans", { body: new FormData(), headers: { "Idempotency-Key": "bad key!" } });
check(badKey.status === 400, "a malformed idempotency key is rejected");

// --- OCR failure paths & retry --------------------------------------------
const providerErr = await upload(fixture("03-fraction-vi.jpg"), { scenario: "provider_error" });
check(
  providerErr.status === 201 && providerErr.json.scan.ocr === null && providerErr.json.scan.ocrError?.code === "ocr_provider_error",
  "provider error keeps the scan and reports a retryable OCR error",
  providerErr.json,
);
const retried = await call("POST", `/v1/scans/${providerErr.json.scan.id}/ocr`);
check(retried.status === 200 && retried.json.scan.ocr !== null && retried.json.scan.ocrError === null, "OCR retry succeeds on the stored image", retried.json);
check(retried.json.scan.ocrAttempts === 2, "attempts are counted");

const malformed = await upload(fixture("04-exponent-root-en.jpg"), { scenario: "malformed" });
check(malformed.json.scan.ocrError?.code === "ocr_malformed_output", "malformed model output is caught (after one automatic retry)");

const unreadable = await upload(fixture("16-blurry.jpg"), { scenario: "unreadable" });
check(unreadable.json.scan.ocr?.status === "unreadable" && unreadable.json.scan.ocr.rawText === "", "unreadable image is reported, not faked");
const noMath = await upload(fixture("15-not-math.jpg"), { scenario: "no_math" });
check(noMath.json.scan.ocr?.status === "no_math_found", "non-maths image is reported");
const lowQ = await upload(fixture("11-handwritten-vi.jpg"), { scenario: "low_quality" });
check(lowQ.json.scan.ocr?.status === "low_quality" && lowQ.json.scan.ocr.issues.includes("blurry"), "low-quality read is flagged for checking");

// A student can still save a problem by typing it when OCR fails.
const manual = await call("POST", `/v1/scans/${malformed.json.scan.id}/confirm`, {
  body: JSON.stringify({ text: "Simplify $(2^{3} \\cdot 2^{4}) \\div 2^{5}$" }),
  headers: { "content-type": "application/json" },
});
check(manual.status === 200 && manual.json.scan.problem.edited === true, "a problem can be saved by typing it after OCR failed");

// --- concurrency: duplicate in-flight submission ---------------------------
const dupKey = token();
const [first, second] = await Promise.all([
  upload(fixture("07-word-vi.jpg"), { key: dupKey }),
  (async () => {
    await new Promise((r) => setTimeout(r, 300));
    return upload(fixture("07-word-vi.jpg"), { key: dupKey });
  })(),
]);
check(first.status === 201, "first of two concurrent duplicates succeeds");
check(second.status === 409 && second.json.error.code === "ocr_in_progress" && second.json.error.retryable, "concurrent duplicate is told to wait, not processed twice", second.json);
const afterwards = await upload(fixture("07-word-vi.jpg"), { key: dupKey });
check(afterwards.status === 200 && afterwards.json.scan.id === first.json.scan.id, "the duplicate resolves to the original once done");

const [lockA, lockB] = await Promise.all([
  call("POST", `/v1/scans/${lowQ.json.scan.id}/ocr`),
  (async () => {
    await new Promise((r) => setTimeout(r, 200));
    return call("POST", `/v1/scans/${lowQ.json.scan.id}/ocr`);
  })(),
]);
check(lockA.status === 200 && lockB.status === 409, "concurrent OCR retries on one scan are serialized");

// --- signed URL tampering --------------------------------------------------
const signed = new URL(retried.json.scan.image.url);
const forged = new URL(signed);
forged.pathname = `/v1/images/${scan.id}`;
check((await fetch(forged)).status === 403, "a signature cannot be reused for another image");
const expired = new URL(signed);
expired.searchParams.set("exp", "1000");
check((await fetch(expired)).status === 403, "an expired/tampered link is rejected");

// --- pagination -----------------------------------------------------------
const pager = token();
for (const name of ["01-arithmetic-vi.jpg", "05-inequality-vi.jpg", "09-geometry-vi.jpg"]) {
  const s = (await upload(fixture(name), { device: pager })).json.scan;
  await call("POST", `/v1/scans/${s.id}/confirm`, {
    device: pager,
    body: JSON.stringify({ text: s.ocr.formattedText }),
    headers: { "content-type": "application/json" },
  });
}
const page1 = await call("GET", "/v1/scans?limit=2", { device: pager });
check(page1.json.items.length === 2 && page1.json.nextCursor, "first page has a cursor");
check(page1.json.items[0].problem.edited === false, "unedited confirmations are recorded as not edited");
const page2 = await call("GET", `/v1/scans?limit=2&cursor=${page1.json.nextCursor}`, { device: pager });
check(page2.json.items.length === 1 && page2.json.nextCursor === null, "second page completes the list");
check(new Set([...page1.json.items, ...page2.json.items].map((s) => s.id)).size === 3, "pages don't overlap");
check((await call("GET", "/v1/scans?cursor=garbage")).status === 400, "an invalid cursor is rejected");
check((await call("GET", "/v1/scans?limit=500")).status === 400, "an oversized page is rejected");

// --- delete ---------------------------------------------------------------
check((await call("DELETE", `/v1/scans/${scan.id}`)).status === 204, "the owner can delete a problem");
check((await call("GET", `/v1/scans/${scan.id}`)).status === 404, "deleted problem is gone");
check((await fetch(scan.image.url)).status === 404, "deleted problem's image is gone");

console.log(`\nAll ${passed} checks passed against ${API}`);
