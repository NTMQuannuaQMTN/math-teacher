# Kiểm tra cuối (12 câu mới, 4 chuyên đề) — vòng 1

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `fin-a1` | cuối | default | đã kiểm chứng bằng máy | đúng 8/10 | 135 s | $0.0065 |
| 2 | `fin-a2` | cuối | default | máy không kiểm chứng được | đúng 8/10 | 45 s | $0.0118 |
| 3 | `fin-a3` | cuối | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng — bị giữ lại lúc chạy 7/10 | 51 s | $0.0164 |
| 4 | `fin-g1` | cuối | routine-right-triangle | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 5 | `fin-g2` | cuối | default | máy không kiểm chứng được | đúng 8/10 | 59 s | $0.0207 |
| 6 | `fin-g3` | cuối | default | máy không kiểm chứng được | đúng 8/10 | 64 s | $0.0216 |
| 7 | `fin-n1` | cuối | default | máy không kiểm chứng được | đúng 8/10 | 17 s | $0.0088 |
| 8 | `fin-n2` | cuối | routine-linear-divisor | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 9 | `fin-n3` | cuối | routine-difference-of-squares | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 10 | `fin-c1` | cuối | default | đã kiểm chứng bằng máy | đúng 8/10 | 33 s | $0.0122 |
| 11 | `fin-c2` | cuối | routine-digit-numbers | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 12 | `fin-c3` | cuối | default | kiểm chứng một phần | đúng 8/10 | 159 s | $0.0417 |

## Câu 1 — `fin-a1`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Giải phương trình $x^2-2x-\sqrt{x^2-2x+4}=2$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $x=1\pm\sqrt6$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 135 s · *Chi phí:* $0.0065

**Hướng giải:** Đặt ẩn phụ $y = \sqrt{x^2 - 2x + 4}$ để biến đổi phương trình chứa căn thành phương trình bậc hai theo $y$. Giải phương trình theo $y$ để tìm giá trị của $y$, sau đó thay ngược lại để giải phương trình bậc hai theo $x$.
1. **Xác định điều kiện xác định** — Đầu tiên, ta xác định điều kiện xác định. Biểu thức dưới dấu căn là $x^2 - 2x + 4 = (x-1)^2 + 3$. Vì $(x-1)^2 \ge 0$ với mọi $x$, nên $(x-1)^2 + 3 \ge 3 > 0$. Vậy phương trình luôn xác định với mọi $x \in \mathbb{R}$.

   $$
   x^2 - 2x + 4 = (x-1)^2 + 3 > 0, \quad \forall x \in \mathbb{R}
   $$
   *Lí do:* Biểu thức dưới căn thức luôn dương.
2. **Đặt ẩn phụ và giải phương trình theo $y$** — Ta đặt ẩn phụ để đưa phương trình về dạng dễ giải hơn. Đặt $y = \sqrt{x^2 - 2x + 4}$ với điều kiện $y \ge 0$. Khi đó, bình phương hai vế ta được $y^2 = x^2 - 2x + 4$, hay $x^2 - 2x = y^2 - 4$.
Thay $x^2 - 2x = y^2 - 4$ vào phương trình ban đầu $x^2 - 2x - \sqrt{x^2 - 2x + 4} = 2$, ta được:
$(y^2 - 4) - y = 2$
$y^2 - y - 6 = 0$.
Đây là phương trình bậc hai theo $y$.

   $$
   \begin{cases} y = \sqrt{x^2 - 2x + 4} \ge 0 \\ y^2 - y - 6 = 0 \end{cases}
   $$
   *Lí do:* Đặt ẩn phụ và giải phương trình bậc hai theo $y$.
3. **Giải phương trình tìm $x$ và kết luận** — Với $y = 3$, ta thay ngược lại vào định nghĩa của $y$:
$\sqrt{x^2 - 2x + 4} = 3$
Bình phương hai vế (hai vế đều dương nên tương đương):
$x^2 - 2x + 4 = 9$
$x^2 - 2x - 5 = 0$.
Giải phương trình bậc hai này theo $x$:
$\Delta' = (-1)^2 - 1(-5) = 1 + 5 = 6 > 0$.
Phương trình có hai nghiệm phân biệt:
$x_1 = 1 - \sqrt{6}$
$x_2 = 1 + \sqrt{6}$.
Cả hai nghiệm này đều thỏa mãn điều kiện xác định của phương trình ban đầu.

   $$
   \begin{cases} x^2 - 2x - 5 = 0 \\ \Delta' = 6 \\ x = 1 \pm \sqrt{6} \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai theo $x$ sau khi đã tìm được giá trị của $y$.

**Kết luận của ứng dụng:** Phương trình có tập nghiệm là $S = \{1 - \sqrt{6}; 1 + \sqrt{6}\}$.

$$
S = \{1 - \sqrt{6}; 1 + \sqrt{6}\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: x = 1 ± √6, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 2 — `fin-a2`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho hai số thực $x,y$ thỏa mãn $x+2y=5$. Tìm giá trị nhỏ nhất của $P=x^2+y^2$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\min P=5$, đạt khi $x=1$, $y=2$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 45 s · *Chi phí:* $0.0118

**Hướng giải:** Biến đổi biểu thức $P$ thành một biến duy nhất bằng cách thay $x = 5 - 2y$ vào $P$. Sau đó hoàn thành bình phương để đưa $P$ về dạng $5(y - 2)^2 + 5$. Vì bình phương luôn không âm, giá trị nhỏ nhất của $P$ sẽ là $5$ khi $y = 2$ (khi đó $x = 1$).
1. **Biểu diễn $x$ theo $y$** — Từ điều kiện $x + 2y = 5$, ta biểu diễn $x$ theo $y$ để thay vào biểu thức $P$.

   $$
   x = 5 - 2y
   $$
   *Lí do:* Biến đổi đại số
2. **Thay $x$ vào $P$ và rút gọn** — Thay $x = 5 - 2y$ vào $P = x^2 + y^2$ và khai triển, rút gọn biểu thức.

   $$
   P = (5 - 2y)^2 + y^2 = 25 - 20y + 4y^2 + y^2 = 5y^2 - 20y + 25
   $$
   *Lí do:* Thay thế và khai triển hằng đẳng thức $(A - B)^2 = A^2 - 2AB + B^2$
3. **Biến đổi $P$ về dạng hằng đẳng thức** — Đặt nhân tử chung $5$ và biến đổi phần trong ngoặc thành hằng đẳng thức bình phương của một hiệu.

   $$
   P = 5(y^2 - 4y + 5) = 5(y^2 - 4y + 4 + 1) = 5((y - 2)^2 + 1) = 5(y - 2)^2 + 5
   $$
   *Lí do:* Hoàn thành bình phương
4. **Tìm giá trị nhỏ nhất của $P$** — Vì bình phương của một số thực luôn không âm, nên $5(y - 2)^2 \ge 0$. Từ đó suy ra giá trị nhỏ nhất của $P$.

   $$
   5(y - 2)^2 \ge 0 \Rightarrow P = 5(y - 2)^2 + 5 \ge 5
   $$
   *Lí do:* Tính chất của bình phương $(A)^2 \ge 0$ với mọi $A \in \mathbb{R}$
5. **Xét dấu bằng** — Xét dấu bằng xảy ra khi nào để tìm được $x$ và $y$ tương ứng.

   $$
   P = 5 \Leftrightarrow 5(y - 2)^2 + 5 = 5 \Leftrightarrow (y - 2)^2 = 0 \Leftrightarrow y = 2 \Rightarrow x = 5 - 2(2) = 1
   $$
   *Lí do:* Giải phương trình tìm $y$ và thay vào biểu thức của $x$
6. **Kết luận** — Kết luận giá trị nhỏ nhất của $P$ và điều kiện để $P$ đạt giá trị đó.

   $$
   P_{min} = 5 \Leftrightarrow \begin{cases} x = 1 \\ y = 2 \end{cases}
   $$
   *Lí do:* Tổng hợp các bước trên

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của $P$ là $5$ khi và chỉ khi $x = 1$ và $y = 2$.

$$
P_{min} = 5 \Leftrightarrow \begin{cases} x = 1 \\ y = 2 \end{cases}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: min P = 5 tại (1; 2).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 3 — `fin-a3`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho phương trình $x^2-(2m-1)x+m^2-m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=13$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m\in\{-2;3\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 51 s · *Chi phí:* $0.0164

**Hướng giải:** Tính biệt thức $Δ$ để xác định điều kiện có hai nghiệm phân biệt. Sử dụng hệ thức Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo $m$, giải phương trình tìm $m$, và kiểm tra lại điều kiện $Δ > 0$.
1. **Tính biệt thức $Δ$** — Ta xét phương trình $x^2 - (2m-1)x + m^2 - m = 0$. Để phương trình có hai nghiệm phân biệt, biệt thức $Δ$ phải lớn hơn 0.

   $$
   \Delta = [-(2m-1)]^2 - 4(1)(m^2 - m) = (2m-1)^2 - 4(m^2 - m) = 4m^2 - 4m + 1 - 4m^2 + 4m = 1
   $$
   *Lí do:* Tính biệt thức $Δ$ của phương trình bậc hai
2. **Xác định điều kiện có nghiệm** — Vì $Δ = 1 > 0$ với mọi $m$, nên phương trình luôn có hai nghiệm phân biệt với mọi giá trị của $m$.

   $$
   \Delta = 1 > 0 \quad \forall m
   $$
   *Lí do:* Kết luận về số nghiệm của phương trình
3. **Áp dụng hệ thức Vi-ét** — Áp dụng hệ thức Vi-ét, ta có tổng hai nghiệm $S = x_1 + x_2 = 2m - 1$ và tích hai nghiệm $P = x_1 x_2 = m^2 - m$. Ta biến đổi biểu thức $x_1^2 + x_2^2$ theo $S$ và $P$.

   $$
   \begin{cases} x_1 + x_2 = 2m - 1 \\ x_1 x_2 = m^2 - m \end{cases}
   $$
   *Lí do:* Hệ thức Vi-ét cho phương trình bậc hai
4. **Giải phương trình theo $m$** — Ta có $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2$. Thay các giá trị theo $m$ vào và giải phương trình theo điều kiện $x_1^2 + x_2^2 = 13$.

   $$
   (2m - 1)^2 - 2(m^2 - m) = 13
   $$
   *Lí do:* Biến đổi biểu thức và giải phương trình
5. **Tìm giá trị của $m$** — Ta có phương trình $(2m - 1)^2 - 2(m^2 - m) = 13$. Khai triển: $4m^2 - 4m + 1 - 2m^2 + 2m = 13 \Rightarrow 2m^2 - 2m - 12 = 0 \Rightarrow m^2 - m - 6 = 0$. Phương trình này có $a + b + c = 1 - 1 - 6 = -6 \neq 0$, nhưng $a - b + c = 1 - (-1) - 6 = -4 \neq 0$. Ta giải bằng cách phân tích nhân tử: $(m - 3)(m + 2) = 0$. Vậy $m = 3$ hoặc $m = -2$.

   $$
   m^2 - m - 6 = 0 \Leftrightarrow \begin{cases} m = 3 \\ m = -2 \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai
6. **Kết luận** — Vì phương trình luôn có hai nghiệm phân biệt với mọi $m$, nên cả hai giá trị $m = 3$ và $m = -2$ đều thỏa mãn điều kiện đề bài.

   $$
   m \in \{3; -2\}
   $$
   *Lí do:* Kết luận dựa trên điều kiện có nghiệm

**Kết luận của ứng dụng:** Giá trị cần tìm của $m$ là $m = 3$ hoặc $m = -2$.

$$
m = 3 \text{ hoặc } m = -2
$$

### Claude tự chấm

- Kết luận: **đúng — bị giữ lại lúc chạy** — 7/10
- Nhận xét: m ∈ {−2; 3} đúng; bước 5 dùng dấu “{” (và) thay vì “[” (hoặc) nên bị giữ lại. Sau đánh giá đã thêm sửa tự động #24 (không chạy lại bài kiểm tra cuối).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 4 — `fin-g1`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho tam giác $ABC$ vuông tại $A$ có $AB=5$ cm, $BC=13$ cm, đường cao $AH$. Tính $AC$, $AH$ và $BH$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $AC=12$ cm, $AH=\frac{60}{13}$ cm, $BH=\frac{25}{13}$ cm

### Lời giải của ứng dụng

*Nguồn:* `routine-right-triangle` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Dùng định lí Pythagore và các hệ thức lượng, tính dần từ các đoạn đã biết.
1. **Xác định tam giác vuông và các yếu tố đã biết** — Tam giác $ABC$ vuông tại $A$, cạnh huyền $BC$, đường cao $AH$ (nên $H$ nằm giữa $B$ và $C$, các tam giác $AHB$, $AHC$ vuông tại $H$). Đã biết: $AB=5$, $BC=13$.
   *Lí do:* Phân tích giả thiết
2. **Tính AC** — Áp dụng định lí Pythagore trong tam giác ABC vuông:

   $$
   AC^2=BC^2-AB^2=169-25=144\ \Rightarrow\ AC=12
   $$
   *Lí do:* Định lí Pythagore trong tam giác ABC vuông
3. **Tính AH** — Áp dụng hệ thức lượng trong tam giác vuông:

   $$
   AH\cdot BC=AB\cdot AC\ \Rightarrow\ AH=\frac{5\cdot 12}{13}\ \Rightarrow\ AH=\frac{60}{13}
   $$
   *Lí do:* Hệ thức lượng trong tam giác vuông
4. **Tính BH** — Áp dụng định lí Pythagore trong tam giác AHB vuông:

   $$
   BH^2=AB^2-AH^2=25-\frac{3600}{169}=\frac{625}{169}\ \Rightarrow\ BH=\frac{25}{13}
   $$
   *Lí do:* Định lí Pythagore trong tam giác AHB vuông
5. **Kết luận** — Vậy $AC=12\text{ cm}$, $AH=\frac{60}{13}\text{ cm}$, $BH=\frac{25}{13}\text{ cm}$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy $AC=12\text{ cm}$, $AH=\frac{60}{13}\text{ cm}$, $BH=\frac{25}{13}\text{ cm}$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bộ giải xác định: AC = 12, AH = 60/13, BH = 25/13.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 5 — `fin-g2`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho đường tròn $(O;R)$ và dây $AB=R\sqrt3$. Tính số đo góc $AOB$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\widehat{AOB}=120^\circ$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 59 s · *Chi phí:* $0.0207

**Hướng giải:** Hạ đường cao OM từ O xuống AB. Sử dụng tính chất tam giác cân để tìm AM, sau đó dùng định lý Pythagore để tìm OM. Cuối cùng, dùng tỉ số lượng giác trong tam giác vuông OMA để tìm góc AOM, từ đó suy ra góc AOB.
1. **Xác định tam giác OAB cân** — Vì $OA$ và $OB$ đều là bán kính của đường tròn $(O)$ nên $OA = OB = R$. Do đó, tam giác $OAB$ cân tại $O$.

   $$
   OA = OB = R \Rightarrow \triangle OAB \text{ cân tại } O
   $$
   *Lí do:* Định nghĩa bán kính và tam giác cân
2. **Hạ đường cao và tính AM** — Hạ $OM \perp AB$ tại $M$. Vì $\triangle OAB$ cân tại $O$, nên $OM$ vừa là đường cao, vừa là đường trung tuyến. Do đó, $M$ là trung điểm của $AB$ và $AM = \frac{AB}{2} = \frac{R\sqrt{3}}{2}$.

   $$
   AM = \frac{AB}{2} = \frac{R\sqrt{3}}{2}
   $$
   *Lí do:* Tính chất tam giác cân
3. **Tính độ dài OM** — Xét tam giác vuông $OMA$ tại $M$. Áp dụng định lý Pythagore: $OM^2 = OA^2 - AM^2 = R^2 - \left(\frac{R\sqrt{3}}{2}\right)^2 = R^2 - \frac{3R^2}{4} = \frac{R^2}{4}$. Suy ra $OM = \frac{R}{2}$.

   $$
   OM = \frac{R}{2}
   $$
   *Lí do:* Định lý Pythagore
4. **Tính góc AOM** — Trong tam giác vuông $OMA$, ta có $OM = \frac{R}{2}$ và $OA = R$, nên $OM = \frac{1}{2} OA$. Điều này có nghĩa là $\cos(\angle AOM) = \frac{OM}{OA} = \frac{1}{2}$. Vậy $\angle AOM = 60^\circ$.

   $$
   \angle AOM = 60^\circ
   $$
   *Lí do:* Tỉ số lượng giác
5. **Tính góc AOB** — Vì $OM$ là đường phân giác của góc $AOB$ (do tam giác $OAB$ cân tại $O$), nên $\angle AOB = 2 \cdot \angle AOM = 2 \cdot 60^\circ = 120^\circ$.

   $$
   \angle AOB = 120^\circ
   $$
   *Lí do:* Tính chất tam giác cân

**Kết luận của ứng dụng:** Số đo góc $AOB$ là $120^\circ$.

$$
120^\circ
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: ∠AOB = 120°.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 6 — `fin-g3`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho tam giác $ABC$ nội tiếp đường tròn $(O)$. Tia phân giác của góc $BAC$ cắt đường tròn $(O)$ tại $D$ ($D$ khác $A$). Chứng minh $DB=DC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\widehat{BAD}=\widehat{DAC}$ nên hai cung $BD$, $DC$ (không chứa $A$) bằng nhau, do đó hai dây $DB=DC$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 64 s · *Chi phí:* $0.0216

**Hướng giải:** Sử dụng tính chất của góc nội tiếp và mối liên hệ giữa góc nội tiếp, cung bị chắn và dây cung. Cụ thể, ta sẽ chứng minh hai góc nội tiếp bằng nhau, suy ra hai cung bằng nhau, và từ đó suy ra hai dây cung bằng nhau.
1. **Sử dụng tính chất tia phân giác** — Vì AD là tia phân giác của góc BAC, nên nó chia góc đó thành hai góc bằng nhau. Hai góc này đều là các góc nội tiếp trong đường tròn (O).

   $$
   \text{góc } BAD = \text{góc } CAD
   $$
   *Lí do:* Định nghĩa tia phân giác
2. **Chứng minh hai cung bằng nhau** — Trong đường tròn (O), góc BAD chắn cung BD và góc CAD chắn cung CD. Vì hai góc nội tiếp này bằng nhau, nên số đo của hai cung bị chắn cũng bằng nhau.

   $$
   \text{sđ cung } BD = \text{sđ cung } CD
   $$
   *Lí do:* Góc nội tiếp bằng nhau thì chắn các cung bằng nhau
3. **Kết luận** — Trong cùng một đường tròn, nếu hai cung bằng nhau thì hai dây cung tương ứng với chúng cũng bằng nhau. Vì cung BD bằng cung CD, nên dây DB bằng dây DC.

   $$
   DB = DC
   $$
   *Lí do:* Hai cung bằng nhau thì căng hai dây bằng nhau

**Kết luận của ứng dụng:** Ta đã chứng minh được $DB = DC$ (đpcm).

$$
DB = DC
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Góc nội tiếp bằng nhau ⇒ cung bằng nhau ⇒ dây bằng nhau. Gọn, đúng.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 7 — `fin-n1`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm số dư khi chia $7^{100}+11^{100}$ cho $5$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $2$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 17 s · *Chi phí:* $0.0088

**Hướng giải:** Sử dụng tính chất của số dư để biến đổi các lũy thừa lớn thành các lũy thừa nhỏ hơn, sau đó tính toán số dư của các lũy thừa mới này.
1. **Biến đổi cơ số** — Ta thấy $7$ chia $5$ dư $2$, nên $7^{100}$ chia $5$ cũng dư giống như $2^{100}$. Tương tự, $11$ chia $5$ dư $6$, mà $6$ chia $5$ dư $1$, nên $11^{100}$ chia $5$ cũng dư giống như $1^{100}$.

   $$
   \begin{gathered}7 \equiv 2 \pmod{5} \Rightarrow 7^{100} \equiv 2^{100} \pmod{5} \\ 11 \equiv 1 \pmod{5} \Rightarrow 11^{100} \equiv 1^{100} \pmod{5}\end{gathered}
   $$
   *Lí do:* Tính chất của số dư

**Kết luận của ứng dụng:** Số dư cần tìm là 2.

$$
2
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 2.

### Đánh giá của bạn

- Điểm (0–10): 4
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: 2^100 thì chia 5 dư mấy? 11 chia 5 dư 6 là sao?

---

## Câu 8 — `fin-n2`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số nguyên $n$ sao cho $n^2+5$ chia hết cho $n+1$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $n\in\{-7;-4;-3;-2;0;1;2;5\}$

### Lời giải của ứng dụng

*Nguồn:* `routine-linear-divisor` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Tách phần chia hết để đưa về bài toán tìm ước của một số.
1. **Tách phần chia hết** — Ta viết $n^2+5$ thành một bội của $n+1$ cộng với một số nguyên. Kiểm tra lại bằng cách khai triển vế phải.

   $$
   n^2+5=(n+1)(n-1)+6
   $$
   *Lí do:* Phép chia đa thức cho đa thức bậc nhất
2. **Suy ra $n+1$ là ước của $6$** — Vì $(n+1)(n-1)$ là bội của $n+1$, nên $n^2+5$ chia hết cho $n+1$ khi và chỉ khi $6$ chia hết cho $n+1$, tức $n+1$ là ước của $6$. Ước của một số khác $0$ luôn khác $0$, nên mẫu $n+1\ne0$.

   $$
   n+1\in\{\pm1;\pm2;\pm3;\pm6\}
   $$
   *Lí do:* Tính chất chia hết của hiệu
3. **Tìm các giá trị và thử lại** — Giải $n+1$ bằng từng ước, chỉ giữ giá trị nguyên của $n$, rồi thay lại vào đề để kiểm tra (bắt buộc).

   $$
   \begin{array}{c|cccccccc}n&-7&-4&-3&-2&0&1&2&5\\\hline \text{thỏa?}&\checkmark&\checkmark&\checkmark&\checkmark&\checkmark&\checkmark&\checkmark&\checkmark\end{array}
   $$
   *Lí do:* Thử lại trong đề gốc; điều kiện của ẩn
4. **Kết luận** — Vậy $n\in\{-7;-4;-3;-2;0;1;2;5\}$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy $n\in\{-7;-4;-3;-2;0;1;2;5\}$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bộ giải routine: n + 1 | 6 ⇒ 8 giá trị.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 9 — `fin-n3`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $x^2-y^2=24$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(5;1),(7;5)\}$

### Lời giải của ứng dụng

*Nguồn:* `routine-difference-of-squares` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đưa phương trình về dạng tích hai số nguyên bằng một hằng số, rồi xét các cặp ước.
1. **Phân tích thành tích** — Dùng hằng đẳng thức hiệu hai bình phương: $x^2-y^2=(x-y)(x+y)$. Phương trình trở thành tích của hai số nguyên bằng $24$.

   $$
   (x-y)(x+y)=24
   $$
   *Lí do:* Hằng đẳng thức $a^2-b^2=(a-b)(a+b)$
2. **Xét các cặp ước** — $x-y$ và $x+y$ là hai số nguyên có tích bằng $24$, nên là một cặp ước của $24$. Ngoài ra $(x+y)+(x-y)=2x$ là số chẵn, nên hai thừa số phải cùng tính chẵn lẻ. Với mỗi cặp, giải hệ $x-y=u$, $x+y=w$ được $x=\frac{u+w}{2}$, $y=\frac{w-u}{2}$; chỉ giữ nghiệm là số nguyên dương.

   $$
   \begin{array}{c|c|c}x-y&x+y&(x;y)\\\hline 1&24&\text{khác tính chẵn lẻ}\\-1&-24&\text{khác tính chẵn lẻ}\\2&12&(7;5)\\-2&-12&(-7;-5)\ \text{(loại)}\\3&8&\text{khác tính chẵn lẻ}\\-3&-8&\text{khác tính chẵn lẻ}\\4&6&(5;1)\\-4&-6&(-5;-1)\ \text{(loại)}\\6&4&(5;-1)\ \text{(loại)}\\-6&-4&(-5;1)\ \text{(loại)}\\8&3&\text{khác tính chẵn lẻ}\\-8&-3&\text{khác tính chẵn lẻ}\\12&2&(7;-5)\ \text{(loại)}\\-12&-2&(-7;5)\ \text{(loại)}\\24&1&\text{khác tính chẵn lẻ}\\-24&-1&\text{khác tính chẵn lẻ}\end{array}
   $$
   *Lí do:* Ước của một số nguyên; tính chẵn lẻ của tổng và hiệu
3. **Kết luận** — Các trường hợp trên là tất cả các khả năng, nên không bỏ sót nghiệm. Vậy các cặp số nguyên dương $(x;y)$ thỏa mãn là: $(5;1);\ (7;5)$.
   *Lí do:* Đã xét hết các trường hợp

**Kết luận của ứng dụng:** Vậy các cặp số nguyên dương $(x;y)$ thỏa mãn là: $(5;1);\ (7;5)$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bộ giải routine: (5;1), (7;5).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 10 — `fin-c1`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Có bao nhiêu cách chia $6$ học sinh thành $3$ nhóm, mỗi nhóm $2$ học sinh (các nhóm không phân biệt thứ tự)?

**Đáp án tham khảo** (verified by SymPy/enumeration): $15$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 33 s · *Chi phí:* $0.0122

**Hướng giải:** Chọn lần lượt 2 học sinh từ 6, rồi 2 từ 4, rồi 2 từ 2. Sau đó chia cho 3! vì các nhóm không phân biệt thứ tự.
1. **Chọn nhóm thứ nhất** — Để chia 6 học sinh thành 3 nhóm, ta có thể thực hiện lần lượt. Đầu tiên, chọn 2 học sinh từ 6 học sinh để tạo thành nhóm thứ nhất.

   $$
   C_6^2 = \frac{6 \times 5}{2 \times 1} = 15
   $$
   *Lí do:* Định nghĩa tổ hợp
2. **Chọn nhóm thứ hai** — Sau khi đã chọn xong nhóm thứ nhất, còn lại 4 học sinh. Ta chọn 2 học sinh từ 4 học sinh còn lại để tạo thành nhóm thứ hai.

   $$
   C_4^2 = \frac{4 \times 3}{2 \times 1} = 6
   $$
   *Lí do:* Định nghĩa tổ hợp
3. **Chọn nhóm thứ ba** — Còn lại 2 học sinh, ta chọn 2 học sinh từ 2 học sinh còn lại để tạo thành nhóm thứ ba. Chỉ có 1 cách làm này.

   $$
   C_2^2 = 1
   $$
   *Lí do:* Định nghĩa tổ hợp
4. **Tính số cách chia thực tế** — Theo quy tắc nhân, số cách chia nếu coi các nhóm là có thứ tự là: 15 * 6 * 1 = 90. Tuy nhiên, đề bài cho biết các nhóm không phân biệt thứ tự. Điều này có nghĩa là cách chia {A,B}, {C,D}, {E,F} cũng giống như {C,D}, {A,B}, {E,F}. Vì có 3 nhóm, số cách sắp xếp 3 nhóm là 3! = 6. Do đó, ta cần chia kết quả cho 6.

   $$
   \frac{15 \times 6 \times 1}{3!} = \frac{90}{6} = 15
   $$
   *Lí do:* Quy tắc đếm và tính chất của tổ hợp

**Kết luận của ứng dụng:** Số cách chia là 15 cách.

$$
15
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 15, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 11 — `fin-c2`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Từ các chữ số $0,1,2,3,4,5$ lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau và chia hết cho $5$?

**Đáp án tham khảo** (verified by SymPy/enumeration): $36$

### Lời giải của ứng dụng

*Nguồn:* `routine-digit-numbers` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn lần lượt từng chữ số, xét riêng chữ số có điều kiện (đầu khác 0, cuối theo tính chẵn lẻ) trước.
1. **Nhận dạng các điều kiện** — Các chữ số lấy từ tập $\{0,1,2,3,4,5\}$; số có $3$ chữ số nên chữ số đầu khác $0$; các chữ số đôi một khác nhau; điều kiện chia hết cho 5 chỉ phụ thuộc chữ số cuối.
   *Lí do:* Phân tích đề
2. **Trường hợp chữ số cuối là 0** — Chữ số cuối là $0$ (thỏa điều kiện chia hết cho 5). Các chữ số còn lại chọn trong $5$ chữ số khác $0$, đôi một khác nhau; chữ số đầu tự động khác $0$.

   $$
   5\cdot 4=20
   $$
   *Lí do:* Quy tắc nhân
3. **Trường hợp chữ số cuối khác 0** — Chữ số cuối thuộc $\{5\}$: $1$ cách. Chữ số đầu khác $0$ và khác chữ số cuối: $4$ cách. Các chữ số ở giữa chọn trong các chữ số còn lại: $4$ cách.

   $$
   1\cdot 4\cdot 4=16
   $$
   *Lí do:* Quy tắc nhân; chữ số đầu khác 0
4. **Cộng hai trường hợp** — Hai trường hợp không trùng nhau (chữ số cuối khác nhau) và bao quát mọi số thỏa đề, nên cộng lại.

   $$
   20+16=36
   $$
   *Lí do:* Quy tắc cộng: các trường hợp rời nhau, đầy đủ
5. **Kết luận** — Vậy lập được $36$ số.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy lập được $36$ số.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bộ giải routine: 36.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 12 — `fin-c3`

*Nguồn đề:* authored 2026-10-14 22:25 after all fixes; run once (final evaluation) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Chứng minh rằng trong $5$ điểm bất kì nằm trong hình vuông cạnh $2$ (kể cả trên cạnh) luôn có hai điểm cách nhau không quá $\sqrt2$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: chia hình vuông thành $4$ hình vuông cạnh $1$; theo nguyên lí Dirichlet có hai điểm cùng thuộc một hình vuông nhỏ, khoảng cách của chúng không vượt quá đường chéo $\sqrt2$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 159 s · *Chi phí:* $0.0417

**Hướng giải:** Chia hình vuông cạnh 2 thành 4 hình vuông nhỏ cạnh 1. Áp dụng nguyên lý Dirichlet để chỉ ra rằng luôn có ít nhất một hình vuông nhỏ chứa 2 điểm. Khoảng cách lớn nhất giữa hai điểm trong một hình vuông nhỏ cạnh 1 chính là đường chéo của nó, bằng $\sqrt{2}$.
1. **Chia hình vuông thành 4 phần** — Để chứng minh điều này, chúng ta sẽ chia hình vuông lớn thành các phần nhỏ hơn. Hãy chia hình vuông $ABCD$ cạnh 2 thành 4 hình vuông nhỏ bằng cách nối trung điểm các cạnh đối diện.
   *Lí do:* Phép chia hình
2. **Áp dụng nguyên lý Dirichlet** — Bây giờ, chúng ta có 5 điểm và 4 hình vuông nhỏ. Theo nguyên lý Dirichlet (ngăn kéo), nếu ta đặt 5 vật vào 4 ngăn, thì luôn có ít nhất một ngăn chứa 2 vật trở lên.
   *Lí do:* Nguyên lý Dirichlet
3. **Tính khoảng cách trong hình vuông nhỏ** — Gọi hai điểm đó là $P_1$ và $P_2$. Vì $P_1$ và $P_2$ đều nằm trong cùng một hình vuông nhỏ cạnh 1, khoảng cách giữa chúng không thể lớn hơn đường chéo của hình vuông đó.

   $$
   d(P_1, P_2) \le \sqrt{1^2 + 1^2} = \sqrt{2}
   $$
   *Lí do:* Tính chất hình vuông (khoảng cách lớn nhất là đường chéo)
4. **Kết luận** — Từ các bước trên, ta đã chứng minh được rằng trong 5 điểm bất kỳ, luôn tồn tại ít nhất một cặp điểm có khoảng cách không quá $\sqrt{2}$.
   *Lí do:* Tổng hợp các bước

**Kết luận của ứng dụng:** Luôn tồn tại ít nhất một cặp điểm trong 5 điểm đã cho có khoảng cách không quá $\sqrt{2}$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chia 4 hình vuông cạnh 1, Dirichlet, đường chéo √2.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---
