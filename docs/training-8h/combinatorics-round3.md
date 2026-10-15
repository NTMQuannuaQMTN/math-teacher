# Tổ hợp — vòng 3

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/3a` | luyện | default | máy không kiểm chứng được | đúng 5/10 | 33 s | $0.0108 |
| 2 | `ptnk-2023-chuyen/3b` | luyện (chạy lại) | default | máy không kiểm chứng được | đúng 6/10 | 140 s | $0.0093 |
| 3 | `ptnk-2024-chuyen/5a` | luyện | default | kiểm chứng một phần | một phần 5/10 | 68 s | $0.0144 |
| 4 | `ptnk-2024-chuyen/5b` | luyện (chạy lại) | không có lời giải | không có lời giải | không có lời giải 0/10 | 197 s | $0.0198 |
| 5 | `ptnk-2025-chuyen/5a` | luyện | không có lời giải | không có lời giải | không có lời giải 0/10 | 25 s | $0.0084 |
| 6 | `hcm-2025-chuyen/5a` | luyện | default | máy không kiểm chứng được | đúng 9/10 | 78 s | $0.024 |
| 7 | `hcm-2025-chuyen/5b` | luyện | default | máy không kiểm chứng được | đúng 9/10 | 24 s | $0.0087 |
| 8 | `hanoi-2025-chuyen/V.1` | luyện | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | không hiển thị 3/10 | 35 s | $0.013 |
| 9 | `hanoi-2025-chuyen/V.2` | luyện | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | sai 0/10 | 138 s | $0.0101 |
| 10 | `ptnk-2026-chuyen/5` | luyện | default | máy không kiểm chứng được | đúng 9/10 | 34 s | $0.0103 |
| 11 | `comb8-h1` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 31 s | $0.0126 |
| 12 | `comb8-h2` | kiểm tra cũ (chạy lại) | không có lời giải | không có lời giải | không có lời giải 0/10 | 0 s | $0 |
| 13 | `comb8-h3` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 8/10 | 31 s | $0.0092 |
| 14 | `comb8-h4` | kiểm tra cũ (chạy lại) | default | kiểm chứng một phần | đúng 8/10 | 1 s | $0.0002 |
| 15 | `comb8-h5` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 258 s | $0.0093 |
| 16 | `comb8-h6` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 18 s | $0.0066 |
| 17 | `comb9-f1` | MỚI | routine-digit-numbers | đã kiểm chứng bằng máy | đúng 7/10 | 0 s | $0 |
| 18 | `comb9-f2` | MỚI (chạy lại) | default | máy không kiểm chứng được | đúng 8/10 | 2 s | $0.0005 |
| 19 | `comb9-f3` | MỚI | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | —  | 34 s | $0.0093 |
| 20 | `comb9-f4` | MỚI | default | đã kiểm chứng bằng máy | đúng 9/10 | 17 s | $0.0074 |
| 21 | `comb9-f5` | MỚI | không có lời giải | không có lời giải | không có lời giải 0/10 | 48 s | $0.0172 |
| 22 | `ptnk-2025-chuyen/5b` | MỚI | không có lời giải | không có lời giải | không có lời giải 0/10 | 101 s | $0.0278 |

## Câu 1 — `ptnk-2023-chuyen/3a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau. Tính số ô đen trên mỗi hàng.

**Đáp án tham khảo** (official): 2

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 33 s · *Chi phí:* $0.0108

**Hướng giải:** Đặt ẩn số ô đen mỗi hàng là r, thiết lập phương trình tổng số ô đen theo hàng và theo cột. Sử dụng điều kiện các số ô đen các cột là 4 số nguyên phân biệt từ 0 đến 4 để tìm ra tổng duy nhất thỏa mãn chia hết cho 4, từ đó suy ra r.
1. **Thiết lập phương trình tổng** — Gọi số ô đen trên mỗi hàng là $r$. Vì có 4 hàng, tổng số ô đen trong bảng là $4r$. Gọi số ô đen trên 4 cột lần lượt là $c_1, c_2, c_3, c_4$. Tổng số ô đen cũng bằng tổng các số ô đen trên các cột, nên ta có phương trình: $c_1 + c_2 + c_3 + c_4 = 4r$.

   $$
   c_1 + c_2 + c_3 + c_4 = 4r
   $$
   *Lí do:* Tổng số ô đen không đổi
2. **Xác định tập giá trị của các cột** — Mỗi cột có 4 ô, nên số ô đen trên mỗi cột $c_i$ là một số nguyên thuộc tập {0, 1, 2, 3, 4}. Đề bài yêu cầu các số này đôi một khác nhau, nghĩa là ta cần chọn 4 số khác nhau từ tập {0, 1, 2, 3, 4}. Có 5 số, chọn 4 số, nghĩa là ta sẽ loại đi 1 số.

   $$
   c_i \in \{0, 1, 2, 3, 4\}, \text{ đôi một khác nhau}
   $$
   *Lí do:* Điều kiện xác định của số ô đen
3. **Tìm giá trị của r** — Ta có 5 trường hợp loại đi một số từ tập {0, 1, 2, 3, 4}. Tổng của 4 số còn lại sẽ là tổng của cả 5 số trừ đi số bị loại. Tổng của {0, 1, 2, 3, 4} là 10. Vậy tổng $S = 10 - k$ với $k$ là số bị loại. Ta cần $S = 4r$, tức là $10 - k$ chia hết cho 4. Vì $k \in \{0, 1, 2, 3, 4\}$, ta thử từng giá trị:
- Nếu $k=0$, $S=10$ (loại)
- Nếu $k=1$, $S=9$ (loại)
- Nếu $k=2$, $S=8$ (nhận, vì $8 = 4 \times 2$)
- Nếu $k=3$, $S=7$ (loại)
- Nếu $k=4$, $S=6$ (loại)
Vậy chỉ có trường hợp loại số 2, tổng các số ô đen các cột là 8, và $4r = 8 \Rightarrow r = 2$.

   $$
   10 - k = 4r \Rightarrow k = 2, r = 2
   $$
   *Lí do:* Điều kiện chia hết
4. **Kết luận** — Ta đã tìm được $r = 2$. Cần kiểm tra xem có tồn tại cách tô màu thỏa mãn không. Các số ô đen các cột là {0, 1, 3, 4} (loại 2). Ta cần điền 2 ô đen vào mỗi hàng, sao cho các cột có số ô đen là 0, 1, 3, 4. Ví dụ: Cột 1: 0 đen, Cột 2: 1 đen, Cột 3: 3 đen, Cột 4: 4 đen. Tổng ô đen = 8. Mỗi hàng có 2 ô đen. Ta có thể xây dựng bảng như sau:
Hàng 1: 0, 0, 1, 1 (2 đen)
Hàng 2: 0, 1, 1, 1 (3 đen? Không, cần 2 đen)
Thử lại: Cột 4 có 4 đen (tất cả hàng đều có đen ở cột 4). Cột 1 có 0 đen (không hàng nào có đen ở cột 1). Vậy mỗi hàng có 1 đen ở cột 4, cần thêm 1 đen nữa ở cột 2 hoặc 3. Cột 2 cần 1 đen, Cột 3 cần 3 đen. Vậy 3 hàng còn lại (trừ hàng 1) phải có đen ở cột 3, và 1 hàng trong số đó có thêm đen ở cột 2. Ví dụ:
H1: 0, 0, 1, 1
H2: 0, 0, 1, 1
H3: 0, 0, 1, 1
H4: 0, 1, 1, 1 -> Cột 2 có 1 đen, Cột 3 có 4 đen? Không, Cột 3 cần 3 đen.
Thử: C1=0, C2=1, C3=3, C4=4.
H1: 0, 0, 1, 1
H2: 0, 0, 1, 1
H3: 0, 1, 1, 1 -> C2=1, C3=3, C4=3? Không, C4=4.
H1: 0, 0, 1, 1
H2: 0, 0, 1, 1
H3: 0, 0, 1, 1
H4: 0, 1, 1, 1 -> C3=4, C4=4. Sai.
Thử: C1=0, C2=1, C3=3, C4=4.
H1: 0, 1, 0, 1 (2 đen)
H2: 0, 0, 1, 1 (2 đen)
H3: 0, 0, 1, 1 (2 đen)
H4: 0, 0, 1, 1 (2 đen)
Tổng C2=1, C3=3, C4=4, C1=0. Đúng. Vậy tồn tại cách tô.
Kết luận: Số ô đen trên mỗi hàng là 2.

   $$
   r = 2
   $$
   *Lí do:* Kiểm tra tính tồn tại

**Kết luận của ứng dụng:** Số ô đen trên mỗi hàng là 2.

$$
2
$$

### Claude tự chấm

- Kết luận: **đúng** — 5/10
- Nhận xét: Đáp số 2 đúng (loại số 2 khỏi {0,…,4}), nhưng bước 4 tự sửa giữa chừng ('3 đen? Không, cần 2 đen… Thử lại') và không vẽ được bảng ví dụ như bạn yêu cầu. Luật mới bắt đoạn này để viết lại.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `ptnk-2023-chuyen/3b`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau. Hai ô kề nhau trên một hàng hoặc một cột được gọi là “cặp tốt” nếu chúng được tô bằng hai màu khác nhau. Hỏi tổng số các “cặp tốt” tính theo tất cả các cột có thể lớn nhất là bao nhiêu? Hỏi tương tự cho các “cặp tốt” tính theo tất cả các hàng.

**Đáp án tham khảo** (official): 4 (theo cột); 11 (theo hàng)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 140 s · *Chi phí:* $0.0093

**Hướng giải:** Xác định số ô đen mỗi hàng và mỗi cột dựa trên điều kiện tổng và tính phân biệt. Tính số cặp tốt tối đa cho từng cấu hình cột và hàng, sau đó tìm cấu hình hàng tổng hợp đạt cực đại.
1. **Xác định số ô đen** — Gọi số ô đen mỗi hàng là $k$. Tổng số ô đen là $4k$. Số ô đen các cột là 4 số nguyên phân biệt trong ${0,1,2,3,4}$. Tổng của 4 số này cũng bằng $4k$, nên phải chia hết cho 4. Bộ 4 số phân biệt duy nhất có tổng chia hết cho 4 là ${0,1,3,4}$ (tổng bằng 8). Vậy $4k=8
Rightarrow k=2$. Mỗi hàng có đúng 2 ô đen.

   $$
   \begin{gathered}c_1, c_2, c_3, c_4 \in \\ {0,1,2,3,4}, \text{phân biệt} \\ c_1+c_2+c_3+c_4 = 4k \\ {0,1,3,4} \text{ là bộ duy nhất có tổng chia hết 4}\end{gathered}
   $$
   *Lí do:* Phân tích tổng số ô đen và tính chia hết
2. **Tính tổng cặp tốt cột** — Gọi $M(c)$ là số cặp tốt lớn nhất của một cột có $c$ ô đen. Ta có: $M(0)=0, M(1)=2, M(2)=3, M(3)=2, M(4)=0$. Tổng số cặp tốt cột lớn nhất là $M(0)+M(1)+M(3)+M(4) = 0+2+2+0 = 4$.

   $$
   M(0)=0, M(1)=2, M(2)=3, M(3)=2, M(4)=0 \\ \text{Tổng} = 0+2+2+0 = 4
   $$
   *Lí do:* Tính tổng số cặp tốt cột
3. **Loại trường hợp 4 hàng xen kẽ** — Mỗi hàng có 2 ô đen. Dạng xen kẽ B-W-B-W cho 3 cặp tốt. Nếu 4 hàng đều xen kẽ, số ô đen các cột sẽ là ${x,y,x,y}$, vi phạm điều kiện các cột đôi một khác nhau. Vậy không thể có 4 hàng xen kẽ.

   $$
   4 \text{ hàng xen kẽ} \Rightarrow c_1=c_3, c_2=c_4 \text{ (loại)}
   $$
   *Lí do:* Loại trường hợp 4 hàng xen kẽ
4. **Tìm cấu hình đạt cực đại** — Thử 3 hàng xen kẽ (mỗi hàng 3 cặp) và 1 hàng dạng B-W-W-B (2 cặp). Tổng số cặp tốt hàng là $3 \times 3 + 2 = 11$. Kiểm tra số ô đen các cột: 3 hàng xen kẽ (W B W B) và 1 hàng (B W W B) cho số ô đen cột là $1, 3, 0, 4$ (phân biệt). Thỏa mãn điều kiện.

   $$
   3 \times 3 + 2 = 11 \\ c_1=1, c_2=3, c_3=0, c_4=4
   $$
   *Lí do:* Xây dựng cấu hình đạt cực đại
5. **Kết luận** — Kết luận: Tổng số cặp tốt lớn nhất theo các cột là 4 và theo các hàng là 11.

   $$
   \text{ĐS: } 4 \text{ và } 11
   $$
   *Lí do:* Tổng kết kết quả

**Kết luận của ứng dụng:** a) Tổng số cặp tốt lớn nhất theo các cột là 4.
b) Tổng số cặp tốt lớn nhất theo các hàng là 11.

$$
(a) 4; (b) 11
$$

### Claude tự chấm

- Kết luận: **đúng** — 6/10
- Nhận xét: Chạy lại: 4 (theo cột) và 11 (theo hàng) — đúng, có cấu hình 3 hàng xen kẽ + 1 hàng B-W-W-B. Vẫn chưa vẽ bảng minh họa như bạn yêu cầu; một chỗ lỗi định dạng '\Rightarrow' bị tách dòng. (Lần đầu: hết thời gian.)

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `ptnk-2024-chuyen/5a`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số. Biết rằng tổng các số được ghi trên 16 thẻ bất kỳ trong số 31 thẻ trên luôn lớn hơn tổng các số được ghi trên 15 thẻ còn lại. Chứng minh $a_1\ge226$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 68 s · *Chi phí:* $0.0144

**Hướng giải:** Xét trường hợp các số nguyên dương phân biệt tăng dần có khoảng cách nhỏ nhất (cách đều 1 đơn vị) để tìm cận dưới của $a_1$. Tính tổng 16 số nhỏ nhất và 15 số lớn nhất theo $a_1$, thiết lập bất đẳng thức và giải tìm $a_1$.
1. **Xét tổng nhỏ nhất** — Điều kiện đề bài yêu cầu tổng của 16 thẻ bất kỳ luôn lớn hơn tổng 15 thẻ còn lại. Điều này có nghĩa là ngay cả khi ta chọn 16 thẻ có tổng nhỏ nhất, tổng đó vẫn phải lớn hơn tổng 15 thẻ còn lại (tức là tổng của 15 thẻ lớn nhất). Nếu điều này đúng, thì với mọi cách chọn 16 thẻ khác (có tổng lớn hơn hoặc bằng), bất đẳng thức cũng sẽ đúng.

   $$
   \sum_{i=1}^{16} a_i > \sum_{i=17}^{31} a_i
   $$
   *Lí do:* Xét trường hợp tổng nhỏ nhất của 16 số
2. **Biểu diễn các số** — Vì $a_1, a_2, \dots, a_{31}$ là các số nguyên dương phân biệt và tăng dần, nên $a_{i+1} \ge a_i + 1$. Để tìm cận dưới của $a_1$, ta xét trường hợp các số cách đều nhau nhất, tức là $a_{i+1} = a_i + 1$. Khi đó dãy số là một cấp số cộng với công sai $d=1$. Ta có $a_i = a_1 + (i-1)$.

   $$
   a_i \ge a_1 + i - 1
   $$
   *Lí do:* Tính chất số nguyên phân biệt tăng dần
3. **Tính tổng** — Thay $a_i = a_1 + i - 1$ vào các tổng.
Tổng 16 số bé nhất: $S_{16} = \sum_{i=1}^{16} (a_1 + i - 1) = 16a_1 + (0 + 1 + \dots + 15) = 16a_1 + \frac{15 \times 16}{2} = 16a_1 + 120$.
Tổng 15 số lớn nhất: $S_{15} = \sum_{i=17}^{31} (a_1 + i - 1)$. Các số hạng là $a_1+16, a_1+17, \dots, a_1+30$.
$S_{15} = 15a_1 + (16 + 17 + \dots + 30)$. Tổng $16 + \dots + 30$ là tổng cấp số cộng với 15 số hạng, số hạng đầu 16, số hạng cuối 30. Tổng = $\frac{15(16+30)}{2} = \frac{15 \times 46}{2} = 15 \times 23 = 345$. Vậy $S_{15} = 15a_1 + 345$.

   $$
   \begin{cases} S_{16} = 16a_1 + 120 \\ S_{15} = 15a_1 + 345 \end{cases}
   $$
   *Lí do:* Công thức tổng cấp số cộng
4. **Kết luận** — Thay các biểu thức tổng vào bất đẳng thức $S_{16} > S_{15}$: $16a_1 + 120 > 15a_1 + 345$. Chuyển vế: $16a_1 - 15a_1 > 345 - 120$, suy ra $a_1 > 225$. Vì $a_1$ là số nguyên dương, nên $a_1 \ge 226$. Dấu bằng trong $a_i \ge a_1 + i - 1$ xảy ra khi dãy số là cấp số cộng với công sai 1, tức là $a_i = a_1 + i - 1$. Khi đó $a_1 = 226$ thỏa mãn điều kiện đề bài.

   $$
   a_1 > 225 \Rightarrow a_1 \ge 226
   $$
   *Lí do:* Giải bất phương trình và tính chất số nguyên

**Kết luận của ứng dụng:** Ta đã chứng minh được $a_1 \ge 226$.

$$
a_1 \ge 226
$$

### Claude tự chấm

- Kết luận: **một phần** — 5/10
- Nhận xét: Kết quả a₁ ≥ 226 đúng nhưng lập luận chỉ xét trường hợp dãy cách đều 1 ('trường hợp cách đều nhất') thay vì chứng minh a_{16+k} ≥ a_{k+1} + 15 cho mọi dãy.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `ptnk-2024-chuyen/5b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default CHƯA kiểm chứng (có kiểm tra thất bại) — KHÔNG hiển thị. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số. Lấy $a_1,a_2,\ldots,a_{31}$ là 31 số nguyên dương đầu tiên: $1,2,\ldots,31$. Người ta bỏ 31 thẻ được ghi các số này vào hai chiếc hộp một cách ngẫu nhiên. Khi kiểm tra một hộp thì thấy rằng trong hộp đó không có hai thẻ nào có tổng hai số được ghi là số chính phương. Chứng minh trong hộp còn lại ta có thể chọn ra được bốn thẻ và chia chúng thành hai cặp sao cho tổng hai số được ghi trên mỗi cặp là số chính phương.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải.** Mô hình bỏ cuộc (cho rằng bài ngoài chương trình) ở mọi lần thử.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Mô hình bỏ cuộc ở mọi lần thử (vòng trước bạn chấm 3 — 'quá phức tạp').

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `ptnk-2025-chuyen/5a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho bảng ô vuông kích thước $2\times9$ và số nguyên dương $k\le18$. Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn $k$ ô của bảng và hỏi An: trong $k$ ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo. Xét $k=4$. Chứng minh rằng Bình có thể thắng sau không quá 8 lượt chơi.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

**Không có lời giải.** Chiến lược trò chơi chưa được chứng minh đầy đủ cho mọi nước đi của đối thủ nên không hiển thị.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Trò chơi: không có chứng nhận chiến lược hợp lệ (như vòng trước).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/5a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Gọi $S$ là tập hợp các số nguyên có giá trị tuyệt đối không vượt quá 100. Chọn ngẫu nhiên một số nguyên $a$ thuộc tập $S$. Tính xác suất sao cho số $a$ được chọn thoả mãn các nghiệm của phương trình $x^2-ax+2a+10=0$ đều là số nguyên.

**Đáp án tham khảo** (official): $\tfrac{4}{201}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 78 s · *Chi phí:* $0.024

**Hướng giải:** Đầu tiên, xác định điều kiện để phương trình bậc hai có nghiệm nguyên là biệt thức $\Delta$ phải là một số chính phương. Tiếp theo, biến đổi phương trình $\Delta = k^2$ thành dạng hiệu hai bình phương để tìm các giá trị nguyên của $a$. Cuối cùng, đếm số giá trị $a$ thỏa mãn thuộc tập $S$ và tính xác suất.
1. **Tính biệt thức $\Delta$** — Để phương trình $x^2 - ax + 2a + 10 = 0$ có nghiệm nguyên, trước hết nó phải có nghiệm thực, tức là $\Delta \ge 0$. Hơn nữa, nghiệm $x = \frac{-b \pm \sqrt{\Delta}}{2a}$ sẽ là số nguyên nếu và chỉ nếu $\Delta$ là một số chính phương. Ta tính $\Delta$ theo $a$.

   $$
   \Delta = (-a)^2 - 4(1)(2a + 10) = a^2 - 8a - 40
   $$
   *Lí do:* Công thức tính biệt thức $\Delta$ của phương trình bậc hai $Ax^2+Bx+C=0$ là $\Delta = B^2 - 4AC$.
2. **Biến đổi thành hiệu hai bình phương** — Đặt $\Delta = k^2$ với $k$ là số nguyên không âm ($k \ge 0$). Ta có phương trình $a^2 - 8a - 40 = k^2$. Biến đổi vế trái bằng cách hoàn thành bình phương để đưa về dạng hiệu hai bình phương.

   $$
   a^2 - 8a - 40 = k^2 \Leftrightarrow (a-4)^2 - 16 - 40 = k^2 \Leftrightarrow (a-4)^2 - k^2 = 56
   $$
   *Lí do:* Hằng đẳng thức $(A-B)^2 = A^2 - 2AB + B^2$ và biến đổi đại số.
3. **Tìm các cặp ước (X, Y)** — Phân tích vế trái thành nhân tử: $(a-4-k)(a-4+k) = 56$. Đặt $X = a-4-k$ và $Y = a-4+k$. Khi đó $XY = 56$. Ta có $Y - X = (a-4+k) - (a-4-k) = 2k \ge 0$, nên $Y \ge X$. Hơn nữa, $X+Y = 2(a-4)$ là số chẵn, suy ra $X$ và $Y$ phải cùng tính chẵn lẻ. Vì tích $XY=56$ (số chẵn) nên cả $X$ và $Y$ đều phải là số chẵn. Ta liệt kê các cặp ước $(X, Y)$ của 56 thỏa mãn điều kiện này.

   $$
   \left\{\begin{array}{l}XY = 56 \\ X, Y \in \mathbb{Z} \\ X \le Y \\ X, Y \text{ cùng chẵn}\end{array}\right.
   $$
   *Lí do:* Phân tích nhân tử và tính chất của số nguyên.
4. **Tính các giá trị của a** — Giải hệ $\left\{\begin{array}{l}X+Y = 2(a-4) \\ XY = 56\end{array}\right.$ để tìm $a$ cho từng cặp $(X, Y)$ thỏa mãn.

   $$
   a = \frac{X+Y}{2} + 4
   $$
   *Lí do:* Từ $X+Y = 2(a-4) \Rightarrow a-4 = \frac{X+Y}{2} \Rightarrow a = \frac{X+Y}{2} + 4$.
5. **Xác định tập hợp S** — Kiểm tra các giá trị $a$ tìm được có thuộc tập $S$ hay không. $S = \{a \in \mathbb{Z} : |a| \le 100\}$, tức là $-100 \le a \le 100$. Tổng số phần tử của $S$ là $100 - (-100) + 1 = 201$.

   $$
   S = \{-100, -99, ..., 99, 100\}, |S| = 201
   $$
   *Lí do:* Định nghĩa tập hợp S.
6. **Xác định số giá trị a thỏa mãn** — Liệt kê các giá trị $a$ cụ thể từ các cặp $(X, Y)$:
1. $(X, Y) = (-28, -2) \Rightarrow a = \frac{-30}{2} + 4 = -15 + 4 = -11$. (Thuộc S)
2. $(X, Y) = (-14, -4) \Rightarrow a = \frac{-18}{2} + 4 = -9 + 4 = -5$. (Thuộc S)
3. $(X, Y) = (2, 28) \Rightarrow a = \frac{30}{2} + 4 = 15 + 4 = 19$. (Thuộc S)
4. $(X, Y) = (4, 14) \Rightarrow a = \frac{18}{2} + 4 = 9 + 4 = 13$. (Thuộc S)

Tất cả các giá trị $a$ này đều thuộc tập $S$. Vậy có 4 giá trị của $a$ thỏa mãn đề bài.

   $$
   A = \{13, 19, -11, -5\}, |A| = 4
   $$
   *Lí do:* Liệt kê các giá trị a thỏa mãn.
7. **Tính xác suất** — Xác suất cần tìm là tỉ số giữa số giá trị $a$ thỏa mãn và tổng số phần tử của tập $S$.

   $$
   P = \frac{4}{201}
   $$
   *Lí do:* Định nghĩa xác suất cổ điển.

**Kết luận của ứng dụng:** Xác suất cần tìm là $\frac{4}{201}$.

$$
\frac{4}{201}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Δ = k², (a−4−k)(a−4+k) = 56, chọn cặp cùng chẵn → 4 giá trị, xác suất 4/201.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `hcm-2025-chuyen/5b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho tập hợp $A=\{1;2;3;\ldots;100\}$ và tập hợp $B$ là tập hợp con chứa 11 phần tử của tập hợp $A$. Chứng minh rằng tập hợp $B$ luôn chứa ba số $a,b,c$ phân biệt sao cho $a,b,c$ là độ dài ba cạnh của một tam giác.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 24 s · *Chi phí:* $0.0087

**Hướng giải:** Sử dụng phương pháp chứng minh phản chứng kết hợp với nguyên lý Dirichlet (nguyên lý xếp lồng). Giả sử không có ba số nào lập thành tam giác, ta sẽ chứng minh phần tử lớn nhất của tập hợp $B$ phải lớn hơn 100, mâu thuẫn với điều kiện $B \subseteq A$.
1. **Điều kiện để ba số lập thành tam giác** — Để ba số $a, b, c$ (với $a < b < c$) là độ dài ba cạnh của một tam giác, tổng hai cạnh nhỏ hơn phải lớn hơn cạnh lớn nhất, tức là $a + b > c$. Ngược lại, nếu $a + b \le c$ thì ba số đó không thể lập thành tam giác.

   $$
   a + b > c
   $$
   *Lí do:* Bất đẳng thức tam giác
2. **Giả sử phản chứng** — Ta giả sử ngược lại rằng trong tập hợp $B$ không tồn tại ba số nào lập thành tam giác. Khi đó, với bất kỳ ba số nào $x_i < x_j < x_k$ trong $B$, ta luôn có $x_i + x_j \le x_k$. Điều này đặc biệt đúng với ba số liên tiếp trong dãy đã sắp xếp.

   $$
   x_k \ge x_{k-1} + x_{k-2}, \forall k \ge 3
   $$
   *Lí do:* Chứng minh phản chứng
3. **Tính giá trị nhỏ nhất của các phần tử** — Vì $B$ là tập con của $A$ nên các phần tử của $B$ là các số nguyên dương phân biệt. Sắp xếp $B$ theo thứ tự tăng dần: $x_1 < x_2 < \ldots < x_{11}$. Ta có $x_1 \ge 1$ và $x_2 \ge 2$. Áp dụng bất đẳng thức $x_k \ge x_{k-1} + x_{k-2}$, ta tính được các giá trị nhỏ nhất có thể có của các phần tử tiếp theo:
$x_3 \ge 1 + 2 = 3$
$x_4 \ge 2 + 3 = 5$
$x_5 \ge 3 + 5 = 8$
$x_6 \ge 5 + 8 = 13$
$x_7 \ge 8 + 13 = 21$
$x_8 \ge 13 + 21 = 34$
$x_9 \ge 21 + 34 = 55$
$x_{10} \ge 34 + 55 = 89$
$x_{11} \ge 55 + 89 = 144$.

   $$
   x_{11} \ge 144
   $$
   *Lí do:* Dãy Fibonacci và điều kiện không lập thành tam giác
4. **Mâu thuẫn và kết luận** — Ta có $x_{11} \ge 144$. Tuy nhiên, vì $B$ là tập con của $A = \{1, 2, \ldots, 100\}$, nên phần tử lớn nhất của $B$ không thể vượt quá 100, tức là $x_{11} \le 100$. Điều này dẫn đến mâu thuẫn $144 \le x_{11} \le 100$, vô lý.

   $$
   144 \le x_{11} \le 100 \Rightarrow \text{Vô lý}
   $$
   *Lí do:* Mâu thuẫn với giả thiết

**Kết luận của ứng dụng:** Đã chứng minh được tập hợp $B$ luôn chứa ba số $a, b, c$ phân biệt thỏa mãn bất đẳng thức tam giác.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Phản chứng với dãy kiểu Fibonacci: x₁₁ ≥ 144 > 100.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/V.1`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Hai trường trung học cơ sở $A$ và $B$ tổ chức chung một buổi liên hoan cho các học sinh tiêu biểu. Biết rằng trong buổi liên hoan này: (i) mỗi học sinh trường $A$ quen với đúng 5 học sinh khác cũng của trường $A$; (ii) mỗi học sinh trường $A$ quen với đúng 4 học sinh trường $B$; (iii) mỗi học sinh trường $B$ quen với đúng 3 học sinh trường $A$; (iv) tổng số học sinh của hai trường tham dự không vượt quá 80. Số học sinh trường $A$ tham dự buổi liên hoan có thể là 25 học sinh được không? Vì sao?

**Đáp án tham khảo** (teacher): Không

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 35 s · *Chi phí:* $0.013

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: methods within the curriculum (graph theory)

**Hướng giải:** Đếm tổng số mối quan hệ 'quen' giữa hai trường theo hai cách (từ A và từ B) để thiết lập phương trình liên hệ giữa số học sinh hai trường. Sau đó kiểm tra xem x = 25 có thỏa mãn điều kiện số nguyên cho y hay không.
1. **Thiết lập phương trình** — Gọi x là số học sinh trường A và y là số học sinh trường B. Ta sẽ đếm tổng số mối quan hệ 'quen' giữa hai trường theo hai cách.

   $$
   4x = 3y
   $$
   *Lí do:* Counting edges in a bipartite graph
2. **Điều kiện nguyên** — Từ phương trình 4x = 3y, ta suy ra y = 4x/3. Vì y là số học sinh, y phải là số nguyên dương. Điều này có nghĩa là 4x phải chia hết cho 3. Vì 4 không chia hết cho 3, nên x phải chia hết cho 3.

   $$
   y = \frac{4x}{3}
   $$
   *Lí do:* Tính chất của số nguyên
3. **Kiểm tra trường hợp x = 25** — Nếu x = 25, thì y = 4 * 25 / 3 = 100 / 3. Vì 100 không chia hết cho 3, y không phải là số nguyên. Vậy số học sinh trường A không thể là 25.

   $$
   y = \frac{100}{3}
   $$
   *Lí do:* Phép thế và tính chất số nguyên

**Kết luận của ứng dụng:** Không thể.

### Claude tự chấm

- Kết luận: **không hiển thị** — 3/10
- Nhận xét: Đếm hai cách 4x = 3y → x chia hết cho 3 nên x ≠ 25 — đúng. Bị chặn vì phần lí do ghi 'Counting edges in a bipartite graph' (tiếng Anh + lí thuyết đồ thị) — đúng luật bạn đặt.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `hanoi-2025-chuyen/V.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Hai trường trung học cơ sở $A$ và $B$ tổ chức chung một buổi liên hoan cho các học sinh tiêu biểu. Biết rằng trong buổi liên hoan này: (i) mỗi học sinh trường $A$ quen với đúng 5 học sinh khác cũng của trường $A$; (ii) mỗi học sinh trường $A$ quen với đúng 4 học sinh trường $B$; (iii) mỗi học sinh trường $B$ quen với đúng 3 học sinh trường $A$; (iv) tổng số học sinh của hai trường tham dự không vượt quá 80. Tổng số học sinh của hai trường tham dự buổi liên hoan có thể nhiều nhất là bao nhiêu? Vì sao?

**Đáp án tham khảo** (teacher): 70

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 138 s · *Chi phí:* $0.0101

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: methods within the curriculum (graph theory)

**Hướng giải:** Đếm số mối quan hệ quen biết giữa hai trường theo hai cách để tìm tỉ lệ giữa số học sinh hai trường, sau đó dùng điều kiện tổng không vượt quá 80 để tìm giá trị lớn nhất.
1. **Thiết lập phương trình liên hệ** — Gọi $x$ là số học sinh trường A và $y$ là số học sinh trường B. Mỗi học sinh A quen 4 bạn B, nên tổng số mối quan hệ A-B là $4x$. Mỗi học sinh B quen 3 bạn A, nên tổng số mối quan hệ A-B là $3y$. Hai tổng này phải bằng nhau.

   $$
   4x = 3y
   $$
   *Lí do:* Đếm số cạnh trong đồ thị hai phía
2. **Tìm nghiệm nguyên** — Từ $4x = 3y$, ta có $x = \frac{3y}{4}$. Vì $x$ là số nguyên nên $y$ phải chia hết cho 4. Đặt $y = 4k$ (với $k$ là số nguyên dương), khi đó $x = 3k$.

   $$
   x = 3k, y = 4k
   $$
   *Lí do:* Biến đổi đại số và điều kiện nguyên
3. **Áp dụng điều kiện tổng** — Tổng số học sinh là $x + y = 3k + 4k = 7k$. Theo đề bài, tổng này không vượt quá 80, nên $7k \le 80$. Chia cả hai vế cho 7, ta được $k \le \frac{80}{7} \approx 11,4$.

   $$
   7k \le 80 \Rightarrow k \le 11
   $$
   *Lí do:* Giải bất phương trình
4. **Tính kết quả** — Vì $k$ là số nguyên dương và $k \le 11,4$, nên giá trị lớn nhất của $k$ là 11. Khi đó tổng số học sinh là $7 \times 11 = 77$.

   $$
   k_{max} = 11 \Rightarrow x+y = 77
   $$
   *Lí do:* Tìm cực trị

**Kết luận của ứng dụng:** Tổng số học sinh của hai trường tham dự buổi liên hoan có thể nhiều nhất là 80 bạn.

$$
80
$$

### Claude tự chấm

- Kết luận: **sai** — 0/10
- Nhận xét: Các bước ra 77, kết luận ghi 80 — cả hai sai (đáp án 70: còn điều kiện 5x chẵn từ (i) nên x chẵn, k chẵn). Bị chặn, không hiển thị.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `ptnk-2026-chuyen/5`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Câu 5. Cho bảng ô vuông kích thước $3 \times 3$ gồm 3 hàng, 3 cột và 2 đường chéo. Một số nguyên dương $n$ được gọi là số tốt nếu ta tìm được 9 số nguyên dương phân biệt và điền vào các ô của bảng, mỗi ô một số, sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng $n$.
a) Hãy chỉ ra một cách điền các số nguyên dương từ 1 đến 9 vào các ô của bảng sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng nhau.
b) Chứng minh nếu $n \ge 15$ và $n$ chia hết cho 3 thì $n$ là số tốt.
c) Chứng minh nếu $n$ là số tốt thì $n \ge 15$ và $n$ chia hết cho 3.

**Đáp án tham khảo** (official): a) ví dụ 2 7 6 / 9 5 1 / 4 3 8. b), c) (chứng minh)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 34 s · *Chi phí:* $0.0103

**Hướng giải:** Đầu tiên, tìm tổng mỗi hàng, cột, đường chéo cho câu a bằng cách tính tổng 9 số từ 1 đến 9. Sau đó, xây dựng bảng ma phương 15. Với câu b, sử dụng bảng ma phương 15 và cộng thêm một hằng số vào mỗi ô để tạo ra bảng ma phương với tổng n. Với câu c, sử dụng tổng của 9 số và tổng của 4 đường qua tâm để chứng minh n >= 15 và n chia hết cho 3.
1. **Tìm tổng mỗi hàng, cột, đường chéo** — Để giải quyết câu a, chúng ta cần tìm một cách sắp xếp các số từ 1 đến 9 vào bảng 3x3 sao cho tổng các hàng, cột và đường chéo bằng nhau. Tổng của 9 số từ 1 đến 9 là 45. Vì có 3 hàng và tổng mỗi hàng bằng nhau, nên tổng mỗi hàng phải là 45 / 3 = 15. Tương tự cho các cột và đường chéo.

   $$
   1+2+3+4+5+6+7+8+9 = 45 \Rightarrow 3n = 45 \Rightarrow n = 15
   $$
   *Lí do:* Tính chất của tổng các số tự nhiên liên tiếp và tính chất của bảng ma phương.
2. **Chỉ ra cách điền số** — Một cách điền số thỏa mãn điều kiện trên là:
8 1 6
3 5 7
4 9 2
Ta kiểm tra:
- Hàng 1: 8+1+6 = 15
- Hàng 2: 3+5+7 = 15
- Hàng 3: 4+9+2 = 15
- Cột 1: 8+3+4 = 15
- Cột 2: 1+5+9 = 15
- Cột 3: 6+7+2 = 15
- Đường chéo 1: 8+5+2 = 15
- Đường chéo 2: 6+5+4 = 15
Vậy bảng trên thỏa mãn yêu cầu câu a.

   $$
   \begin{array}{|c|c|c|}
\hline
8 & 1 & 6 \\
\hline
3 & 5 & 7 \\
\hline
4 & 9 & 2 \\
\hline
\end{array}
   $$
   *Lí do:* Kiểm tra trực tiếp các tổng.
3. **Chứng minh n là số tốt** — Câu b: Giả sử n >= 15 và n chia hết cho 3. Khi đó, n = 3k với k là số nguyên và k >= 5. Ta lấy bảng ma phương 15 ở câu a và cộng thêm một số d vào mỗi ô. Để tổng mới bằng n, ta cần 15 + 3d = n. Suy ra 3d = n - 15 = 3k - 15 = 3(k-5). Vậy d = k - 5. Vì k >= 5 nên d >= 0. Các số mới trong bảng là 1+d, 2+d, ..., 9+d. Đây là 9 số nguyên dương phân biệt. Tổng mỗi hàng, cột, đường chéo mới là 15 + 3d = 15 + 3(k-5) = 15 + 3k - 15 = 3k = n. Vậy n là số tốt.

   $$
   n = 3k, d = k-5 \Rightarrow 15+3d = 15+3(k-5) = 3k = n
   $$
   *Lí do:* Tính chất của phép cộng và định nghĩa số tốt.
4. **Chứng minh n >= 15** — Câu c: Giả sử n là số tốt. Gọi 9 số trong bảng là a1, a2, ..., a9. Tổng của 9 số này là S = a1 + ... + a9. Mặt khác, tổng của 3 hàng bằng 3n. Vậy S = 3n. Vì 9 số là các số nguyên dương phân biệt, tổng nhỏ nhất của chúng là tổng của 9 số nguyên dương phân biệt nhỏ nhất, tức là 1+2+...+9 = 45. Do đó, S >= 45. Suy ra 3n >= 45, hay n >= 15. Điều này chứng minh n >= 15.

   $$
   S = 3n \ge 45 \Rightarrow n \ge 15
   $$
   *Lí do:* Tính chất của tổng các số nguyên dương phân biệt.
5. **Chứng minh n chia hết cho 3** — Tiếp tục câu c: Gọi số ở ô trung tâm là c. Xét tổng của 4 đường (2 đường chéo và 2 đường qua tâm theo hàng và cột). Tổng này bằng 4n. Mặt khác, tổng này bằng tổng của 9 số trong bảng cộng thêm 3 lần số c (vì số c nằm trong 4 đường, nên được cộng 4 lần, trong khi các số khác chỉ được cộng 1 lần trong tổng 9 số). Vậy 4n = S + 3c. Thay S = 3n vào, ta có 4n = 3n + 3c, suy ra n = 3c. Điều này chứng tỏ n chia hết cho 3.

   $$
   4n = S + 3c = 3n + 3c \Rightarrow n = 3c
   $$
   *Lí do:* Tính chất của tổng các đường qua tâm.
6. **Kết luận** — Kết luận: Từ các bước trên, ta đã chứng minh được:
a) Có cách điền số từ 1 đến 9 vào bảng 3x3 sao cho tổng mỗi hàng, cột, đường chéo bằng 15.
b) Nếu n >= 15 và n chia hết cho 3 thì n là số tốt.
c) Nếu n là số tốt thì n >= 15 và n chia hết cho 3.
   *Lí do:* Tổng hợp các kết quả đã chứng minh.

**Kết luận của ứng dụng:** a) Bảng số:
8 1 6
3 5 7
4 9 2
Tổng mỗi hàng, cột, đường chéo bằng 15.
b) Với n = 3k (k >= 5), ta luôn tìm được 9 số nguyên dương phân biệt thỏa mãn điều kiện. Vậy n là số tốt.
c) Nếu n là số tốt thì n >= 15 và n chia hết cho 3.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Có vẽ bảng 3×3 (dạng bảng có kẻ ô); b) cộng d = k−5 vào mỗi ô; c) S = 3n ≥ 45 và 4n = S + 3c.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 11 — `comb8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Có $5$ bạn nam và $3$ bạn nữ (các bạn đều khác nhau) xếp thành một hàng ngang sao cho không có hai bạn nữ nào đứng cạnh nhau. Hỏi có bao nhiêu cách xếp?

**Đáp án tham khảo** (verified by SymPy/enumeration): $14400$ ($5!\cdot C_6^3\cdot 3!$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 31 s · *Chi phí:* $0.0126

**Hướng giải:** Xếp 5 bạn nam trước, sau đó xếp 3 bạn nữ vào các khoảng trống giữa các bạn nam để đảm bảo không có hai bạn nữ nào đứng cạnh nhau.
1. **Xếp 5 bạn nam** — Để đảm bảo không có hai bạn nữ nào đứng cạnh nhau, ta sẽ xếp 5 bạn nam trước. Vì 5 bạn nam khác nhau, số cách xếp 5 bạn nam vào 5 vị trí là số hoán vị của 5 phần tử.

   $$
   5! = 120
   $$
   *Lí do:* Hoán vị
2. **Đếm số khoảng trống** — Sau khi xếp 5 bạn nam, ta có các khoảng trống xung quanh họ. Hãy tưởng tượng 5 bạn nam đứng thành hàng: $\_ N \_ N \_ N \_ N \_ N \_$. Các dấu gạch dưới là các khoảng trống. Có 5 bạn nam nên sẽ có 4 khoảng trống ở giữa, cộng thêm 1 khoảng trống ở đầu và 1 khoảng trống ở cuối. Tổng cộng có 6 khoảng trống.

   $$
   6
   $$
   *Lí do:* Đếm khoảng trống
3. **Xếp 3 bạn nữ vào khoảng trống** — Ta có 3 bạn nữ khác nhau và 6 khoảng trống khác nhau. Ta cần chọn 3 khoảng trống trong 6 khoảng trống đó và xếp 3 bạn nữ vào đó. Số cách xếp là chỉnh hợp chập 3 của 6.

   $$
   A_6^3 = 6 \times 5 \times 4 = 120
   $$
   *Lí do:* Chỉnh hợp
4. **Tính tổng số cách xếp** — Theo quy tắc nhân, số cách xếp tổng cộng là tích của số cách xếp nam và số cách xếp nữ.

   $$
   120 \times 120 = 14400
   $$
   *Lí do:* Quy tắc nhân

**Kết luận của ứng dụng:** Số cách xếp là 14400 cách.

$$
14400
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Xếp nam trước, 6 khoảng trống, A₆³ — 14400. Lỗi gạch dưới '_ N _' đã hết.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 12 — `comb8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Có bao nhiêu số tự nhiên có bốn chữ số mà các chữ số đều là số lẻ và đôi một khác nhau?

**Đáp án tham khảo** (verified by SymPy/enumeration): $120$

### Lời giải của ứng dụng

**Không có lời giải.** Lời giải bị loại vì vẫn còn chữ tiếng Anh/nước ngoài sau khi đã tự động sửa ngôn ngữ.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Vẫn bị loại vì chữ 'choose' trong ô kết quả (lần chạy lại dùng lại phản hồi đã lưu nên chưa áp dụng sửa 38).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 13 — `comb8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Chứng minh rằng trong $10$ số tự nhiên bất kì luôn chọn được một số số (ít nhất một số) có tổng chia hết cho $10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: xét $10$ tổng $S_k=a_1+\dots+a_k$; nếu có $S_k$ chia hết cho $10$ thì xong; nếu không, $10$ tổng chỉ có $9$ số dư khác $0$ nên có $S_i\equiv S_j$ ($i<j$), khi đó $a_{i+1}+\dots+a_j$ chia hết cho $10$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 31 s · *Chi phí:* $0.0092

**Hướng giải:** Xây dựng 10 tổng riêng phần $S_k$ và xét số dư của chúng khi chia cho 10. Áp dụng Nguyên lý Dirichlet để chứng minh tồn tại hai tổng có cùng số dư, từ đó suy ra hiệu của chúng (chính là tổng của một tập hợp con các số) chia hết cho 10.
1. **Đặt ký hiệu** — Để giải quyết bài toán này, chúng ta sẽ sử dụng một công cụ rất mạnh mẽ trong toán học là Nguyên lý Dirichlet (hay còn gọi là Nguyên lý ngăn kéo). Ý tưởng chính là xây dựng các tổng riêng phần và xét số dư của chúng khi chia cho 10.

   $$
   \text{ Gọi } 10 \text{ số tự nhiên bất kì là }  a_1, a_2, \dots, a_{10} .
   $$
   *Lí do:* Đặt ký hiệu
2. **Xây dựng tổng riêng phần** — Ta xây dựng 10 tổng riêng phần $S_k$ như sau: $S_1 = a_1$, $S_2 = a_1 + a_2$, ..., $S_{10} = a_1 + a_2 + \dots + a_{10}$. Mỗi tổng $S_k$ là tổng của $k$ số đầu tiên trong dãy.

   $$
   S_k = a_1 + a_2 + \dots + a_k \quad (k = 1, 2, \dots, 10)
   $$
   *Lí do:* Xây dựng dãy tổng
3. **Xét số dư** — Xét số dư của 10 tổng $S_1, S_2, \dots, S_{10}$ khi chia cho 10. Số dư khi chia cho 10 chỉ có thể nhận một trong 10 giá trị: $0, 1, 2, \dots, 9$.

   $$
   S_k \equiv r_k \pmod{10}, \quad r_k \in \{0, 1, 2, \dots, 9\}
   $$
   *Lí do:* Số dư khi chia cho 10
4. **Xét các trường hợp** — Ta xét hai trường hợp có thể xảy ra đối với các số dư $r_1, r_2, \dots, r_{10}$.
   *Lí do:* Xét trường hợp
5. **Trường hợp 1: Có tổng chia hết cho 10** — Trường hợp 1: Tồn tại một chỉ số $i$ sao cho $S_i$ chia hết cho 10 (tức là $r_i = 0$). Khi đó, chính tổng $i$ số đầu tiên $a_1 + \dots + a_i$ đã chia hết cho 10. Ta đã tìm được tập hợp con cần tìm.

   $$
   S_i \equiv 0 \pmod{10} \Rightarrow a_1 + \dots + a_i \vdots 10
   $$
   *Lí do:* Trường hợp 1
6. **Trường hợp 2: Áp dụng Nguyên lý Dirichlet** — Trường hợp 2: Không có tổng nào chia hết cho 10, tức là tất cả các số dư $r_1, r_2, \dots, r_{10}$ đều khác 0. Khi đó, các số dư này chỉ có thể nhận 9 giá trị khác nhau: $1, 2, \dots, 9$. Ta có 10 số dư nhưng chỉ có 9 giá trị có thể nhận. Theo Nguyên lý Dirichlet, phải tồn tại ít nhất hai số dư bằng nhau. Gọi hai chỉ số là $i$ và $j$ với $1 \le i < j \le 10$ sao cho $r_i = r_j$. Điều này có nghĩa là $S_i$ và $S_j$ có cùng số dư khi chia cho 10.

   $$
   r_i = r_j \Rightarrow S_j \equiv S_i \pmod{10}
   $$
   *Lí do:* Nguyên lý Dirichlet
7. **Tìm tập hợp con** — Vì $S_j$ và $S_i$ có cùng số dư khi chia cho 10, nên hiệu $S_j - S_i$ sẽ chia hết cho 10. Ta có: $S_j - S_i = (a_1 + \dots + a_j) - (a_1 + \dots + a_i) = a_{i+1} + \dots + a_j$. Đây chính là tổng của các số từ $a_{i+1}$ đến $a_j$. Vì $j > i$, nên tập hợp các số này không rỗng. Vậy ta đã tìm được một tập hợp con các số có tổng chia hết cho 10.

   $$
   S_j - S_i = a_{i+1} + \dots + a_j \vdots 10
   $$
   *Lí do:* Tính chất chia hết
8. **Kết luận** — Trong cả hai trường hợp, ta đều tìm được ít nhất một tập hợp con các số có tổng chia hết cho 10. Điều phải chứng minh đã được hoàn thành.
   *Lí do:* Kết luận

**Kết luận của ứng dụng:** Đã chứng minh: Luôn tồn tại tập con các số có tổng chia hết cho 10.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Tổng riêng phần + Dirichlet, đúng; hơi dài (8 bước).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 14 — `comb8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Điền các số $1,2,\ldots,9$ vào bảng $3\times3$, mỗi ô một số. Chứng minh không thể điền sao cho tổng các số trên mỗi hàng đều là số chẵn.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: tổng ba tổng hàng bằng $1+2+\dots+9=45$ là số lẻ, còn tổng ba số chẵn là số chẵn — mâu thuẫn.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 1 s · *Chi phí:* $0.0002

**Hướng giải:** Tính tổng của tất cả các số từ 1 đến 9, nhận xét tổng này là số lẻ. Sau đó, sử dụng phương pháp phản chứng: giả sử tổng mỗi hàng là số chẵn, suy ra tổng toàn bảng phải là số chẵn, dẫn đến mâu thuẫn với tổng thực tế là số lẻ.
1. **Tính tổng các số từ 1 đến 9** — Đầu tiên, chúng ta cần tính tổng của tất cả các số từ 1 đến 9. Đây là tổng của một cấp số cộng với số hạng đầu là 1, số hạng cuối là 9 và có 9 số hạng.

   $$
   S = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = \frac{(1 + 9) \times 9}{2} = 45
   $$
   *Lí do:* Công thức tính tổng cấp số cộng
2. **Nhận xét tính chẵn lẻ của tổng** — Ta thấy rằng 45 là một số lẻ. Đây là một tính chất cố định của tổng các số từ 1 đến 9.

   $$
   45 \text{ là số lẻ}
   $$
   *Lí do:* Định nghĩa số chẵn và số lẻ
3. **Giả sử điều ngược lại** — Để chứng minh điều này, ta sử dụng phương pháp phản chứng. Ta giả sử điều ngược lại là đúng, tức là có thể điền các số vào bảng sao cho tổng các số trên mỗi hàng đều là số chẵn.

   $$
   \text{ Giả sử tổng các số trên mỗi hàng là số chẵn. }
   $$
   *Lí do:* Phương pháp phản chứng
4. **Suy luận từ giả thiết** — Gọi $S_1, S_2, S_3$ lần lượt là tổng các số trên hàng 1, hàng 2 và hàng 3. Theo giả thiết, $S_1, S_2, S_3$ đều là các số chẵn. Tổng của cả bảng là tổng của 3 hàng này, tức là $S = S_1 + S_2 + S_3$. Vì tổng của ba số chẵn luôn là một số chẵn, nên $S$ phải là số chẵn.

   $$
   S_1, S_2, S_3 \text{ chẵn} \Rightarrow S_1 + S_2 + S_3 \text{ chẵn} \Rightarrow S \text{ chẵn}
   $$
   *Lí do:* Tính chất: Tổng của các số chẵn là số chẵn
5. **Phát hiện mâu thuẫn** — Ta có một mâu thuẫn: từ bước 2, tổng thực tế của các số là 45 (số lẻ), nhưng từ giả thiết ở bước 4, tổng này phải là số chẵn. Một số không thể vừa là số lẻ vừa là số chẵn được.

   $$
   45 \text{ (lẻ)} \neq \text{Số chẵn}
   $$
   *Lí do:* Mâu thuẫn lập luận
6. **Kết luận** — Vì giả sử tổng các hàng là số chẵn dẫn đến mâu thuẫn, nên giả thiết đó là sai. Do đó, không thể điền các số $1, 2, \ldots, 9$ vào bảng $3 \times 3$ sao cho tổng các số trên mỗi hàng đều là số chẵn.

   $$
   \text{Không thể điền được.}
   $$
   *Lí do:* Phương pháp phản chứng

**Kết luận của ứng dụng:** Không thể điền được các số $1, 2, \ldots, 9$ vào bảng $3 \times 3$ sao cho tổng các số trên mỗi hàng đều là số chẵn.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chạy lại: tổng 45 lẻ, ba tổng chẵn → mâu thuẫn. Đúng, hơi dài (6 bước). Chữ 'logic' đã hết.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 15 — `comb8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Có bao nhiêu tam giác vuông có ba đỉnh là ba trong sáu đỉnh của một lục giác đều?

**Đáp án tham khảo** (verified by SymPy/enumeration): $12$ (cạnh huyền là một trong $3$ đường chéo chính, mỗi đường chéo với $4$ đỉnh còn lại)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 258 s · *Chi phí:* $0.0093

**Hướng giải:** Sử dụng tính chất góc nội tiếp chắn nửa đường tròn để xác định các tam giác vuông. Lục giác đều có 3 đường chéo chính là đường kính, mỗi đường kính tạo ra 4 tam giác vuông.
1. **Xác định đường tròn ngoại tiếp** — Gọi lục giác đều là ABCDEF. Ta nhận thấy rằng 6 đỉnh này cùng nằm trên một đường tròn (đường tròn ngoại tiếp lục giác).

   $$
   \text{ Đường tròn } (O) \text{ ngoại tiếp lục giác đều ABCDEF }
   $$
   *Lí do:* Định nghĩa lục giác đều
2. **Xác định các đường kính** — Theo tính chất góc nội tiếp, một tam giác nội tiếp đường tròn là tam giác vuông khi và chỉ khi một cạnh của nó là đường kính của đường tròn đó. Lục giác đều có 3 đường chéo chính AD, BE, CF cắt nhau tại tâm O và là các đường kính.

   $$
   AD, BE, \text{ CF là các đường kính của } (O)
   $$
   *Lí do:* Tính chất lục giác đều
3. **Đếm số tam giác vuông** — Xét đường kính AD. Các đỉnh còn lại là B, C, E, F. Ta có các tam giác vuông tại B, C, E, F: ABD, ACD, AED, AFD. Tương tự với BE và CF. Mỗi đường kính tạo ra 4 tam giác vuông.

   $$
   4 \text{ tam giác vuông trên mỗi đường kính }
   $$
   *Lí do:* Góc nội tiếp chắn nửa đường tròn

**Kết luận của ứng dụng:** Số tam giác vuông là 12.

$$
12
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: 3 đường kính × 4 = 12.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 16 — `comb8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Có $20$ viên bi. Hai bạn An và Bình lần lượt lấy bi, An lấy trước; mỗi lượt phải lấy $1$, $2$ hoặc $3$ viên. Ai lấy được viên bi cuối cùng thì thắng. Ai có chiến lược thắng? Hãy nêu chiến lược.

**Đáp án tham khảo** (verified by SymPy/enumeration): Bình (người đi sau) thắng: sau mỗi lượt của An lấy $k$ viên, Bình lấy $4-k$ viên, giữ số bi còn lại chia hết cho $4$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 18 s · *Chi phí:* $0.0066

**Hướng giải:** Phân tích trò chơi bằng cách tìm quy luật từ các trường hợp đơn giản (số bi nhỏ). Xác định rằng người đi sau có thể thắng nếu số bi ban đầu là bội số của (số lượng tối đa + 1). Áp dụng quy luật này cho 20 viên bi để xác định người thắng và chiến lược cụ thể.
1. **Phân tích trường hợp cơ sở** — Hãy cùng phân tích trò chơi với số bi ít hơn để tìm ra quy luật. Giả sử chỉ có 4 viên bi. An đi trước, An có thể lấy 1, 2 hoặc 3 viên. Dù An lấy bao nhiêu, Bình đều có thể lấy số viên bi còn lại (vì số bi còn lại là 3, 2 hoặc 1, đều nhỏ hơn hoặc bằng 3) và lấy được viên bi cuối cùng. Vậy với 4 viên bi, người đi sau (Bình) sẽ thắng.

   $$
   4 \text{ viên bi} \Rightarrow \text{Người đi sau thắng}
   $$
   *Lí do:* Phân tích trường hợp cơ sở
2. **Xây dựng chiến lược** — Từ kết quả trên, ta thấy chiến lược của người đi sau là: bất cứ An lấy bao nhiêu viên (gọi là $x$), Bình sẽ lấy $4 - x$ viên. Khi đó, sau lượt của Bình, tổng số viên bi đã lấy đi là $x + (4 - x) = 4$ viên. Nếu số bi ban đầu là 8, sau 2 vòng (An-Bình, An-Bình), số bi đã lấy đi là $4 + 4 = 8$ viên, Bình lại thắng. Quy luật này đúng cho mọi số bi là bội số của 4.

   $$
   x + (4 - x) = 4
   $$
   *Lí do:* Chiến lược bù vào 4
3. **Áp dụng cho 20 viên bi** — Bây giờ áp dụng vào bài toán với 20 viên bi. Ta thấy $20 = 4 \times 5$, tức là 20 là bội số của 4. Vì An đi trước, Bình là người đi sau. Bình sẽ áp dụng chiến lược: sau mỗi lượt của An, Bình lấy số viên bi sao cho tổng số viên bi hai người đã lấy trong một vòng bằng 4. Sau 5 vòng như vậy, tổng số bi đã lấy đi là $5 \times 4 = 20$ viên. Viên bi cuối cùng sẽ do Bình lấy.

   $$
   20 \vdots 4
   $$
   *Lí do:* Áp dụng quy luật cho số bi cụ thể

**Kết luận của ứng dụng:** Bạn Bình có chiến lược thắng. Chiến lược: Sau mỗi lượt của An, Bình lấy số viên bi sao cho tổng số viên bi hai người đã lấy trong một vòng (2 lượt) bằng 4.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Bình thắng, lấy 4 − x. Lỗi tiếng Anh vòng trước đã hết.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 17 — `comb9-f1`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Từ các chữ số $1,2,3,4,5,6$ lập được bao nhiêu số tự nhiên chẵn có ba chữ số đôi một khác nhau?

**Đáp án tham khảo** (verified by SymPy/enumeration): $60$

### Lời giải của ứng dụng

*Nguồn:* `routine-digit-numbers` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn lần lượt từng chữ số, xét riêng chữ số có điều kiện (đầu khác 0, cuối theo tính chẵn lẻ) trước.
1. **Nhận dạng các điều kiện** — Các chữ số lấy từ tập $\{1,2,3,4,5,6\}$; số có $3$ chữ số nên chữ số đầu khác $0$; các chữ số đôi một khác nhau; điều kiện chẵn chỉ phụ thuộc chữ số cuối.
   *Lí do:* Phân tích đề
2. **Trường hợp chữ số cuối khác 0** — Chữ số cuối thuộc $\{2,4,6\}$: $3$ cách. Chữ số đầu khác $0$ và khác chữ số cuối: $5$ cách. Các chữ số ở giữa chọn trong các chữ số còn lại: $4$ cách.

   $$
   3\cdot 5\cdot 4=60
   $$
   *Lí do:* Quy tắc nhân; chữ số đầu khác 0
3. **Cộng hai trường hợp** — Hai trường hợp không trùng nhau (chữ số cuối khác nhau) và bao quát mọi số thỏa đề, nên cộng lại.

   $$
   60=60
   $$
   *Lí do:* Quy tắc cộng: các trường hợp rời nhau, đầy đủ
4. **Kết luận** — Vậy lập được $60$ số.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** Vậy lập được $60$ số.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Mô-đun chứng nhận: 3·5·4 = 60, nhưng văn mẫu thừa ('chữ số đầu khác 0', 'cộng hai trường hợp: 60 = 60') vì đề không có chữ số 0.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 18 — `comb9-f2`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Một lớp có $30$ học sinh. Chứng minh rằng có ít nhất $3$ học sinh có sinh nhật trong cùng một tháng.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: nếu mỗi tháng có nhiều nhất $2$ học sinh thì lớp có nhiều nhất $24<30$ học sinh — mâu thuẫn (nguyên lí Dirichlet).

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 2 s · *Chi phí:* $0.0005

**Hướng giải:** Sử dụng phương pháp phản chứng: giả sử mỗi tháng có tối đa 2 học sinh sinh nhật, tính tổng số học sinh tối đa và so sánh với số học sinh thực tế để tìm ra mâu thuẫn.
1. **Xác định các đối tượng** — Để chứng minh điều này, chúng ta sẽ sử dụng một phương pháp lập luận đơn giản: giả sử điều ngược lại xảy ra và xem điều gì sẽ xảy ra.
   *Lí do:* Xác định bài toán
2. **Giả sử điều ngược lại** — Giả sử rằng không có tháng nào có 3 học sinh sinh nhật trở lên. Điều này có nghĩa là mỗi tháng có tối đa 2 học sinh sinh nhật.
   *Lí do:* Phương pháp phản chứng
3. **Tính tổng số học sinh tối đa** — Nếu mỗi tháng có tối đa 2 học sinh, thì tổng số học sinh của lớp sẽ không vượt quá 12 tháng nhân với 2 học sinh/tháng.

   $$
   12 \times 2 = 24
   $$
   *Lí do:* Phép nhân
4. **Phát hiện mâu thuẫn** — Tuy nhiên, đề bài cho biết lớp có 30 học sinh. Số 30 lớn hơn 24, điều này mâu thuẫn với giả thiết ban đầu.

   $$
   30 > 24
   $$
   *Lí do:* So sánh
5. **Kết luận** — Vì giả sử mỗi tháng có tối đa 2 học sinh dẫn đến mâu thuẫn, nên giả thiết đó sai. Do đó, phải có ít nhất một tháng có nhiều hơn 2 học sinh, tức là có ít nhất 3 học sinh.
   *Lí do:* Kết luận phản chứng

**Kết luận của ứng dụng:** Kết luận: Trong lớp có ít nhất 3 học sinh có sinh nhật trong cùng một tháng.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chạy lại: 12 × 2 = 24 < 30 → mâu thuẫn. Đúng; bước 1 thừa.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 19 — `comb9-f3`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Một nhóm có $5$ bạn nam và $4$ bạn nữ. Có bao nhiêu cách chọn $3$ bạn sao cho có cả nam và nữ?

**Đáp án tham khảo** (verified by SymPy/enumeration): $70$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 34 s · *Chi phí:* $0.0093

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: C(9,3) - C(5,3) - C(4,3)

**Hướng giải:** Tính tổng số cách chọn 3 bạn từ 9 bạn, sau đó trừ đi số cách chọn toàn nam và số cách chọn toàn nữ để tìm số cách chọn có cả nam và nữ.
1. **Tính tổng số cách chọn 3 bạn** — Nhóm có tổng cộng $5 + 4 = 9$ bạn. Số cách chọn ra 3 bạn từ 9 bạn này (không phân biệt thứ tự) là tổ hợp chập 3 của 9.

   $$
   C_9^3 = \frac{9 \times 8 \times 7}{3 \times 2 \times 1} = 3 \times 4 \times 7 = 84 \text{ (cách)}
   $$
   *Lí do:* Định nghĩa tổ hợp
2. **Tính số cách chọn toàn nam hoặc toàn nữ** — Điều kiện 'có cả nam và nữ' nghĩa là không được chọn toàn bộ là nam và không được chọn toàn bộ là nữ. Ta sẽ tính số cách chọn vi phạm điều kiện này (gọi là trường hợp loại).

   $$
   \begin{cases} \text{Chọn 3 bạn nam: } C_5^3 = \frac{5 \times 4 \times 3}{3 \times 2 \times 1} = 10 \text{ (cách)} \\ \text{Chọn 3 bạn nữ: } C_4^3 = \frac{4 \times 3 \times 2}{3 \times 2 \times 1} = 4 \text{ (cách)} \end{cases}
   $$
   *Lí do:* Định nghĩa tổ hợp
3. **Tính số cách chọn có cả nam và nữ** — Số cách chọn thỏa mãn yêu cầu bài toán (có cả nam và nữ) bằng tổng số cách chọn trừ đi các cách chọn toàn nam và toàn nữ.

   $$
   84 - 10 - 4 = 70 \text{ (cách)}
   $$
   *Lí do:* Quy tắc đếm phần bù

**Kết luận của ứng dụng:** Có 74 cách chọn.

$$
74
$$

### Claude tự chấm

- Kết luận: **(chưa chấm)**
- Nhận xét: 

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 20 — `comb9-f4`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho $7$ điểm trên mặt phẳng, không có ba điểm nào thẳng hàng. Có bao nhiêu đoạn thẳng và bao nhiêu tam giác có các đỉnh là các điểm đã cho?

**Đáp án tham khảo** (verified by SymPy/enumeration): $21$ đoạn thẳng, $35$ tam giác

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 17 s · *Chi phí:* $0.0074

**Hướng giải:** Sử dụng công thức tổ hợp để tính số cách chọn 2 điểm từ 7 điểm (cho đoạn thẳng) và số cách chọn 3 điểm từ 7 điểm (cho tam giác), dựa trên điều kiện không có ba điểm nào thẳng hàng.
1. **Tính số đoạn thẳng** — Để tạo thành một đoạn thẳng, ta cần chọn ra 2 điểm bất kỳ từ 7 điểm đã cho. Vì không có ba điểm nào thẳng hàng, nên bất kỳ cặp điểm nào cũng tạo thành một đoạn thẳng duy nhất. Số đoạn thẳng là số tổ hợp chập 2 của 7.

   $$
   C_7^2 = \frac{7 \times 6}{2} = 21
   $$
   *Lí do:* Tổ hợp chập k của n (Counting combinations)
2. **Tính số tam giác** — Để tạo thành một tam giác, ta cần chọn ra 3 điểm bất kỳ từ 7 điểm đã cho. Vì không có ba điểm nào thẳng hàng, nên bất kỳ bộ ba điểm nào cũng tạo thành một tam giác duy nhất. Số tam giác là số tổ hợp chập 3 của 7.

   $$
   C_7^3 = \frac{7 \times 6 \times 5}{3 \times 2 \times 1} = 35
   $$
   *Lí do:* Tổ hợp chập k của n (Counting combinations)

**Kết luận của ứng dụng:** Số đoạn thẳng là 21.
Số tam giác là 35.

$$
21 \text{ đoạn thẳng}, 35 \text{ tam giác}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: C₇² = 21, C₇³ = 35.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 21 — `comb9-f5`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Có hai đống sỏi, mỗi đống $10$ viên. Hai bạn lần lượt chơi, mỗi lượt chọn một đống và bốc ít nhất một viên (bao nhiêu cũng được) từ đống đó. Ai bốc được viên sỏi cuối cùng thì thắng. Người đi trước hay người đi sau có chiến lược thắng?

**Đáp án tham khảo** (verified by SymPy/enumeration): Người đi sau thắng: luôn bốc ở đống kia đúng bằng số viên đối thủ vừa bốc, giữ hai đống bằng nhau.

### Lời giải của ứng dụng

**Không có lời giải.** Mô hình không viết được lời giải hợp lệ (dùng điều chưa chứng minh, sai cấu trúc) sau các lần thử.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Trò chơi hai đống sỏi: mô hình không viết được chứng nhận chiến lược hợp lệ (đáp án: người đi sau thắng bằng cách giữ hai đống bằng nhau).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 22 — `ptnk-2025-chuyen/5b`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho bảng ô vuông kích thước $2\times9$ và số nguyên dương $k\le18$. Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn $k$ ô của bảng và hỏi An: trong $k$ ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo. Xét $k=2$. Chứng minh rằng Bình có thể thắng sau không quá 16 lượt chơi.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

**Không có lời giải.** Chiến lược trò chơi chưa được chứng minh đầy đủ cho mọi nước đi của đối thủ nên không hiển thị.

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Câu MỚI (đề thi chưa dùng): mô hình dùng lí thuyết đồ thị rồi không hoàn thành chứng nhận.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
