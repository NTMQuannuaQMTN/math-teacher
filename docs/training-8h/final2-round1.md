# Kiểm tra cuối lần 2 (12 câu mới viết sau mọi sửa lỗi ngày 15/10, chạy một lần) — vòng 1

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `fin2-a1` | final2 | deterministic-algebra | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 2 | `fin2-a2` | final2 | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 9/10 | 171 s | $0.0156 |
| 3 | `fin2-a3` | final2 | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng (không hiển thị) 4/10 | 295 s | $0.0056 |
| 4 | `fin2-g1` | final2 | routine-right-triangle | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 5 | `fin2-g2` | final2 | default | đã kiểm chứng bằng máy | đúng 9/10 | 59 s | $0.0209 |
| 6 | `fin2-g3` | final2 | default | máy không kiểm chứng được | đúng 9/10 | 80 s | $0.0255 |
| 7 | `fin2-n1` | final2 | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng (không hiển thị) 4/10 | 30 s | $0.0124 |
| 8 | `fin2-n2` | final2 | routine-linear-divisor | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 9 | `fin2-n3` | final2 | routine-consecutive-product | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 10 | `fin2-c1` | final2 | routine-digit-numbers | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 11 | `fin2-c2` | final2 | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | sai (không hiển thị) 0/10 | 31 s | $0.0125 |
| 12 | `fin2-c3` | final2 | routine-pigeonhole-residue | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |

## Câu 1 — `fin2-a1`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Giải phương trình $\sqrt{x+3}=x-3$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $x=6$

### Lời giải của ứng dụng

*Nguồn:* `deterministic-algebra` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Giữ điều kiện không âm, bình phương tương đương, giải phương trình đa thức rồi kiểm tra dấu ở phương trình ban đầu.
1. **Giữ điều kiện trước khi bình phương** — Căn bậc hai có nghĩa khi biểu thức dưới căn không âm và luôn nhận giá trị không âm. Vì thế vế phải cũng phải không âm. Khi hai vế không âm, bình phương là phép biến đổi tương đương.

   $$
   x+3\ge0,\quad x-3\ge0\quad;\quad x+3=(x-3)^2
   $$
   *Lí do:* Định nghĩa căn bậc hai số học và điều kiện để bình phương tương đương
2. **Đưa phương trình về dạng đa thức tương đương** — Khai triển các tích rồi chuyển tất cả về một vế và thu gọn các hạng tử cùng bậc. Nếu cần, chia tất cả hệ số cho cùng một số khác không; tập nghiệm không đổi.

   $$
   \begin{gathered}(x+3)=((x-3))^2\\x+3=x^{2}-6x+9\\x^{2}-7x+6=0\end{gathered}
   $$
   *Lí do:* Quy đồng và nhân với biểu thức khác không; khai triển và chuyển vế
3. **Tính biệt thức và xét đủ các trường hợp** — Hệ số là $a=1$, $b=-7$, $c=6$. Tính biệt thức trước khi tìm nghiệm. Biệt thức dương, nên công thức nghiệm cho đúng hai nghiệm thực; không còn trường hợp nào khác.

   $$
   \Delta=(-7)^{2}-4\cdot1\cdot6=25
   $$
   *Lí do:* Công thức biệt thức của phương trình bậc hai
4. **Áp dụng công thức nghiệm** — Thay các hệ số và biệt thức vào công thức nghiệm; tính lần lượt từng giá trị, không đổi dấu của hệ số $b$.

   $$
   x=\frac{-(-7)\pm\sqrt{25}}{2\cdot1}\quad\Rightarrow\quad x=1,\quad x=6
   $$
   *Lí do:* Công thức nghiệm bậc hai, bao gồm nghiệm kép
5. **Đối chiếu từng giá trị với điều kiện ban đầu** — Các phương trình sau biến đổi cho các giá trị cần kiểm tra: $x=1$, $x=6$.  $x=1$ cho vế phải bằng $-2$, âm nên loại. $x=6$ cho vế phải bằng $3$, không âm nên nhận. Giữ lại đúng các giá trị có vế phải ban đầu không âm; quan hệ đã biến đổi và dấu của vế phải bảo đảm chúng thỏa mãn phương trình ban đầu. Không có nghiệm khác vì mọi nghiệm ban đầu đều phải thuộc các trường hợp đã xét. Vậy phương trình có nghiệm duy nhất: $x=6$.

   $$
   \begin{gathered}x=1:\quad \text{VP}=-2<0\\x=6:\quad \text{VP}=3\ge0\end{gathered}
   $$
   *Lí do:* Kiểm tra dấu sau khi bình phương hoặc tách giá trị tuyệt đối; tính tương đương và tính đầy đủ

**Kết luận của ứng dụng:** Vậy phương trình có nghiệm duy nhất: $x=6$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Mô-đun chứng nhận: x = 6, loại x = 1. Văn mẫu hơi dài.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `fin2-a2`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Cho phương trình $x^2-2(m-1)x+m^2-3=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m=0$ (điều kiện $\Delta'=4-2m\ge0$ loại $m=4$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 171 s · *Chi phí:* $0.0156

**Hướng giải:** Tính biệt thức $\Delta$ theo $m$ để xác định điều kiện có hai nghiệm phân biệt. Sau đó, sử dụng định lý Vi-ét để biểu diễn $x_1^2 + x_2^2$ qua $m$, giải phương trình tìm $m$ và kiểm tra lại với điều kiện của $\Delta$.
1. **Tính biệt thức $\Delta$** — Để phương trình có hai nghiệm phân biệt, biệt thức $\Delta$ phải lớn hơn 0. Mình sẽ tính $\Delta$ theo $m$.

   $$
   \Delta = [-2(m-1)]^2 - 4(1)(m^2 - 3) = 8(2 - m)
   $$
   *Lí do:* Tính biệt thức $\Delta$ của phương trình bậc hai
2. **Biến đổi biểu thức nghiệm** — Ta biến đổi biểu thức $x_1^2 + x_2^2$ về dạng chứa tổng và tích hai nghiệm để dễ dàng thay thế.

   $$
   x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 10
   $$
   *Lí do:* Hằng đẳng thức đáng nhớ
3. **Áp dụng định lý Vi-ét** — Áp dụng định lý Vi-ét để tìm tổng và tích hai nghiệm theo $m$, sau đó thay vào phương trình ở bước 2.

   $$
   \begin{cases} x_1 + x_2 = 2(m-1) \\ x_1 x_2 = m^2 - 3 \end{cases}
   $$
   *Lí do:* Định lý Vi-ét
4. **Giải phương trình theo $m$** — Giải phương trình tìm được ở bước 3 để tìm các giá trị $m$ có thể.

   $$
   4(m^2 - 2m + 1) - 2m^2 + 6 = 10 \Leftrightarrow 2m^2 - 8m = 0 \Leftrightarrow \left[\begin{array}{l}m = 0 \\m = 4\end{array}\right.
   $$
   *Lí do:* Giải phương trình bậc hai
5. **Kiểm tra điều kiện** — Kiểm tra điều kiện để phương trình có hai nghiệm phân biệt ($\Delta > 0$).

   $$
   \Delta > 0 \Leftrightarrow 8(2 - m) > 0 \Leftrightarrow m < 2
   $$
   *Lí do:* Điều kiện có hai nghiệm phân biệt

**Kết luận của ứng dụng:** Giá trị cần tìm là $m = 0$.

$$
m = 0
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Δ = 8(2 − m), m ∈ {0; 4}, điều kiện m < 2 loại m = 4 → m = 0.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `fin2-a3`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Cho $x,y$ là các số thực thỏa mãn $x+y=4$. Tìm giá trị nhỏ nhất của $P=x^2+y^2+xy$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\min P=12$, đạt khi $x=y=2$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 295 s · *Chi phí:* $0.0056

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: hint 1: the lesson contains the solver's own working ("Wait"); write only the clean solution, correct from the first step; hint 1: the lesson contains the solver's own working ("Wait"); write only the clean solution, correct from the first step

**Hướng giải:** Biến đổi $P$ thành biểu thức chứa $x+y$ và $xy$, sau đó sử dụng bất đẳng thức để tìm giá trị lớn nhất của $xy$ từ đó suy ra giá trị nhỏ nhất của $P$.
1. **Biến đổi P theo x+y và xy** — Ta biến đổi biểu thức $P$ để xuất hiện tổng $x+y$ đã biết.

   $$
   P = x^2 + y^2 + xy = (x+y)^2 - xy
   $$
   *Lí do:* Biến đổi đại số
2. **Tìm GTLMax của xy** — Để $P$ nhỏ nhất thì $xy$ phải lớn nhất. Với $x+y=4$, tích $xy$ lớn nhất khi $x=y=2$.

   $$
   xy \le \frac{(x+y)^2}{4} = \frac{16}{4} = 4
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si) cho hai số không âm, hoặc tính chất $xy \le \frac{(x+y)^2}{4}$ với mọi $x,y$.
3. **Tìm GTNN của P** — Thay $xy \le 4$ vào biểu thức $P = 16 - xy$ để tìm GTNN của $P$.

   $$
   P = 16 - xy \ge 16 - 4 = 12
   $$
   *Lí do:* Tính chất bất đẳng thức
4. **Kết luận** — Xét dấu bằng xảy ra khi $x=y=2$ (thỏa mãn $x+y=4$).

   $$
   x = y = 2
   $$
   *Lí do:* Điều kiện dấu bằng của bất đẳng thức

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của $P$ là $12$, đạt được khi $x = 2$ và $y = 2$.

$$
P_{\min} = 12 \Leftrightarrow x = y = 2
$$

### Claude tự chấm

- Kết luận: **đúng (không hiển thị)** — 4/10
- Nhận xét: Lời giải đúng và gọn (P = 16 − xy ≥ 12) nhưng một gợi ý có chữ 'Wait' → bị chặn theo luật 'không có lời tự nói'. Học sinh không thấy lời giải đúng này.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `fin2-g1`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Cho tam giác $ABC$ vuông tại $A$ có $AB=9$ cm, $AC=12$ cm, đường cao $AH$. Tính $BC$, $AH$ và $HC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $BC=15$ cm, $AH=\frac{36}{5}$ cm, $HC=\frac{48}{5}$ cm

### Lời giải của ứng dụng

*Nguồn:* `routine-right-triangle` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Dùng định lí Pythagore và các hệ thức lượng, tính dần từ các đoạn đã biết.
1. **Xác định tam giác vuông và các yếu tố đã biết** — Tam giác $ABC$ vuông tại $A$, cạnh huyền $BC$, đường cao $AH$ (nên $H$ nằm giữa $B$ và $C$, các tam giác $AHB$, $AHC$ vuông tại $H$). Đã biết: $AB=9$, $AC=12$.
   *Lí do:* Phân tích giả thiết
2. **Tính BC** — Áp dụng định lí Pythagore trong tam giác ABC vuông:

   $$
   BC^2=AB^2+AC^2=81+144=225\ \Rightarrow\ BC=15
   $$
   *Lí do:* Định lí Pythagore trong tam giác ABC vuông
3. **Tính AH** — Áp dụng hệ thức lượng trong tam giác vuông:

   $$
   AH\cdot BC=AB\cdot AC\ \Rightarrow\ AH=\frac{9\cdot 12}{15}\ \Rightarrow\ AH=\frac{36}{5}
   $$
   *Lí do:* Hệ thức lượng trong tam giác vuông
4. **Tính BH** — Áp dụng định lí Pythagore trong tam giác AHB vuông:

   $$
   BH^2=AB^2-AH^2=81-\frac{1296}{25}=\frac{729}{25}\ \Rightarrow\ BH=\frac{27}{5}
   $$
   *Lí do:* Định lí Pythagore trong tam giác AHB vuông
5. **Tính HC** — Áp dụng định lí Pythagore trong tam giác AHC vuông:

   $$
   HC^2=AC^2-AH^2=144-\frac{1296}{25}=\frac{2304}{25}\ \Rightarrow\ HC=\frac{48}{5}
   $$
   *Lí do:* Định lí Pythagore trong tam giác AHC vuông
6. **Kết luận** — Vậy $BC=15\text{ cm}$, $AH=\frac{36}{5}\text{ cm}$, $HC=\frac{48}{5}\text{ cm}$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy $BC=15\text{ cm}$, $AH=\frac{36}{5}\text{ cm}$, $HC=\frac{48}{5}\text{ cm}$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Pythagore, AH·BC = AB·AC, HC = 48/5.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `fin2-g2`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn có $\widehat{A}=110^\circ$ và $\widehat{D}=75^\circ$. Tính $\widehat{B}$ và $\widehat{C}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\widehat{C}=70^\circ$, $\widehat{B}=105^\circ$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 59 s · *Chi phí:* $0.0209

**Hướng giải:** Sử dụng tính chất hai góc đối diện trong tứ giác nội tiếp luôn có tổng bằng $180^\circ$ để tính góc $C$ từ góc $A$ và góc $B$ từ góc $D$.
1. **Xác định quan hệ giữa góc A và góc C** — Vì tứ giác $ABCD$ nội tiếp đường tròn, nên tổng hai góc đối diện bằng $180^\circ$. Góc $A$ và góc $C$ là hai góc đối diện.

   $$
   \widehat{A} + \widehat{C} = 180^\circ
   $$
   *Lí do:* Tính chất tứ giác nội tiếp
2. **Tính góc C** — Thay $\widehat{A} = 110^\circ$ vào công thức trên để tìm $\widehat{C}$.

   $$
   \widehat{C} = 180^\circ - 110^\circ = 70^\circ
   $$
   *Lí do:* Thay số
3. **Xác định quan hệ giữa góc B và góc D** — Tương tự, góc $B$ và góc $D$ là hai góc đối diện trong tứ giác nội tiếp, nên tổng của chúng cũng bằng $180^\circ$.

   $$
   \widehat{B} + \widehat{D} = 180^\circ
   $$
   *Lí do:* Tính chất tứ giác nội tiếp
4. **Tính góc B** — Thay $\widehat{D} = 75^\circ$ vào công thức trên để tìm $\widehat{B}$.

   $$
   \widehat{B} = 180^\circ - 75^\circ = 105^\circ
   $$
   *Lí do:* Thay số

**Kết luận của ứng dụng:** Ta có:
$\widehat{B} = 105^\circ$
$\widehat{C} = 70^\circ$

$$
\widehat{B} = 105^\circ, \quad \widehat{C} = 70^\circ
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Ĉ = 70°, B̂ = 105° (phép tính số được kiểm tra).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `fin2-g3`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Cho đường tròn $(O)$ và điểm $A$ nằm ngoài đường tròn. Kẻ các tiếp tuyến $AB$, $AC$ ($B$, $C$ là các tiếp điểm). Chứng minh $AO$ là tia phân giác của góc $BAC$ và $AO\perp BC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\triangle ABO=\triangle ACO$ (cạnh huyền – cạnh góc vuông) nên $\widehat{BAO}=\widehat{CAO}$; $AB=AC$, $OB=OC$ nên $AO$ là trung trực của $BC$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 80 s · *Chi phí:* $0.0255

**Hướng giải:** Sử dụng tính chất hai tiếp tuyến cắt nhau để chứng minh AB = AC, sau đó chứng minh hai tam giác ABO và ACO bằng nhau để suy ra các góc bằng nhau. Cuối cùng, sử dụng tính chất tam giác cân để kết luận AO vuông góc với BC.
1. **Chứng minh AB = AC** — Theo tính chất hai tiếp tuyến cắt nhau, khoảng cách từ giao điểm của hai tiếp tuyến đến hai tiếp điểm là bằng nhau.

   $$
   AB = AC
   $$
   *Lí do:* Tính chất hai tiếp tuyến cắt nhau
2. **Chứng minh tam giác ABO bằng tam giác ACO** — Xét hai tam giác ABO và ACO. Ta có AB = AC (chứng minh trên), OB = OC (bán kính đường tròn (O)), và AO là cạnh chung. Do đó, hai tam giác này bằng nhau theo trường hợp cạnh - cạnh - cạnh.

   $$
   \triangle ABO = \triangle ACO (c.c.c)
   $$
   *Lí do:* Trường hợp cạnh - cạnh - cạnh (c.c.c)
3. **Chứng minh AO là tia phân giác của góc BAC** — Vì hai tam giác ABO và ACO bằng nhau, nên các góc tương ứng của chúng bằng nhau. Cụ thể, góc BAO bằng góc CAO.

   $$
   \widehat{BAO} = \widehat{CAO}
   $$
   *Lí do:* Góc tương ứng của hai tam giác bằng nhau
4. **Chứng minh AO vuông góc với BC** — Vì AB = AC nên tam giác ABC cân tại A. Trong tam giác cân, đường phân giác xuất phát từ đỉnh đồng thời là đường cao hạ xuống cạnh đáy. Do đó, AO vuông góc với BC.

   $$
   AO \perp BC
   $$
   *Lí do:* Tính chất tam giác cân (phân giác đồng thời là đường cao)

**Kết luận của ứng dụng:** Chứng minh được AO là tia phân giác của góc BAC và AO vuông góc với BC.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: AB = AC, △ABO = △ACO (c.c.c), tam giác cân → phân giác cũng là đường cao.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `fin2-n1`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Tìm số dư khi chia $2^{100}+3^{100}$ cho $7$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $6$ ($2^{100}\equiv2$, $3^{100}\equiv4\pmod7$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 30 s · *Chi phí:* $0.0124

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: (2^100 + 3^100) % 7

**Hướng giải:** Sử dụng tính chất đồng dư thức để tìm số dư của từng lũy thừa $2^{100}$ và $3^{100}$ khi chia cho 7, sau đó cộng hai số dư lại.
1. **Tìm số dư của $2^{100}$** — Để tìm số dư của $2^{100}$ khi chia cho 7, ta xét các lũy thừa của 2: $2^1 = 2$ (dư 2), $2^2 = 4$ (dư 4), $2^3 = 8$ (dư 1). Vì $2^3$ chia 7 dư 1, ta có thể viết $100 = 3 \times 33 + 1$. Khi đó $2^{100} = (2^3)^{33} \times 2^1$ chia 7 cũng dư $1^{33} \times 2 = 2$.

   $$
   2^{100} \equiv 2 \pmod{7}
   $$
   *Lí do:* Tính chất đồng dư thức
2. **Tìm số dư của $3^{100}$** — Tương tự, ta xét các lũy thừa của 3: $3^1 = 3$ (dư 3), $3^2 = 9$ (dư 2), $3^3 = 27$ (dư 6, hay còn gọi là -1). Vì $3^3$ chia 7 dư 6 (tức là -1), ta viết $100 = 3 \times 33 + 1$. Khi đó $3^{100} = (3^3)^{33} \times 3^1$ chia 7 cũng dư $(-1)^{33} \times 3 = -1 \times 3 = -3$. Số dư âm -3 tương đương với số dư dương $7 - 3 = 4$ khi chia cho 7.

   $$
   3^{100} \equiv 4 \pmod{7}
   $$
   *Lí do:* Tính chất đồng dư thức
3. **Tìm số dư của tổng** — Cuối cùng, ta cộng hai số dư lại: $2 + 4 = 6$. Vì $6 < 7$ nên số dư của tổng $2^{100} + 3^{100}$ khi chia cho 7 chính là 6.

   $$
   2^{100} + 3^{100} \equiv 6 \pmod{7}
   $$
   *Lí do:* Tính chất cộng của đồng dư thức

**Kết luận của ứng dụng:** Số dư cần tìm là 6.

$$
6
$$

### Claude tự chấm

- Kết luận: **đúng (không hiển thị)** — 4/10
- Nhận xét: Lời giải đúng (2 + 4 = 6) nhưng bị chặn: phép kiểm tra '(2^100 + 3^100) % 7' do mô hình viết được máy tính bằng số thực nên sai — lỗi của bộ kiểm tra, sửa sau vòng này.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `fin2-n2`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Tìm tất cả các số nguyên $n$ sao cho $n^2+3n+5$ chia hết cho $n+1$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $n\in\{-4;-2;0;2\}$

### Lời giải của ứng dụng

*Nguồn:* `routine-linear-divisor` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Tách phần chia hết để đưa về bài toán tìm ước của một số.
1. **Tách phần chia hết** — Ta viết $n^2+3n+5$ thành một bội của $n+1$ cộng với một số nguyên. Kiểm tra lại bằng cách khai triển vế phải.

   $$
   n^2+3n+5=(n+1)(n+2)+3
   $$
   *Lí do:* Phép chia đa thức cho đa thức bậc nhất
2. **Suy ra $n+1$ là ước của $3$** — Vì $(n+1)(n+2)$ là bội của $n+1$, nên $n^2+3n+5$ chia hết cho $n+1$ khi và chỉ khi $3$ chia hết cho $n+1$, tức $n+1$ là ước của $3$. Ước của một số khác $0$ luôn khác $0$, nên mẫu $n+1\ne0$.

   $$
   n+1\in\{\pm1;\pm3\}
   $$
   *Lí do:* Tính chất chia hết của hiệu
3. **Tìm các giá trị và thử lại** — Giải $n+1$ bằng từng ước, chỉ giữ giá trị nguyên của $n$, rồi thay lại vào đề để kiểm tra (bắt buộc).

   $$
   \begin{array}{c|cccc}n&-4&-2&0&2\\\hline \text{thỏa?}&\checkmark&\checkmark&\checkmark&\checkmark\end{array}
   $$
   *Lí do:* Thử lại trong đề gốc; điều kiện của ẩn
4. **Kết luận** — Vậy $n\in\{-4;-2;0;2\}$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy $n\in\{-4;-2;0;2\}$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: n² + 3n + 5 = (n+1)(n+2) + 3 → n + 1 là ước của 3.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `fin2-n3`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Chứng minh rằng với mọi số nguyên $n$, $n^3+11n$ chia hết cho $6$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $n^3+11n=(n-1)n(n+1)+12n$.

### Lời giải của ứng dụng

*Nguồn:* `routine-consecutive-product` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Viết biểu thức thành tích các số nguyên liên tiếp cộng với một bội của số chia.
1. **Tách thành tích các số nguyên liên tiếp** — Ta viết $n^3+11n$ thành một tích của 3 số nguyên liên tiếp, cộng với một bội của $6$. Khai triển vế phải để kiểm tra lại.

   $$
   n^3+11n=(n-1)n(n+1)+12n
   $$
   *Lí do:* Khai triển và nhóm hạng tử
2. **Tích các số nguyên liên tiếp** — Trong ba số nguyên liên tiếp luôn có một số chẵn và một số chia hết cho $3$; vì $2$ và $3$ nguyên tố cùng nhau nên tích chia hết cho $6$.

   $$
   (n-1)n(n+1)\ \vdots\ 6
   $$
   *Lí do:* Tính chất chia hết của tích các số nguyên liên tiếp
3. **Kết luận** — Mỗi số hạng ở vế phải đều chia hết cho $6$, nên tổng của chúng chia hết cho $6$. Vậy $n^3+11n$ chia hết cho $6$ với mọi số nguyên $n$.

   $$
   n^3+11n\ \vdots\ 6
   $$
   *Lí do:* Tính chất chia hết của một tổng

**Kết luận của ứng dụng:** Vậy $n^3+11n$ chia hết cho $6$ với mọi số nguyên $n$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: (n−1)n(n+1) + 12n — đúng kiểu bạn muốn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `fin2-c1`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Từ các chữ số $0,1,2,3,4$ lập được bao nhiêu số tự nhiên có ba chữ số đôi một khác nhau?

**Đáp án tham khảo** (verified by SymPy/enumeration): $48$

### Lời giải của ứng dụng

*Nguồn:* `routine-digit-numbers` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn lần lượt từng chữ số, xét riêng chữ số có điều kiện (đầu khác 0, cuối theo tính chẵn lẻ) trước.
1. **Nhận dạng các điều kiện** — Các chữ số lấy từ tập $\{0,1,2,3,4\}$; số có $3$ chữ số nên chữ số đầu khác $0$; các chữ số đôi một khác nhau.
   *Lí do:* Phân tích đề
2. **Chữ số đầu khác 0** — Chữ số đầu khác $0$: $4$ cách. Mỗi chữ số tiếp theo chọn trong các chữ số chưa dùng (kể cả $0$): lần lượt $4, 3$ cách.

   $$
   4\cdot 4\cdot 3=48
   $$
   *Lí do:* Quy tắc nhân; chữ số đầu khác 0
3. **Kết luận** — Vậy lập được $48$ số.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy lập được $48$ số.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: 4·4·3 = 48.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 11 — `fin2-c2`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Một hộp có $4$ bi đỏ và $3$ bi xanh. Lấy ngẫu nhiên $2$ viên bi. Tính xác suất để lấy được $2$ viên cùng màu.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\frac37$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 31 s · *Chi phí:* $0.0125

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: 4 * 3 / (7 * 6 / 2)

**Hướng giải:** Tính tổng số cách lấy 2 viên bi từ 7 viên. Sau đó tính số cách lấy được 2 viên cùng màu (gồm 2 viên đỏ hoặc 2 viên xanh). Chia số cách thuận lợi cho tổng số cách.
1. **Tính tổng số trường hợp có thể** — Trước hết, ta tính tổng số cách lấy 2 viên bi từ tổng số 7 viên bi (4 đỏ + 3 xanh). Đây là tổ hợp chập 2 của 7.

   $$
   n(\Omega) = C_7^2 = \frac{7 \times 6}{2} = 21
   $$
   *Lí do:* Tổ hợp chập k của n
2. **Xác định các trường hợp thuận lợi** — Biến cố "2 viên cùng màu" gồm 2 trường hợp loại trừ nhau: lấy được 2 viên đỏ hoặc lấy được 2 viên xanh.

   $$
   A = \{2 \text{ đỏ}\} \cup \{2 \text{ xanh}\}
   $$
   *Lí do:* Phép cộng xác suất
3. **Tính số trường hợp thuận lợi** — Ta tính số cách lấy 2 viên đỏ từ 4 viên đỏ và số cách lấy 2 viên xanh từ 3 viên xanh.

   $$
   n(A) = C_4^2 + C_3^2 = \frac{4 \times 3}{2} + \frac{3 \times 2}{2} = 6 + 3 = 9
   $$
   *Lí do:* Tổ hợp chập 2 của 4 và 3
4. **Tính xác suất** — Cuối cùng, tính xác suất bằng cách lấy số trường hợp thuận lợi chia cho tổng số trường hợp có thể.

   $$
   P(A) = \frac{9}{21} = \frac{3}{7}
   $$
   *Lí do:* Định nghĩa xác suất cổ điển

**Kết luận của ứng dụng:** Xác suất cần tìm là 0.4 (hay 2/5).

$$
0.4
$$

### Claude tự chấm

- Kết luận: **sai (không hiển thị)** — 0/10
- Nhận xét: Các bước ra 9/21 = 3/7 đúng, nhưng kết luận ghi '0.4 (hay 2/5)' → bị chặn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 12 — `fin2-c3`

*Nguồn đề:* authored 2026-10-15 15:50, after all fixes of the second run; run once (final evaluation 2) · *Tập:* final2

**Đề bài.** Chứng minh rằng trong $13$ số nguyên bất kì luôn có hai số có hiệu chia hết cho $12$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: có $12$ số dư khi chia cho $12$ mà có $13$ số, theo nguyên lí Dirichlet có hai số cùng số dư, hiệu của chúng chia hết cho $12$.

### Lời giải của ứng dụng

*Nguồn:* `routine-pigeonhole-residue` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn lồng và thỏ thích hợp; số thỏ nhiều hơn số lồng.
1. **Chia theo số dư** — Khi chia một số nguyên cho $12$, số dư là một trong $12$ giá trị $0,1,\ldots,11$. Coi mỗi số dư là một lồng: có $12$ lồng; $13$ số đã cho là $13$ con thỏ.
   *Lí do:* Phép chia có dư
2. **Hai số cùng số dư** — Vì $13>12$, theo nguyên lí Dirichlet có hai số $a\ne b$ (trong các số đã cho) có cùng số dư $r$ khi chia cho $12$: $a=12q_1+r$, $b=12q_2+r$. Khi đó hiệu của chúng chia hết cho $12$.

   $$
   a-b=12(q_1-q_2)\ \vdots\ 12
   $$
   *Lí do:* Nguyên lí Dirichlet; hiệu hai số cùng số dư
3. **Kết luận** — Vậy trong $13$ số nguyên bất kì luôn có hai số có hiệu chia hết cho $12$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy trong $13$ số nguyên bất kì luôn có hai số có hiệu chia hết cho $12$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: 12 số dư, 13 số → Dirichlet.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
