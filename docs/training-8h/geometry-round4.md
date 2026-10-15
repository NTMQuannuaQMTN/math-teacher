# Hình học — vòng 4

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/5a` | luyện | không có lời giải | không có lời giải | không có lời giải 0/10 | 60 s | $0.0221 |
| 2 | `ptnk-2023-chuyen/5b` | luyện | không có lời giải | không có lời giải | không có lời giải 0/10 | 132 s | $0.0365 |
| 3 | `ptnk-2024-chuyen/4a` | luyện | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng (không hiển thị) 6/10 | 192 s | $0.0508 |
| 4 | `ptnk-2024-chuyen/4b` | luyện | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | sai (không hiển thị) 0/10 | 106 s | $0.0323 |
| 5 | `ptnk-2025-chuyen/4a` | luyện | geometry-case-proof | kiểm chứng một phần | đúng 6/10 | 0 s | $0 |
| 6 | `hcm-2025-chuyen/3a` | luyện (chạy lại) | không có lời giải | không có lời giải | không có lời giải 0/10 | 115 s | $0 |
| 7 | `hanoi-2025-chuyen/IV.1` | luyện (chạy lại) | default | kiểm chứng một phần | SAI lập luận — đã hiển thị 3/10 | 49 s | $0.0162 |
| 8 | `hanoi-2025-chuyen/IV.2` | luyện | không có lời giải | không có lời giải | không có lời giải 0/10 | 193 s | $0.0261 |
| 9 | `khtn-2025-vong2/III.1` | luyện | default | máy không kiểm chứng được | đúng 7/10 | 142 s | $0.0411 |
| 10 | `ptnk-2026-chuyen/2` | luyện (chạy lại) | default | kiểm chứng một phần | đúng 6/10 | 34 s | $0.0126 |
| 11 | `geo8-h1` | kiểm tra cũ | proof-planner | kiểm chứng một phần | đúng 8/10 | 0 s | $0 |
| 12 | `geo8-h2` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 7/10 | 273 s | $0.0125 |
| 13 | `geo8-h3` | kiểm tra cũ | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | sai (không hiển thị) 0/10 | 48 s | $0.0185 |
| 14 | `geo8-h4` | kiểm tra cũ | default | máy không kiểm chứng được | SAI — đã hiển thị 0/10 | 58 s | $0.0214 |
| 15 | `geo8-h5` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 36 s | $0.0154 |
| 16 | `geo8-h6` | kiểm tra cũ | default | đã kiểm chứng bằng máy | đúng 9/10 | 34 s | $0.0107 |
| 17 | `geo9-f1` | MỚI | routine-right-triangle | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |
| 18 | `geo9-f2` | MỚI | proof-planner | kiểm chứng một phần | đúng 9/10 | 0 s | $0 |
| 19 | `geo9-f3` | MỚI | proof-planner | kiểm chứng một phần | đúng 9/10 | 0 s | $0 |
| 20 | `geo9-f4` | MỚI | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | sai (không hiển thị) 2/10 | 54 s | $0.0201 |
| 21 | `geo9-f5` | MỚI | default | máy không kiểm chứng được | đúng 9/10 | 47 s | $0.0185 |
| 22 | `hcm-2025-chuyen/3b` | MỚI | không có lời giải | không có lời giải | không có lời giải 0/10 | 300 s | $0.0184 |

## Câu 1 — `ptnk-2023-chuyen/5a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$). Chứng minh rằng đường tròn ngoại tiếp tam giác $ALH$ đi qua tâm nội tiếp $I$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải.** Mô hình không viết được lời giải hợp lệ (dùng điều chưa chứng minh, sai cấu trúc) sau các lần thử.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Mô hình dùng 'ALHI nội tiếp' mà không chứng minh, cả hai lần → bộ kiểm tra cấu trúc chặn (đúng).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `ptnk-2023-chuyen/5b`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$. Gọi $D,E,F$ là các tiếp điểm của đường tròn $(I)$ nội tiếp tam giác $ABC$ với $BC,CA,AB$. Từ chân đường phân giác ngoài $L$ của góc $\widehat{BAC}$ ($L$ thuộc $BC$), kẻ tiếp tuyến $LH$ đến đường tròn $(I)$ ($H$ thuộc $(I)$, $H\ne D$). Chứng minh $\widehat{BAD}=\widehat{CAH}$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải.** Mô hình không viết được lời giải hợp lệ (dùng điều chưa chứng minh, sai cấu trúc) sau các lần thử.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Như 5a (AILM nội tiếp không chứng minh).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `ptnk-2024-chuyen/4a`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$. Chứng minh $CEHK$ là hình bình hành và $IB^2=ID^2=IA\cdot IK$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 192 s · *Chi phí:* $0.0508

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: methods within the curriculum (geometry tools outside the knowledge base (antiparallel)

**Hướng giải:** Chứng minh $CEHK$ là hình bình hành bằng cách chứng minh hai cạnh đối $CE$ và $HK$ song song và bằng nhau. Sau đó, sử dụng tính chất đường chéo hình bình hành và hệ thức lượng trong đường tròn (lũy thừa điểm) để chứng minh đẳng thức $IB^2 = ID^2 = IA \text{.} IK$.
1. **Chứng minh AH = 2OI và AH // OI** — Trong tam giác $ABD$, $O$ là tâm đường tròn ngoại tiếp và $H$ là trực tâm. Ta có tính chất quen thuộc: $AH = 2OI$ và $AH // OI$ (vì $OI \perp BD$ và $AH \perp BD$).

   $$
   AH = 2OI \text{ và } AH // OI
   $$
   *Lí do:* Tính chất trực tâm và tâm đường tròn ngoại tiếp tam giác
2. **Chứng minh C, I, H thẳng hàng và I là trung điểm CH** — Xét tam giác $AHC$. Ta có $O$ là trung điểm của $AC$ (do $AC$ là đường kính) và $OI // AH$. Suy ra $OI$ là đường trung bình của tam giác $AHC$. Do đó $I$ là trung điểm của $CH$ và $C, I, H$ thẳng hàng.

   $$
   C, I, H \text{ thẳng hàng và I là trung điểm CH }
   $$
   *Lí do:* Đường trung bình của tam giác
3. **Chứng minh $CE \perp AI$** — Vì $AC$ là đường kính của đường tròn $(O)$, góc nội tiếp chắn nửa đường tròn là góc vuông. Vậy $\angle AEC = 90^\circ$, hay $CE \perp AI$.

   $$
   CE \perp AI
   $$
   *Lí do:* Góc nội tiếp chắn nửa đường tròn
4. **Chứng minh CE // HK** — Theo giả thiết, $HK \perp AI$ tại $K$. Từ kết quả bước 3 ($CE \perp AI$) và giả thiết, suy ra $CE // HK$ (cùng vuông góc với $AI$).

   $$
   CE // HK
   $$
   *Lí do:* Hai đường thẳng cùng vuông góc với một đường thẳng thứ ba thì song song
5. **Chứng minh CE = HK** — Xét $\triangle CIE$ và $\triangle HIK$. Ta có $\angle CIE = \angle HIK$ (đối đỉnh), $\angle ICE = \angle IHK$ (do đó le trong vì $CE // HK$), và $IC = IH$ (chứng minh ở bước 2). Vậy $\triangle CIE = \triangle HIK$ (g.c.g). Suy ra $CE = HK$.

   $$
   CE = HK
   $$
   *Lí do:* Tam giác bằng nhau (g.c.g)
6. **Chứng minh CEHK là hình bình hành** — Tứ giác $CEHK$ có $CE // HK$ (bước 4) và $CE = HK$ (bước 5). Vậy $CEHK$ là hình bình hành.

   $$
   \text{ CEHK là hình bình hành }
   $$
   *Lí do:* Dấu hiệu nhận biết hình bình hành (hai cạnh đối song song và bằng nhau)
7. **Chứng minh IB = ID** — Vì $I$ là trung điểm $BD$, nên $IB = ID$. Do đó $IB^2 = ID^2$.

   $$
   IB = ID
   $$
   *Lí do:* I là trung điểm BD
8. **Chứng minh IE = IK** — Vì $CEHK$ là hình bình hành, hai đường chéo $CH$ và $EK$ cắt nhau tại trung điểm $I$. Suy ra $IE = IK$.

   $$
   IE = IK
   $$
   *Lí do:* Tính chất đường chéo hình bình hành
9. **Chứng minh $IB^2 = ID^2 = IA \text{.} IK$** — Xét đường tròn $(O)$ và điểm $I$ bên trong. Áp dụng hệ thức lượng (lũy thừa điểm $I$) cho hai dây $BD$ và $AE$ cắt nhau tại $I$, ta có $IA \text{.} IE = IB \text{.} ID$. Vì $IB = ID$ (bước 7) và $IE = IK$ (bước 8), thay vào ta được $IA \text{.} IK = IB^2$. Vậy $IB^2 = ID^2 = IA \text{.} IK$.

   $$
   IB^2 = ID^2 = IA \text{.} IK
   $$
   *Lí do:* Lũy thừa của điểm đối với đường tròn

**Kết luận của ứng dụng:** Chứng minh được $CEHK$ là hình bình hành và $IB^2 = ID^2 = IA \text{.} IK$.

### Claude tự chấm

- Kết luận: **đúng (không hiển thị)** — 6/10
- Nhận xét: Bây giờ giải tổng quát như bạn yêu cầu: AH = 2OI, I là trung điểm CH, CE ∥ HK, △CIE = △HIK → hình bình hành; IA·IE = IB·ID với IE = IK. Lập luận đúng, nhưng bị chặn vì nhãn nội bộ 'antiparallel' (công cụ ngoài kho kiến thức) — cần xem lại luật này.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `ptnk-2024-chuyen/4b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có tam giác $ABD$ là tam giác nhọn và đường chéo $AC$ đi qua tâm $O$ của đường tròn $(O)$. Gọi $I$ là trung điểm $BD$, $H$ là trực tâm của tam giác $ABD$, $E$ là giao điểm khác $A$ của $AI$ với $(O)$ và $K$ là hình chiếu vuông góc của $H$ lên $AI$. Lấy điểm $F$ trên cung nhỏ $BD$ của đường tròn $(O)$ sao cho $\widehat{BAF}=\widehat{DAI}$. Chứng minh các điểm $K$ và $F$ đối xứng nhau qua đường thẳng $BD$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 106 s · *Chi phí:* $0.0323

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: E, C, F thẳng hàng; ∠BCF = ∠DCE; ∠BCD = ∠BAD

**Hướng giải:** Chứng minh I là trung điểm HC, sau đó chứng minh E, C, F thẳng hàng. Tiếp theo, chứng minh AH song song OI và KF song song AH. Cuối cùng, chứng minh BD là trung trực của KF.
1. **Chứng minh I là trung điểm HC** — Vì AC là đường kính của đường tròn (O) nên góc ABC và góc ADC bằng 90 độ. Điều này có nghĩa là BC vuông góc AB và DC vuông góc AD. Vì H là trực tâm của tam giác ABD nên BH vuông góc AD và DH vuông góc AB. Từ đó suy ra BH song song DC và DH song song BC. Vậy BHCD là hình bình hành. Vì I là trung điểm BD nên I cũng là trung điểm HC.

   $$
   BC \perp AB, DC \perp AD \Rightarrow BH \parallel DC, DH \parallel BC \Rightarrow BHCD \text{ là hình bình hành} \Rightarrow I \text{ là trung điểm } HC.
   $$
   *Lí do:* Đường kính và góc vuông, Hình bình hành
2. **Chứng minh E, C, F thẳng hàng** — Vì góc BAF = góc DAI nên cung BF bằng cung DE. Do đó góc BCF bằng góc DCE. Vì góc BCD bằng góc BAD (tứ giác nội tiếp) và góc BAD bằng góc BAF + góc FAD, ta có thể suy ra E, C, F thẳng hàng.

   $$
   \widehat{BAF} = \widehat{DAI} \Rightarrow \text{cung } BF = \text{cung } DE \Rightarrow \widehat{BCF} = \widehat{DCE} \Rightarrow E, C, F \text{ thẳng hàng}.
   $$
   *Lí do:* Góc nội tiếp và cung tròn
3. **Chứng minh AH song song OI** — Vì H là trực tâm của tam giác ABD nên AH vuông góc BD. Vì I là trung điểm BD nên OI là đường trung trực của BD, do đó OI vuông góc BD. Từ đó suy ra AH song song OI.

   $$
   AH \perp BD, OI \perp BD \Rightarrow AH \parallel OI.
   $$
   *Lí do:* Trực tâm và đường trung trực
4. **Chứng minh KF song song AH** — Vì K là hình chiếu của H lên AI nên HK vuông góc AI. Vì E, C, F thẳng hàng và I là trung điểm HC, ta có thể chứng minh KF song song với AH.

   $$
   HK \perp AI, E, C, F \text{ thẳng hàng}, I \text{ là trung điểm } HC \Rightarrow KF \parallel AH.
   $$
   *Lí do:* Hình chiếu và đường vuông góc
5. **Chứng minh K và F đối xứng nhau qua BD** — Vì KF song song với AH mà AH vuông góc BD nên KF vuông góc BD. Vì I là trung điểm HC và E, C, F thẳng hàng, BD đi qua trung điểm của KF. Vậy BD là trung trực của KF, suy ra K và F đối xứng nhau qua BD.

   $$
   KF \parallel AH, AH \perp BD \Rightarrow KF \perp BD. I \text{ là trung điểm } HC, E, C, F \text{ thẳng hàng} \Rightarrow BD \text{ đi qua trung điểm } KF \Rightarrow BD \text{ là trung trực } KF \Rightarrow K, F \text{ đối xứng qua } BD.
   $$
   *Lí do:* Đối xứng trục

**Kết luận của ứng dụng:** K và F đối xứng nhau qua đường thẳng BD.

### Claude tự chấm

- Kết luận: **sai (không hiển thị)** — 0/10
- Nhận xét: Vẫn lỗi bạn chỉ ra: 'E, C, F thẳng hàng' không có cơ sở, 'KF ∥ AH' chỉ khẳng định. Bị chặn (hình kiểm tra sai).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `ptnk-2025-chuyen/4a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện (bạn đã chấm)

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
4. **Dựng đường tròn và chứng minh điểm thứ tư thuộc nó** — Vì cung $AD$ có số đo nằm giữa $0^\circ$ và $180^\circ$, ba điểm $A,D,O$ không thẳng hàng. Gọi $(ADO)$ là đường tròn qua ba điểm này. Điểm $C$ và tâm $O$ ở cùng phía đối với dây $AD$, vì $C$ ở cung lớn $AD$. Điểm $F$ nằm trong đoạn $AC$ nên cũng ở phía ấy. Ta đã có $\widehat{AFD}=\widehat{AOD}=2\beta$. Hai điểm $F,O$ cùng nhìn đoạn $AD$ dưới một góc bằng nhau và ở cùng phía, nên $F\in(ADO)$.
   *Lí do:* Đường tròn qua ba điểm không thẳng hàng và dấu hiệu cùng nhìn một đoạn từ cùng phía
5. **Xác định vị trí có thể có của $E$** — Ta có $ED=EB$ theo cách dựng. Điểm $E$ không thể trùng $B$. Nếu $E$ nằm trên tia đối của tia $BA$ thì $\widehat{EBD}=180^\circ-\beta>90^\circ$, trái với việc hai góc ở đáy của tam giác cân $EBD$ bằng nhau. Vậy $E$ thuộc tia $BA$. Suy ra $\widehat{EBD}=\widehat{EDB}=\beta$ và $\widehat{BED}=180^\circ-2\beta$. Nếu $E=A$ thì $E$ đã thuộc $(ADO)$; còn lại xét hai vị trí sau.
   *Lí do:* Hai góc ở đáy tam giác cân bằng nhau; tổng ba góc bằng 180 độ
6. **Trường hợp $E$ nằm giữa $A$ và $B$** — Nếu $E$ nằm giữa $A,B$, hai tia $EA,EB$ đối nhau, nên $\widehat{AED}=180^\circ-\widehat{BED}=2\beta=\widehat{AOD}$. Điểm $B$ ở cung lớn $AD$ nên cùng phía với $O$ đối với dây $AD$; $E$ nằm trong đoạn $AB$ cũng ở phía ấy. Dấu hiệu cùng nhìn đoạn $AD$ dưới hai góc bằng nhau từ cùng phía cho $E\in(ADO)$.
   *Lí do:* Hai góc kề bù và dấu hiệu nội tiếp từ hai góc cùng chắn một đoạn
7. **Trường hợp $E$ nằm ngoài đoạn về phía $A$** — Nếu $E$ nằm trên tia $BA$ và ở ngoài đoạn $AB$, hai tia $EA,EB$ trùng nhau; vì vậy $\widehat{AED}=180^\circ-2\beta$ và $\widehat{AED}+\widehat{AOD}=180^\circ$. Điểm $E$ ở phía đối diện với $B$ và $O$ đối với dây $AD$. Hai góc đối bù nhau là dấu hiệu nội tiếp, nên $E\in(ADO)$.
   *Lí do:* Hai tia trùng nhau và dấu hiệu tổng hai góc đối bằng 180 độ
8. **Kết luận cho cả hai yêu cầu** — Các vị trí hợp lệ của $E$ đã được xét hết: nằm trong đoạn, trùng $A$ hoặc nằm trên phần kéo dài qua $A$. Trong mọi trường hợp $E$ và $F$ đều thuộc đường tròn $(ADO)$ qua $A,D,O$. Vậy đường tròn này chứa cả bốn điểm $A,D,E,F$ và đi qua tâm $O$, như hai yêu cầu của đề. Trường hợp đầu cung đã được giải riêng ở bước đầu.

   $$
   A,D,E,F,O\in(ADO)
   $$
   *Lí do:* Các trường hợp đã xét bao phủ mọi vị trí và cùng cho một đường tròn

**Kết luận của ứng dụng:** Đường tròn qua $A,D,O$ chứa $E,F$; cả hai yêu cầu đã được chứng minh.

### Claude tự chấm

- Kết luận: **đúng** — 6/10
- Nhận xét: Mô-đun chứng minh theo trường hợp: đúng và đầy đủ nhưng dài (8 bước, xét 3 vị trí của E). Bạn muốn cách biến đổi góc gọn hơn — chưa đạt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/3a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của các đoạn thẳng $BC,EF$. Gọi $N$ là giao điểm của hai đường thẳng $AM$ và $EF$. Kẻ $ND$ vuông góc với $BC$ tại $D$. Chứng minh rằng $\widehat{AKE}=\widehat{AMB}$ và ba điểm $A,K,D$ thẳng hàng.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải.** Hết thời gian.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết thời gian cả hai lần.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `hanoi-2025-chuyen/IV.1`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default CHƯA kiểm chứng (có kiểm tra thất bại) — KHÔNG hiển thị. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$. Chứng minh ba điểm $T,H,K$ thẳng hàng.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 49 s · *Chi phí:* $0.0162

**Hướng giải:** Chứng minh $BHCK$ là hình bình hành bằng cách sử dụng tính chất đường kính và đường cao. Từ đó suy ra $M$ là trung điểm của $HK$, dẫn đến $H, M, K$ thẳng hàng. Vì $T$ nằm trên tia $MH$, nên $T, H, K$ thẳng hàng.
1. **Chứng minh BK vuông góc AB và CK vuông góc AC** — Vì $AK$ là đường kính của đường tròn $(O)$, nên góc nội tiếp chắn nửa đường tròn đó bằng $90^{\text{o}}$. Do đó, $\widehat{ABK} = 90^{\text{o}}$ và $\widehat{ACK} = 90^{\text{o}}$. Điều này có nghĩa là $BK \bot AB$ và $CK \bot AC$.

   $$
   \widehat{ABK} = \widehat{ACK} = 90^{\text{o}} \Leftrightarrow BK \bot AB, \ CK \bot AC
   $$
   *Lí do:* Góc nội tiếp chắn nửa đường tròn
2. **Chứng minh CH song song BK và BH song song CK** — Ta có $CF$ là đường cao của tam giác $ABC$ nên $CF \bot AB$. Kết hợp với $BK \bot AB$ (chứng minh trên), suy ra $CF \bot AB$ và $BK \bot AB$ nên $CF \bot BK$. Mà $H$ thuộc $CF$ nên $CH \bot BK$. Tương tự, $AD$ là đường cao nên $AD \bot BC$. Ta cần chứng minh $BH \bot AC$. Vì $H$ là trực tâm nên $BH \bot AC$. Kết hợp với $CK \bot AC$ (chứng minh trên), suy ra $BH \bot CK$.

   $$
   CH \parallel BK, \quad BH \parallel CK
   $$
   *Lí do:* Hai đường thẳng cùng vuông góc với một đường thẳng thứ ba thì song song
3. **Chứng minh BHCK là hình bình hành** — Tứ giác $BHCK$ có $CH \bot BK$ và $BH \bot CK$ (tức là $CH \bot BK$ và $BH \bot CK$). Từ $CH \bot BK$ và $BH \bot CK$, ta có $CH \bot BK$ và $BH \bot CK$. Tứ giác $BHCK$ có hai cặp cạnh đối song song ($CH \bot BK$ và $BH \bot CK$). Do đó, $BHCK$ là hình bình hành.

   $$
   BHCK \text{ là hình bình hành}
   $$
   *Lí do:* Tứ giác có hai cặp cạnh đối song song
4. **Chứng minh H, M, K thẳng hàng** — Vì $BHCK$ là hình bình hành nên hai đường chéo $BC$ và $HK$ cắt nhau tại trung điểm mỗi đường. Đề bài cho $M$ là trung điểm của $BC$, nên $M$ cũng là trung điểm của $HK$. Điều này có nghĩa là $H, M, K$ thẳng hàng.

   $$
   M \text{ là trung điểm } HK \Rightarrow H, M, K \text{ thẳng hàng}
   $$
   *Lí do:* Tính chất đường chéo hình bình hành
5. **Kết luận T, H, K thẳng hàng** — Đề bài cho tia $MH$ cắt đường tròn $(O)$ tại $T$, nghĩa là $T$ nằm trên đường thẳng $MH$. Vì $H, M, K$ thẳng hàng (chứng minh ở bước trên), nên đường thẳng $MH$ chính là đường thẳng $HK$. Do đó, $T$ cũng nằm trên đường thẳng $HK$. Vậy ba điểm $T, H, K$ thẳng hàng.

   $$
   T \in MH, \ H, M, K \text{ thẳng hàng} \Rightarrow T, H, K \text{ thẳng hàng}
   $$
   *Lí do:* Tính chất thẳng hàng

**Kết luận của ứng dụng:** Chứng minh được ba điểm $T, H, K$ thẳng hàng.

$$
T, H, K \text{ thẳng hàng}
$$

### Claude tự chấm

- Kết luận: **SAI lập luận — đã hiển thị** — 3/10
- Nhận xét: Chạy lại: hướng đúng (BHCK hình bình hành → M trung điểm HK → T, H, K thẳng hàng) nhưng bước 2–3 viết 'CF ⊥ AB và BK ⊥ AB nên CF ⊥ BK', 'CH ⊥ BK' thay vì song song — sai, và vẫn hiển thị. Bộ kiểm tra hình không bắt được câu chữ này.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/IV.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$ có ba góc nhọn ($AB<AC$), nội tiếp đường tròn $(O)$. Hai đường cao $AD,CF$ của tam giác $ABC$ cắt nhau tại điểm $H$. Gọi $M$ là trung điểm của đoạn thẳng $BC$. Tia $MH$ cắt đường tròn $(O)$ tại điểm $T$. Kẻ đường kính $AK$ của đường tròn $(O)$. Đường thẳng qua $B$ và vuông góc với đường thẳng $AM$ tại điểm $E$, cắt đường thẳng $AD$ tại điểm $G$. Đường tròn ngoại tiếp tam giác $MDG$ cắt đường tròn ngoại tiếp tam giác $ADC$ tại hai điểm $D$ và $N$. Chứng minh đường thẳng $NE$ song song với đường thẳng $BF$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

**Không có lời giải.** Mô hình không viết được lời giải hợp lệ (dùng điều chưa chứng minh, sai cấu trúc) sau các lần thử.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: ANDE nội tiếp không chứng minh → chặn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `khtn-2025-vong2/III.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$ cân tại $A$ có $O$ là trung điểm $BC$ và $\widehat{BAC}<90^\circ$. Xét đường tròn $(O)$ tiếp xúc các cạnh $CA,AB$ theo thứ tự tại $R,Q$. Trên các cạnh $CA,AB$ lần lượt lấy $E,F$ (không trùng các đỉnh tam giác) sao cho $EF$ tiếp xúc $(O)$ tại $P$ và $EF$ không song song $BC$. Gọi $H,K$ lần lượt là trực tâm các tam giác $OFB$, $OEC$. Gọi giao điểm của $FH,EK$ với $BC$ lần lượt là $M,N$. Chứng minh rằng hai tam giác $OHM$, $OKN$ đồng dạng và $\frac{OK}{OH}=\frac{AE}{AF}$.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 142 s · *Chi phí:* $0.0411

**Hướng giải:** Đầu tiên, sử dụng tính chất trực tâm để chứng minh $FH \perp BC$ và $EK \perp BC$, từ đó suy ra $O, H, Q$ thẳng hàng và $O, K, R$ thẳng hàng. Tiếp theo, tính các góc $HOM$ và $KON$ để chứng minh $\triangle OHM \sim \triangle OKN$. Cuối cùng, biểu diễn các cạnh $OM$ và $ON$ theo $AF, AE$ và $\cos B$ để suy ra tỉ số $\frac{OK}{OH} = \frac{AE}{AF}$.
1. **Xác định tính chất vuông góc của FH và EK** — Vì $H$ là trực tâm của tam giác $OFB$, nên $FH$ là đường cao hạ từ đỉnh $F$. Do đó $FH$ phải vuông góc với cạnh đối diện $OB$ (hay $BC$). Tương tự, vì $K$ là trực tâm của tam giác $OEC$, nên $EK$ là đường cao hạ từ $E$, suy ra $EK \perp OC$ (hay $EK \perp BC$).

   $$
   FH \perp BC, EK \perp BC
   $$
   *Lí do:* Tính chất trực tâm của tam giác
2. **Chứng minh O, H, Q thẳng hàng và O, K, R thẳng hàng** — Đường tròn $(O)$ tiếp xúc $AB$ tại $Q$ nên bán kính $OQ \perp AB$. Trong tam giác $OFB$, $OQ$ là đường cao hạ từ $O$. Vì $H$ là trực tâm nên $H$ phải nằm trên đường cao $OQ$. Do đó $O, H, Q$ thẳng hàng. Tương tự, $OR \perp AC$ nên $OR$ là đường cao của $\triangle OEC$, suy ra $O, K, R$ thẳng hàng.

   $$
   O, H, Q \text{ thẳng hàng}; O, K, R \text{ thẳng hàng}
   $$
   *Lí do:* Tính chất trực tâm của tam giác
3. **Chứng minh góc HOM bằng góc KON** — Xét tam giác $OQB$ vuông tại $Q$, ta có $\angle QOB + \angle B = 90^\circ$, suy ra $\angle QOB = 90^\circ - \angle B$. Vì $O, H, Q$ thẳng hàng và $M$ nằm trên $BC$, góc $HOM$ chính là góc $QOB$, nên $\angle HOM = 90^\circ - \angle B$. Tương tự, xét tam giác $ORC$ vuông tại $R$, ta có $\angle ROC = 90^\circ - \angle C$. Vì $O, K, R$ thẳng hàng và $N$ nằm trên $BC$, góc $KON$ chính là góc $ROC$, nên $\angle KON = 90^\circ - \angle C$. Do tam giác $ABC$ cân tại $A$ nên $\angle B = \angle C$. Từ đó suy ra $\angle HOM = \angle KON$.

   $$
   \angle HOM = \angle KON
   $$
   *Lí do:* Tam giác vuông và góc phụ nhau
4. **Chứng minh OHM đồng dạng OKN** — Xét hai tam giác $OHM$ và $OKN$: Ta có $\angle OMH = \angle ONK = 90^\circ$ (vì $FH \perp BC$ và $EK \perp BC$). Và $\angle HOM = \angle KON$ (chứng minh ở bước 3). Vậy $\triangle OHM$ và $\triangle OKN$ đồng dạng với nhau theo trường hợp góc-góc (g.g).

   $$
   \triangle OHM \sim \triangle OKN
   $$
   *Lí do:* Tam giác đồng dạng (g.g)
5. **Biểu diễn OM và ON theo AF, AE và cos B** — Xét tam giác $OQB$ vuông tại $Q$, ta có $OQ = OB \cos B$. Mà $OQ = AB \cos B$ (từ tam giác $AQB$ vuông tại $Q$). Xét tam giác $FMB$ vuông tại $M$, ta có $BM = FB \cos B$. Vì $OM = OB - BM$, thay các biểu thức trên vào: $OM = OB - FB \cos B = AB \cos B - FB \cos B = (AB - FB) \cos B = AF \cos B$. Tương tự, xét tam giác $ONC$ vuông tại $N$, ta có $ON = OC - CN = AC - EC \cos C = (AC - EC) \cos C = AE \cos C$. Do $\angle B = \angle C$ nên $\cos B = \cos C$. Vậy $ON = AE \cos B$.

   $$
   OM = AF \cos B, ON = AE \cos B
   $$
   *Lí do:* Tỉ số lượng giác trong tam giác vuông
6. **Chứng minh tỉ số OK/OH = AE/AF** — Từ sự đồng dạng $\triangle OHM \sim \triangle OKN$ (bước 4), ta có tỉ số các cạnh tương ứng bằng nhau: $\frac{OK}{OH} = \frac{ON}{OM}$. Thay $ON = AE \cos B$ và $OM = AF \cos B$ vào, ta được $\frac{OK}{OH} = \frac{AE \cos B}{AF \cos B} = \frac{AE}{AF}$ (vì $\cos B \neq 0$ do $\angle B < 90^\circ$).

   $$
   \frac{OK}{OH} = \frac{AE}{AF}
   $$
   *Lí do:* Tính chất tam giác đồng dạng

**Kết luận của ứng dụng:** Chứng minh được hai tam giác $OHM$ và $OKN$ đồng dạng với nhau, và tỉ số $\frac{OK}{OH} = \frac{AE}{AF}$.

$$
\triangle OHM \sim \triangle OKN \text{ và } \frac{OK}{OH} = \frac{AE}{AF}
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Đồng dạng g.g, OM = AF·cos B, ON = AE·cos C = AE·cos B → tỉ số. Bước 5 có dòng 'OQ = OB cos B' rồi 'OQ = AB cos B' — sai một chỗ (phải là OB = AB cos B), kết quả vẫn đúng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `ptnk-2026-chuyen/2`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default kiểm chứng một phần. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Câu 2. Cho tứ giác lồi $ABCD$ có các cạnh $BC = 7$, $DA = 1$, và hai đường chéo $AC$ và $BD$ vuông góc với nhau. Tìm giá trị lớn nhất của chu vi tứ giác $ABCD$.

**Đáp án tham khảo** (official): 18

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 34 s · *Chi phí:* $0.0126

**Hướng giải:** Sử dụng tính chất hai đường chéo vuông góc để thiết lập mối liên hệ giữa các cạnh đối diện thông qua định lý Pythagore. Sau đó, sử dụng bất đẳng thức Cô-si để tìm giá trị lớn nhất của tổng hai cạnh còn lại, từ đó suy ra giá trị lớn nhất của chu vi.
1. **Thiết lập mối liên hệ giữa các cạnh** — Gọi O là giao điểm của hai đường chéo AC và BD. Vì AC ❢ BD nên bốn tam giác OAB, OBC, OCD, ODA đều vuông tại O.

   $$
   AB^2 + CD^2 = (OA^2 + OB^2) + (OC^2 + OD^2) = (OB^2 + OC^2) + (OA^2 + OD^2) = BC^2 + DA^2
   $$
   *Lí do:* Định lý Pythagore trong các tam giác vuông OAB, OBC, OCD, ODA.
2. **Tính tổng bình phương hai cạnh** — Thay các giá trị BC = 7 và DA = 1 vào đẳng thức trên.

   $$
   AB^2 + CD^2 = 7^2 + 1^2 = 50
   $$
   *Lí do:* Thay số.
3. **Tìm giá trị lớn nhất của tổng hai cạnh** — Sử dụng bất đẳng thức (a + b)² ≤ 2(a² + b²) để tìm giá trị lớn nhất của AB + CD.

   $$
   (AB + CD)^2 \le 2(AB^2 + CD^2) = 2 \cdot 50 = 100 \Rightarrow AB + CD \le 10
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si) hoặc hằng đẳng thức (a-b)² ≥ 0.
4. **Tính giá trị lớn nhất của chu vi** — Chu vi P = AB + CD + BC + DA. Thay các giá trị đã biết và kết quả tìm được.

   $$
   P = AB + CD + BC + DA \le 10 + 7 + 1 = 18
   $$
   *Lí do:* Định nghĩa chu vi và bất đẳng thức đã chứng minh.

**Kết luận của ứng dụng:** Giá trị lớn nhất của chu vi tứ giác ABCD là 18.

$$
18
$$

### Claude tự chấm

- Kết luận: **đúng** — 6/10
- Nhận xét: Chạy lại: AB² + CD² = BC² + DA² = 50, (AB+CD)² ≤ 100 → chu vi ≤ 18. Đúng, gọn, không còn đoán; nhưng chưa chỉ ra trường hợp đạt 18 (AB = CD = 5 có xảy ra) và còn kí tự rác '❢' thay cho ⊥.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 11 — `geo8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$ nhọn nội tiếp đường tròn $(O)$, các đường cao $BE$, $CF$ cắt nhau tại $H$. Chứng minh tứ giác $AEHF$ nội tiếp và $AE\cdot AC=AF\cdot AB$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\widehat{AEH}+\widehat{AFH}=90^\circ+90^\circ=180^\circ$ nên $AEHF$ nội tiếp; $\triangle AEB\backsim\triangle AFC$ (g.g: góc $A$ chung, $\widehat{AEB}=\widehat{AFC}=90^\circ$) nên $AE/AF=AB/AC$.

### Lời giải của ứng dụng

*Nguồn:* `proof-planner` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh lần lượt: tứ giác AEHF nội tiếp; AE· AC = AF· AB. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
1. **tứ giác AEHF nội tiếp** — ∠HEA = 90° (vì BE ⊥ AC).
∠HFA = 90° (vì CF ⊥ AB).
⇒ E, F cùng nhìn đoạn HA dưới một góc vuông, nên cùng thuộc đường tròn đường kính HA.
⇒ tứ giác AEHF nội tiếp.

   $$
   \begin{aligned}&\widehat{HEA} = 90^\circ \\ &\widehat{HFA} = 90^\circ \\ &\Rightarrow A, E, H, F\text{ cùng thuộc một đường tròn}\end{aligned}
   $$
   *Lí do:* dấu hiệu tứ giác nội tiếp
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

- Kết luận: **đúng** — 8/10
- Nhận xét: AEHF: nay chỉ 3 dòng 'E, F cùng nhìn AH dưới góc vuông' (bạn chê lòng vòng). Phần đồng dạng chọn cặp góc ∠ABE = ∠ACF thay vì hai góc vuông — đúng nhưng chưa tự nhiên.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 12 — `geo8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho đường tròn $(O)$ đường kính $AB$ và điểm $C$ thuộc đường tròn ($C$ khác $A$, $B$). Tiếp tuyến tại $C$ cắt các tiếp tuyến tại $A$ và $B$ lần lượt tại $M$ và $N$. Chứng minh $MN=AM+BN$ và $\widehat{MON}=90^\circ$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: tính chất hai tiếp tuyến cắt nhau cho $MA=MC$, $NB=NC$ nên $MN=MC+CN=AM+BN$; $OM$, $ON$ là phân giác của hai góc kề bù $\widehat{AOC}$, $\widehat{COB}$ nên $\widehat{MON}=90^\circ$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 273 s · *Chi phí:* $0.0125

**Hướng giải:** Sử dụng tính chất hai tiếp tuyến cắt nhau để chứng minh $MA = MC$, $NB = NC$ và $MO, NO$ là các tia phân giác. Từ đó suy ra $MN = AM + BN$ và tính được $\text{góc } MON = 90^\text{°}$.
1. **Chứng minh MA = MC và NB = NC** — Áp dụng tính chất hai tiếp tuyến cắt nhau tại $M$ và $N$.

   $$
   MA = MC, NB = NC
   $$
   *Lí do:* Tính chất hai tiếp tuyến cắt nhau
2. **Chứng minh MN = AM + BN** — Vì $M, C, N$ cùng nằm trên tiếp tuyến tại $C$ nên $M, C, N$ thẳng hàng. Do đó $MN = MC + CN$. Thay $MC = MA$ và $CN = NB$ (từ bước 1) vào, ta có điều phải chứng minh.

   $$
   MN = MC + CN = MA + BN
   $$
   *Lí do:* Tính chất cộng đoạn thẳng và thay thế
3. **Chứng minh góc MON = 90°** — Theo tính chất hai tiếp tuyến cắt nhau, $MO$ là tia phân giác của $\text{góc } AMN$ và $NO$ là tia phân giác của $\text{góc } BNM$. Vì $MA \text{ vuông góc } AB$ và $NB \text{ vuông góc } AB$ nên $MA \text{ song song } NB$. Hai góc trong cùng phía $\text{góc } AMN$ và $\text{góc } BNM$ bù nhau, tức là $\text{góc } AMN + \text{góc } BNM = 180^\text{°}$. Do đó, $\text{góc } MON = \text{góc } MOC + \text{góc } NOC = \frac{1}{2}\text{góc } AMN + \frac{1}{2}\text{góc } BNM = \frac{1}{2}(\text{góc } AMN + \text{góc } BNM) = \frac{1}{2} \times 180^\text{°} = 90^\text{°}$.

   $$
   \text{ góc MON } = 90°
   $$
   *Lí do:* Tính chất hai tiếp tuyến cắt nhau và tính chất hai đường thẳng song song

**Kết luận của ứng dụng:** a) $MN = AM + BN$
b) $\text{góc } MON = 90^\text{°}$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: MN = AM + BN gọn. ∠MON vẫn đi đường MA ∥ NB, tổng góc trong cùng phía — dài hơn cách hai phân giác của hai góc kề bù ∠AOC, ∠COB (bạn đề nghị). Còn '\text{ góc }' trong công thức.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 13 — `geo8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho tam giác $ABC$ vuông tại $A$ có $AB=6$ cm, $AC=8$ cm, $AD$ là đường phân giác ($D$ thuộc $BC$). Tính $BD$ và $DC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $BC=10$ cm, $BD=\frac{30}{7}$ cm, $DC=\frac{40}{7}$ cm

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 48 s · *Chi phí:* $0.0185

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: DC = 6; 6 * 10 / (6 + 8); 8 * 10 / (6 + 8)

**Hướng giải:** Đầu tiên, tính độ dài cạnh huyền BC bằng định lý Pythagore. Sau đó, sử dụng định lý đường phân giác để thiết lập tỉ số giữa BD và DC, từ đó tính ra độ dài cụ thể của hai đoạn thẳng này.
1. **Tính độ dài cạnh huyền BC** — Vì tam giác ABC vuông tại A, ta áp dụng định lý Pythagore để tính cạnh huyền BC.

   $$
   BC^2 = AB^2 + AC^2 = 6^2 + 8^2 = 36 + 64 = 100 \Rightarrow BC = 10 \text{ (cm)}
   $$
   *Lí do:* Định lý Pythagore
2. **Áp dụng định lý đường phân giác** — Áp dụng định lý đường phân giác trong tam giác ABC, ta có tỉ số giữa hai đoạn BD và DC bằng tỉ số giữa hai cạnh kề AB và AC.

   $$
   \frac{BD}{DC} = \frac{AB}{AC} = \frac{6}{8} = \frac{3}{4}
   $$
   *Lí do:* Định lý đường phân giác
3. **Tính độ dài DC** — Ta có $\frac{BD}{DC} = \frac{3}{4}$, suy ra $BD = \frac{3}{4} DC$. Thay vào phương trình tổng $BD + DC = BC = 10$ để tìm DC.

   $$
   \begin{cases} BD = \frac{3}{4} DC \\ BD + DC = 10 \end{cases} \Rightarrow \frac{3}{4} DC + DC = 10 \Rightarrow \frac{7}{4} DC = 10 \Rightarrow DC = \frac{40}{7} \text{ (sai)}
   $$
   *Lí do:* Giải hệ phương trình
4. **Tính độ dài BD** — Thay giá trị DC vừa tìm được vào biểu thức của BD để tìm BD.

   $$
   BD = 10 - 6 = 4 \text{ (sai)}
   $$
   *Lí do:* Thay số

**Kết luận của ứng dụng:** BD = 4.5 cm
DC = 6 cm

$$
BD = 4.5 \text{ cm}, DC = 6 \text{ cm}
$$

### Claude tự chấm

- Kết luận: **sai (không hiển thị)** — 0/10
- Nhận xét: DC = 40/7 tính đúng rồi tự ghi '(sai)', kết luận BD = 4,5; DC = 6 — sai. Bị chặn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 14 — `geo8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho tứ giác $ABCD$ nội tiếp đường tròn có $\widehat{A}=80^\circ$ và $\widehat{B}=70^\circ$. Tính $\widehat{C}$ và $\widehat{D}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\widehat{C}=100^\circ$, $\widehat{D}=110^\circ$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 58 s · *Chi phí:* $0.0214

**Hướng giải:** Sử dụng tính chất tổng hai góc đối diện bằng $180^\text{o}$ trong tứ giác nội tiếp để tính góc $C$ từ góc $A$ và góc $D$ từ góc $B$.
1. **Áp dụng tính chất góc đối diện** — Ta có tứ giác $ABCD$ nội tiếp đường tròn. Theo tính chất của tứ giác nội tiếp, tổng số đo hai góc đối diện bằng $180^\text{o}$. Do đó, góc $A$ và góc $C$ là hai góc đối diện nên ta có: $A + C = 180^\text{o}$.

   $$
   A + C = 180^\text{o}
   $$
   *Lí do:* Tính chất tứ giác nội tiếp
2. **Tính số đo các góc** — Thay số $A = 80^\text{o}$ vào công thức trên, ta tính được góc $C$. Tương tự, góc $B$ và góc $D$ cũng là hai góc đối diện nên $B + D = 180^\text{o}$. Thay $B = 70^\text{o}$ vào, ta tính được góc $D$.

   $$
   C = 180^\text{o} - 80^\text{o} = 110^\text{o} \quad D = 180^\text{o} - 70^\text{o} = 100^\text{o}
   $$
   *Lí do:* Thay số
3. **Kiểm tra lại kết quả** — Kiểm tra lại: Tổng bốn góc của tứ giác là $A + B + C + D = 80^\text{o} + 70^\text{o} + 110^\text{o} + 100^\text{o} = 360^\text{o}$. Kết quả này phù hợp với tính chất tổng bốn góc trong một tứ giác bằng $360^\text{o}$.

   $$
   A + B + C + D = 360^\text{o}
   $$
   *Lí do:* Tổng bốn góc trong tứ giác

**Kết luận của ứng dụng:** Góc $C$ bằng $110^\text{o}$ và góc $D$ bằng $100^\text{o}$.

$$
C = 110^\text{o}, D = 100^\text{o}
$$

### Claude tự chấm

- Kết luận: **SAI — đã hiển thị** — 0/10
- Nhận xét: Ĉ = 180°−80° ghi thành 110°, D̂ = 100° (đúng: Ĉ = 100°, D̂ = 110°) và VẪN hiển thị. Đã sửa sau vòng này: kiểm tra mọi phép tính số trong các bước (180 − 70 = 100 bị phát hiện).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 15 — `geo8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Từ điểm $M$ nằm ngoài đường tròn $(O)$ kẻ tiếp tuyến $MA$ ($A$ là tiếp điểm) và cát tuyến $MBC$ ($B$ nằm giữa $M$ và $C$). Chứng minh $MA^2=MB\cdot MC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\triangle MAB\backsim\triangle MCA$ (g.g: góc $M$ chung, $\widehat{MAB}=\widehat{MCA}$ — góc tạo bởi tiếp tuyến và dây cung bằng góc nội tiếp cùng chắn cung $AB$) nên $MA/MC=MB/MA$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 36 s · *Chi phí:* $0.0154

**Hướng giải:** Để chứng minh $MA^2 = MB \cdot MC$, ta viết lại thành tỉ lệ thức $\frac{MA}{MC} = \frac{MB}{MA}$ và chứng minh hai tam giác $MAB$ và $MCA$ đồng dạng. Hai tam giác này có góc $M$ chung và góc $MAB$ (góc tạo bởi tiếp tuyến và dây cung) bằng góc $MCA$ (góc nội tiếp chắn cung $AB$).
1. **Phân tích mục tiêu** — Ta cần chứng minh $MA^2 = MB \cdot MC$. Đẳng thức này tương đương với tỉ lệ thức $\frac{MA}{MC} = \frac{MB}{MA}$, gợi ý rằng ta nên xét sự đồng dạng giữa tam giác $MAB$ và tam giác $MCA$.

   $$
   \frac{MA}{MC} = \frac{MB}{MA}
   $$
   *Lí do:* Biến đổi đại số tương đương
2. **Xác định góc chung** — Xét hai tam giác $MAB$ và $MCA$. Ta thấy góc $M$ là góc chung của cả hai tam giác.

   $$
   \widehat{AMB} = \widehat{CMA}
   $$
   *Lí do:* Góc chung
3. **Chứng minh cặp góc bằng nhau** — Góc $MAB$ là góc tạo bởi tiếp tuyến $MA$ và dây cung $AB$. Theo định lý về góc tạo bởi tiếp tuyến và dây cung, góc này bằng góc nội tiếp chắn cung $AB$, đó chính là góc $ACB$ (hay $MCA$).

   $$
   \widehat{MAB} = \widehat{MCA}
   $$
   *Lí do:* Góc tạo bởi tiếp tuyến và dây cung bằng góc nội tiếp chắn cung bị chắn
4. **Chứng minh tam giác đồng dạng** — Vì $\triangle MAB$ và $\triangle MCA$ có hai cặp góc tương ứng bằng nhau ($\widehat{M}$ chung và $\widehat{MAB} = \widehat{MCA}$), nên hai tam giác này đồng dạng với nhau theo trường hợp góc-góc (g.g). Cụ thể, $\triangle MAB \sim \triangle MCA$.

   $$
   \triangle MAB \sim \triangle MCA
   $$
   *Lí do:* Tam giác đồng dạng (g.g)
5. **Suy ra kết luận** — Từ sự đồng dạng $\triangle MAB \sim \triangle MCA$, ta có tỉ số các cạnh tương ứng bằng nhau: $\frac{MA}{MC} = \frac{MB}{MA} = \frac{AB}{CA}$. Từ tỉ lệ thức $\frac{MA}{MC} = \frac{MB}{MA}$, nhân chéo ta được $MA^2 = MB \cdot MC$.

   $$
   MA^2 = MB \cdot MC
   $$
   *Lí do:* Tính chất tam giác đồng dạng

**Kết luận của ứng dụng:** Ta đã chứng minh được $MA^2 = MB \cdot MC$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: △MAB ∽ △MCA (g.g) — chuẩn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 16 — `geo8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho đường tròn $(O;5\text{ cm})$ và hai dây $AB=8$ cm, $CD=6$ cm song song với nhau, nằm khác phía đối với tâm $O$. Tính khoảng cách giữa hai dây.

**Đáp án tham khảo** (verified by SymPy/enumeration): $7$ cm (khoảng cách từ $O$ đến $AB$ là $3$ cm, đến $CD$ là $4$ cm)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 34 s · *Chi phí:* $0.0107

**Hướng giải:** Kẻ đường vuông góc từ tâm O đến hai dây song song, sử dụng tính chất đường kính vuông góc với dây cung để tìm trung điểm, sau đó áp dụng định lý Pythagore để tính khoảng cách từ tâm đến mỗi dây. Cuối cùng, cộng hai khoảng cách này lại vì hai dây nằm khác phía đối với tâm.
1. **Xác định trung điểm của các dây cung** — Để tính khoảng cách từ tâm đến các dây, ta sử dụng tính chất đường kính vuông góc với dây cung. Ta kẻ đường thẳng đi qua O vuông góc với AB và CD. Vì AB // CD, nên đường thẳng này cũng vuông góc với CD. Gọi M và N lần lượt là giao điểm của đường thẳng này với AB và CD. Khi đó, M và N là trung điểm của AB và CD.

   $$
   MA = MB = \frac{AB}{2} = \frac{8}{2} = 4 \text{ (cm)} \\ NC = ND = \frac{CD}{2} = \frac{6}{2} = 3 \text{ (cm)}
   $$
   *Lí do:* Tính chất đường kính vuông góc với dây cung
2. **Tính khoảng cách từ O đến dây AB** — Xét tam giác OMA vuông tại M (vì $OM \perp AB)$. Áp dụng định lý Pythagore, ta có $OA^2 = OM^2 + MA^2$. Từ đó suy ra $OM^2 = OA^2 - MA^2$. Ta biết OA = 5 cm (bán kính) và MA = 4 cm.

   $$
   OM^2 = OA^2 - MA^2 = 5^2 - 4^2 = 25 - 16 = 9 \\ \Rightarrow OM = \sqrt{9} = 3 \text{ (cm)}
   $$
   *Lí do:* Định lý Pythagore
3. **Tính khoảng cách từ O đến dây CD** — Tương tự, xét tam giác ONC vuông tại N (vì $ON \perp CD)$. Áp dụng định lý Pythagore, ta có $OC^2 = ON^2 + NC^2$. Suy ra $ON^2 = OC^2 - NC^2$. Ta biết OC = 5 cm (bán kính) và NC = 3 cm.

   $$
   ON^2 = OC^2 - NC^2 = 5^2 - 3^2 = 25 - 9 = 16 \\ \Rightarrow ON = \sqrt{16} = 4 \text{ (cm)}
   $$
   *Lí do:* Định lý Pythagore
4. **Tính khoảng cách giữa hai dây** — Vì hai dây AB và CD nằm khác phía đối với tâm O, nên điểm O nằm giữa hai dây. Do đó, khoảng cách giữa hai dây chính là tổng độ dài hai đoạn OM và ON.

   $$
   MN = OM + ON = 3 + 4 = 7 \text{ (cm)}
   $$
   *Lí do:* Tính chất vị trí tương đối của các điểm

**Kết luận của ứng dụng:** Khoảng cách giữa hai dây AB và CD là 7 cm.

$$
7 \text{ cm}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: 3 + 4 = 7 cm.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 17 — `geo9-f1`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH=4$ cm, $CH=9$ cm. Tính $AH$, $AB$, $AC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $AH=6$ cm, $AB=2\sqrt{13}$ cm, $AC=3\sqrt{13}$ cm

### Lời giải của ứng dụng

*Nguồn:* `routine-right-triangle` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Dùng định lí Pythagore và các hệ thức lượng, tính dần từ các đoạn đã biết.
1. **Xác định tam giác vuông và các yếu tố đã biết** — Tam giác $ABC$ vuông tại $A$, cạnh huyền $BC$, đường cao $AH$ (nên $H$ nằm giữa $B$ và $C$, các tam giác $AHB$, $AHC$ vuông tại $H$). Đã biết: $BH=4$, $CH=9$.
   *Lí do:* Phân tích giả thiết
2. **Tính AH** — Áp dụng hệ thức lượng trong tam giác vuông:

   $$
   AH^2=BH\cdot CH=4\cdot 9\ \Rightarrow\ AH=6
   $$
   *Lí do:* Hệ thức lượng trong tam giác vuông
3. **Tính AB** — Áp dụng định lí Pythagore trong tam giác AHB vuông:

   $$
   AB^2=AH^2+BH^2=36+16=52\ \Rightarrow\ AB=2\sqrt{13}
   $$
   *Lí do:* Định lí Pythagore trong tam giác AHB vuông
4. **Tính AC** — Áp dụng định lí Pythagore trong tam giác AHC vuông:

   $$
   AC^2=AH^2+CH^2=36+81=117\ \Rightarrow\ AC=3\sqrt{13}
   $$
   *Lí do:* Định lí Pythagore trong tam giác AHC vuông
5. **Kết luận** — Vậy $AH=6\text{ cm}$, $AB=2\sqrt{13}\text{ cm}$, $AC=3\sqrt{13}\text{ cm}$.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy $AH=6\text{ cm}$, $AB=2\sqrt{13}\text{ cm}$, $AC=3\sqrt{13}\text{ cm}$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: AH² = BH·CH; Pythagore.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 18 — `geo9-f2`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Từ điểm $M$ nằm ngoài đường tròn $(O)$ kẻ hai tiếp tuyến $MA$, $MB$ ($A$, $B$ là các tiếp điểm). Chứng minh tứ giác $MAOB$ nội tiếp và $OM\perp AB$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $\widehat{OAM}=\widehat{OBM}=90^\circ$ nên tổng hai góc đối bằng $180^\circ$, $MAOB$ nội tiếp; $MA=MB$ và $OA=OB$ nên $OM$ là đường trung trực của $AB$.

### Lời giải của ứng dụng

*Nguồn:* `proof-planner` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh lần lượt: tứ giác MAOB nội tiếp; OM ⊥ AB. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
1. **tứ giác MAOB nội tiếp** — ∠MAO = 90° (vì MA ⊥ OA).
∠MBO = 90° (vì MB ⊥ OB).
⇒ A, B cùng nhìn đoạn MO dưới một góc vuông, nên cùng thuộc đường tròn đường kính MO.
⇒ tứ giác AMBO nội tiếp.

   $$
   \begin{aligned}&\widehat{MAO} = 90^\circ \\ &\widehat{MBO} = 90^\circ \\ &\Rightarrow M, A, O, B\text{ cùng thuộc một đường tròn}\end{aligned}
   $$
   *Lí do:* dấu hiệu tứ giác nội tiếp
2. **MA = MB** — Xét △MAO vuông tại A và △MBO vuông tại B có:
• MO là cạnh huyền chung
• OA = OB (bán kính của (O))
⇒ △MAO = △MBO (cạnh huyền – cạnh góc vuông)
⇒ MA = MB.

   $$
   MA = MB
   $$
   *Lí do:* hai tam giác vuông bằng nhau
3. **OM ⊥ AB** — • OA = OB (bán kính của (O))
• MA = MB (bước 2)
⇒ OM là đường trung trực của AB (hai điểm cách đều hai đầu đoạn thẳng)
⇒ OM ⊥ AB.

   $$
   OM \perp AB
   $$
   *Lí do:* đường trung trực của đoạn thẳng

**Kết luận của ứng dụng:** Đã chứng minh: tứ giác MAOB nội tiếp; OM ⊥ AB.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bộ lập kế hoạch chứng minh: hai góc vuông; hai tam giác vuông bằng nhau; trung trực.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 19 — `geo9-f3`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho tam giác $ABC$ nhọn có các đường cao $BE$, $CF$. Chứng minh tứ giác $BFEC$ nội tiếp và $\widehat{AEF}=\widehat{ABC}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $E$, $F$ cùng nhìn $BC$ dưới góc vuông nên $BFEC$ nội tiếp; góc ngoài $\widehat{AEF}$ của tứ giác nội tiếp bằng góc trong đối diện $\widehat{FBC}=\widehat{ABC}$.

### Lời giải của ứng dụng

*Nguồn:* `proof-planner` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh lần lượt: tứ giác BFEC nội tiếp; ∠AEF = ∠ABC. Mỗi bước chỉ dùng giả thiết, cách dựng hình và các kết quả đã chứng minh trước đó.
1. **tứ giác BFEC nội tiếp** — ∠BEC = 90° (vì BE ⊥ AC).
∠CFB = 90° (vì CF ⊥ AB).
⇒ E, F cùng nhìn đoạn BC dưới một góc vuông, nên cùng thuộc đường tròn đường kính BC.
⇒ tứ giác BCEF nội tiếp.

   $$
   \begin{aligned}&\widehat{BEC} = 90^\circ \\ &\widehat{CFB} = 90^\circ \\ &\Rightarrow B, F, E, C\text{ cùng thuộc một đường tròn}\end{aligned}
   $$
   *Lí do:* dấu hiệu tứ giác nội tiếp
2. **∠AEF = ∠ABC** — Ta có:
∠AEF = 180° − ∠FEC (hai góc kề bù)
= ∠ABC (tứ giác BCEF nội tiếp, bước 1)
⇒ ∠AEF = ∠ABC.

   $$
   \begin{aligned}\widehat{AEF} &= 180^\circ - \widehat{FEC} \\ &= \widehat{ABC} \\ &\Rightarrow \widehat{AEF} = \widehat{ABC}\end{aligned}
   $$
   *Lí do:* cộng, trừ góc

**Kết luận của ứng dụng:** Đã chứng minh: tứ giác BFEC nội tiếp; ∠AEF = ∠ABC.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Hai góc vuông nhìn BC; góc ngoài = góc trong đối diện.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 20 — `geo9-f4`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho tam giác $ABC$ có $\widehat B=60^\circ$, $\widehat C=45^\circ$ và đường cao $AH=6$ cm. Tính $BC$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $BC=6+2\sqrt3$ cm ($BH=2\sqrt3$, $CH=6$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 54 s · *Chi phí:* $0.0201

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: BC = 16.392304845413264

**Hướng giải:** Dùng đường cao AH để chia tam giác ABC thành hai tam giác vuông ABH và ACH. Tính BH và CH bằng tỉ số lượng giác, sau đó cộng lại để có BC.
1. **Xác định hai tam giác vuông** — Đường cao $AH$ vuông góc với $BC$ tại $H$, nên $AH$ chia tam giác $ABC$ thành hai tam giác vuông là $ABH$ và $ACH$. Ta sẽ tính độ dài hai đoạn $BH$ và $CH$ riêng.

   $$
   \triangle ABH \text{ vuông tại } H, \quad \triangle ACH \text{ vuông tại } H
   $$
   *Lí do:* Định nghĩa đường cao
2. **Tính độ dài BH** — Trong tam giác vuông $ABH$, ta có $\widehat{B} = 60^\circ$. Áp dụng hệ thức lượng: cạnh góc vuông $BH$ bằng cạnh góc vuông $AH$ nhân với $\cot B$.

   $$
   BH = AH \cdot \cot 60^\circ = 6 \cdot \frac{1}{\sqrt{3}} = 2\sqrt{3} \text{ (cm)}
   $$
   *Lí do:* Tỉ số lượng giác trong tam giác vuông
3. **Tính độ dài CH** — Trong tam giác vuông $ACH$, ta có $\widehat{C} = 45^\circ$. Áp dụng hệ thức lượng: $CH = AH \cdot \cot C$.

   $$
   CH = AH \cdot \cot 45^\circ = 6 \cdot 1 = 6 \text{ (cm)}
   $$
   *Lí do:* Tỉ số lượng giác trong tam giác vuông
4. **Tính độ dài BC** — Vì tam giác $ABC$ có $\widehat{B}=60^\circ$ và $\widehat{C}=45^\circ$ đều nhọn, nên chân đường cao $H$ nằm giữa hai đỉnh $B$ và $C$. Do đó $BC = BH + CH$.

   $$
   BC = BH + CH = 2\sqrt{3} + 6 = 6 + 2\sqrt{3} \text{ (cm)}
   $$
   *Lí do:* Tính chất cộng đoạn thẳng

**Kết luận của ứng dụng:** Độ dài đoạn thẳng $BC$ là $6(1 + \sqrt{3})$ cm.

$$
6(1 + \sqrt{3}) \text{ cm}
$$

### Claude tự chấm

- Kết luận: **sai (không hiển thị)** — 2/10
- Nhận xét: Các bước ra 6 + 2√3 đúng, nhưng kết luận ghi 6(1+√3) — sai. Bị chặn (phép thử số).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 21 — `geo9-f5`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho nửa đường tròn tâm $O$ đường kính $AB=2R$ và điểm $C$ trên nửa đường tròn sao cho $\widehat{CAB}=30^\circ$. Tính $AC$, $BC$ và diện tích tam giác $ABC$ theo $R$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $AC=R\sqrt3$, $BC=R$, $S_{ABC}=\frac{R^2\sqrt3}{2}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 47 s · *Chi phí:* $0.0185

**Hướng giải:** Đầu tiên, nhận diện tam giác ABC là tam giác vuông tại C nhờ tính chất góc nội tiếp chắn nửa đường tròn. Sau đó, sử dụng các tỉ số lượng giác của góc 30 độ để tính độ dài hai cạnh góc vuông AC và BC dựa trên cạnh huyền AB = 2R. Cuối cùng, tính diện tích tam giác bằng một nửa tích hai cạnh góc vuông.
1. **Xác định tam giác ABC vuông** — Vì AB là đường kính của nửa đường tròn và C là điểm thuộc nửa đường tròn, góc ACB chắn nửa đường tròn nên bằng 90 độ. Do đó, tam giác ABC vuông tại C.

   $$
   \triangle ABC \text{ vuông tại } C
   $$
   *Lí do:* Góc nội tiếp chắn nửa đường tròn
2. **Tính độ dài AC và BC** — Trong tam giác vuông ABC, ta sử dụng các tỉ số lượng giác của góc CAB = 30 độ. Cạnh BC đối diện với góc 30 độ nên bằng một nửa cạnh huyền AB. Cạnh AC kề với góc 30 độ nên bằng AB nhân với cos(30 độ).

   $$
   BC = AB \cdot \sin 30^\circ = 2R \cdot \frac{1}{2} = R \\ AC = AB \cdot \cos 30^\circ = 2R \cdot \frac{\sqrt{3}}{2} = R\sqrt{3}
   $$
   *Lí do:* Tỉ số lượng giác của góc nhọn
3. **Tính diện tích tam giác ABC** — Diện tích tam giác vuông ABC bằng một nửa tích hai cạnh góc vuông AC và BC. Thay các giá trị vừa tìm được vào công thức.

   $$
   S_{ABC} = \frac{1}{2} AC \cdot BC = \frac{1}{2} \cdot R\sqrt{3} \cdot R = \frac{R^2\sqrt{3}}{2}
   $$
   *Lí do:* Công thức diện tích tam giác vuông

**Kết luận của ứng dụng:** Ta có:
$AC = R\sqrt{3}$
$BC = R$
$S_{ABC} = \frac{R^2\sqrt{3}}{2}$

$$
AC = R\sqrt{3}, \quad BC = R, \quad S_{ABC} = \frac{R^2\sqrt{3}}{2}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Góc nội tiếp chắn nửa đường tròn, sin/cos 30°.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 22 — `hcm-2025-chuyen/3b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho tam giác nhọn $ABC$ ($AB<AC$) nội tiếp đường tròn $(O)$ có $BE,CF$ là các đường cao. Gọi $M,K$ theo thứ tự là trung điểm của các đoạn thẳng $BC,EF$. Gọi $N$ là giao điểm của hai đường thẳng $AM$ và $EF$. Kẻ $ND$ vuông góc với $BC$ tại $D$. Tiếp tuyến tại $A$ của đường tròn $(O)$ cắt đường thẳng $BC$ tại $Q$. Chứng minh rằng $QB\cdot DC=QC\cdot DB$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải.** Hết thời gian.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Câu MỚI (đề thi chưa dùng): hết thời gian ở cả dàn ý và lời giải.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
