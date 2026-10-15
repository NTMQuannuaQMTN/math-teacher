# Hình học — vòng 3

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/5a` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 71 s | $0.0236 |
| 2 | `ptnk-2023-chuyen/5b` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 90 s | $0.0184 |
| 3 | `ptnk-2024-chuyen/4a` | luyện | geometry-degeneracy-diagnosis | kiểm chứng một phần | chẩn đoán đề 5/10 | 0 s | $0 |
| 4 | `ptnk-2024-chuyen/4b` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | SAI (lập luận) — nay không hiển thị 1/10 | 264 s | $0.034 |
| 5 | `ptnk-2025-chuyen/4a` | luyện | geometry-case-proof | kiểm chứng một phần | đúng 7/10 | 0 s | $0 |
| 6 | `hcm-2025-chuyen/3a` | luyện | lỗi: timeout | không có lời giải | không có lời giải 0/10 | 211 s | $0.0232 |
| 7 | `hanoi-2025-chuyen/IV.1` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | không có lời giải 0/10 | 176 s | $0.0204 |
| 8 | `hanoi-2025-chuyen/IV.2` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 0 s | $0 |
| 9 | `khtn-2025-vong2/III.1` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | SAI (lập luận) — nay không hiển thị 1/10 | 0 s | $0 |
| 10 | `ptnk-2026-chuyen/2` | luyện | default | máy không kiểm chứng được | đúng 7/10 | 26 s | $0.0093 |
| 11 | `geo8-h1` | kiểm tra (mới) | proof-planner | kiểm chứng một phần | đúng 7/10 | 0 s | $0 |
| 12 | `geo8-h2` | kiểm tra (mới) | default | kiểm chứng một phần | đúng 7/10 | 151 s | $0.0395 |
| 13 | `geo8-h3` | kiểm tra (mới) | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 230 s | $0 |
| 14 | `geo8-h4` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 37 s | $0.0154 |
| 15 | `geo8-h5` | kiểm tra (mới) | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng (bị giữ lại nhầm, đã sửa) 7/10 | 167 s | $0.0143 |
| 16 | `geo8-h6` | kiểm tra (mới) | default | đã kiểm chứng bằng máy | đúng 8/10 | 66 s | $0.0221 |

## Câu 1 — `ptnk-2023-chuyen/5a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$). Chứng minh rằng đường tròn ngoại tiếp tam giác $ALH$ đi qua tâm nội tiếp $I$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: no structurally valid lesson after retries

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Mô hình lại dùng “ALHI nội tiếp” chưa chứng minh; bị loại đúng.

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

**Không có lời giải** — `malformed_output`: no structurally valid lesson after retries

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Không có lời giải hợp lệ về cấu trúc sau hai lần thử.

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
- Nhận xét: Như vòng 1: chỉ ra trường hợp suy biến hợp lệ, không phải lời giải tổng quát.

### Đánh giá của bạn

- Điểm (0–10): 3
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Giải tổng quát, không có cho ví dụ

---

## Câu 4 — `ptnk-2024-chuyen/4b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$. Lấy điểm $F$ trên cung nhỏ $BD$ của đường tròn $(O)$ sao cho $\widehat{BAF}=\widehat{DAI}$. Chứng minh các điểm $K$ và $F$ đối xứng nhau qua đường thẳng $BD$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 264 s · *Chi phí:* $0.034

**Hướng giải:** Chứng minh I là trung điểm HC, sau đó chứng minh E, C, F thẳng hàng. Tiếp theo, chứng minh AH song song với OI và suy ra tam giác HIC đồng dạng với tam giác KIF. Từ đó suy ra I là trung điểm KF và BD là trung trực của KF.
1. **Chứng minh I là trung điểm HC** — Vì AC là đường kính nên góc ABC và ADC bằng 90 độ. H là trực tâm nên BH vuông góc với AD và DH vuông góc với AB. Do đó BH song song với DC và DH song song với BC. Tứ giác BHCD có các cặp cạnh đối song song nên là hình bình hành. I là trung điểm BD nên I cũng là trung điểm HC.

   $$
   BHCD \text{ là hình bình hành} \Rightarrow I \text{ là trung điểm } HC
   $$
   *Lí do:* Đường kính và góc vuông; Trực tâm; Hình bình hành
2. **Chứng minh E, C, F thẳng hàng** — Góc BAF và góc DAI là các góc nội tiếp chắn cung BF và cung DE. Vì góc BAF = góc DAI nên cung BF = cung DE. Do đó, góc BCF = góc DCE (hai góc nội tiếp chắn hai cung bằng nhau). Vì BHCD là hình bình hành, BC song song với DH và DC song song với BH. Ta có góc BCD + góc CDH = 180 độ. Tuy nhiên, cách đơn giản hơn là: góc BCF = góc DCE. Vì C, I, H thẳng hàng và I là trung điểm, ta xét tam giác HIC. Ta cần chứng minh E, C, F thẳng hàng. Thực tế, từ góc BCF = góc DCE, và do tính chất đối xứng, ta có thể suy ra E, C, F thẳng hàng.

   $$
   \widehat{BCF} = \widehat{DCE} \Rightarrow E, C, F \text{ thẳng hàng}
   $$
   *Lí do:* Góc nội tiếp; Tính chất hình bình hành
3. **Chứng minh AH song song OI** — AH là đường cao của tam giác ABD nên AH vuông góc với BD. OI là đường trung trực của dây BD nên OI vuông góc với BD. Do đó AH song song với OI. Vì K là hình chiếu của H lên AI nên HK vuông góc với AI, tức là góc AKH bằng 90 độ.

   $$
   AH \perp BD, OI \perp BD \Rightarrow AH \parallel OI
   $$
   *Lí do:* Trực tâm; Đường trung trực
4. **Chứng minh tam giác HIC đồng dạng tam giác KIF** — Xét tam giác HIC và tam giác KIF. Ta có góc HIC bằng góc KIF (đối đỉnh). Vì AH song song với OI và HK vuông góc với AI, ta có thể chứng minh KF song song với AH. Do đó, góc IHC bằng góc IKF (do đó le trong). Vậy tam giác HIC đồng dạng với tam giác KIF.

   $$
   \triangle HIC \sim \triangle KIF
   $$
   *Lí do:* Tam giác đồng dạng
5. **Chứng minh K và F đối xứng qua BD** — Vì tam giác HIC đồng dạng với tam giác KIF và I là trung điểm của HC (HI = IC), nên I cũng là trung điểm của KF (KI = IF). Do đó, BD đi qua trung điểm của KF. Mà BD vuông góc với KF (vì KF song song với AH và AH vuông góc với BD). Vậy BD là trung trực của KF. Suy ra K và F đối xứng nhau qua BD.

   $$
   BD \text{ là trung trực } KF \Rightarrow K, F \text{ đối xứng qua } BD
   $$
   *Lí do:* Tam giác đồng dạng; Trung trực

**Kết luận của ứng dụng:** Chứng minh được K và F đối xứng nhau qua đường thẳng BD.

### Claude tự chấm

- Kết luận: **SAI (lập luận) — nay không hiển thị** — 1/10
- Nhận xét: Bộ kiểm tra đo trên hình: “E, C, F thẳng hàng”, “B, F, D thẳng hàng”, “∠BCF = ∠DCE” đều SAI. Trước đây vẫn hiển thị với nhãn “chưa kiểm chứng”; theo quy tắc mới (#12) không hiển thị cho học sinh.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Sai lập luận từ đoạn E, C, F thẳng hàng

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
- Nhận xét: Như vòng 1 (bộ xác định).

### Đánh giá của bạn

- Điểm (0–10): 5
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Có cách dễ hiểu hơn và gọn hơn cho việc O thuộc đường tròn qua biến đổi góc, và với việc đặt đường tròn thì đặt tâm, đừng dùng kí hiệu (Gamma)

---

## Câu 6 — `hcm-2025-chuyen/3a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của các đoạn thẳng $BC,EF$. Gọi $N$ là giao điểm của hai đường thẳng $AM$ và $EF$. Kẻ $ND$ vuông góc với $BC$ tại $D$. Chứng minh rằng $\widehat{AKE}=\widehat{AMB}$ và ba điểm $A,K,D$ thẳng hàng.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `timeout`: local model request timed out

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết giờ. Vòng 1 bài này là lời giải sai được hiển thị; nay không còn hiển thị lời giải sai.

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

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 176 s · *Chi phí:* $0.0204

**Hướng giải:** Chứng minh tứ giác $BHCK$ là hình bình hành để suy ra $M$ là trung điểm $HK$, từ đó $H, M, K$ thẳng hàng. Vì $T$ nằm trên tia $MH$ nên $T, H, K$ thẳng hàng.
1. **Chứng minh $BK \perp AB$ và $CK \perp AC$** — Vì $AK$ là đường kính của đường tròn $(O)$, góc nội tiếp chắn nửa đường tròn luôn bằng $90^\circ$. Do đó, $\angle ABK = 90^\circ$ và $\angle ACK = 90^\circ$.

   $$
   \angle ABK = 90^\circ, \angle ACK = 90^\circ
   $$
   *Lí do:* Góc nội tiếp chắn nửa đường tròn
2. **Chứng minh $CH \parallel BK$ và $BH \parallel CK$** — Ta có $CF$ là đường cao của tam giác $ABC$ nên $CF \perp AB$, hay $CH \perp AB$. Từ bước 1, ta có $BK \perp AB$. Vì cùng vuông góc với $AB$ nên $CH \parallel BK$. Tương tự, $H$ là trực tâm nên $BH \perp AC$. Mà $CK \perp AC$ (từ bước 1). Vì cùng vuông góc với $AC$ nên $BH \parallel CK$.

   $$
   CH \parallel BK, BH \parallel CK
   $$
   *Lí do:* Hai đường thẳng cùng vuông góc với một đường thẳng thứ ba thì song song với nhau
3. **Chứng minh $M$ là trung điểm $HK$** — Tứ giác $BHCK$ có $CH \parallel BK$ và $BH \parallel CK$ (chứng minh ở bước 2), nên $BHCK$ là hình bình hành. Trong hình bình hành, hai đường chéo $BC$ và $HK$ cắt nhau tại trung điểm mỗi đường. Vì $M$ là trung điểm của $BC$ (theo giả thiết), nên $M$ cũng là trung điểm của $HK$.

   $$
   M \text{ là trung điểm HK }
   $$
   *Lí do:* Dấu hiệu nhận biết hình bình hành và tính chất đường chéo
4. **Kết luận $T, H, K$ thẳng hàng** — Vì $M$ là trung điểm của $HK$ nên ba điểm $H, M, K$ thẳng hàng (cùng thuộc đường thẳng chứa đường chéo $HK$). Theo giả thiết, tia $MH$ cắt đường tròn $(O)$ tại $T$, nghĩa là $T$ nằm trên tia $MH$. Do đó, $T$ cũng nằm trên đường thẳng $HK$. Vậy ba điểm $T, H, K$ thẳng hàng.

   $$
   T, H, K \text{ thẳng hàng }
   $$
   *Lí do:* Tính chất thẳng hàng

**Kết luận của ứng dụng:** Ba điểm $T, H, K$ thẳng hàng.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Không xong trong giới hạn 120 s của cổng SoCLaaS.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Cần nhanh hơn

---

## Câu 8 — `hanoi-2025-chuyen/IV.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$. Đường thẳng qua $B$ và vuông góc với đường thẳng $AM$ tại điểm $E$, cắt đường thẳng $AD$ tại điểm $G$. Đường tròn ngoại tiếp tam giác $MDG$ cắt đường tròn ngoại tiếp tam giác $ADC$ tại hai điểm $D$ và $N$. Chứng minh đường thẳng $NE$ song song với đường thẳng $BF$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: no structurally valid lesson after retries

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Dùng “ABDE nội tiếp” chưa chứng minh; bị loại.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: 

---

## Câu 9 — `khtn-2025-vong2/III.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Cho tam giác $ABC$ cân tại $A$ có $O$ là trung điểm $BC$ và $\widehat{BAC}<90^\circ$. Xét đường tròn $(O)$ tiếp xúc các cạnh $CA,AB$ theo thứ tự tại $R,Q$. Trên các cạnh $CA,AB$ lần lượt lấy $E,F$ (không trùng các đỉnh tam giác) sao cho $EF$ tiếp xúc $(O)$ tại $P$ và $EF$ không song song $BC$. Gọi $H,K$ lần lượt là trực tâm các tam giác $OFB$, $OEC$. Gọi giao điểm của $FH,EK$ với $BC$ lần lượt là $M,N$. Chứng minh rằng hai tam giác $OHM$, $OKN$ đồng dạng và $\frac{OK}{OH}=\frac{AE}{AF}$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Bước 1: Chứng minh FH và EK vuông góc với BC để xác định M, N. Bước 2: Chứng minh O, H, Q thẳng hàng và O, K, R thẳng hàng. Bước 3: Chứng minh góc HOM bằng góc KON. Bước 4: Suy ra OHM đồng dạng OKN. Bước 5: Tính OM và ON theo AF, AE và cos B. Bước 6: Sử dụng tỉ số đồng dạng để chứng minh OK/OH = AE/AF.
1. **Xác định tính chất vuông góc** — Vì H là trực tâm tam giác OFB, nên FH là đường cao hạ từ F xuống cạnh OB. Mà OB nằm trên đường thẳng BC, nên FH vuông góc với BC. Giao điểm M của FH và BC chính là chân đường cao này, do đó tam giác OHM vuông tại M. Tương tự, K là trực tâm tam giác OEC nên EK là đường cao hạ từ E xuống OC (BC), suy ra EK vuông góc BC và tam giác OKN vuông tại N.

   $$
   FH \perp BC \Rightarrow \angle OMH = 90^\circ \\ EK \perp BC \Rightarrow \angle ONK = 90^\circ
   $$
   *Lí do:* Tính chất trực tâm của tam giác
2. **Chứng minh O, H, Q và O, K, R thẳng hàng** — Ta có OQ là bán kính của (O) tiếp xúc với AB tại Q, nên $OQ \perp AB$. Trong tam giác OFB, FH là đường cao (vuông góc OB) và OQ là đường cao (vuông góc FB). Giao điểm H của hai đường cao FH và OQ chính là trực tâm, do đó H nằm trên OQ. Vậy O, H, Q thẳng hàng. Tương tự, OR là bán kính tiếp xúc AC tại R nên $OR \perp AC$. Trong tam giác OEC, EK là đường cao (vuông góc OC) và OR là đường cao (vuông góc EC). Giao điểm K của EK và OR là trực tâm, nên O, K, R thẳng hàng.

   $$
   O, H, Q \text{ thẳng hàng} \\ O, K, R \text{ thẳng hàng}
   $$
   *Lí do:* Tính chất trực tâm
3. **Chứng minh góc HOM bằng góc KON** — Tam giác ABC cân tại A nên $\angle B = \angle C$. Xét tam giác OQB vuông tại Q, ta có $\angle QOB = 90^\circ - \angle B$. Xét tam giác ORC vuông tại R, ta có $\angle ROC = 90^\circ - \angle C$. Vì $\angle B = \angle C$ nên $\angle QOB = \angle ROC$. Mà $\angle HOM = \angle QOB$ (do O, H, Q thẳng hàng và M, O, B thẳng hàng) và $\angle KON = \angle ROC$ (do O, K, R thẳng hàng và N, O, C thẳng hàng), suy ra $\angle HOM = \angle KON$.

   $$
   \angle HOM = \angle KON
   $$
   *Lí do:* Tam giác vuông và tam giác cân
4. **Chứng minh hai tam giác đồng dạng** — Xét hai tam giác OHM và OKN: Ta có $\angle OMH = \angle ONK = 90^\circ$ (chứng minh ở bước 1) và $\angle HOM = \angle KON$ (chứng minh ở bước 3). Vậy $\triangle OHM \sim \triangle OKN$ (theo trường hợp đồng dạng góc-góc).

   $$
   \triangle OHM \sim \triangle OKN
   $$
   *Lí do:* Tam giác đồng dạng (g.g)
5. **Tính độ dài OM và ON** — Ta có $OM = OB - BM$. Trong tam giác OQB vuông tại Q, $OB = OQ / \sin B$. Nhưng ta có thể tính trực tiếp hơn: Trong tam giác ABC, $OB = AB \cos B$ (vì AO là đường cao, tam giác AOB vuông tại O? Không, AO vuông góc BC nên tam giác AOB vuông tại O. Đúng, $OB = AB \cos B$). Trong tam giác FMB vuông tại M, $BM = FB \cos B$. Vậy $OM = OB - BM = (AB - FB) \cos B = AF \cos B$. Tương tự, $ON = OC - CN = AC \cos C - EC \cos C = (AC - EC) \cos C = AE \cos C$. Vì $\angle B = \angle C$ nên $\cos B = \cos C$. Do đó $OM = AF \cos B$ và $ON = AE \cos B$.

   $$
   OM = AF \cos B \\ ON = AE \cos B
   $$
   *Lí do:* Tỉ số lượng giác trong tam giác vuông
6. **Kết luận** — Vì $\triangle OHM \sim \triangle OKN$, tỉ số các cạnh tương ứng bằng nhau: $\frac{OK}{OH} = \frac{ON}{OM}$. Thay các biểu thức vừa tìm được: $\frac{ON}{OM} = \frac{AE \cos B}{AF \cos B} = \frac{AE}{AF}$. Vậy $\frac{OK}{OH} = \frac{AE}{AF}$ (đpcm).

   $$
   \frac{OK}{OH} = \frac{AE}{AF}
   $$
   *Lí do:* Tính chất tam giác đồng dạng

**Kết luận của ứng dụng:** Ta đã chứng minh được hai tam giác OHM và OKN đồng dạng với nhau và tỉ số đồng dạng bằng AE/AF.

$$
\triangle OHM \sim \triangle OKN \quad \text{và} \quad \frac{OK}{OH} = \frac{AE}{AF}
$$

### Claude tự chấm

- Kết luận: **SAI (lập luận) — nay không hiển thị** — 1/10
- Nhận xét: Bộ kiểm tra đo: “∠HOM = 20°”, “∠KON = 20°”, “OHM ∼ OKN” sai trên hình dựng; các bước khẳng định không chứng minh (OM = AF cos B dùng lượng giác). Không hiển thị theo quy tắc mới. Sau sửa #15 (kết luận của chính đề sai trên hình dựng ⇒ hình dựng sai, không dùng để bác bỏ): bài này lại được hiển thị là “máy không kiểm chứng được” — giới hạn: khi hình dựng sai, bộ kiểm tra không phát hiện được lập luận sai.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Được dùng lượng giác ở mức này được

---

## Câu 10 — `ptnk-2026-chuyen/2`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 2. Cho tứ giác lồi $ABCD$ có các cạnh $BC = 7$, $DA = 1$, và hai đường chéo $AC$ và $BD$ vuông góc với nhau. Tìm giá trị lớn nhất của chu vi tứ giác $ABCD$.

**Đáp án tham khảo** (official): 18

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 26 s · *Chi phí:* $0.0093

**Hướng giải:** Sử dụng tính chất $AB^2 + CD^2 = BC^2 + DA^2$ của tứ giác có hai đường chéo vuông góc để tìm tổng bình phương hai cạnh còn lại. Sau đó dùng bất đẳng thức $(a+b)^2 \le 2(a^2+b^2)$ để tìm giá trị lớn nhất của tổng hai cạnh này, từ đó suy ra giá trị lớn nhất của chu vi.
1. **Xác định các tam giác vuông** — Gọi O là giao điểm của hai đường chéo AC và BD. Vì AC vuông góc với BD, bốn tam giác OAB, OBC, OCD, ODA đều là tam giác vuông tại O.

   $$
   \triangle OAB, \triangle OBC, \triangle OCD, \triangle ODA \text{ vuông tại } O
   $$
   *Lí do:* Định nghĩa hai đường thẳng vuông góc
2. **Chứng minh đẳng thức giữa các cạnh** — Áp dụng định lý Pythagore cho từng tam giác vuông, ta có:
$AB^2 = OA^2 + OB^2$
$CD^2 = OC^2 + OD^2$
$BC^2 = OB^2 + OC^2$
$DA^2 = OD^2 + OA^2$

Tính tổng $AB^2 + CD^2$:
$AB^2 + CD^2 = (OA^2 + OB^2) + (OC^2 + OD^2) = OA^2 + OB^2 + OC^2 + OD^2$

Tính tổng $BC^2 + DA^2$:
$BC^2 + DA^2 = (OB^2 + OC^2) + (OD^2 + OA^2) = OA^2 + OB^2 + OC^2 + OD^2$

Suy ra: $AB^2 + CD^2 = BC^2 + DA^2$.

   $$
   AB^2 + CD^2 = BC^2 + DA^2
   $$
   *Lí do:* Định lý Pythagore và tính chất cộng đại số
3. **Tính tổng bình phương hai cạnh** — Thay các giá trị đã biết $BC = 7$ và $DA = 1$ vào đẳng thức trên:
$AB^2 + CD^2 = 7^2 + 1^2 = 49 + 1 = 50$.

   $$
   AB^2 + CD^2 = 50
   $$
   *Lí do:* Thay số vào đẳng thức đã chứng minh
4. **Chặn giá trị của tổng hai cạnh** — Ta cần tìm giá trị lớn nhất của chu vi $P = AB + CD + BC + DA = AB + CD + 8$. Để $P$ lớn nhất thì $AB + CD$ phải lớn nhất.

Áp dụng bất đẳng thức $(a - b)^2 \ge 0 \Rightarrow a^2 + b^2 \ge 2ab \Rightarrow 2(a^2 + b^2) \ge a^2 + b^2 + 2ab = (a + b)^2$.

Với $a = AB$ và $b = CD$, ta có:
$(AB + CD)^2 \le 2(AB^2 + CD^2)$

Thay $AB^2 + CD^2 = 50$:
$(AB + CD)^2 \le 2 \times 50 = 100$

Suy ra $AB + CD \le \sqrt{100} = 10$ (vì độ dài luôn dương).

   $$
   AB + CD \le 10
   $$
   *Lí do:* Bất đẳng thức $(a+b)^2 \le 2(a^2+b^2)$
5. **Tính giá trị lớn nhất của chu vi** — Dấu bằng xảy ra khi $AB = CD$. Khi đó $AB^2 + AB^2 = 50 \Rightarrow 2AB^2 = 50 \Rightarrow AB^2 = 25 \Rightarrow AB = 5$. Vậy $AB = CD = 5$.

Giá trị lớn nhất của chu vi là:
$P_{max} = (AB + CD)_{max} + BC + DA = 10 + 7 + 1 = 18$.

Ta cần kiểm tra xem có tồn tại tứ giác lồi ABCD với $AB=CD=5, BC=7, DA=1$ và $AC \perp BD$ không.
Gọi O là giao điểm. $OA^2+OB^2=25, OB^2+OC^2=49, OC^2+OD^2=25, OD^2+OA^2=1$.
Từ $OA^2+OB^2=25$ và $OD^2+OA^2=1$, suy ra $OB^2 - OD^2 = 24$.
Từ $OB^2+OC^2=49$ và $OC^2+OD^2=25$, suy ra $OB^2 - OD^2 = 24$ (thỏa mãn).
Chọn $OD=0$ (không được vì O nằm trong tứ giác lồi, các đoạn phải dương).
Thử chọn $OA=3, OB=4 \Rightarrow AB=5$. $OD^2 = 1-9 = -8$ (vô lý).
Thử chọn $OA=1, OB=\sqrt{24} \Rightarrow AB=5$. $OD^2 = 1-1=0$ (O trùng D, không phải tứ giác lồi).
Thử chọn $OA=0.5$. $OB^2 = 25 - 0.25 = 24.75$. $OD^2 = 1 - 0.25 = 0.75$. $OC^2 = 25 - 0.75 = 24.25$. $BC^2 = 24.75 + 24.25 = 49 \Rightarrow BC=7$.
Các độ dài $OA, OB, OC, OD$ đều dương, nên O nằm trong tứ giác. Tứ giác tồn tại và lồi.
Vậy giá trị lớn nhất là 18.

   $$
   P_{max} = 18
   $$
   *Lí do:* Thay giá trị lớn nhất vào công thức chu vi

**Kết luận của ứng dụng:** Giá trị lớn nhất của chu vi tứ giác ABCD là 18.

$$
18
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Chu vi lớn nhất 18 (AB² + CD² = 50, AB + CD ≤ 10). Vòng 2 bài này thất bại (mô hình bỏ cuộc khi không suy nghĩ); nay có lời giải nhưng bước kiểm tra dấu bằng ngắn hơn vòng 1.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Có thể không cần kiểm lại

---

## Câu 11 — `geo8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$, các đường cao $BE$, $CF$ cắt nhau tại $H$. Chứng minh tứ giác $AEHF$ nội tiếp và $AE\cdot AC=AF\cdot AB$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\widehat{AEH}+\widehat{AFH}=90^\circ+90^\circ=180^\circ$ nên $AEHF$ nội tiếp; $\triangle AEB\backsim\triangle AFC$ (g.g: góc $A$ chung, $\widehat{AEB}=\widehat{AFC}=90^\circ$) nên $AE/AF=AB/AC$.

### Lời giải của ứng dụng

*Nguồn:* `proof-planner` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh lần lượt: tứ giác AEHF nội tiếp; AE· AC = AF· AB. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
1. **tứ giác AEHF nội tiếp** — Ta có:
∠AEH = 90° (E là hình chiếu của B trên AC)
= 180° − ∠AFH (F là hình chiếu của C trên AB)
⇒ ∠AEH + ∠AFH = 180°
∠HEA = 90° (vì BE ⊥ AC; các điểm thuộc các đường thẳng theo cách dựng hoặc kết quả trước đó).
∠HFA = 90° (vì CF ⊥ AB; các điểm thuộc các đường thẳng theo cách dựng hoặc kết quả trước đó).
Hai góc vuông cùng chắn đoạn HA; vì vậy bốn điểm cùng thuộc đường tròn đường kính HA.
⇒ tứ giác AEHF nội tiếp.

   $$
   \begin{aligned}\widehat{AEH} &= 90^\circ \\ &= 180^\circ - \widehat{AFH} \\ &\Rightarrow \widehat{AEH} + \widehat{AFH} = 180^\circ \\ &\Rightarrow \widehat{HEA} = 90^\circ \\ &\widehat{HFA} = 90^\circ \\ &\Rightarrow A, E, H, F\text{ cùng thuộc một đường tròn}\end{aligned}
   $$
   *Lí do:* cộng, trừ góc; dấu hiệu tứ giác nội tiếp
2. **AE· AC = AF· AB** — Xét △ABE và △ACF có:
• ∠EAB là góc chung
• ∠ABE = ∠ACF (vì BE ⊥ AC, E là hình chiếu của B trên AC; CF ⊥ AB, F là hình chiếu của C trên AB)
⇒ △ABE ∽ △ACF (g.g)
Ta có:
AE · AC = AB · AF (△ABE ∽ △ACF: AB/AC = AE/AF)
⇒ AE · AC = AF · AB.

   $$
   \begin{aligned}&\triangle ABE \backsim \triangle ACF \\ &\Rightarrow AE \cdot  AC &= AB \cdot  AF \\ &\Rightarrow AE \cdot AC = AF \cdot AB\end{aligned}
   $$
   *Lí do:* hai tam giác đồng dạng; biến đổi tỉ số, đẳng thức độ dài

**Kết luận của ứng dụng:** Đã chứng minh: tứ giác AEHF nội tiếp; AE· AC = AF· AB.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Bộ lập kế hoạch chứng minh (xác định): AEHF nội tiếp và AE·AC = AF·AB; trạng thái một phần.

### Đánh giá của bạn

- Điểm (0–10): 7
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Chứng minh AEHF quá lòng vòng

---

## Câu 12 — `geo8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho đường tròn $(O)$ đường kính $AB$ và điểm $C$ thuộc đường tròn ($C$ khác $A$, $B$). Tiếp tuyến tại $C$ cắt các tiếp tuyến tại $A$ và $B$ lần lượt tại $M$ và $N$. Chứng minh $MN=AM+BN$ và $\widehat{MON}=90^\circ$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: tính chất hai tiếp tuyến cắt nhau cho $MA=MC$, $NB=NC$ nên $MN=MC+CN=AM+BN$; $OM$, $ON$ là phân giác của hai góc kề bù $\widehat{AOC}$, $\widehat{COB}$ nên $\widehat{MON}=90^\circ$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 151 s · *Chi phí:* $0.0395

**Hướng giải:** Để chứng minh MN = AM + BN, ta sử dụng tính chất hai tiếp tuyến cắt nhau để suy ra MA = MC và NB = NC, sau đó thay vào đẳng thức MN = MC + CN. Để chứng minh góc MON = 90 độ, ta cũng dùng tính chất hai tiếp tuyến cắt nhau để suy ra MO và NO lần lượt là phân giác của góc AMN và góc BNM. Vì MA và NB cùng vuông góc với AB nên MA song song với NB, dẫn đến tổng góc AMN và BNM bằng 180 độ. Từ đó tính được góc MON = 90 độ.
1. **Chứng minh MA = MC và NB = NC** — Ta xét điểm M. MA và MC là hai tiếp tuyến của đường tròn (O) cắt nhau tại M. Theo tính chất hai tiếp tuyến cắt nhau, ta có MA = MC. Tương tự, NB và NC là hai tiếp tuyến của đường tròn (O) cắt nhau tại N, nên NB = NC.

   $$
   MA = MC, NB = NC
   $$
   *Lí do:* Tính chất hai tiếp tuyến cắt nhau
2. **Chứng minh MN = AM + BN** — Vì M, C, N cùng nằm trên tiếp tuyến tại C của đường tròn (O), nên ba điểm M, C, N thẳng hàng. Do đó, độ dài đoạn thẳng MN bằng tổng độ dài hai đoạn thẳng MC và CN: MN = MC + CN. Thay MC = MA và CN = NB (theo kết quả câu 1), ta được MN = MA + BN.

   $$
   MN = MC + CN = MA + BN
   $$
   *Lí do:* Tính chất cộng độ dài đoạn thẳng và kết quả câu 1
3. **Chứng minh MO và NO là các tia phân giác** — Tiếp tục sử dụng tính chất hai tiếp tuyến cắt nhau: đường thẳng nối giao điểm hai tiếp tuyến với tâm đường tròn là tia phân giác của góc tạo bởi hai tiếp tuyến đó. Vì MA và MC là hai tiếp tuyến cắt nhau tại M, nên MO là tia phân giác của góc AMN, hay góc AMO = góc CMN = 1/2 góc AMN. Tương tự, vì NB và NC là hai tiếp tuyến cắt nhau tại N, nên NO là tia phân giác của góc BNM, hay góc BNO = góc CNO = 1/2 góc BNM.

   $$
   \text{ góc }_AMO = \text{ góc }_CMN = \frac{1}{2}\text{ góc }_AMN, \text{ góc }_BNO = \text{ góc }_CNO = \frac{1}{2}\text{ góc }_BNM
   $$
   *Lí do:* Tính chất hai tiếp tuyến cắt nhau
4. **Chứng minh MA song song với NB** — Vì MA là tiếp tuyến của đường tròn (O) tại A, nên MA vuông góc với bán kính OA (hay AB). Do đó, góc MAB = 90 độ. Tương tự, vì NB là tiếp tuyến của đường tròn (O) tại B, nên NB vuông góc với bán kính OB (hay AB). Do đó, góc NBA = 90 độ. Vì MA và NB cùng vuông góc với đường thẳng AB nên MA song song với NB.

   $$
   MA \perp AB, NB \perp AB \Rightarrow MA \parallel NB
   $$
   *Lí do:* Tính chất tiếp tuyến và dấu hiệu nhận biết hai đường thẳng song song
5. **Chứng minh tổng góc AMN và BNM bằng 180 độ** — Vì MA song song với NB, nên hai góc trong cùng phía tạo bởi cát tuyến MN là góc AMN và góc BNM có tổng bằng 180 độ. Tức là góc AMN + góc BNM = 180 độ.

   $$
   \text{ góc }_AMN + \text{ góc }_BNM = 180^\circ
   $$
   *Lí do:* Tính chất hai đường thẳng song song
6. **Chứng minh góc MON = 90 độ** — Xét tam giác MON. Tổng ba góc trong một tam giác bằng 180 độ, nên góc MON = 180 độ - (góc OMN + góc ONM). Từ câu 3, ta có góc OMN = 1/2 góc AMN và góc ONM = 1/2 góc BNM. Do đó, góc OMN + góc ONM = 1/2 góc AMN + 1/2 góc BNM = 1/2 (góc AMN + góc BNM). Thay góc AMN + góc BNM = 180 độ (theo câu 5), ta được góc OMN + góc ONM = 1/2 . 180 độ = 90 độ. Vậy góc MON = 180 độ - 90 độ = 90 độ.

   $$
   \text{ góc }_MON = 180^\circ - (\text{ góc }_OMN + \text{ góc }_ONM) = 180^\circ - \frac{1}{2}(\text{ góc }_AMN + \text{ góc }_BNM) = 180^\circ - 90^\circ = 90^\circ
   $$
   *Lí do:* Tổng ba góc trong tam giác và kết quả câu 3, 5

**Kết luận của ứng dụng:** a) $MN = AM + BN$
b) $\boxed{\text{góc } MON = 90^\text{o}}$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: MN = AM + BN và ∠MON = 90°; trình bày “90^\text{o}” chưa đẹp.

### Đánh giá của bạn

- Điểm (0–10): 7
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Chứng minh MON = 90 khá phức tạp, có cách gọn hơn

---

## Câu 13 — `geo8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho tam giác $ABC$ vuông tại $A$ có $AB=6$ cm, $AC=8$ cm, $AD$ là đường phân giác ($D$ thuộc $BC$). Tính $BD$ và $DC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $BC=10$ cm, $BD=\frac{30}{7}$ cm, $DC=\frac{40}{7}$ cm

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (local model request timed out)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết thời gian (tính chất đường phân giác chưa có bộ giải xác định).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 14 — `geo8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn có $\widehat{A}=80^\circ$ và $\widehat{B}=70^\circ$. Tính $\widehat{C}$ và $\widehat{D}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\widehat{C}=100^\circ$, $\widehat{D}=110^\circ$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 37 s · *Chi phí:* $0.0154

**Hướng giải:** Sử dụng tính chất hai góc đối diện trong tứ giác nội tiếp luôn bù nhau (tổng bằng $180^\circ$) để tính trực tiếp $\widehat{C}$ và $\widehat{D}$ từ $\widehat{A}$ và $\widehat{B}$.
1. **Áp dụng tính chất góc đối diện** — Vì tứ giác $ABCD$ nội tiếp đường tròn, nên tổng số đo hai góc đối diện bằng $180^\circ$. Điều này có nghĩa là $\widehat{A}$ và $\widehat{C}$ bù nhau, cũng như $\widehat{B}$ và $\widehat{D}$ bù nhau.

   $$
   \widehat{A} + \widehat{C} = 180^\circ \text{ và } \widehat{B} + \widehat{D} = 180^\circ
   $$
   *Lí do:* Tính chất tứ giác nội tiếp (hai góc đối diện bù nhau)
2. **Tính góc $\widehat{C}$** — Từ phương trình $\widehat{A} + \widehat{C} = 180^\circ$, ta suy ra $\widehat{C} = 180^\circ - \widehat{A}$. Thay $\widehat{A} = 80^\circ$ vào, ta tính được $\widehat{C}$.

   $$
   \widehat{C} = 180^\circ - 80^\circ = 100^\circ
   $$
   *Lí do:* Biến đổi đại số đơn giản
3. **Tính góc $\widehat{D}$** — Tương tự, từ phương trình $\widehat{B} + \widehat{D} = 180^\circ$, ta suy ra $\widehat{D} = 180^\circ - \widehat{B}$. Thay $\widehat{B} = 70^\circ$ vào, ta tính được $\widehat{D}$.

   $$
   \widehat{D} = 180^\circ - 70^\circ = 110^\circ
   $$
   *Lí do:* Biến đổi đại số đơn giản

**Kết luận của ứng dụng:** Ta có:
$\widehat{C} = 100^\circ$
$\widehat{D} = 110^\circ$

$$
\widehat{C} = 100^\circ, \widehat{D} = 110^\circ
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: ∠C = 100°, ∠D = 110°.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 15 — `geo8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Từ điểm $M$ nằm ngoài đường tròn $(O)$ kẻ tiếp tuyến $MA$ ($A$ là tiếp điểm) và cát tuyến $MBC$ ($B$ nằm giữa $M$ và $C$). Chứng minh $MA^2=MB\cdot MC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\triangle MAB\backsim\triangle MCA$ (g.g: góc $M$ chung, $\widehat{MAB}=\widehat{MCA}$ — góc tạo bởi tiếp tuyến và dây cung bằng góc nội tiếp cùng chắn cung $AB$) nên $MA/MC=MB/MA$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 167 s · *Chi phí:* $0.0143

**Hướng giải:** Để chứng minh $MA^2 = MB \cdot MC$, ta sẽ chứng minh hai tam giác $\triangle MAB$ và $\triangle MCA$ đồng dạng với nhau. Từ đó suy ra tỉ số các cạnh tương ứng và biến đổi đại số để có kết quả.
1. **Chứng minh góc bằng nhau** — Ta sẽ sử dụng tính chất của góc tạo bởi tiếp tuyến và dây cung. Góc $\angle MAB$ là góc tạo bởi tiếp tuyến $MA$ và dây cung $AB$. Theo định lý, số đo của góc này bằng nửa số đo cung nhỏ $AB$. Mặt khác, góc nội tiếp $\angle ACB$ (hay $\angle C$) cũng chắn cung $AB$ nên số đo của nó cũng bằng nửa số đo cung $AB$. Do đó, hai góc này bằng nhau.

   $$
   \angle MAB = \angle ACB
   $$
   *Lí do:* Góc tạo bởi tiếp tuyến và dây cung bằng góc nội tiếp cùng chắn một cung
2. **Chứng minh tam giác đồng dạng** — Xét hai tam giác $\triangle MAB$ và $\triangle MCA$. Ta có: $\angle M$ là góc chung của cả hai tam giác. Và ở bước 1, ta đã chứng minh được $\angle MAB = \angle MCA$ (vì $\angle MCA$ chính là $\angle C$). Theo trường hợp đồng dạng thứ nhất (g.g - góc-góc), hai tam giác này đồng dạng với nhau.

   $$
   \triangle MAB \backsim \triangle MCA
   $$
   *Lí do:* Tam giác đồng dạng (g.g): $\angle M$ chung, $\angle MAB = \angle MCA$
3. **Suy ra hệ thức lượng** — Từ sự đồng dạng $\triangle MAB \backsim \triangle MCA$, ta lập tỉ số các cạnh tương ứng. Lưu ý thứ tự các đỉnh: $M$ ứng với $M$, $A$ ứng với $C$, $B$ ứng với $A$. Ta có tỉ số: $\frac{MA}{MC} = \frac{MB}{MA} = \frac{AB}{CA}$. Từ hai tỉ số đầu tiên, ta nhân chéo để được đẳng thức cần chứng minh.

   $$
   MA^2 = MB \cdot MC
   $$
   *Lí do:* Tỉ số các cạnh tương ứng trong tam giác đồng dạng

**Kết luận của ứng dụng:** Ta đã chứng minh được $MA^2 = MB \cdot MC$ (đpcm).

$$
MA^2 = MB \cdot MC
$$

### Claude tự chấm

- Kết luận: **đúng (bị giữ lại nhầm, đã sửa)** — 7/10
- Nhận xét: Lúc chạy bị quy tắc #13 giữ lại vì phép kiểm tra “MA^2 = MB*MC” của mô hình bị thử như đẳng thức đại số (M, A, B, C là số) — sai cách kiểm tra, không phải lời giải sai. Sửa #14: quan hệ giữa các đoạn thẳng không thử bằng đại số; nay được hiển thị.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 16 — `geo8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Cho đường tròn $(O;5\text{ cm})$ và hai dây $AB=8$ cm, $CD=6$ cm song song với nhau, nằm khác phía đối với tâm $O$. Tính khoảng cách giữa hai dây.

**Đáp án tham khảo** (verified by SymPy/enumeration): $7$ cm (khoảng cách từ $O$ đến $AB$ là $3$ cm, đến $CD$ là $4$ cm)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 66 s · *Chi phí:* $0.0221

**Hướng giải:** Kẻ đường thẳng đi qua tâm O vuông góc với hai dây song song, từ đó xác định được các trung điểm của hai dây. Áp dụng định lý Pythagore trong hai tam giác vuông tạo thành để tính khoảng cách từ tâm đến mỗi dây, rồi cộng lại vì hai dây nằm khác phía đối với tâm.
1. **Xây dựng đường vuông góc với hai dây** — Gọi I và J lần lượt là trung điểm của AB và CD. Vì O là tâm đường tròn, nên $OI \perp AB$ và $OJ \perp CD$. Do $AB \parallel CD$, ba điểm I, O, J thẳng hàng và đoạn thẳng IJ chính là khoảng cách giữa hai dây.

   $$
   I \in AB, J \in CD, IJ \perp AB \Rightarrow IJ \perp CD
   $$
   *Lí do:* Tính chất đường kính vuông góc với dây cung
2. **Tính khoảng cách từ O đến AB** — Vì I là trung điểm AB nên $AI = \frac{AB}{2} = 4$ cm. Xét tam giác OIA vuông tại I, áp dụng định lý Pythagore: $OI^2 = OA^2 - AI^2 = 5^2 - 4^2 = 9 \Rightarrow OI = 3$ cm.

   $$
   OI = \sqrt{OA^2 - AI^2} = \sqrt{5^2 - 4^2} = 3 \text{ cm}
   $$
   *Lí do:* Định lý Pythagore trong tam giác vuông OIA
3. **Tính khoảng cách từ O đến CD** — Tương tự, vì J là trung điểm CD nên $CJ = \frac{CD}{2} = 3$ cm. Xét tam giác OJC vuông tại J, áp dụng định lý Pythagore: $OJ^2 = OC^2 - CJ^2 = 5^2 - 3^2 = 16 \Rightarrow OJ = 4$ cm.

   $$
   OJ = \sqrt{OC^2 - CJ^2} = \sqrt{5^2 - 3^2} = 4 \text{ cm}
   $$
   *Lí do:* Định lý Pythagore trong tam giác vuông OJC
4. **Tính khoảng cách giữa hai dây** — Vì hai dây AB và CD nằm khác phía đối với tâm O, nên khoảng cách giữa hai dây là tổng hai khoảng cách từ O đến từng dây: $IJ = OI + OJ = 3 + 4 = 7$ cm.

   $$
   IJ = OI + OJ = 3 + 4 = 7 \text{ cm}
   $$
   *Lí do:* Tính chất cộng đoạn thẳng

**Kết luận của ứng dụng:** Khoảng cách giữa hai dây AB và CD là 7 cm.

$$
7 \text{ cm}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 7 cm (3 cm + 4 cm).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---
