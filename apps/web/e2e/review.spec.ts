import path from "node:path";
import { expect, test } from "@playwright/test";

const FIXTURES = path.resolve(import.meta.dirname, "../../../services/api/tests/fixtures/ocr/images");

test("session cookie is httpOnly and API secret never reaches the page", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tài liệu của bạn" })).toBeVisible();
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === "mt_session");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("mt_session");
  expect(await page.content()).not.toContain("e2e-gateway-secret");
});

test("upload → review → fix unclear notation → confirm → workspace", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);

  const q3 = page.locator("article").filter({ has: page.getByRole("heading", { name: "Câu 3" }) });
  await expect(q3).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("article")).toHaveCount(4);
  await expect(q3.getByText("Cần sửa")).toBeVisible();
  await expect(q3.getByText(/ký hiệu chưa đọc rõ/)).toBeVisible();
  await expect(q3.locator(".katex .colorbox").first()).toBeVisible();
  await expect(q3.getByRole("button", { name: "Xác nhận đúng" })).toBeDisabled();

  // The page image and a region overlay for each question are shown.
  await expect(page.getByAltText("Ảnh gốc trang 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn Câu 3" })).toBeVisible();

  await q3.getByRole("button", { name: "Sửa" }).click();
  const textarea = q3.getByLabel("Đề bài (LaTeX)");
  const value = await textarea.inputValue();
  await textarea.fill(value.replace("\\unclear{2}", "2"));
  await expect(q3.getByText("Xem trước")).toBeVisible();
  await q3.getByRole("button", { name: "Lưu và xác nhận" }).click();
  await expect(q3.getByText("Đã xác nhận")).toBeVisible();
  await expect(q3.locator(".katex").first()).toBeVisible();

  // Topic chips are editable (mixed topics allowed).
  await q3.getByRole("button", { name: "Đại số" }).click();
  await expect(q3.getByRole("button", { name: "Đại số" })).toHaveAttribute("aria-pressed", "true");
  await expect(q3.getByText("Bài kết hợp nhiều chủ đề.")).toBeVisible();

  await q3.getByRole("link", { name: "Mở câu hỏi" }).click();
  await expect(page.getByRole("heading", { name: "Câu 3" })).toBeVisible();
  await page.getByRole("button", { name: "Giải bài" }).click();
  await expect(page.getByText("Chức năng giải bài sẽ có trong Phase 3.")).toBeVisible();
});

test("invalid LaTeX blocks confirmation and shows Vietnamese errors", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page2.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  const q1 = page.locator("article").filter({ has: page.getByRole("heading", { name: "Câu 1" }) });
  await expect(q1).toBeVisible({ timeout: 20_000 });
  await q1.getByRole("button", { name: "Sửa" }).click();
  await q1.getByLabel("Đề bài (LaTeX)").fill("Giải phương trình $\\frac{1}{x$");
  await expect(q1.getByText(/ngoặc nhọn|Không hiển thị được công thức|Thiếu/).first()).toBeVisible();
  await expect(q1.getByRole("button", { name: "Lưu và xác nhận" })).toBeDisabled();
});

test("unsupported file shows a Vietnamese error", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", {
    name: "not-an-image.png",
    mimeType: "image/png",
    buffer: Buffer.from("GIF89a definitely not a png"),
  });
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await expect(page.getByText(/Định dạng tệp không được hỗ trợ/)).toBeVisible();
});

test("another user cannot open my document", async ({ page, browser }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_exam.pdf"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  const url = page.url();
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.goto(url);
  await expect(strangerPage.getByText("Không tìm thấy tài liệu.")).toBeVisible();
  await stranger.close();
});

test("usage and admin dashboards render", async ({ page }) => {
  await page.goto("/usage");
  await expect(page.getByRole("heading", { name: "Sử dụng AI hôm nay" })).toBeVisible();
  await expect(page.getByText("Trạng thái:")).toBeVisible();
  await page.goto("/admin/usage");
  await expect(page.getByRole("heading", { name: "Chi phí AI" })).toBeVisible();
});

test("review page fits a phone screen @mobile", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  await expect(page.locator("article").first()).toBeVisible({ timeout: 20_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
