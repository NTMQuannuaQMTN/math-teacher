# Hình học — vòng 1

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/5a` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 155 s | $0.039 |
| 2 | `ptnk-2023-chuyen/5b` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 250 s | $0 |
| 3 | `ptnk-2024-chuyen/4a` | luyện | geometry-degeneracy-diagnosis | kiểm chứng một phần | chẩn đoán đề 5/10 | 0 s | $0 |
| 4 | `ptnk-2024-chuyen/4b` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 256 s | $0 |
| 5 | `ptnk-2025-chuyen/4a` | luyện | geometry-case-proof | kiểm chứng một phần | đúng 7/10 | 0 s | $0 |
| 6 | `hcm-2025-chuyen/3a` | luyện | nvidia/nemotron-3-super-120b-a12b:free | kiểm chứng một phần | SAI (lập luận) 2/10 | 264 s | $0 |
| 7 | `hanoi-2025-chuyen/IV.1` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 234 s | $0 |
| 8 | `hanoi-2025-chuyen/IV.2` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 269 s | $0 |
| 9 | `khtn-2025-vong2/III.1` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 283 s | $0 |
| 10 | `ptnk-2026-chuyen/2` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 184 s | $0.0429 |

## Câu 1 — `ptnk-2023-chuyen/5a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$). Chứng minh rằng đường tròn ngoại tiếp tam giác $ALH$ đi qua tâm nội tiếp $I$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: no structurally valid lesson after retries

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hai lần mô hình dùng “ALHI nội tiếp” mà chưa chứng minh — bộ kiểm tra phụ thuộc chứng minh loại đúng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `ptnk-2023-chuyen/5b`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$). Chứng minh $\widehat{BAD}=\widehat{CAH}$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (output truncated)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: SoCLaaS trả lỗi 502 (cổng cắt mọi yêu cầu ở 120 s); mô hình miễn phí bị cắt cụt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `ptnk-2024-chuyen/4a`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$. Chứng minh $CEHK$ là hình bình hành và $IB^2=ID^2=IA\cdot IK$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `geometry-degeneracy-diagnosis` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn một cấu hình hợp lệ theo đúng giả thiết để kiểm tra bốn đỉnh có luôn phân biệt hay không.
1. **Chọn một trường hợp được giả thiết cho phép** — Lấy tam giác $ABD$ đều, nội tiếp đường tròn $(O)$ bán kính $2$. Đây là tam giác nhọn nên thỏa giả thiết. Lấy $C$ đối diện $A$ qua tâm: $AC$ là đường kính. Bốn điểm $A,B,C,D$ đều phân biệt và nằm trên đường tròn.
   *Lí do:* Tam giác đều có ba góc bằng 60 độ; dựng đường kính
2. **Xác định trung điểm và trực tâm** — Vì tam giác đều, trung tuyến từ $A$ đồng thời là đường cao, đường trung trực và đường phân giác. Tâm đường tròn ngoại tiếp cũng là trực tâm và trọng tâm, nên $H=O$; các điểm $A,O,I,C$ thẳng hàng. Trọng tâm chia trung tuyến theo tỉ số $2:1$, nên từ $AO=2$ suy ra $AI=3$ và $OI=1$.
   *Lí do:* Các tâm của tam giác đều trùng nhau; tính chất trọng tâm
3. **Hai cặp đỉnh của tứ giác trùng nhau** — Đường thẳng $AI$ chính là đường thẳng chứa đường kính $AC$, nên giao điểm thứ hai với đường tròn là $E=C$. Điểm $H=O$ đã nằm trên đường thẳng này, vì vậy hình chiếu của $H$ lên nó là chính $H$: $K=H$. Do đó $CEHK$ chỉ có hai điểm phân biệt, không phải một tứ giác.
   *Lí do:* Giao điểm của đường kính với đường tròn; hình chiếu của điểm đã nằm trên đường thẳng
4. **Kiểm tra phần đẳng thức và nêu giới hạn** — Tam giác $OIB$ vuông tại $I$ vì trung tuyến của tam giác đều vuông góc với đáy. Theo Pythagore, $IB^2=2^2-1^2=3$, và $ID^2=3$ do $I$ là trung điểm. Mặt khác $IA\cdot IK=3\cdot1=3$. Vậy Với đề hiện tại, $E=C$ và $K=H$ có thể xảy ra; vì vậy $CEHK$ không nhất thiết là một hình bình hành không suy biến. Cần xác nhận giả thiết loại trường hợp này trước khi chứng minh kết luận ấy. Ví dụ trên vẫn thỏa đẳng thức tích, nhưng chưa phải chứng minh đẳng thức trong mọi trường hợp.

   $$
   IB^2=ID^2=IA\cdot IK=3
   $$
   *Lí do:* Pythagore; phản ví dụ đối với kết luận không suy biến

**Kết luận của ứng dụng:** Với đề hiện tại, $E=C$ và $K=H$ có thể xảy ra; vì vậy $CEHK$ không nhất thiết là một hình bình hành không suy biến. Cần xác nhận giả thiết loại trường hợp này trước khi chứng minh kết luận ấy. Ví dụ trên vẫn thỏa đẳng thức tích, nhưng chưa phải chứng minh đẳng thức trong mọi trường hợp.

### Claude tự chấm

- Kết luận: **chẩn đoán đề** — 5/10
- Nhận xét: Bộ xác định chỉ ra trường hợp suy biến hợp lệ (ABD đều ⇒ E = C, K = H) — đúng nhưng không phải lời giải cho trường hợp tổng quát.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `ptnk-2024-chuyen/4b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$. Lấy điểm $F$ trên cung nhỏ $BD$ của đường tròn $(O)$ sao cho $\widehat{BAF}=\widehat{DAI}$. Chứng minh các điểm $K$ và $F$ đối xứng nhau qua đường thẳng $BD$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (output truncated)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: 502 rồi mô hình miễn phí bị cắt cụt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `ptnk-2025-chuyen/4a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$ có $\hat A>\hat B>\hat C$ và điểm $D$ trên cung nhỏ $AC$ sao cho $CD>AB$. Đường trung trực của $DB$ cắt $AB$ tại $E$; đường trung trực của $DC$ cắt $AC$ tại $F$. Chứng minh các điểm $A,D,E,F$ thuộc một đường tròn và đường tròn này đi qua tâm $O$ của $(O)$.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

*Nguồn:* `geometry-case-proof` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh giao điểm trên cạnh thứ hai thuộc đường tròn qua đỉnh, điểm trên cung và tâm; sau đó xét đầy đủ vị trí của giao điểm còn lại.
1. **Xét trường hợp đầu cung $D=A$** — Nếu $D=A$ thì $E$ và $F$ lần lượt là trung điểm của $AB$ và $AC$; vì $OA=OB=OC$, các đường $OE$ và $OF$ là đường trung trực của hai dây ấy; do đó $\widehat{AEO}=\widehat{AFO}=90^\circ$: $E,F$ thuộc đường tròn đường kính $AO$; đường tròn này đã chứa các điểm yêu cầu. Từ đây xét $D\ne A$.
   *Lí do:* Trung điểm của dây, đường trung trực và góc vuông chắn đường kính
2. **Xác định góc từ cung nhỏ** — Đường trung trực của $DC$ đã được dựng nên $D\ne C$. Tam giác $ABC$ nhọn nên cung nhỏ $AC$ có số đo $2\widehat{ABC}<180^\circ$. Cung $AD$ nằm trong cung này. Đặt $\beta=\widehat{ABD}=\widehat{ACD}$, vì hai góc nội tiếp cùng chắn cung $AD$. Khi đó $0<\beta<90^\circ$ và góc ở tâm $\widehat{AOD}=2\beta$. Cung $AD$ nhỏ hơn cung $AC$ nên dây $AD<AC$.
   *Lí do:* Góc nội tiếp, góc ở tâm và so sánh dây với cung nhỏ
3. **Chứng minh $F$ nằm giữa $A$ và $C$** — Vì $F$ thuộc đường trung trực của $DC$ nên $FD=FC$. Do $AD<AC$, điểm $A$ nằm về phía $D$ đối với đường trung trực của $DC$; còn $C$ nằm ở phía kia. Vì thế giao điểm $F$ với đoạn $AC$ nằm giữa hai đầu đoạn. Tam giác $FCD$ cân tại $F$, có $\widehat{FCD}=\widehat{FDC}=\beta$, nên $\widehat{CFD}=180^\circ-2\beta$. Hai tia $FA,FC$ đối nhau, do đó $\widehat{AFD}=2\beta$.
   *Lí do:* Đường trung trực chia hai miền gần mỗi đầu đoạn; tam giác cân và hai góc kề bù
4. **Dựng đường tròn và chứng minh điểm thứ tư thuộc nó** — Vì cung $AD$ có số đo nằm giữa $0^\circ$ và $180^\circ$, ba điểm $A,D,O$ không thẳng hàng. Gọi $(\Gamma)$ là đường tròn qua ba điểm này. Điểm $C$ và tâm $O$ ở cùng phía đối với dây $AD$, vì $C$ ở cung lớn $AD$. Điểm $F$ nằm trong đoạn $AC$ nên cũng ở phía ấy. Ta đã có $\widehat{AFD}=\widehat{AOD}=2\beta$. Hai điểm $F,O$ cùng nhìn đoạn $AD$ dưới một góc bằng nhau và ở cùng phía, nên $F\in(\Gamma)$.
   *Lí do:* Đường tròn qua ba điểm không thẳng hàng và dấu hiệu cùng nhìn một đoạn từ cùng phía
5. **Xác định vị trí có thể có của $E$** — Ta có $ED=EB$ theo cách dựng. Điểm $E$ không thể trùng $B$. Nếu $E$ nằm trên tia đối của tia $BA$ thì $\widehat{EBD}=180^\circ-\beta>90^\circ$, trái với việc hai góc ở đáy của tam giác cân $EBD$ bằng nhau. Vậy $E$ thuộc tia $BA$. Suy ra $\widehat{EBD}=\widehat{EDB}=\beta$ và $\widehat{BED}=180^\circ-2\beta$. Nếu $E=A$ thì $E$ đã thuộc $(\Gamma)$; còn lại xét hai vị trí sau.
   *Lí do:* Hai góc ở đáy tam giác cân bằng nhau; tổng ba góc bằng 180 độ
6. **Trường hợp $E$ nằm giữa $A$ và $B$** — Nếu $E$ nằm giữa $A,B$, hai tia $EA,EB$ đối nhau, nên $\widehat{AED}=180^\circ-\widehat{BED}=2\beta=\widehat{AOD}$. Điểm $B$ ở cung lớn $AD$ nên cùng phía với $O$ đối với dây $AD$; $E$ nằm trong đoạn $AB$ cũng ở phía ấy. Dấu hiệu cùng nhìn đoạn $AD$ dưới hai góc bằng nhau từ cùng phía cho $E\in(\Gamma)$.
   *Lí do:* Hai góc kề bù và dấu hiệu nội tiếp từ hai góc cùng chắn một đoạn
7. **Trường hợp $E$ nằm ngoài đoạn về phía $A$** — Nếu $E$ nằm trên tia $BA$ và ở ngoài đoạn $AB$, hai tia $EA,EB$ trùng nhau; vì vậy $\widehat{AED}=180^\circ-2\beta$ và $\widehat{AED}+\widehat{AOD}=180^\circ$. Điểm $E$ ở phía đối diện với $B$ và $O$ đối với dây $AD$. Hai góc đối bù nhau là dấu hiệu nội tiếp, nên $E\in(\Gamma)$.
   *Lí do:* Hai tia trùng nhau và dấu hiệu tổng hai góc đối bằng 180 độ
8. **Kết luận cho cả hai yêu cầu** — Các vị trí hợp lệ của $E$ đã được xét hết: nằm trong đoạn, trùng $A$ hoặc nằm trên phần kéo dài qua $A$. Trong mọi trường hợp $E$ và $F$ đều thuộc đường tròn $(\Gamma)$ qua $A,D,O$. Vậy đường tròn này chứa cả bốn điểm $A,D,E,F$ và đi qua tâm $O$, như hai yêu cầu của đề. Trường hợp đầu cung đã được giải riêng ở bước đầu.

   $$
   A,D,E,F,O\in(\Gamma)
   $$
   *Lí do:* Các trường hợp đã xét bao phủ mọi vị trí và cùng cho một đường tròn

**Kết luận của ứng dụng:** Đường tròn qua $A,D,O$ chứa $E,F$; cả hai yêu cầu đã được chứng minh.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Chứng minh theo trường hợp (bộ xác định): xét vị trí E, F, dùng góc ở tâm; chặt chẽ nhưng dài.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/3a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của các đoạn thẳng $BC,EF$. Gọi $N$ là giao điểm của hai đường thẳng $AM$ và $EF$. Kẻ $ND$ vuông góc với $BC$ tại $D$. Chứng minh rằng $\widehat{AKE}=\widehat{AMB}$ và ba điểm $A,K,D$ thẳng hàng.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `nvidia/nemotron-3-super-120b-a12b:free` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 264 s · *Chi phí:* $0

**Hướng giải:** Chúng ta sẽ sử dụng tính chất của đường tròn đường kính neuf (đường tròn đi qua các chân đường cao và trung điểm các cạnh) để chứng minh rằng A, K, D thẳng hàng và góc AKE bằng góc AMB. Đầu tiên, chứng minh rằng A, E, H, F concyclic (H là orthocenter), sau đó dùng trung điểm và đường trung bình để estabele các mối quan hệ góc và thẳng hàng.
1. **Chứng minh rằng A, E, H, F concyclic (H là orthocenter của tam giác ABC)** — Vì BE và CF là hai đường cao của tam giác ABC, nên chúng giao nhau tại H (orthocenter). Góc BEC là góc vuông vì BE ⟂ AC. Góc BFC cũng là góc vuông vì CF ⟂ AB. Do đó, các điểm B, E, C, F đều nằm trên đường tròn có đường kính BC (góc BEC và BFC đều là 90°). Tuy nhiên, để chứng minh A, E, H, F concyclic, ta xem xét góc AEH và AFH. Vì H là giao điểm của BE và CF, ta có ∠AEH = ∠AFH (cùng là góc phụ của góc vuông). Do đó, A, E, H, F concyclic.

   $$
   \angle AEH = \angle AFH = 90^{\circ} - \angle EAH
   $$
   *Lí do:* góc trong tam giác vuông và tính chất orthocenter
2. **Chứng minh rằng K là trung điểm của đường thẳng nối E và F và thuộc đường tròn đường kính NEUF.** — Theo định nghĩa, K là trung điểm của EF. Đường tròn đường kính neuf của tam giác ABC đi qua ba chân đường cao (E, F và chân từ A đến BC) và ba trung điểm các cạnh (M là trung điểm BC, trung điểm của AB và trung điểm của AC). Do đó, K thuộc đường tròn đường kính neuf vì là trung điểm của đoạn nối hai chân đường cao E và F.

   $$
   K \text{ là trung điểm } EF \Rightarrow K \text{ thuộc đường tròn đường kính neuf}
   $$
   *Lí do:* định nghĩa trung điểm và tính chất đường tròn đường kính neuf
3. **Chứng minh rằng AM là đường trung bình của tam giác ABC và N là giao điểm của AM với EF** — M là trung điểm BC, nên AM là đường trung bình từ A đến BC. N được định nghĩa là giao điểm của AM và EF, vì vậy N nằm trên cả AM và EF.

   $$
   M \text{ là trung điểm } BC \Rightarrow AM \text{ là đường trung bình} \quad \text{ và } \quad N = AM \cap EF
   $$
   *Lí do:* định nghĩa đường trung bình và giao điểm
4. **Chứng minh rằng ND ⟂ BC và D là chân đường thẳng vuông góc từ N đến BC** — Theo định nghĩa, ND được kẻ vuông góc với BC tại D, vì vậy ND ⟂ BC và D là chân đường thẳng vuông góc từ N đến BC.

   $$
   ND \perp BC \text{ tại } D
   $$
   *Lí do:* định nghĩa đường thẳng vuông góc
5. **Chứng minh rằng A, K, D thẳng hàng** — Ta sẽ chứng minh rằng AK và AD là cùng một đường thẳng. Vì K là trung điểm EF và thuộc đường tròn đường kính neuf, và D là chân đường thẳng vuông góc từ N đến BC, ta xét đường trung bình của tam giác AEF. Trong tam giác AEF, đường trung bình từ A đến EF đi qua K (trung điểm EF). Tuy nhiên, để chứng minh A, K, D thẳng hàng, ta cần xem xét đường thẳng qua A và K và chứng minh rằng D cũng nằm trên đường thẳng này. Vì N là giao điểm AM và EF, và ND ⟂ BC, ta có thể sử dụng tính chất của đường tròn đường kính neuf và đường trung bình để chứng minh rằng AK là đường trung bình của một tam giác thích hợp và D là hình chiếu của N lên BC, do đó A, K, D thẳng hàng.

   $$
   A, K, D \text{ thẳng hàng}
   $$
   *Lí do:* đường trung bình và tính chất hình chiếu
6. **Chứng minh rằng $\angle AKE = \angle AMB$** — Ta sẽ chứng minh hai góc này bằng bằng cách sử dụng tính chất góc nội tiếp và đường tròn đường kính neuf. Vì K thuộc đường tròn đường kính neuf và M là trung điểm BC, ta có thể xem xét góc AKE và góc AMB. Góc AKE là góc nội tiếp đường tròn đường kính neuf chắn cung AE. Góc AMB là góc tại M trong tam giác AMB. Vì M là trung điểm BC và đường tròn đường kính neuf có tính chất đối xứng, ta có $\angle AKE = \angle AMB$. Cụ thể, vì K và M đều thuộc đường tròn đường kính neuf và A, E, F, M concyclic (do đường tròn đường kính neuf), ta có thể dùng tính chất góc nội tiếp trên cùng một cung để chứng minh bằng góc.

   $$
   \angle AKE = \angle AMB
   $$
   *Lí do:* góc nội tiếp và đường tròn đường kính neuf
7. **Kết luận** — Từ các bước trên, ta đã chứng minh rằng $\angle AKE = \angle AMB$ và ba điểm A, K, D thẳng hàng.

   $$
   \angle AKE = \angle AMB \quad \text{ và } \quad A, K, D \text{ thẳng hàng}
   $$
   *Lí do:* từ các bước chứng minh trước

**Kết luận của ứng dụng:** $\angle AKE = \angle AMB$ và A, K, D thẳng hàng

$$
\angle AKE = \angle AMB \quad \text{ và } \quad A, K, D \text{ thẳng hàng}
$$

### Claude tự chấm

- Kết luận: **SAI (lập luận)** — 2/10
- Nhận xét: Khẳng định mà không chứng minh (“A, K, D thẳng hàng”), gọi trung tuyến AM là “đường trung bình” (sai thuật ngữ), lẫn “concyclic”, “orthocenter”, “neuf”. Vẫn được hiển thị là “một phần” — đã thêm từ hình học tiếng Anh vào bộ kiểm tra ngôn ngữ.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `hanoi-2025-chuyen/IV.1`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$. Chứng minh ba điểm $T,H,K$ thẳng hàng.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (output truncated)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: 502 rồi cắt cụt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/IV.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$. Đường thẳng qua $B$ và vuông góc với đường thẳng $AM$ tại điểm $E$, cắt đường thẳng $AD$ tại điểm $G$. Đường tròn ngoại tiếp tam giác $MDG$ cắt đường tròn ngoại tiếp tam giác $ADC$ tại hai điểm $D$ và $N$. Chứng minh đường thẳng $NE$ song song với đường thẳng $BF$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (output truncated)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: 502 rồi cắt cụt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `khtn-2025-vong2/III.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ cân tại $A$ có $O$ là trung điểm $BC$ và $\widehat{BAC}<90^\circ$. Xét đường tròn $(O)$ tiếp xúc các cạnh $CA,AB$ theo thứ tự tại $R,Q$. Trên các cạnh $CA,AB$ lần lượt lấy $E,F$ (không trùng các đỉnh tam giác) sao cho $EF$ tiếp xúc $(O)$ tại $P$ và $EF$ không song song $BC$. Gọi $H,K$ lần lượt là trực tâm các tam giác $OFB$, $OEC$. Gọi giao điểm của $FH,EK$ với $BC$ lần lượt là $M,N$. Chứng minh rằng hai tam giác $OHM$, $OKN$ đồng dạng và $\frac{OK}{OH}=\frac{AE}{AF}$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (output truncated)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: 502 rồi cắt cụt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `ptnk-2026-chuyen/2`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 2. Cho tứ giác lồi $ABCD$ có các cạnh $BC = 7$, $DA = 1$, và hai đường chéo $AC$ và $BD$ vuông góc với nhau. Tìm giá trị lớn nhất của chu vi tứ giác $ABCD$.

**Đáp án tham khảo** (official): 18

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 184 s · *Chi phí:* $0.0429

**Hướng giải:** Sử dụng định lý Pythagore cho các tam giác vuông nhỏ tạo bởi hai đường chéo vuông góc để tìm mối liên hệ giữa các cạnh. Sau đó áp dụng bất đẳng thức $(a-b)^2 \ge 0$ để tìm giá trị lớn nhất của tổng hai cạnh chưa biết, từ đó suy ra chu vi lớn nhất.
1. **Áp dụng định lý Pythagore cho các tam giác vuông** — Gọi $O$ là giao điểm của hai đường chéo $AC$ và $BD$. Vì $AC \perp BD$, bốn tam giác $OAB, OBC, OCD, ODA$ đều vuông tại $O$. Áp dụng định lý Pythagore cho từng tam giác, ta có thể biểu diễn bình phương các cạnh của tứ giác qua các đoạn $OA, OB, OC, OD$.

   $$
   AB^2 = OA^2 + OB^2, \quad BC^2 = OB^2 + OC^2, \quad CD^2 = OC^2 + OD^2, \quad DA^2 = OD^2 + OA^2
   $$
   *Lí do:* Định lý Pythagore trong tam giác vuông
2. **Tìm mối liên hệ giữa các cạnh đối diện** — Ta tính tổng bình phương hai cặp cạnh đối diện. Nhận thấy tổng $AB^2 + CD^2$ và $AD^2 + BC^2$ đều bằng tổng của bốn bình phương đoạn $OA, OB, OC, OD$. Điều này cho phép ta tính được $AB^2 + CD^2$ khi biết $AD$ và $BC$.

   $$
   AB^2 + CD^2 = (OA^2 + OB^2) + (OC^2 + OD^2) = (OA^2 + OD^2) + (OB^2 + OC^2) = AD^2 + BC^2 = 1^2 + 7^2 = 50
   $$
   *Lí do:* Biến đổi đại số và thay số
3. **Áp dụng bất đẳng thức để tìm giá trị lớn nhất của $AB + CD$** — Ta cần tìm giá trị lớn nhất của $AB + CD$ khi biết $AB^2 + CD^2 = 50$. Sử dụng bất đẳng thức $(AB - CD)^2 \ge 0$, ta có $AB^2 + CD^2 \ge 2 AB \cdot CD$. Từ đó suy ra $(AB + CD)^2 = AB^2 + CD^2 + 2 AB \cdot CD \le 2(AB^2 + CD^2)$.

   $$
   (AB + CD)^2 \le 2 \times 50 = 100 \Rightarrow AB + CD \le 10
   $$
   *Lí do:* Hằng đẳng thức và bất đẳng thức $(a-b)^2 \ge 0$
4. **Tính chu vi lớn nhất và kiểm tra tính khả thi** — Chu vi $P = AB + CD + BC + DA$. Thay các giá trị đã tìm được vào, ta được $P \le 10 + 7 + 1 = 18$. Dấu bằng xảy ra khi $AB = CD = 5$. Để tứ giác tồn tại và lồi, ta cần các đoạn $OA, OB, OC, OD$ đều dương. Với $AB=CD=5$, ta có hệ phương trình $OA^2+OB^2=25$ và $OA^2+OD^2=1$, suy ra $OB^2-OD^2=24$. Chọn $OD = 0.5$ thì $OB = \sqrt{24.25}$, $OA = \sqrt{0.75}$, $OC = \sqrt{24.75}$, tất cả đều dương nên tứ giác lồi tồn tại.

   $$
   P_{max} = 18 \quad (\text{khi } AB = CD = 5)
   $$
   *Lí do:* Thay số và xét điều kiện tồn tại

**Kết luận của ứng dụng:** Giá trị lớn nhất của chu vi tứ giác $ABCD$ là $18$.

$$
P_{max} = 18
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chu vi lớn nhất 18: AB² + CD² = AD² + BC² = 50, (AB + CD)² ≤ 100; dấu bằng AB = CD = 5 và có kiểm tra tồn tại; máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
