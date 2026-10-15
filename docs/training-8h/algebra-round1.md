# Đại số — vòng 1

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/1` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 29 s | $0.008 |
| 2 | `ptnk-2023-chuyen/2a` | luyện | nvidia/nemotron-3-super-120b-a12b:free | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 7/10 | 171 s | $0 |
| 3 | `ptnk-2024-chuyen/1.1` | luyện | nvidia/nemotron-3-super-120b-a12b:free | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 7/10 | 53 s | $0.0032 |
| 4 | `ptnk-2024-chuyen/2` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 163 s | $0.0361 |
| 5 | `hcm-2025-chuyen/1a` | luyện | nvidia/nemotron-3-super-120b-a12b:free | máy không kiểm chứng được | đúng 8/10 | 53 s | $0.0034 |
| 6 | `hcm-2025-chuyen/1b` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 79 s | $0.0034 |
| 7 | `hcm-2025-chuyen/2a` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 85 s | $0.0232 |
| 8 | `hanoi-2025-chuyen/I.2` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 40 s | $0.0138 |
| 9 | `hanoi-2025-chuyen/III.1b` | luyện | lỗi: timeout | không có lời giải | không có lời giải 0/10 | 681 s | $0 |
| 10 | `khtn-2025-vong2/I.1` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 186 s | $0.0032 |
| 11 | `khtn-2025-vong2/I.2` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | một phần 5/10 | 70 s | $0.0189 |
| 12 | `ptnk-2026-chuyen/1` | luyện | lỗi: timeout | không có lời giải | không có lời giải 0/10 | 316 s | $0 |

## Câu 1 — `ptnk-2023-chuyen/1`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}(x+y)\left(4+\frac{1}{xy}\right)=1\\ \left(4x+\frac{1}{x}\right)\left(4y+\frac{1}{y}\right)=-20\end{cases}$.

**Đáp án tham khảo** (official): $(x,y)\in\{(1,-\tfrac12),(\tfrac14,-\tfrac12),(-\tfrac12,1),(-\tfrac12,\tfrac14)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 29 s · *Chi phí:* $0.008

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
- Nhận xét: Đúng 4 nghiệm. Đặt u = 4x + 1/x, v = 4y + 1/y rồi dùng Vi-ét đảo; lập luận đủ, có điều kiện x, y ≠ 0.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 2 — `ptnk-2023-chuyen/2a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho $a,b,c$ là các số thực dương thỏa mãn $ab+bc+ca=abc$. Chứng minh $\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `nvidia/nemotron-3-super-120b-a12b:free` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 171 s · *Chi phí:* $0

**Hướng giải:** Chúng ta sẽ biến đổi điều kiện thành $1/a+1/b+1/c=1$, sau đó đặt $x=1/√a$, $y=1/√b$, $z=1/√c$ để biến bất đẳng thức cần chứng minh thành x+y+z ≤ √3 với điều kiện $x^2+y^2+z^2=1$. Cuối cùng áp dụng bất đẳng thức Bunhiacopxki (Cauchy–Schwarz) để suy ra kết luận.
1. **Biến đổi điều kiện** — Chia cả hai vế của điều kiện ab+bc+ca=abc cho abc (vì a,b,c>0) để đưa về dạng liên quan đến nghịch đảo.

   $$
   \frac{ab+bc+ca}{abc}=1 \;\Rightarrow\; \frac1a+\frac1b+\frac1c=1
   $$
   *Lí do:* chia hai vế cho một biểu thức không zero
2. **Đặt ẩn phụ** — Đặt $x=1/√a$, $y=1/√b$, $z=1/√c (x,y,z>0)$. Khi đó $a=1/x^2$, $b=1/y^2$, $c=1/z^2$. Thay vào điều kiện từ bước 1 và biểu thức cần chứng minh.

   $$
   x=\frac1{\sqrt a},\ y=\frac1{\sqrt b},\ z=\frac1{\sqrt c}\ \Rightarrow\ x^2+y^2+z^2=\frac1a+\frac1b+\frac1c=1\;\text{và}\; \frac1{\sqrt a}+\frac1{\sqrt b}+\frac1{\sqrt c}=x+y+z
   $$
   *Lí do:* định nghĩa biến mới
3. **Áp dụng bất đẳng thức Bunhiacopxki** — Áp dụng bất đẳng thức Bunhiacopxki (Cauchy–Schwarz) cho các vectơ (x,y,z) và (1,1,1): $(x·1+y·1+z·1)^2 ≤ (x^2+y^2+z^2)(1^2+1^2+1^2)$. Vì $x^2+y^2+z^2=1$, ta được $(x+y+z)^2 ≤ 3$. Vì $x+y+z>0$, lấy căn bậc hai hai vế.

   $$
   (x+y+z)^2 \le 3(x^2+y^2+z^2)=3 \;\Rightarrow\; x+y+z \le \sqrt3
   $$
   *Lí do:* Bất đẳng thức Bunhiacopxki (Cauchy–Schwarz)
4. **Kết luận và trường hợp bằng** — Quay lại biến ban đầu, ta có 1/√a+1/√b+1/√c = x+y+z ≤ √3. Dấu bằng xảy ra khi x=y=z, tức là 1/√a=1/√b=1/√c ⇒ a=b=c. Từ điều kiện 1/a+1/b+1/c=1 được 3/a=1 ⇒ a=b=c=3.

   $$
   \frac1{\sqrt a}+\frac1{\sqrt b}+\frac1{\sqrt c}\le\sqrt3\;\text{và bằng khi}\;a=b=c=3
   $$
   *Lí do:* suy ngược từ bước 3 và điều kiện
5. **Kiểm tra nhanh** — Thử một bộ số thỏa mãn điều kiện, ví dụ a=2, b=3, thì từ ab+bc+ca=abc ta được c=6. Tính LHS ≈ 1,6927 < √3 ≈ 1,732, xác nhận bất đẳng thức.

   $$
   \text{Với }a=2,\ b=3,\ c=6:\; \frac1{\sqrt2}+\frac1{\sqrt3}+\frac1{\sqrt6}\approx1,6927<\sqrt3\approx1,732
   $$
   *Lí do:* kiểm tra số cụ thể

**Kết luận của ứng dụng:** Do đó, $\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3$, với dấu bằng xảy ra khi $a=b=c=3$.

$$
\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Chứng minh đúng (đổi biến x = 1/√a…, Bunhiacopxki, dấu bằng a = b = c = 3). Trừ điểm: gọi hai bộ số là “vectơ” — theo đánh giá PTNK 2025 trước của bạn, cách diễn đạt này ngoài chương trình lớp 9; máy đánh dấu chưa kiểm chứng vì lí do này.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Không cần kiểm lại

---

## Câu 3 — `ptnk-2024-chuyen/1.1`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}x^3+z^3=y\\ y^3+x^3=z\\ z^3+y^3=x\end{cases}$.

**Đáp án tham khảo** (official): $x=y=z\in\{0;\tfrac{1}{\sqrt2};-\tfrac{1}{\sqrt2}\}$

### Lời giải của ứng dụng

*Nguồn:* `nvidia/nemotron-3-super-120b-a12b:free` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 53 s · *Chi phí:* $0.0032

**Hướng giải:** Trừ hai phương trình liên tiếp để lấy nhân tử $(z−y)(z^2+zy+y^2+1)=0$. Vì nhân tử thứ hai luôn dương với số thực, suy ra $z=y$. Tương tự được $x=z$, nên $x=y=z$. Thay vào một phương trình để giải phương trình bậc một trong $2t^3=t$.
1. **Trừ hai phương trình đầu tiên** — Trừ phương trình thứ hai từ phương trình đầu, ta hủy $x^3$ và được (z^3−y^3) = (y−z). Phân tích $z^3−y^3 = (z−y)(z^2+zy+y^2)$.

   $$
   (x^3+z^3)-(y^3+x^3)=y-z \\ ⇔ (z^3-y^3)=-(z-y) \\ ⇔ (z-y)(z^2+zy+y^2)=-(z-y)
   $$
   *Lí do:* trừ vế theo vế, hằng đẳng thức $a^3−b^3=(a−b)(a^2+ab+b^2)$
2. **Suy ra x=y=z** — Vì $z^2+zy+y^2+1 = (z+ y/2)^2 + 3y^2/4 +1 >0$ với mọi y,z thực, nên nhân tử thứ hai không thể bằng zéro. Do đó $z−y=0$ → $z=y$. Tương tự, trừ phương trình thứ ba từ phương trình thứ hai cho $x=z$.

   $$
   z^2+zy+y^2+1>0 ∀ y,z∈ℝ \\ ⇒ z=y \\ (y^3+x^3)-(z^3+y^3)=z-x \\ ⇒ (x^3-z^3)=-(x-z) \\ ⇒ (x-z)(x^2+xz+z^2+1)=0 \\ ⇒ x=z
   $$
   *Lí do:* phân tích nhân tử, bất đẳng thức bậc hai luôn dương
3. **Giải phương trình khi x=y=z** — Đặt $x=y=z=t$. Thay vào bất kỳ phương trình nào, ví dụ phương trình đầu: $t^3+t^3=t$ → $2t^3=t$. Đưa tất cả về một vế và phân tích.

   $$
   2t^3=t \\ ⇔ 2t^3−t=0 \\ ⇔ t(2t^2−1)=0
   $$
   *Lí do:* đặt ẩn phụ, đưa cùng mẫu, phân tích nhân tử
4. **Liệt kê tất cả nghiệm** — Mỗi giá trị của t cho một nghiệm ba‑tuple (t,t,t). Do đó có ba nghiệm:

   $$
   (x,y,z)=(0,0,0);\\ (x,y,z)=\left(\frac{\sqrt2}{2},\frac{\sqrt2}{2},\frac{\sqrt2}{2}\right);\\ (x,y,z)=\left(-\frac{\sqrt2}{2},-\frac{\sqrt2}{2},-\frac{\sqrt2}{2}\right)
   $$
   *Lí do:* thay giá trị t vào x=y=z

**Kết luận của ứng dụng:** Các nghiệm của hệ là: (0,0,0); (√2/2, √2/2, √2/2); (-√2/2, -√2/2, -√2/2).

$$
\{(0,0,0),\;(\frac{\sqrt2}{2},\frac{\sqrt2}{2},\frac{\sqrt2}{2}),\;(-\frac{\sqrt2}{2},-\frac{\sqrt2}{2},-\frac{\sqrt2}{2})\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Đúng ba nghiệm (t, t, t) với t ∈ {0; ±√2/2}; lập luận trừ phương trình và z² + zy + y² + 1 > 0 hợp lệ. Trừ điểm: gọi Δ là “định thức” (đúng phải là “biệt thức”), lẫn từ “zéro”, “ba‑tuple”.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Không được dùng kí hiệu với mọi hay tồn tại mà phải dùng chính cụm từ đó

---

## Câu 4 — `ptnk-2024-chuyen/2`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho ba số thực $a,b,c$ không âm thỏa mãn $a^2+b^2+c^2+3=2(ab+bc+ca)$. Chứng minh $3\le a+b+c\le\frac{2(ab+bc+ca)+3}{3}$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Bị loại vì lẫn tiếng Anh (lí do trạng thái chép vào ghi chú) — lỗi do chính hệ thống chép trường statusReason, đã sửa cho vòng 2.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: student-facing text?

---

## Câu 5 — `hcm-2025-chuyen/1a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Với $a,b$ là các số thực dương thỏa mãn $(a+b)(a-b)=1$. Tính giá trị của biểu thức $P=\sqrt{(4a+5)^2+(3b)^2}-\sqrt{(4a-5)^2+(3b)^2}$.

**Đáp án tham khảo** (official): $P=8$

### Lời giải của ứng dụng

*Nguồn:* `nvidia/nemotron-3-super-120b-a12b:free` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 53 s · *Chi phí:* $0.0034

**Hướng giải:** Ta dùng điều kiện đã cho để viết $b^2$ theo $a^2$, rồi thay vào từng radicand để nhận ra chúng là bình phương hoàn chỉnh $(5a±4)^2$. Vì $a≥1$ nên dấu trong căn luôn dương, sau đó trừ hai căn để có kết quả hằng số 8.
1. **Suy ra $a^2 - b^2 = 1$ từ điều kiện đã cho** — Áp dụng hằng đẳng thức $(x+y)(x-y)=x^2 - y^2$ với $x=a$, $y=b$.

   $$
   (a+b)(a-b)=a^2-b^2=1
   $$
   *Lí do:* hằng đẳng thức $(x+y)(x-y)=x^2 - y^2$
2. **Thay $b^2 = a^2 - 1$ vào các radicand và rút gọn** — Thay $b^2$ vào từng biểu thức dưới dấu căn, sau đó nhóm các hạng tử để nhận dạng bình phương hoàn chỉnh.

   $$
   \begin{aligned}&(4a+5)^2+(3b)^2 = 16a^2+40a+25+9b^2 \\&= 16a^2+40a+25+9(a^2-1) = 25a^2+40a+16 = (5a+4)^2,\\&(4a-5)^2+(3b)^2 = 16a^2-40a+25+9b^2 \\&= 16a^2-40a+25+9(a^2-1) = 25a^2-40a+16 = (5a-4)^2.\end{aligned}
   $$
   *Lí do:* thay thế và nhóm các hạng tử; hằng đẳng thức $(p±q)^2 = p^2$ ± $2pq + q^2$
3. **Xác định dấu của các biểu thức trong căn để bỏ dấu tuyệt đối** — Từ $a^2 - b^2 = 1$ và $a,b>0$ suy ra $a^2 ≥ 1$, vì $a>0$ nên a ≥ 1. Do đó 5a-4 > 0 và 5a+4 > 0.

   $$
   a^2 = 1+b^2 \ge 1 \Rightarrow a \ge 1 \Rightarrow 5a-4 > 0
   $$
   *Lí do:* tính chất của căn bậc hai: $sqrt(u^2)=|u|$ và dấu của u
4. **Tính giá trị của P** — Với các dấu xác định, ta có $sqrt((5a+4)^2)=5a+4$ và $sqrt((5a-4)^2)=5a-4$. Do đó $P = (5a+4)-(5a-4)=8$.

   $$
   P = \sqrt{(5a+4)^2} - \sqrt{(5a-4)^2} = (5a+4)-(5a-4)=8
   $$
   *Lí do:* biểu thức đã rút gọn và tính trực tiếp

**Kết luận của ứng dụng:** Giá trị của biểu thức P là 8.

$$
P=8
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: P = 8, biến đổi thành bình phương (5a ± 4)² và xét dấu 5a − 4 > 0 từ a ≥ 1. Trừ điểm: một bước viết “sqrt(…)” dạng chữ thay vì công thức.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/1b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Biết $a,b$ là hai nghiệm thực của phương trình $x^2-4x+c=0$ và $-a$ là một nghiệm thực của phương trình $11x^2-x+2c=0$ với $c$ là một số thực khác 0. Tính giá trị của biểu thức $a^{2025}+b^{2025}+c^{2025}$.

**Đáp án tham khảo** (official): $-1$

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: SoCLaaS bỏ cuộc (“ngoài chương trình”), lần thử lại bằng mô hình miễn phí lẫn chữ Trung/Nga. Đã sửa: bỏ cuộc thì thử lại trên SoCLaaS kèm phản hồi.

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
- Nhận xét: Bị loại vì từ tiếng Anh “the” trong trường kiểm tra bước và tên biến “xeTai”; các trường này chưa được sửa ngôn ngữ — đã mở rộng sửa ngôn ngữ cho vòng 2.

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

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Bị loại vì “The”/“and” trong ghi chú và trường thao tác; phép kiểm tra của mô hình tính ra 4 thay vì 0 (đáp án đúng P = 0) — cần xem lại ở vòng 2.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: student-facing text?

---

## Câu 9 — `hanoi-2025-chuyen/III.1b`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Với các số thực $a,b,c$ thỏa mãn $a^2b+b^2c+c^2a+16=ab^2+bc^2+ca^2$. Tìm giá trị nhỏ nhất của biểu thức $P=a^2+b^2+c^2$.

**Đáp án tham khảo** (teacher): 8

### Lời giải của ứng dụng

**Không có lời giải** — `timeout`: solve deadline exceeded

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết thời gian (SoCLaaS suy nghĩ quá 230 s, rồi mô hình miễn phí).

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Cần train nhiều hơn

---

## Câu 10 — `khtn-2025-vong2/I.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Giải phương trình $\sqrt[4]{x+1}+\sqrt[4]{3x^2-2x+1}=\sqrt[4]{2x^2-x+1}+\sqrt[4]{x^2+1}$, trong đó với $a$ là số thực không âm thì $\sqrt[4]{a}=\sqrt{\sqrt a}$.

**Đáp án tham khảo** (teacher): $x\in\{0;1\}$

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: empty model output

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: SoCLaaS bỏ cuộc và đáp số không khớp nghiệm máy tính được (x = 0; x = 1); mô hình miễn phí trả về rỗng.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Có thể giải bằng phương pháp đặt ẩn phụ, train thêm

---

## Câu 11 — `khtn-2025-vong2/I.2`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Giải hệ phương trình $\begin{cases}x+y+xy=3,\\ 1+12(x+y)=7y^3+6xy(y+3-xy).\end{cases}$

**Đáp án tham khảo** (teacher): $(x,y)=(1,1)$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 70 s · *Chi phí:* $0.0189

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

- Kết luận: **một phần** — 5/10
- Nhận xét: Đáp số (1; 1) đúng, nhưng lập luận “nghiệm duy nhất” không đầy đủ, và máy phát hiện dùng đạo hàm (ngoài chương trình).

### Đánh giá của bạn

- Điểm (0–10): 4/10
- Đúng về toán? (có / không / một phần): Một phần
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Đạo hàm, và cũng hơi phức tạp

---

## Câu 12 — `ptnk-2026-chuyen/1`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 1. Cho các phương trình $x^{2}+2ax+3b=0$ và $x^{2}+2bx+3a=0$, trong đó $a$ và $b$ là hai tham số. Biết các phương trình này đều có hai nghiệm phân biệt.
a) Chứng minh $\left(a-\frac{3}{2}\right)^{2}+\left(b-\frac{3}{2}\right)^{2}>\frac{9}{2}$.
b) Giả sử hai phương trình trên có đúng một nghiệm chung. Gọi $r$ là nghiệm còn lại của phương trình thứ nhất và $s$ là nghiệm còn lại của phương trình thứ hai. Chứng minh $r+s$ không phụ thuộc vào $a$ và $b$.

**Đáp án tham khảo** (official): a) (chứng minh) b) r + s = −3/2.

### Lời giải của ứng dụng

**Không có lời giải** — `timeout`: solve deadline exceeded

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết thời gian (SoCLaaS quá 230 s).

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Từng giải đc, giờ ko đc là có chuyện

---
