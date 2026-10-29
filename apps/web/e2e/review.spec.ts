import path from "node:path";
import { expect, test } from "@playwright/test";

// A tiny valid PNG: the fixture model "reads" it as the notebook work in tests/fixtures/llm/work_ocr.json.
const NOTEBOOK_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFUlEQVR4nGP8//8/AzbAhFV00EoAAFbUAw037MyjAAAAAElFTkSuQmCC";

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
  await expect(q3.getByText(/Bài kết hợp nhiều chủ đề/)).toBeVisible();

  await q3.getByRole("link", { name: "Mở câu hỏi" }).click();
  await expect(page.getByRole("heading", { name: "Câu 3" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Giải bài" })).toBeEnabled();
});

test("confirm all confirms clean questions and points at the ones with errors", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  await expect(page.locator("article")).toHaveCount(4, { timeout: 20_000 });

  await page.getByRole("button", { name: "Xác nhận tất cả (4)" }).first().click();
  await expect(page.getByRole("status")).toContainText("Đã xác nhận 3 câu");
  await expect(page.getByRole("status")).toContainText("Câu 3");
  await expect(page.getByText("đã xác nhận 3/4")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xác nhận tất cả (1)" }).first()).toBeVisible();

  // Step 2 shows only the questions (no page image); clicking an unconfirmed one goes back to fix it.
  await page.getByRole("tab", { name: "2. Kiểm tra & xác nhận" }).click();
  await expect(page.getByAltText("Ảnh gốc trang 1")).toHaveCount(0);
  const checkList = page.getByRole("region", { name: "Kiểm tra và xác nhận" });
  await checkList.getByRole("button").filter({ hasText: "Câu 3" }).click();
  await expect(page.getByRole("tab", { name: "1. Đối chiếu với ảnh" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByAltText("Ảnh gốc trang 1")).toBeVisible();

  // A confirmed question opens its workspace by clicking the question itself.
  await page.getByRole("tab", { name: "2. Kiểm tra & xác nhận" }).click();
  await checkList.getByRole("link").filter({ hasText: "Câu 1" }).click();
  await page.waitForURL(/\/questions\//);
  await expect(page.getByRole("heading", { name: "Câu 1" })).toBeVisible();
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

test("confirmed question → solve → hints first → full verified solution", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  const q1 = page.locator("article").filter({ has: page.getByRole("heading", { name: "Câu 1" }) });
  await expect(q1).toBeVisible({ timeout: 20_000 });
  await q1.getByRole("button", { name: "Xác nhận đúng" }).click();
  await q1.getByRole("link", { name: "Mở câu hỏi" }).click();

  await page.getByRole("button", { name: "Giải bài" }).click();

  // Hints come first; the full solution is withheld until the student asks for it.
  await expect(page.getByRole("heading", { name: "Gợi ý" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Đã kiểm chứng", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem lời giải đầy đủ" })).toBeDisabled();
  await expect(page.getByText("(x-2)(x-3)")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem gợi ý đầu tiên" }).click();
  await expect(page.getByText("Gợi ý 1 · Kiến thức cần dùng")).toBeVisible();
  await page.getByRole("button", { name: "Xem gợi ý tiếp theo (2/3)" }).click();
  await expect(page.getByText("Gợi ý 2 · Điều cần nhận ra")).toBeVisible();

  // Self-practice: the tutor checks the student's steps and gives the next hint, without the answer.
  await expect(page.getByRole("heading", { name: "Tự làm bài" })).toBeVisible();
  const tutor = page.locator("section").filter({ has: page.getByRole("heading", { name: "Tự làm bài" }) });
  // Symbol bar: inserts at the cursor, wraps in $…$, and the preview renders it.
  await expect(tutor.getByText("Bài làm sẽ hiển thị ở đây khi em gõ.")).toBeVisible();
  await tutor.getByRole("button", { name: "Chèn căn bậc hai" }).click();
  await page.keyboard.type("x+1");
  await page.keyboard.press("ArrowRight"); // out of the braces, still inside $…$
  await tutor.getByRole("tab", { name: "So sánh, chia hết" }).click();
  await tutor.getByRole("button", { name: "Chèn lớn hơn hoặc bằng" }).click();
  const workBox = page.getByLabel("Bài làm", { exact: true });
  await expect(workBox).toHaveValue("$\\sqrt{x+1}\\ge $");
  await expect(tutor.locator(".katex .sqrt")).toBeVisible();
  // A photo of notebook work is read into the box (appended); unclear readings block sending until fixed or confirmed.
  await tutor.getByLabel("Tải ảnh bài làm").setInputFiles({ name: "vo.png", mimeType: "image/png", buffer: Buffer.from(NOTEBOOK_PNG, "base64") });
  await expect(workBox).toHaveValue(/Ta có \$x\^2 - 5x \+ 6 = 0\$\n.*\\unclear\{3\}/);
  await expect(tutor.getByRole("img", { name: "Ảnh bài làm em vừa tải lên" })).toBeVisible();
  await expect(tutor.getByText("Còn 1 chỗ chép chưa chắc (tô vàng).", { exact: false })).toBeVisible();
  await expect(tutor.getByRole("button", { name: "Gửi bài làm" })).toBeDisabled();
  await tutor.getByRole("button", { name: "Các chỗ tô vàng đã đúng" }).click();
  await expect(workBox).toHaveValue(/\(x-3\) = 0\$$/);
  await expect(tutor.getByRole("button", { name: "Gửi bài làm" })).toBeEnabled();
  await workBox.fill("Ta có $x^2 - 5x + 6 = 0$ nên $(x-2)(x-3) = 0$.");
  await page.getByRole("button", { name: "Gửi bài làm" }).click();
  await expect(page.getByText("Gợi ý cho bước tiếp theo")).toBeVisible();
  await expect(page.getByText(/bước biến đổi đã được kiểm tra bằng công cụ/)).toBeVisible();
  await expect(page.getByLabel("correct")).toHaveCount(2);

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Xem lời giải đầy đủ" }).click();
  await expect(page.getByRole("heading", { name: "Lời giải" })).toBeVisible();
  await expect(page.getByText("Đúng chương trình lớp 9")).toBeVisible();
  await expect(page.getByText("Ý tưởng chính")).toBeVisible();
  await expect(page.locator("ol li .math-text").filter({ hasText: "Ta có" })).toBeVisible();
  await expect(page.getByText("Kết luận")).toBeVisible();
  await expect(page.getByText("Các gợi ý đã xem (2)")).toBeVisible();

  await page.getByText("Bằng chứng kiểm chứng").click();
  await expect(page.getByText(/Giải bằng SymPy: đúng 2 nghiệm/)).toBeVisible();

  // The reveal is remembered by the server.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Lời giải" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Giải lại" })).toBeEnabled();
});

test("an unconfirmed question cannot be solved", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  const q2 = page.locator("article").filter({ has: page.getByRole("heading", { name: "Câu 2" }) });
  await expect(q2).toBeVisible({ timeout: 20_000 });
  const href = await page.evaluate(() => window.location.pathname);
  const docId = href.split("/").pop();
  const questions = await page.request.get(`/api/v1/documents/${docId}`);
  const q2id = (await questions.json()).questions[1].id as string;
  await page.goto(`/questions/${q2id}`);
  await expect(page.getByRole("button", { name: "Giải bài" })).toBeDisabled();
  await expect(page.getByText("Hãy xác nhận đề bài đúng trước khi giải.")).toBeVisible();
});

test("geometry question → interactive figure that keeps its constraints while dragging", async ({ page }) => {
  await page.goto("/upload");
  await page.setInputFiles("input[type=file]", path.join(FIXTURES, "synthetic_page1.png"));
  await page.getByRole("button", { name: "Nhận dạng đề" }).click();
  await page.waitForURL(/\/documents\//);
  await expect(page.locator("article").first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "+ Thêm câu bị thiếu" }).click();
  const manual = page.locator("article").filter({ hasText: "thêm thủ công" });
  await manual.getByRole("button", { name: "Sửa" }).click();
  await manual.getByLabel("Đề bài (LaTeX)").fill(
    "Cho tam giác ABC nội tiếp đường tròn $(O)$, $M$ là trung điểm của $BC$. Chứng minh $OM \\perp BC$.");
  await manual.getByRole("button", { name: "Lưu và xác nhận" }).click();
  await expect(manual.getByText("Đã xác nhận")).toBeVisible();
  await manual.getByRole("button", { name: "Hình học" }).click();
  await expect(manual.getByRole("button", { name: "Hình học" })).toHaveAttribute("aria-pressed", "true");
  await manual.getByRole("link", { name: "Mở câu hỏi" }).click();

  await expect(page.getByRole("heading", { name: "Hình vẽ" })).toBeVisible();
  await page.getByRole("button", { name: "Vẽ hình" }).click();
  const board = page.getByRole("figure", { name: "Hình vẽ tương tác" });
  await expect(board.locator("ellipse").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("✓ OM ⊥ BC")).toBeVisible();

  // Drag the first free point (A): the figure is recomputed and the theorem still holds on the new figure.
  // JSXGraph draws circles as <ellipse> too (on a lower layer): the first *small* ellipse is the first free point.
  const radii = await board.locator("ellipse").evaluateAll((els) => els.map((e) => Number(e.getAttribute("rx"))));
  const pointA = board.locator("ellipse").nth(radii.findIndex((r) => r < 15));
  const before = await pointA.boundingBox();
  await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
  await page.mouse.down();
  await page.mouse.move(before!.x + 60, before!.y + 40, { steps: 8 });
  // No coordinate popup while dragging or hovering a point.
  await expect(board.locator(".JXGinfobox")).toBeHidden();
  await page.mouse.up();
  await expect(board.locator(".JXGinfobox")).toBeHidden();
  const after = await pointA.boundingBox();
  expect(Math.abs(after!.x - before!.x) + Math.abs(after!.y - before!.y)).toBeGreaterThan(20);
  await expect(page.getByText("✓ OM ⊥ BC")).toBeVisible();
  await expect(page.getByText(/Hình suy biến/)).toHaveCount(0);

  // "Vẽ lại hình" draws the figure again from a fresh reading of the problem.
  await page.getByRole("button", { name: "Vẽ lại hình" }).click();
  await expect(board.locator("ellipse").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("✓ OM ⊥ BC")).toBeVisible();
});
