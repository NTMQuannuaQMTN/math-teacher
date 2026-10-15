# Đại số — vòng 3

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/1` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 2 | `ptnk-2023-chuyen/2a` | luyện | default | kiểm chứng một phần | đúng 7/10 | 214 s | $0.0492 |
| 3 | `ptnk-2024-chuyen/1.1` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 1 s | $0.0001 |
| 4 | `ptnk-2024-chuyen/2` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 30 s | $0.0061 |
| 5 | `hcm-2025-chuyen/1a` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 28 s | $0.0083 |
| 6 | `hcm-2025-chuyen/1b` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 5 s | $0.0013 |
| 7 | `hcm-2025-chuyen/2a` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 38 s | $0.0128 |
| 8 | `hanoi-2025-chuyen/I.2` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 1 s | $0.0003 |
| 9 | `hanoi-2025-chuyen/III.1b` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 8 s | $0.0015 |
| 10 | `khtn-2025-vong2/I.1` | luyện | default | máy không kiểm chứng được | đúng (đáp số) 6/10 | 0 s | $0 |
| 11 | `khtn-2025-vong2/I.2` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | một phần 4/10 | 0 s | $0 |
| 12 | `ptnk-2026-chuyen/1` | luyện | default | kiểm chứng một phần | đúng 7/10 | 209 s | $0.0479 |
| 13 | `alg8-h1` | kiểm tra (mới) | deterministic-algebra | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 14 | `alg8-h2` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 1 s | $0 |
| 15 | `alg8-h3` | kiểm tra (mới) | nvidia/nemotron-3-super-120b-a12b:free | đã kiểm chứng bằng máy | đúng 8/10 | 120 s | $0 |
| 16 | `alg8-h4` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 43 s | $0.0145 |
| 17 | `alg8-h5` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 0 s | $0 |
| 18 | `alg8-h7` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 19 s | $0.0062 |
| 19 | `alg8-h8` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 29 s | $0.0107 |
| 20 | `alg8-h6` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 0 s | $0 |

## Câu 1 — `ptnk-2023-chuyen/1`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}(x+y)\left(4+\frac{1}{xy}\right)=1\\ \left(4x+\frac{1}{x}\right)\left(4y+\frac{1}{y}\right)=-20\end{cases}$.

**Đáp án tham khảo** (official): $(x,y)\in\{(1,-\tfrac12),(\tfrac14,-\tfrac12),(-\tfrac12,1),(-\tfrac12,\tfrac14)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đặt ẩn phụ $u = 4x + 1/x$ và $v = 4y + 1/y$ để biến đổi hệ phương trình thành hệ đối xứng mới, sau đó giải tìm $u, v$ và cuối cùng tìm $x, y$.
1. **Xác định điều kiện xác định** — Đầu tiên, ta xác định điều kiện xác định của hệ phương trình. Vì các phân thức có mẫu là $x$ và $y$, nên $x$ và $y$ khác 0.

   $$
   x \neq 0, y \neq 0
   $$
   *Lí do:* Điều kiện xác định của phân thức.
2. **Đặt ẩn phụ và biến đổi hệ phương trình** — Ta đặt ẩn phụ để đơn giản hóa hệ phương trình. Đặt $u = 4x + \frac{1}{x}$ và $v = 4y + \frac{1}{y}$. Khi đó, ta có $u + v = 4x + \frac{1}{x} + 4y + \frac{1}{y} = 4(x+y) + \frac{1}{x} + \frac{1}{y}$. Phương trình thứ nhất của hệ là $(x+y)(4 + \frac{1}{xy}) = 4(x+y) + \frac{x+y}{xy} = 4(x+y) + \frac{1}{y} + \frac{1}{x}$. Vậy phương trình thứ nhất chính là $u + v = 1$. Phương trình thứ hai là $uv = -20$. Ta có hệ mới: $\begin{cases} u + v = 1 \\ uv = -20 \end{cases}$.

   $$
   \begin{cases} u + v = 1 \\ uv = -20 \end{cases}
   $$
   *Lí do:* Đặt ẩn phụ và biến đổi đại số.
3. **Giải hệ phương trình mới** — Từ hệ $\begin{cases} u + v = 1 \\ uv = -20 \end{cases}$, theo định lý Vi-ét đảo, $u$ và $v$ là nghiệm của phương trình bậc hai $T^2 - T - 20 = 0$. Phương trình này có $\Delta = (-1)^2 - 4(1)(-20) = 81 > 0$, nên có hai nghiệm phân biệt $T_1 = 5$ và $T_2 = -4$. Vậy ta có hai trường hợp: $\begin{cases} u = 5 \\ v = -4 \end{cases}$ hoặc $\begin{cases} u = -4 \\ v = 5 \end{cases}$.

   $$
   T^2 - T - 20 = 0 \Rightarrow T_1 = 5, T_2 = -4
   $$
   *Lí do:* Định lý Vi-ét đảo.
4. **Tìm x và y từ u và v** — Ta xét từng trường hợp để tìm $x$ và $y$.
Trường hợp 1: $u = 5$ và $v = -4$.
$u = 5 \Rightarrow 4x + \frac{1}{x} = 5 \Leftrightarrow 4x^2 - 5x + 1 = 0$. Phương trình này có $1 + (-5) + 4 = 0$ nên có hai nghiệm $x_1 = 1$ và $x_2 = 1/4$.
$v = -4 \Rightarrow 4y + \frac{1}{y} = -4 \Leftrightarrow 4y^2 + 4y + 1 = 0 \Leftrightarrow (2y+1)^2 = 0$ nên có nghiệm kép $y = -1/2$.
Vậy ta được hai nghiệm $(x, y) = (1; -1/2)$ và $(1/4; -1/2)$.
Trường hợp 2: $u = -4$ và $v = 5$.
Tương tự, ta tìm được $x = -1/2$ và $y \in \{1; 1/4\}$.
Vậy ta được hai nghiệm $(x, y) = (-1/2; 1)$ và $(-1/2; 1/4)$.

   $$
   \begin{cases} 4x^2 - 5x + 1 = 0 \\ 4y^2 + 4y + 1 = 0 \end{cases} \text{ hoặc } \begin{cases} 4x^2 + 4x + 1 = 0 \\ 4y^2 - 5y + 1 = 0 \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai.
5. **Kết luận** — Tất cả các nghiệm tìm được đều thỏa mãn điều kiện $x \neq 0$ và $y \neq 0$. Vậy hệ phương trình có 4 nghiệm như trên.

   $$
   x \neq 0, y \neq 0
   $$
   *Lí do:* Kiểm tra điều kiện xác định.

**Kết luận của ứng dụng:** Hệ phương trình có 4 nghiệm:
(x; y) = (-1/2; 1/4)
(x; y) = (-1/2; 1)
(x; y) = (1/4; -1/2)
(x; y) = (1; -1/2)

$$
\left\{\begin{matrix} (x;y) = (-1/2; 1/4) \\ (x;y) = (-1/2; 1) \\ (x;y) = (1/4; -1/2) \\ (x;y) = (1; -1/2) \end{matrix}\right.
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Như vòng 1 (lấy từ bộ nhớ đệm): đúng 4 nghiệm, lập luận đủ.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Như vòng 1

---

## Câu 2 — `ptnk-2023-chuyen/2a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho $a,b,c$ là các số thực dương thỏa mãn $ab+bc+ca=abc$. Chứng minh $\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 214 s · *Chi phí:* $0.0492

**Hướng giải:** Mình sẽ hướng dẫn bạn biến đổi điều kiện đã cho thành tổng các bình phương bằng 1, sau đó đặt ẩn phụ để áp dụng bất đẳng thức Bunhiacopxki.
1. **Biến đổi điều kiện đã cho** — Mình gợi ý bạn thử chia cả hai vế của phương trình $ab+bc+ca=abc$ cho $abc$ xem kết quả sẽ như thế nào nhé.

   $$
   \frac{1}{a} + \frac{1}{b} + \frac{1}{c} = 1
   $$
   *Lí do:* Phép chia hai vế cho $abc$ (vì $a,b,c > 0$)
2. **Đặt ẩn phụ** — Để ý rằng $\frac{1}{a} = \left(\frac{1}{\sqrt{a}}\right)^2$. Mình nghĩ bạn nên đặt $x = \frac{1}{\sqrt{a}}$, $y = \frac{1}{\sqrt{b}}$, $z = \frac{1}{\sqrt{c}}$ để bài toán gọn hơn.

   $$
   x^2 + y^2 + z^2 = 1
   $$
   *Lí do:* Thay ẩn phụ vào điều kiện vừa tìm được
3. **Áp dụng bất đẳng thức Bunhiacopxki** — Bây giờ ta cần chứng minh $x+y+z \le \sqrt{3}$. Bạn nhớ lại bất đẳng thức Bunhiacopxki cho 3 số $x, y, z$ với các hệ số $1, 1, 1$ nhé.

   $$
   (x+y+z)^2 \le (1^2+1^2+1^2)(x^2+y^2+z^2) = 3
   $$
   *Lí do:* Bất đẳng thức Bunhiacopxki (Cauchy-Schwarz)
4. **Kết luận** — Từ bước trên, bạn lấy căn hai vế để tìm ra kết quả cuối cùng. Dấu bằng xảy ra khi $x=y=z$, tức là $a=b=c=3$.

   $$
   \frac{1}{\sqrt{a}} + \frac{1}{\sqrt{b}} + \frac{1}{\sqrt{c}} \le \sqrt{3}
   $$
   *Lí do:* Lấy căn hai vế và thay lại $x, y, z$

**Kết luận của ứng dụng:** Ta đã chứng minh được $\frac{1}{\sqrt{a}} + \frac{1}{\sqrt{b}} + \frac{1}{\sqrt{c}} \le \sqrt{3}$. Dấu "=" xảy ra khi và chỉ khi $a=b=c=3$.

$$
\frac{1}{\sqrt{a}} + \frac{1}{\sqrt{b}} + \frac{1}{\sqrt{c}} \le \sqrt{3}
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Chứng minh đúng; trạng thái “một phần”. Cần bạn xem còn dùng chữ “vectơ” hay không.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Như vòng 1

---

## Câu 3 — `ptnk-2024-chuyen/1.1`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}x^3+z^3=y\\ y^3+x^3=z\\ z^3+y^3=x\end{cases}$.

**Đáp án tham khảo** (official): $x=y=z\in\{0;\tfrac{1}{\sqrt2};-\tfrac{1}{\sqrt2}\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 1 s · *Chi phí:* $0.0001

**Hướng giải:** Trừ vế theo vế các phương trình trong hệ để tìm mối liên hệ giữa các biến, chứng minh rằng $x=y=z$, sau đó thay vào một phương trình để giải tìm nghiệm.
1. **Trừ vế theo vế** — Trừ vế theo vế phương trình (1) và (2) để loại bỏ $x^3$ và tìm mối liên hệ giữa $y$ và $z$.

   $$
   (x^3+z^3) - (y^3+x^3) = y - z \Rightarrow z^3 - y^3 = y - z
   $$
   *Lí do:* Trừ vế theo vế
2. **Phân tích nhân tử** — Phân tích nhân tử để đưa về dạng tích, từ đó suy ra $x=y=z$.

   $$
   (z-y)(z^2+zy+y^2) = -(z-y)
   $$
   *Lí do:* Hằng đẳng thức $a^3-b^3$ và biến đổi đại số
3. **Chứng minh x=y=z** — Chứng minh $x=y=z$ bằng cách xét các trường hợp.

   $$
   x=y=z
   $$
   *Lí do:* Xét trường hợp $z=y$ và $z \neq y$ để suy ra $x=y=z$
4. **Giải phương trình một ẩn** — Thay $y=x$ và $z=x$ vào phương trình đầu tiên để giải phương trình một ẩn.

   $$
   x^3+x^3=x \Rightarrow 2x^3-x=0 \Rightarrow x(2x^2-1)=0
   $$
   *Lí do:* Thay thế và giải phương trình bậc hai
5. **Kết luận** — Kết luận các nghiệm của hệ phương trình.

   $$
   (0; 0; 0); \left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right); \left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right)
   $$
   *Lí do:* Tổng hợp các nghiệm tìm được

**Kết luận của ứng dụng:** Hệ phương trình có 3 nghiệm:
(0; 0; 0)
$\left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right)$
$\left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right)$

$$
(0; 0; 0); \left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right); \left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right)
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Đúng ba nghiệm, máy kiểm chứng; không còn bị gắn cờ “định thức” sai (sửa #3).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Như vòng 1

---

## Câu 4 — `ptnk-2024-chuyen/2`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho ba số thực $a,b,c$ không âm thỏa mãn $a^2+b^2+c^2+3=2(ab+bc+ca)$. Chứng minh $3\le a+b+c\le\frac{2(ab+bc+ca)+3}{3}$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 30 s · *Chi phí:* $0.0061

**Hướng giải:** Mình sẽ đặt $S=a+b+c$ và $P=ab+bc+ca$ để đơn giản hóa điều kiện đã cho. Sau đó, mình sẽ chứng minh hai vế của bất đẳng thức bằng cách thay $P$ vào và sử dụng các bất đẳng thức cơ bản quen thuộc.
1. **Đặt ẩn phụ và biến đổi điều kiện** — Mình sẽ đặt $S = a+b+c$ và $P = ab+bc+ca$ để bài toán gọn hơn. Bạn hãy dùng hằng đẳng thức $(a+b+c)^2$ để viết lại $a^2+b^2+c^2$ theo $S$ và $P$, rồi thay vào giả thiết.

   $$
   S^2 = a^2+b^2+c^2+2P \Rightarrow a^2+b^2+c^2 = S^2-2\text{ P. Thay vào giả thiết: } S^2-2P+3=2P \Leftrightarrow S^2+3=4P.
   $$
   *Lí do:* Hằng đẳng thức $(a+b+c)^2$ và biến đổi đại số.
2. **Chứng minh bất đẳng thức phải** — Bây giờ ta chứng minh $S \le \frac{2P+3}{3}$. Bạn hãy thay $P = \frac{S^2+3}{4}$ từ bước 1 vào vế phải, rồi biến đổi tương đương về một hằng đẳng thức luôn đúng.

   $$
   S \le \frac{2(\frac{S^2+3}{4})+3}{3} \Leftrightarrow 3S \le \frac{S^2+3}{2}+3 \Leftrightarrow 6S \le S^2+9 \Leftrightarrow (S-3)^2 \ge 0 \text{ (luôn đúng).}
   $$
   *Lí do:* Biến đổi tương đương và hằng đẳng thức $(A-B)^2 \ge 0$.
3. **Tìm chặn dưới của $ab+bc+ca$** — Để chứng minh $S \ge 3$, trước hết ta cần chặn $ab+bc+ca$. Bạn hãy nhớ lại bất đẳng thức $a^2+b^2+c^2 \ge ab+bc+ca$ và thay nó vào giả thiết ban đầu.

   $$
   a^2+b^2+c^2 \ge ab+bc+ca \Rightarrow (ab+bc+ca)+3 \le a^2+b^2+c^2+3 = 2(ab+bc+ca) \Rightarrow ab+bc+ca \ge 3.
   $$
   *Lí do:* Bất đẳng thức cơ bản (từ tổng các bình phương).
4. **Chứng minh bất đẳng thức trái** — Từ $S^2+3=4P$ ở bước 1, ta có $S^2 = 4(ab+bc+ca)-3$. Kết hợp với kết quả $ab+bc+ca \ge 3$ ở bước 3, bạn hãy tính giá trị nhỏ nhất của $S^2$ rồi suy ra $S$.

   $$
   S^2 = 4(ab+bc+ca)-3 \ge 4(3)-3 = 9 \Rightarrow S \ge 3 \text{ (vì } S=a+b+c \ge 0 \text{).}
   $$
   *Lí do:* Tính chất bảo toàn bất đẳng thức và điều kiện $a,b,c \ge 0$.
5. **Xét dấu bằng** — Cuối cùng, bạn hãy tìm điều kiện để các bất đẳng thức trên xảy ra dấu bằng.

   $$
   \text{ Dấu } "=" \text{ xảy ra khi }  a=b=c  \text{ và  ab }+bc+ca=3 \Rightarrow 3a^2=3 \Rightarrow a=1 . \text{ Vậy }  a=b=c=1 .
   $$
   *Lí do:* Điều kiện dấu bằng của các BĐT đã dùng.

**Kết luận của ứng dụng:** Ta đã chứng minh được $3 \le a+b+c \le \frac{2(ab+bc+ca)+3}{3}$ với mọi $a,b,c \ge 0$ thỏa mãn $a^2+b^2+c^2+3=2(ab+bc+ca)$. Dấu "=" xảy ra khi và chỉ khi $a=b=c=1$.

$$
3 \le a+b+c \le \frac{2(ab+bc+ca)+3}{3}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 1 không có lời giải. Nay: S² + 3 = 4P, (S − 3)² ≥ 0 cho vế phải, ab + bc + ca ≥ 3 cho vế trái, dấu bằng a = b = c = 1. Lỗi trình bày: chữ “P. Thay vào giả thiết” nằm trong công thức.

### Đánh giá của bạn

- Điểm (0–10): 8/10
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Một chút
- Nhận xét: Cảm giác có cách dễ hiểu hơn, nhất là ở vế BĐT phải

---

## Câu 5 — `hcm-2025-chuyen/1a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Với $a,b$ là các số thực dương thỏa mãn $(a+b)(a-b)=1$. Tính giá trị của biểu thức $P=\sqrt{(4a+5)^2+(3b)^2}-\sqrt{(4a-5)^2+(3b)^2}$.

**Đáp án tham khảo** (official): $P=8$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 28 s · *Chi phí:* $0.0083

**Hướng giải:** Biến đổi điều kiện $a^2 - b^2 = 1$ thành phương trình Hyperbol của điểm $M(4a; 3b)$ với tiêu điểm $F_1(-5; 0), F_2(5; 0)$. Áp dụng định nghĩa Hyperbol để tính hiệu khoảng cách $MF_1 - MF_2$.
1. **Biến đổi điều kiện** — Ta biến đổi điều kiện đã cho: $(a+b)(a-b) = a^2 - b^2 = 1$. Đây là phương trình liên hệ giữa $a$ và $b$. Biểu thức $P$ chứa các căn thức dạng $\sqrt{X^2 + Y^2}$, gợi ý đến công thức khoảng cách.

   $$
   a^2 - b^2 = 1
   $$
   *Lí do:* Biến đổi đại số cơ bản
2. **Diễn giải hình học** — Ta nhận thấy các biểu thức trong căn có dạng bình phương của tổng hiệu. Cụ thể, $(4a+5)^2 + (3b)^2$ có thể coi là bình phương khoảng cách từ điểm $M(4a; 3b)$ đến điểm $F_1(-5; 0)$. Tương tự, $(4a-5)^2 + (3b)^2$ là bình phương khoảng cách từ $M$ đến $F_2(5; 0)$.

   $$
   P = MF_1 - MF_2 \text{ với } M(4a; 3b), F_1(-5; 0), F_2(5; 0)
   $$
   *Lí do:* Công thức tính khoảng cách giữa hai điểm trong mặt phẳng tọa độ
3. **Xác định quỹ tích điểm M** — Ta xét điểm $M(4a; 3b)$. Ta kiểm tra xem $M$ có thuộc một đường Hyperbol xác định bởi hai tiêu điểm $F_1, F_2$ không. Phương trình Hyperbol nhận $F_1(-c; 0), F_2(c; 0)$ làm tiêu điểm có dạng $\frac{x^2}{a_{hyp}^2} - \frac{y^2}{b_{hyp}^2} = 1$ với $c^2 = a_{hyp}^2 + b_{hyp}^2$. Ở đây, ta thử đặt $x = 4a$ và $y = 3b$. Khi đó $a = x/4$ và $b = y/3$. Thay vào $a^2 - b^2 = 1$, ta được $\frac{x^2}{16} - \frac{y^2}{9} = 1$. Đây chính là phương trình Hyperbol với $a_{hyp}^2 = 16$ và $b_{hyp}^2 = 9$. Kiểm tra tiêu cự: $c^2 = 16 + 9 = 25 \Rightarrow c = 5$. Vậy tiêu điểm là $F_1(-5; 0)$ và $F_2(5; 0)$, đúng với cách đặt ở bước trên.

   $$
   \frac{(4a)^2}{16} - \frac{(3b)^2}{9} = 1 \iff a^2 - b^2 = 1
   $$
   *Lí do:* Thay thế biến và so sánh với phương trình Hyperbol
4. **Tính giá trị P** — Theo định nghĩa Hyperbol, hiệu khoảng cách từ một điểm bất kỳ trên Hyperbol đến hai tiêu điểm bằng độ dài trục thực $2a_{hyp}$. Ở đây, $a_{hyp} = \sqrt{16} = 4$. Vậy $|MF_1 - MF_2| = 2 \times 4 = 8$. Ta cần xác định dấu của hiệu. Vì $a > 0$ nên $4a > 0$. Khi đó $4a + 5 > 0$ và $4a - 5$ có thể âm hoặc dương. Tuy nhiên, $MF_1 = \sqrt{(4a+5)^2 + 9b^2}$ và $MF_2 = \sqrt{(4a-5)^2 + 9b^2}$. Do $(4a+5)^2 > (4a-5)^2$ (vì $4a > 0$), nên $MF_1 > MF_2$. Do đó $P = MF_1 - MF_2 = 8$.

   $$
   P = 2a_{hyp} = 2 \times 4 = 8
   $$
   *Lí do:* Định nghĩa Hyperbol và tính chất $MF_1 > MF_2$

**Kết luận của ứng dụng:** Giá trị của biểu thức P là 8.

$$
P = 8
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: P = 8, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Một phần
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Hyperbol, elipse, ..., chưa học ở lớp 9

---

## Câu 6 — `hcm-2025-chuyen/1b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Biết $a,b$ là hai nghiệm thực của phương trình $x^2-4x+c=0$ và $-a$ là một nghiệm thực của phương trình $11x^2-x+2c=0$ với $c$ là một số thực khác 0. Tính giá trị của biểu thức $a^{2025}+b^{2025}+c^{2025}$.

**Đáp án tham khảo** (official): $-1$

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Bước giải còn từ “where” trong lời giải chính (không được phép xoá) sau khi sửa ngôn ngữ 5/6 trường.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: student-facing text?

---

## Câu 7 — `hcm-2025-chuyen/2a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Một ô tô và một xe tải chuyển động cùng tốc độ không đổi $a$ (km/h) dọc theo hai con đường giao nhau hướng đến giao lộ ($a>0$). Biết rằng vào các thời điểm 14 giờ và 15 giờ cùng ngày, khoảng cách từ ô tô đến giao lộ đều gấp đôi khoảng cách từ xe tải đến giao lộ. Hỏi xe tải đến giao lộ lúc mấy giờ?

**Đáp án tham khảo** (official): 14 giờ 45 phút

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Bị loại vì tên biến “xeTai” trong công thức bị coi là tiếng Anh — đã sửa (#8) sau vòng này.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không 
- Nhận xét: student-facing text?

---

## Câu 8 — `hanoi-2025-chuyen/I.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho $a,b,c$ là các số thực khác 0, thỏa mãn $a+b+c\ne0$ và $ab+bc+ca=0$. Tính giá trị của biểu thức $P=\frac{1}{a^2-bc}+\frac{1}{b^2-ca}+\frac{1}{c^2-ab}$.

**Đáp án tham khảo** (teacher): $P=0$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 1 s · *Chi phí:* $0.0003

**Hướng giải:** Biến đổi các mẫu số của các phân thức trong P bằng cách sử dụng điều kiện ab + bc + ca = 0 để đưa về dạng nhân tử, sau đó thay vào P và rút gọn.
1. **Biến đổi mẫu số thứ nhất** — Ta sẽ biến đổi các mẫu số của các phân thức trong P bằng cách sử dụng điều kiện ab + bc + ca = 0.

   $$
   a^2 - bc = a^2 + ab + ac = a(a + b + c)
   $$
   *Lí do:* Thay thế bc = -(ab + ac) vào biểu thức a² - bc
2. **Biến đổi các mẫu số còn lại** — Tương tự, ta biến đổi các mẫu số còn lại.

   $$
   b^2 - ca = b(a + b + c) \quad \text{và} \quad c^2 - ab = c(a + b + c)
   $$
   *Lí do:* Tương tự như bước 1
3. **Thay thế vào P** — Thay các mẫu số đã biến đổi vào biểu thức P và rút gọn.

   $$
   P = \frac{1}{a(a+b+c)} + \frac{1}{b(a+b+c)} + \frac{1}{c(a+b+c)} = \frac{1}{a+b+c} \left( \frac{1}{a} + \frac{1}{b} + \frac{1}{c} \right)
   $$
   *Lí do:* Thay thế và đặt nhân tử chung
4. **Tính tổng các phân thức** — Tính tổng trong ngoặc và sử dụng điều kiện đã cho.

   $$
   \frac{1}{a} + \frac{1}{b} + \frac{1}{c} = \frac{ab + bc + ca}{abc} = \frac{0}{abc} = 0
   $$
   *Lí do:* Quy đồng mẫu số và thay điều kiện
5. **Kết luận** — Kết luận giá trị của P.

   $$
   P = \frac{1}{a+b+c} \cdot 0 = 0
   $$
   *Lí do:* Thay kết quả từ bước 4 vào bước 3

**Kết luận của ứng dụng:** Giá trị của biểu thức P bằng 0.

$$
0
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 1 không có lời giải. Nay: a² − bc = a(a + b + c) nhờ ab + bc + ca = 0, rồi 1/a + 1/b + 1/c = 0 nên P = 0. Có thể nói rõ hơn vì sao −bc = ab + ac.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Cần rõ hơn

---

## Câu 9 — `hanoi-2025-chuyen/III.1b`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Với các số thực $a,b,c$ thỏa mãn $a^2b+b^2c+c^2a+16=ab^2+bc^2+ca^2$. Tìm giá trị nhỏ nhất của biểu thức $P=a^2+b^2+c^2$.

**Đáp án tham khảo** (teacher): 8

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 8 s · *Chi phí:* $0.0015

**Hướng giải:** Biến đổi điều kiện thành tích các hiệu, đặt ẩn phụ để đưa về bài toán cực trị một biến, sau đó áp dụng bất đẳng thức Cô-si (Cô-si) để tìm giá trị nhỏ nhất.
1. **Biến đổi điều kiện đã cho** — Ta nhận thấy vế trái của đẳng thức có dạng đối xứng vòng quanh. Sử dụng hằng đẳng thức đã biết, ta có thể phân tích thành nhân tử để đơn giản hóa bài toán.

   $$
   a^2b + b^2c + c^2a - ab^2 - bc^2 - ca^2 = -(a-b)(b-c)(c-a)
   $$
   *Lí do:* Hằng đẳng thức đại số
2. **Đặt ẩn phụ và liên hệ với $P$** — Đặt $x=a-b, y=b-c, z=c-a$. Khi đó $x+y+z=0$ và từ điều kiện bài toán suy ra $xyz=16$. Để $P=a^2+b^2+c^2$ nhỏ nhất, ta có thể dịch chuyển $a,b,c$ cùng một lượng $k$ mà không làm thay đổi $x,y,z$. Ta chọn $k$ sao cho $a+b+c=0$. Khi đó, ta có mối liên hệ đẹp giữa $x^2+y^2+z^2$ và $P$.

   $$
   x^2 + y^2 + z^2 = 3(a^2 + b^2 + c^2) = 3P \Rightarrow P = \frac{1}{3}(x^2 + y^2 + z^2)
   $$
   *Lí do:* Biến đổi đại số và tính chất $a+b+c=0$
3. **Tìm giá trị nhỏ nhất của biểu thức theo $S$** — Từ $z = -(x+y)$ và $xyz=16$, ta đặt $S=x+y$ và $Q=xy$. Khi đó $Q = -16/S$. Biểu thức $x^2+y^2+z^2$ được viết theo $S$ là $2(S^2 + 16/S)$. Áp dụng Cô-si cho 6 số hạng dương để chặn dưới biểu thức này.

   $$
   S^2 + \frac{16}{S} = \frac{S^2}{2} + \frac{S^2}{2} + \frac{4}{S} + \frac{4}{S} + \frac{4}{S} + \frac{4}{S} \ge 6\sqrt[6]{\frac{S^4}{4} \cdot \frac{256}{S^4}} = 12
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si)
4. **Tìm bộ số $(a,b,c)$ và kết luận** — Dấu "=" xảy ra khi $S=2$. Khi đó $Q=-8$, phương trình $t^2-2t-8=0$ cho ${4, -2}$. Giải hệ với $a+b+c=0$ ta tìm được bộ số cụ thể. Thay vào $P$ ta được kết quả.

   $$
   P_{min} = \frac{1}{3} \cdot 2 \cdot 12 = 8 \quad \text{khi } (a,b,c) = (2,-2,0) \text{ và các hoán vị cyclic}
   $$
   *Lí do:* Thay giá trị cực trị và giải hệ phương trình

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của $P$ là $8$, đạt được khi $(a,b,c) = (2,-2,0)$ hoặc các hoán vị cyclic của bộ số này.

$$
P_{min} = 8
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 1 hết giờ. Nay: GTNN 8, máy kiểm chứng, đạt tại (2, −2, 0) và hoán vị vòng.

### Đánh giá của bạn

- Điểm (0–10): 6
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Tại sao có mối liên hệ x^2 + y^2 + z^2 với P và đừng ghi hoán vị cyclic mà ghi hẳn tất cả nghiệm ra

---

## Câu 10 — `khtn-2025-vong2/I.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Giải phương trình $\sqrt[4]{x+1}+\sqrt[4]{3x^2-2x+1}=\sqrt[4]{2x^2-x+1}+\sqrt[4]{x^2+1}$, trong đó với $a$ là số thực không âm thì $\sqrt[4]{a}=\sqrt{\sqrt a}$.

**Đáp án tham khảo** (teacher): $x\in\{0;1\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Nhóm các hạng tử để tạo thành hiệu của hai căn thức, sau đó sử dụng hằng đẳng thức $a^4 - b^4$ để khử căn thức, dẫn đến một phương trình đại số bậc hai đơn giản.
1. **Nhóm các hạng tử** — Ta chuyển vế để nhóm các biểu thức chứa $x^2$ về một vế và các biểu thức chứa $x$ về vế kia. Điều này giúp tạo ra các hiệu có cấu trúc đối xứng hơn.

   $$
   \sqrt[4]{3x^2-2x+1} - \sqrt[4]{2x^2-x+1} = \sqrt[4]{x^2+1} - \sqrt[4]{x+1}
   $$
   *Lí do:* Chuyển vế
2. **Biến đổi hiệu căn thức** — Áp dụng hằng đẳng thức $a - b = \frac{a^4 - b^4}{a^3 + a^2b + ab^2 + b^3}$ với $a = \sqrt[4]{u}, b = \sqrt[4]{v}$. Mẫu số luôn dương vì các biểu thức trong căn không âm và không đồng thời bằng 0.

   $$
   \frac{(3x^2-2x+1) - (2x^2-x+1)}{\sqrt[4]{(3x^2-2x+1)^3} + \dots} = \frac{(x^2+1) - (x+1)}{\sqrt[4]{(x^2+1)^3} + \dots}
   $$
   *Lí do:* Nhân tử và mẫu với liên hợp
3. **Giải phương trình đại số** — Rút gọn tử số: $x^2 - x = x(x-1)$. Vì mẫu số dương, phương trình tương đương với tử số bằng 0.

   $$
   x^2 - x = 0 \Leftrightarrow x(x-1) = 0
   $$
   *Lí do:* Giải phương trình tích
4. **Kết luận** — Kiểm tra điều kiện xác định: Với $x=0$, các biểu thức trong căn đều không âm. Với $x=1$, các biểu thức trong căn đều không âm. Vậy cả hai nghiệm đều thỏa mãn.

   $$
   x = 0 \text{ hoặc } x = 1
   $$
   *Lí do:* Điều kiện xác định

**Kết luận của ứng dụng:** Phương trình có tập nghiệm $S = \{0; 1\}$.

$$
S = \{0; 1\}
$$

### Claude tự chấm

- Kết luận: **đúng (đáp số)** — 6/10
- Nhận xét: Vòng 1 không có lời giải. Nay đáp số {0; 1} đúng; máy không kiểm chứng được chứng minh — cần bạn đọc lập luận.

### Đánh giá của bạn

- Điểm (0–10): 6
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Tại sao từ cái lượng liên hợp suy ra thẳng chỉ x(x-1) = 0

---

## Câu 11 — `khtn-2025-vong2/I.2`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}x+y+xy=3,\\ 1+12(x+y)=7y^3+6xy(y+3-xy).\end{cases}$

**Đáp án tham khảo** (teacher): $(x,y)=(1,1)$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đặt $S = x + y$ và $P = xy$ để biến đổi hệ phương trình thành phương trình bậc 2 theo $S$ với tham số $y$, sau đó giải và kiểm tra điều kiện nghiệm thực.
1. **Đặt ẩn phụ và biểu diễn P theo S** — Đặt $S = x + y$ và $P = xy$. Từ phương trình (1), ta có $S + P = 3$, suy ra $P = 3 - S$. Điều kiện để $x, y$ là nghiệm thực là $S^2 - 4P \ge 0$, tức $S^2 - 4(3-S) \ge 0 \Leftrightarrow S^2 + 4S - 12 \ge 0 \Leftrightarrow (S+6)(S-2) \ge 0$, vậy $S \ge 2$ hoặc $S \le -6$.

   $$
   P = 3 - S
   $$
   *Lí do:* Đặt ẩn phụ và biến đổi đại số
2. **Thay P vào phương trình (2) và rút gọn** — Thay $P = 3 - S$ vào phương trình (2): $1 + 12S = 7y^3 + 6(3-S)(y + 3 - (3-S))$. Rút gọn vế phải: $y + 3 - 3 + S = y + S$. Phương trình trở thành: $1 + 12S = 7y^3 + 6(3-S)(y+S)$. Mở rộng: $1 + 12S = 7y^3 + 6(3y + 3S - Sy - S^2)$. $1 + 12S = 7y^3 + 18y + 18S - 6Sy - 6S^2$. Chuyển vế: $7y^3 - 6Sy + 18y - 6S^2 + 6S - 1 = 0$. Đây là phương trình bậc 3 theo $y$. Ta thử tìm nghiệm đặc biệt. Nếu $y=1$, phương trình trở thành: $7 - 6S + 18 - 6S^2 + 6S - 1 = 0 \Leftrightarrow -6S^2 + 24 = 0 \Leftrightarrow S^2 = 4 \Leftrightarrow S = \pm 2$. Vì $S \ge 2$ hoặc $S \le -6$, nên $S=2$ hoặc $S=-2$ (loại vì $-2$ không thuộc tập nghiệm). Với $S=2$, ta có $x+y=2$ và $xy=3-2=1$. Hệ $x+y=2, xy=1$ có nghiệm $x=y=1$. Vậy $(1,1)$ là một nghiệm.

   $$
   7y^3 - 6Sy + 18y - 6S^2 + 6S - 1 = 0
   $$
   *Lí do:* Thay thế và rút gọn phương trình
3. **Chứng minh nghiệm duy nhất** — Ta cần chứng minh $(1,1)$ là nghiệm duy nhất. Từ $7y^3 - 6Sy + 18y - 6S^2 + 6S - 1 = 0$, ta coi đây là phương trình bậc 2 theo $S$: $-6S^2 + (6 - 6y)S + (7y^3 + 18y - 1) = 0$. Giải phương trình bậc 2 theo $S$: $\Delta_S = (6-6y)^2 - 4(-6)(7y^3+18y-1) = 36(1-y)^2 + 24(7y^3+18y-1) = 36(1-2y+y^2) + 168y^3 + 432y - 24 = 168y^3 + 36y^2 + 384y + 12$. Để $S$ là số thực, cần $\Delta_S \ge 0$. Tuy nhiên, ta có thể phân tích nhân tử phương trình ban đầu theo $y-1$. Ta thấy $y=1$ là nghiệm của $7y^3 - 6Sy + 18y - 6S^2 + 6S - 1 = 0$ khi $S=2$. Thực tế, ta có thể viết lại phương trình: $7y^3 + 18y - 1 - 6S(y-1) - 6S^2 = 0$. Nếu $y=1$, ta có $7+18-1 - 6S(0) - 6S^2 = 24 - 6S^2 = 0 \Rightarrow S^2=4$. Với $S=2$, $x=y=1$. Với $S=-2$, $x+y=-2, xy=5$, vô nghiệm thực. Vậy chỉ có $S=2, y=1$ là khả dĩ. Ta cần kiểm tra xem có nghiệm nào khác không. Xét hàm số $f(y) = 7y^3 - 6Sy + 18y - 6S^2 + 6S - 1$. Đạo hàm $f'(y) = 21y^2 - 6S + 18$. Vì $S \ge 2$ hoặc $S \le -6$, nếu $S \ge 2$, $f'(y) = 21y^2 + 18 - 6S$. Nếu $S=2$, $f'(y) = 21y^2 + 6 > 0$, hàm đồng biến, chỉ có 1 nghiệm $y=1$. Nếu $S > 2$, $f'(y)$ có thể âm, nhưng ta đã biết $S$ phụ thuộc vào $y$ qua $S^2+4S-12 \ge 0$. Cách khác: từ $x+y+xy=3$, ta có $x = \frac{3-y}{1+y}$ (với $y \ne -1$). Thay vào phương trình (2). Đây là cách trực tiếp nhưng tính toán phức tạp. Cách đặt ẩn phụ $S, P$ là tốt nhất. Ta đã có $7y^3 - 6Sy + 18y - 6S^2 + 6S - 1 = 0$. Ta coi đây là phương trình bậc 2 theo $S$: $6S^2 + (6y-6)S - (7y^3+18y-1) = 0$. $\$\Delta_S = 36(y-1)^2$

   $$
   S = 2, y = 1 \Rightarrow x = 1
   $$
   *Lí do:* Giải phương trình bậc 2 và kiểm tra điều kiện

**Kết luận của ứng dụng:** Hệ phương trình có nghiệm duy nhất (x; y) = (1; 1).

$$
(x, y) = (1, 1)
$$

### Claude tự chấm

- Kết luận: **một phần** — 4/10
- Nhận xét: Đáp số (1; 1) đúng nhưng vẫn dùng đạo hàm (ngoài chương trình) sau lần sửa; ứng dụng hiển thị là “chưa kiểm chứng”.

### Đánh giá của bạn

- Điểm (0–10): 4
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Như vòng 1

---

## Câu 12 — `ptnk-2026-chuyen/1`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 1. Cho các phương trình $x^{2}+2ax+3b=0$ và $x^{2}+2bx+3a=0$, trong đó $a$ và $b$ là hai tham số. Biết các phương trình này đều có hai nghiệm phân biệt.
a) Chứng minh $\left(a-\frac{3}{2}\right)^{2}+\left(b-\frac{3}{2}\right)^{2}>\frac{9}{2}$.
b) Giả sử hai phương trình trên có đúng một nghiệm chung. Gọi $r$ là nghiệm còn lại của phương trình thứ nhất và $s$ là nghiệm còn lại của phương trình thứ hai. Chứng minh $r+s$ không phụ thuộc vào $a$ và $b$.

**Đáp án tham khảo** (official): a) (chứng minh) b) r + s = −3/2.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 209 s · *Chi phí:* $0.0479

**Hướng giải:** Mình sẽ bắt đầu bằng việc viết điều kiện để mỗi phương trình có hai nghiệm phân biệt, sau đó cộng hai điều kiện này lại để chứng minh câu a. Với câu b, mình sẽ tìm nghiệm chung bằng cách trừ hai phương trình, thay nghiệm đó vào để tìm $a+b$, cuối cùng dùng định lý Vi-ét để tính $r+s$.
1. **Điều kiện để phương trình thứ nhất có hai nghiệm phân biệt** — Phương trình $x^2 + 2ax + 3b = 0$ có hai nghiệm phân biệt khi và chỉ khi biệt thức $\Delta_1$ dương. Mình tính $\Delta_1$ rồi rút gọn bất đẳng thức $\Delta_1 > 0$.

   $$
   \Delta_1 = (2a)^2 - 4(1)(3b) = 4a^2 - 12b > 0 \Rightarrow a^2 - 3b > 0
   $$
   *Lí do:* Điều kiện có hai nghiệm phân biệt của phương trình bậc hai
2. **Điều kiện để phương trình thứ hai có hai nghiệm phân biệt** — Tương tự, phương trình $x^2 + 2bx + 3a = 0$ có hai nghiệm phân biệt khi $\Delta_2 > 0$. Mình cũng tính và rút gọn bất đẳng thức này.

   $$
   \Delta_2 = (2b)^2 - 4(1)(3a) = 4b^2 - 12a > 0 \Rightarrow b^2 - 3a > 0
   $$
   *Lí do:* Điều kiện có hai nghiệm phân biệt của phương trình bậc hai
3. **Cộng hai bất đẳng thức** — Ta cộng vế theo vế hai bất đẳng thức vừa tìm được ở bước 1 và 2 để tạo ra biểu thức chứa cả $a$ và $b$.

   $$
   (a^2 - 3b) + (b^2 - 3a) > 0 \Rightarrow a^2 + b^2 - 3a - 3b > 0
   $$
   *Lí do:* Tính chất bất đẳng thức (cộng vế theo vế)
4. **Biến đổi về dạng bình phương** — Ta thêm và bớt $\frac{9}{4}$ cho mỗi biến $a$ và $b$ để nhóm thành các hằng đẳng thức bình phương của một hiệu.

   $$
   (a^2 - 3a + \frac{9}{4}) + (b^2 - 3b + \frac{9}{4}) - \frac{9}{2} > 0 \Rightarrow (a - \frac{3}{2})^2 + (b - \frac{3}{2})^2 > \frac{9}{2}
   $$
   *Lí do:* Hằng đẳng thức đáng nhớ $(A-B)^2 = A^2 - 2AB + B^2$
5. **Tìm nghiệm chung** — Gọi $x_0$ là nghiệm chung của hai phương trình. Ta thay $x_0$ vào cả hai phương trình rồi trừ vế theo vế để khử $x_0^2$.

   $$
   \begin{cases} x_0^2 + 2ax_0 + 3b = 0 \\ x_0^2 + 2bx_0 + 3a = 0 \end{cases} \Rightarrow 2(a-b)x_0 + 3(b-a) = 0 \Rightarrow (a-b)(2x_0 - 3) = 0
   $$
   *Lí do:* Nghiệm của phương trình, phép trừ vế theo vế
6. **Xác định giá trị của $x_0$** — Vì hai phương trình chỉ có đúng một nghiệm chung nên chúng không trùng nhau, suy ra $a \neq b$. Do đó thừa số $2x_0 - 3$ phải bằng 0.

   $$
   x_0 = \frac{3}{2}
   $$
   *Lí do:* Điều kiện để hai phương trình bậc hai có đúng một nghiệm chung
7. **Tìm mối liên hệ giữa $a$ và $b$** — Thay $x_0 = \frac{3}{2}$ vào phương trình thứ nhất để tìm quan hệ giữa $a$ và $b$.

   $$
   (\frac{3}{2})^2 + 2a(\frac{3}{2}) + 3b = 0 \Rightarrow \frac{9}{4} + 3a + 3b = 0 \Rightarrow a + b = -\frac{3}{4}
   $$
   *Lí do:* Thay nghiệm vào phương trình
8. **Tính $r$ và $s$ theo $a$ và $b$** — Áp dụng định lý Vi-ét cho từng phương trình, ta biểu diễn $r$ và $s$ qua $a, b$ và $x_0$.

   $$
   \begin{cases} x_0 + r = -2a \\ r = -2a - \frac{3}{2} \\ x_0 + s = -2b \\ s = -2b - \frac{3}{2} \end{cases}
   $$
   *Lí do:* Định lý Vi-ét
9. **Tính $r+s$ và kết luận** — Ta cộng $r$ và $s$ lại, thay $a+b = -\frac{3}{4}$ vào để thấy kết quả là một hằng số.

   $$
   r + s = (-2a - \frac{3}{2}) + (-2b - \frac{3}{2}) = -2(a+b) - 3 = -2(-\frac{3}{4}) - 3 = -\frac{3}{2}
   $$
   *Lí do:* Thay số và rút gọn biểu thức

**Kết luận của ứng dụng:** a) Đã chứng minh được $(a - rac{3}{2})^2 + (b - rac{3}{2})^2 > rac{9}{2}$.
b) $r + s = -rac{3}{2}$ (không phụ thuộc vào $a$ và $b$).

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Vòng 1 hết giờ. Nay: a) cộng hai điều kiện Δ rồi hoàn thành bình phương; b) nghiệm chung x₀ = 3/2, r + s = −3/2. Lỗi hiển thị “rac{3}{2}” ở kết luận (\frac bị hỏng trong JSON) — đã sửa (#9).

### Đánh giá của bạn

- Điểm (0–10): 7
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Chú ý latex của frac ghi thành rac

---

## Câu 13 — `alg8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Giải phương trình $\sqrt{x+5}+\sqrt{x}=5$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $x=4$

### Lời giải của ứng dụng

*Nguồn:* `deterministic-algebra` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Giữ điều kiện, bình phương lần lượt, tìm đầy đủ nghiệm của đa thức rồi đối chiếu dấu ở cả hai lần để chứng minh chúng thỏa mãn phương trình ban đầu.
1. **Giữ điều kiện của cả hai căn và các mẫu** — Cả hai biểu thức dưới căn phải không âm; mọi mẫu ban đầu phải khác không. Tổng hai căn không âm, nên vế phải cũng phải không âm.

   $$
   x+5\ge0,\quad x\ge0,\quad 5\ge0
   $$
   *Lí do:* Căn bậc hai số học; điều kiện xác định; dấu của tổng hoặc hiệu
2. **Bình phương lần thứ nhất và chuyển phần không chứa căn** — Khai triển bình phương của tổng hai căn, rồi chuyển các biểu thức không chứa căn sang vế phải. Gọi vế phải mới là $T$. Vì căn bậc hai không âm, ta bắt buộc phải có $T\ge0$.

   $$
   \begin{gathered}(x+5)+(x)+2\sqrt{(x+5)(x)}=5^2\\T=-2x+20=2\sqrt{(x+5)(x)},\quad T\ge0\end{gathered}
   $$
   *Lí do:* Hằng đẳng thức bình phương tổng hoặc hiệu; dấu của căn thức
3. **Bình phương lần thứ hai để tìm các giá trị cần kiểm tra** — Bình phương quan hệ mới để loại căn còn lại. Phương trình đa thức thu được là điều kiện cần. Khi giải xong, phải kiểm tra cả điều kiện xác định và dấu đã giữ; không nhận ngay mọi nghiệm của phương trình đa thức.

   $$
   (-2x+20)^2=4(x+5)(x)
   $$
   *Lí do:* Bình phương tạo điều kiện cần; giữ điều kiện dấu để loại nghiệm ngoại lai
4. **Đưa phương trình về dạng đa thức tương đương** — Khai triển các tích rồi chuyển tất cả về một vế và thu gọn các hạng tử cùng bậc. Nếu cần, chia tất cả hệ số cho cùng một số khác không; tập nghiệm không đổi.

   $$
   \begin{gathered}((5^2-((x+5))-(x)))^2=4\cdot ((x+5))\cdot (x)\\4x^{2}-80x+400=4x^{2}+20x\\x-4=0\end{gathered}
   $$
   *Lí do:* Quy đồng và nhân với biểu thức khác không; khai triển và chuyển vế
5. **Giải phương trình bậc nhất** — Chuyển hạng tử không chứa $x$ sang vế phải rồi chia cho hệ số $1\ne0$. Vì mỗi phép biến đổi tương đương, chỉ có một nghiệm có thể nhận.

   $$
   1x=-(-4)\quad\Rightarrow\quad x=4
   $$
   *Lí do:* Chuyển vế và chia hai vế cho cùng một số khác không
6. **Kiểm tra từng giá trị và chứng minh chiều ngược lại** — Với $x=4$, hai biểu thức dưới căn là $9$, $4$, vế phải là $5$, còn $T=12$: thỏa mãn tất cả điều kiện nên nhận. Đối với giá trị được nhận, dấu của $T$ khôi phục đúng dấu ở lần bình phương thứ hai. Hai vế của phương trình ban đầu không âm nên bình phương lần thứ nhất cũng được khôi phục đúng. Mọi nghiệm ban đầu đều thuộc các giá trị đã xét. Vậy phương trình có tất cả các nghiệm: $x=4$.

   $$
   x=4
   $$
   *Lí do:* Điều kiện xác định và dấu ở mỗi lần bình phương; xét đủ nghiệm cần và đủ

**Kết luận của ứng dụng:** Vậy phương trình có tất cả các nghiệm: $x=4$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: x = 4, bộ giải xác định, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 8/10
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Có cách gọn hơn

---

## Câu 14 — `alg8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Giải hệ phương trình $\begin{cases}x^2+y^2=10\\x+y+xy=7\end{cases}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(1;3),(3;1)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 1 s · *Chi phí:* $0

**Hướng giải:** Đặt ẩn phụ $S = x+y$ và $P = xy$ để biến đổi hệ phương trình thành hệ phương trình bậc nhất hai ẩn theo $S$ và $P$. Sau đó, giải hệ phương trình mới để tìm $S$ và $P$, và cuối cùng tìm $x$ và $y$ từ $S$ và $P$.
1. **Đặt ẩn phụ** — Đặt ẩn phụ để đơn giản hóa hệ phương trình. Ta thấy hệ có dạng đối xứng, nên ta đặt $S = x+y$ và $P = xy$.

   $$
   \begin{cases} S = x+y \\ P = xy \end{cases}
   $$
   *Lí do:* Đặt ẩn phụ
2. **Biến đổi hệ phương trình** — Biến đổi phương trình đầu tiên của hệ phương trình ban đầu thành biểu thức theo $S$ và $P$. Ta có $x^2+y^2 = (x+y)^2 - 2xy = S^2 - 2P$. Phương trình thứ hai trở thành $S + P = 7$.

   $$
   \begin{cases} S^2 - 2P = 10 \\ S + P = 7 \end{cases}
   $$
   *Lí do:* Biến đổi đại số
3. **Giải hệ phương trình theo $S$ và $P$** — Giải hệ phương trình mới theo $S$ và $P$. Từ phương trình thứ hai, ta có $P = 7 - S$. Thay vào phương trình thứ nhất, ta được $S^2 - 2(7 - S) = 10$, hay $S^2 + 2S - 24 = 0$. Giải phương trình bậc hai này, ta được $S = 4$ hoặc $S = -6$. Với mỗi giá trị của $S$, ta tìm được $P$ tương ứng.

   $$
   \begin{cases} S = 4 \\ P = 3 \end{cases} \text{ hoặc } \begin{cases} S = -6 \\ P = 13 \end{cases}
   $$
   *Lí do:* Giải hệ phương trình
4. **Tìm nghiệm của hệ phương trình** — Với mỗi cặp $(S, P)$, ta tìm $x$ và $y$. $x$ và $y$ là nghiệm của phương trình $t^2 - St + P = 0$. Với $S=4, P=3$, phương trình là $t^2 - 4t + 3 = 0$, có nghiệm $t=1$ và $t=3$. Vậy $(x, y) = (1, 3)$ hoặc $(x, y) = (3, 1)$. Với $S=-6, P=13$, phương trình là $t^2 + 6t + 13 = 0$, có biệt thức $\Delta = 36 - 52 = -16 < 0$, nên không có nghiệm thực.

   $$
   \begin{cases} x=1 \\ y=3 \end{cases} \text{ hoặc } \begin{cases} x=3 \\ y=1 \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Hệ phương trình có hai nghiệm: $(x=1; y=3)$ và $(x=3; y=1)$.

$$
(x=1, y=3) \text{ hoặc } (x=3, y=1)
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: (1; 3), (3; 1).

### Đánh giá của bạn

- Điểm (0–10): 9/10
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 15 — `alg8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho hai số thực dương $a,b$ thỏa mãn $a+b=2$. Tìm giá trị nhỏ nhất của biểu thức $P=\frac{1}{a}+\frac{4}{b}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\min P=\frac92$, đạt khi $a=\frac23$, $b=\frac43$

### Lời giải của ứng dụng

*Nguồn:* `nvidia/nemotron-3-super-120b-a12b:free` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 120 s · *Chi phí:* $0

**Hướng giải:** Áp dụng bất đẳng thức Cauchy–Schwarz để đưa ra một hằng số dưới cho P, sau đó tìm điều kiện xảy ra bằng để xác định giá trị nhỏ nhất và kiểm tra khả năng đạt được.
1. **Áp dụng bất đẳng thức Cauchy–Schwarz** — Chọn x1=1, y1=a; x2=2, y2=b. Theo bất đẳng thức Cauchy–Schwarz có (x1²/y1 + x2²/y2)(y1+y2) ≥ (x1+x2)².

   $$
   \left(\frac{1^2}{a} + \frac{2^2}{b}\right)(a+b) \ge (1+2)^2
   $$
   *Lí do:* Bất đẳng thức Cauchy–Schwarz
2. **Đơn giản hóa bằng điều kiện a+b=2** — Thay a+b=2 vào bất đẳng thức trên và nhận ra rằng P = 1/a + 4/b.

   $$
   \left(\frac{1}{a} + \frac{4}{b}\right) \cdot 2 \ge 9 \quad\Longrightarrow\quad P \ge \frac{9}{2}
   $$
   *Lí do:* Điều kiện a+b=2 và tính chất của bất đẳng thức
3. **Xác định điều kiện bằng và tính giá trị** — Dấu bằng xảy ra khi 1/a = 2/b, tức là b=2a. Kết hợp với a+b=2 ta được a=2/3, b=4/3. Thay vào P cho thấy P=9/2, vì vậy đây là giá trị nhỏ nhất.

   $$
   \begin{cases}\frac{1}{a}=\frac{2}{b}\\ a+b=2\end{cases}\;\Longrightarrow\; a=\frac{2}{3},\; b=\frac{4}{3}\;\text{và}\; P=\frac{9}{2}
   $$
   *Lí do:* Điều kiện dấu bằng trong Cauchy–Schwarz và thay vào biểu thức

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của P là $\frac{9}{2}$, đạt khi $a=\frac{2}{3}$, $b=\frac{4}{3}$.

$$
\frac{9}{2}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 2 không có lời giải. Nay min P = 9/2 tại a = 2/3, b = 4/3, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Không biết có đúng trích dẫn Cauchy như thế không hay một phép toán tương đương

---

## Câu 16 — `alg8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho phương trình $x^2-(m+2)x+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=6$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m=-1\pm\sqrt3$ (phương trình luôn có hai nghiệm phân biệt vì $\Delta=m^2+4>0$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 43 s · *Chi phí:* $0.0145

**Hướng giải:** Bước 1: Kiểm tra điều kiện để phương trình có hai nghiệm phân biệt ($\Delta > 0$). Bước 2: Sử dụng định lý Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo $m$. Bước 3: Giải phương trình theo $m$ tìm được từ điều kiện $x_1^2 + x_2^2 = 6$ và đối chiếu với điều kiện ở bước 1.
1. **Xét điều kiện có nghiệm** — Để phương trình có hai nghiệm phân biệt, biệt thức $\Delta$ phải lớn hơn 0. Ta tính $\Delta$ và thấy nó luôn dương với mọi $m$.

   $$
   \Delta = [-(m+2)]^2 - 4(1)(m) = m^2 + 4m + 4 - 4m = m^2 + 4
   $$
   *Lí do:* Tính biệt thức $\Delta$
2. **Áp dụng Vi-ét** — Áp dụng định lý Vi-ét để biểu diễn tổng và tích nghiệm theo $m$, sau đó thay vào điều kiện $x_1^2 + x_2^2 = 6$.

   $$
   \begin{cases} x_1 + x_2 = m + 2 \\ x_1 x_2 = m \end{cases}
   $$
   *Lí do:* Định lý Vi-ét
3. **Giải phương trình theo m** — Biến đổi $x_1^2 + x_2^2$ thành $(x_1+x_2)^2 - 2x_1x_2$, thay các giá trị theo $m$ vào và giải phương trình tìm $m$.

   $$
   x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = (m+2)^2 - 2m = m^2 + 2m + 4
   $$
   *Lí do:* Biến đổi đại số
4. **Kết luận** — Kết luận các giá trị $m$ thỏa mãn.

   $$
   m = -1 + \sqrt{3} \quad \text{hoặc} \quad m = -1 - \sqrt{3}
   $$
   *Lí do:* Kết luận

**Kết luận của ứng dụng:** Các giá trị của $m$ là $m = -1 + \sqrt{3}$ hoặc $m = -1 - \sqrt{3}$.

$$
m = -1 \pm \sqrt{3}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 2 SAI (m = 1 hoặc −5). Nay m = −1 ± √3 nhờ bộ kiểm tra tham số (#7). Lưu ý: câu này đã lộ lỗi nên không còn là câu kiểm tra mới.

### Đánh giá của bạn

- Điểm (0–10): 8/10
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 17 — `alg8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho các số thực $a,b,c$ thỏa mãn $a+b+c=0$ và $a^2+b^2+c^2=6$. Tính $a^4+b^4+c^4$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $18$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Sử dụng hằng đẳng thức bình phương của một tổng để biến đổi các biểu thức đối xứng. Đầu tiên tìm $ab+bc+ca$ từ $a+b+c$ và $a^2+b^2+c^2$, sau đó tìm $a^2b^2+b^2c^2+c^2a^2$ từ $ab+bc+ca$, cuối cùng tính $a^4+b^4+c^4$ từ $a^2+b^2+c^2$ và $a^2b^2+b^2c^2+c^2a^2$.
1. **Tìm giá trị của $ab + bc + ca$** — Ta bình phương hai vế của đẳng thức $a + b + c = 0$. Sử dụng hằng đẳng thức $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)$, ta có $0 = 6 + 2(ab + bc + ca)$, suy ra $ab + bc + ca = -3$.

   $$
   ab + bc + ca = -3
   $$
   *Lí do:* Hằng đẳng thức $(a + b + c)^2$ và thay giá trị đã biết.
2. **Tìm giá trị của $a^2b^2 + b^2c^2 + c^2a^2$** — Ta bình phương hai vế của biểu thức $ab + bc + ca = -3$. Sử dụng hằng đẳng thức $(x + y + z)^2 = x^2 + y^2 + z^2 + 2(xy + yz + zx)$ với $x=ab, y=bc, z=ca$, ta có $(ab + bc + ca)^2 = a^2b^2 + b^2c^2 + c^2a^2 + 2abc(a + b + c)$. Thay $ab + bc + ca = -3$ và $a + b + c = 0$, ta được $(-3)^2 = a^2b^2 + b^2c^2 + c^2a^2 + 0$, suy ra $a^2b^2 + b^2c^2 + c^2a^2 = 9$.

   $$
   a^2b^2 + b^2c^2 + c^2a^2 = 9
   $$
   *Lí do:* Hằng đẳng thức $(ab + bc + ca)^2$ và thay giá trị đã biết.
3. **Tính giá trị của $a^4 + b^4 + c^4$** — Ta bình phương hai vế của đẳng thức $a^2 + b^2 + c^2 = 6$. Sử dụng hằng đẳng thức $(a^2 + b^2 + c^2)^2 = a^4 + b^4 + c^4 + 2(a^2b^2 + b^2c^2 + c^2a^2)$, ta có $6^2 = a^4 + b^4 + c^4 + 2(9)$. Suy ra $36 = a^4 + b^4 + c^4 + 18$, từ đó $a^4 + b^4 + c^4 = 18$.

   $$
   a^4 + b^4 + c^4 = 18
   $$
   *Lí do:* Hằng đẳng thức $(a^2 + b^2 + c^2)^2$ và thay giá trị đã biết.

**Kết luận của ứng dụng:** Giá trị của biểu thức $a^4 + b^4 + c^4$ là $18$.

$$
18
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 18.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 18 — `alg8-h7`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho phương trình $x^2-2mx+m^2-1=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m=\pm2$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 19 s · *Chi phí:* $0.0062

**Hướng giải:** Tính biệt thức $\Delta$ để xác định điều kiện có nghiệm. Sử dụng định lý Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo $m$. Giải phương trình theo $m$ từ điều kiện đã cho.
1. **Xét điều kiện có nghiệm** — Trước hết, để phương trình có hai nghiệm $x_1, x_2$, ta cần xét biệt thức $\Delta$. Phương trình đã cho có $a=1, b=-2m, c=m^2-1$. Ta có $\Delta' = (-m)^2 - 1(m^2-1) = m^2 - m^2 + 1 = 1$. Vì $\Delta' = 1 > 0$ với mọi $m$, nên phương trình luôn có hai nghiệm phân biệt với mọi $m$.

   $$
   \Delta' = 1 > 0 \quad \forall m
   $$
   *Lí do:* Tính biệt thức phụ $\Delta'$
2. **Biểu diễn $x_1^2 + x_2^2$ theo $m$** — Áp dụng định lý Vi-ét, ta có tổng hai nghiệm $x_1 + x_2 = -\frac{b}{a} = 2m$ và tích hai nghiệm $x_1x_2 = \frac{c}{a} = m^2 - 1$. Ta biến đổi biểu thức $x_1^2 + x_2^2$ thành $(x_1 + x_2)^2 - 2x_1x_2$. Thay các giá trị theo $m$ vào, ta được $(2m)^2 - 2(m^2 - 1) = 4m^2 - 2m^2 + 2 = 2m^2 + 2$.

   $$
   x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = (2m)^2 - 2(m^2 - 1) = 2m^2 + 2
   $$
   *Lí do:* Biến đổi biểu thức đối xứng của nghiệm
3. **Tìm $m$** — Theo đề bài, ta có $x_1^2 + x_2^2 = 10$. Thay biểu thức theo $m$ vào, ta được phương trình $2m^2 + 2 = 10$. Giải phương trình này: $2m^2 = 8 \Rightarrow m^2 = 4 \Rightarrow m = 2$ hoặc $m = -2$. Cả hai giá trị này đều thỏa mãn điều kiện phương trình luôn có hai nghiệm phân biệt.

   $$
   2m^2 + 2 = 10 \Leftrightarrow m^2 = 4 \Leftrightarrow \left[ \begin{array}{l} m = 2 \ m = -2 \end{array} \right.
   $$
   *Lí do:* Giải phương trình theo $m$

**Kết luận của ứng dụng:** Giá trị của $m$ là $m = 2$ hoặc $m = -2$.

$$
m = 2 \text{ hoặc } m = -2
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Câu mới sau khi sửa #7: m = ±2.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 19 — `alg8-h8`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho phương trình $x^2-(2m+1)x+m^2+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=13$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m\in\{-3;2\}$ (hai nghiệm là $m$ và $m+1$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 29 s · *Chi phí:* $0.0107

**Hướng giải:** Sử dụng hệ thức Vi-ét để biểu diễn $x_1^2 + x_2^2$ qua $m$, giải phương trình tìm $m$, sau đó kiểm tra điều kiện $\Delta > 0$ để đảm bảo phương trình có hai nghiệm phân biệt.
1. **Tính biệt thức Delta** — Trước hết, ta cần đảm bảo phương trình có hai nghiệm phân biệt. Ta tính biệt thức $\Delta$ của phương trình bậc hai theo $x$.

   $$
   \Delta = [-(2m+1)]^2 - 4(1)(m^2+m) = (4m^2 + 4m + 1) - (4m^2 + 4m) = 1
   $$
   *Lí do:* Tính biệt thức $\Delta$ của phương trình $ax^2+bx+c=0$
2. **Áp dụng định lý Vi-ét** — Vì $\Delta = 1 > 0$ với mọi $m$, nên phương trình luôn có hai nghiệm phân biệt $x_1, x_2$ với mọi giá trị của $m$. Ta áp dụng định lý Vi-ét để biểu diễn tổng và tích của nghiệm.

   $$
   \begin{cases} x_1 + x_2 = 2m + 1 \\ x_1 x_2 = m^2 + m \end{cases}
   $$
   *Lí do:* Định lý Vi-ét cho phương trình $x^2 + bx + c = 0$
3. **Lập và giải phương trình theo m** — Ta biến đổi biểu thức $x_1^2 + x_2^2$ thành $(x_1 + x_2)^2 - 2x_1x_2$ và thay các giá trị tìm được ở bước trước vào để lập phương trình theo $m$.

   $$
   \begin{aligned} x_1^2 + x_2^2 &= (x_1 + x_2)^2 - 2x_1x_2 \\ 13 &= (2m+1)^2 - 2(m^2+m) \\ 13 &= 4m^2 + 4m + 1 - 2m^2 - 2m \\ 13 &= 2m^2 + 2m + 1 \\ 2m^2 + 2m - 12 &= 0 \\ m^2 + m - 6 &= 0 \end{aligned}
   $$
   *Lí do:* Biến đổi đại số và giải phương trình bậc hai
4. **Kết luận giá trị của m** — Giải phương trình $m^2 + m - 6 = 0$. Ta thấy tổng các hệ số $1 + 1 - 6 \neq 0$, tích các hệ số $1 \cdot (-6) = -6$. Phương trình có hai nghiệm $m_1 = 2, m_2 = -3$. Vì $\Delta > 0$ luôn đúng với mọi $m$ (đã chứng minh ở bước 1), nên cả hai giá trị $m$ này đều thỏa mãn điều kiện đề bài.

   $$
   \begin{cases} m_1 + m_2 = -1 \\ m_1 m_2 = -6 \end{cases} \Rightarrow \begin{cases} m_1 = 2 \\ m_2 = -3 \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai bằng cách nhẩm nghiệm

**Kết luận của ứng dụng:** Vậy các giá trị của $m$ cần tìm là $m = -3$ hoặc $m = 2$.

$$
m = -3 \text{ hoặc } m = 2
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Câu mới sau khi sửa #7: m ∈ {−3; 2}.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 20 — `alg8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Một người đi xe đạp từ $A$ đến $B$ cách nhau $36$ km. Lúc về, người đó tăng vận tốc thêm $3$ km/h nên thời gian về ít hơn thời gian đi $36$ phút. Tính vận tốc của người đó lúc đi.

**Đáp án tham khảo** (verified by SymPy/enumeration): $12$ km/h

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đổi đơn vị thời gian sang giờ, đặt ẩn vận tốc lúc đi, lập phương trình dựa trên hiệu thời gian đi và về, sau đó giải phương trình bậc hai để tìm vận tốc.
1. **Đổi đơn vị thời gian** — Để tính toán thuận tiện, chúng ta cần đổi đơn vị thời gian từ phút sang giờ cho đồng nhất với vận tốc (km/h).

   $$
   36 \text{ phút} = \frac{36}{60} \text{ giờ} = 0,6 \text{ giờ}
   $$
   *Lí do:* Đổi đơn vị
2. **Lập phương trình** — Gọi vận tốc lúc đi là $v$ (km/h). Vì vận tốc lúc về nhiều hơn lúc đi 3 km/h nên vận tốc lúc về là $v + 3$. Thời gian đi là $\frac{36}{v}$, thời gian về là $\frac{36}{v+3}$. Theo đề bài, thời gian về ít hơn thời gian đi 0,6 giờ, ta có phương trình.

   $$
   \frac{36}{v} - \frac{36}{v+3} = 0,6
   $$
   *Lí do:* Lập phương trình từ đề bài
3. **Biến đổi phương trình** — Quy đồng mẫu số hai vế phương trình (nhân hai vế với $v(v+3)$) để khử mẫu, sau đó rút gọn về phương trình bậc hai.

   $$
   36(v+3) - 36v = 0,6v(v+3) \Leftrightarrow 108 = 0,6v^2 + 1,8v \Leftrightarrow 0,6v^2 + 1,8v - 108 = 0 \Leftrightarrow v^2 + 3v - 180 = 0
   $$
   *Lí do:* Biến đổi tương đương
4. **Giải phương trình và kết luận** — Giải phương trình bậc hai $v^2 + 3v - 180 = 0$ bằng cách phân tích thành nhân tử. Ta thấy $15 \times (-12) = -180$ và $15 + (-12) = 3$, nên phương trình có nghiệm $v = 12$ và $v = -15$. Vì vận tốc phải dương ($v > 0$) nên ta chọn $v = 12$.

   $$
   v^2 + 3v - 180 = 0 \Leftrightarrow (v-12)(v+15) = 0 \Rightarrow v = 12 \text{ (n)} \text{ hoặc } v = -15 \text{ (loại)}
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Vận tốc của người đó lúc đi là 12 km/h.

$$
v = 12 \text{ (km/h)}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 12 km/h.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---
