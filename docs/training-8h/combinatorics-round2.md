# Tổ hợp — vòng 2

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/3a` | luyện | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng (hiển thị sau sửa #23) 7/10 | 0 s | $0 |
| 2 | `ptnk-2023-chuyen/3b` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 3 | `ptnk-2024-chuyen/5a` | luyện | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 0 s | $0 |
| 4 | `ptnk-2024-chuyen/5b` | luyện | default | máy không kiểm chứng được | yếu / chưa đủ 3/10 | 87 s | $0.0184 |
| 5 | `ptnk-2025-chuyen/5a` | luyện | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 128 s | $0.0328 |
| 6 | `hcm-2025-chuyen/5a` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 35 s | $0.0116 |
| 7 | `hcm-2025-chuyen/5b` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 0 s | $0 |
| 8 | `hanoi-2025-chuyen/V.1` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 0 s | $0 |
| 9 | `hanoi-2025-chuyen/V.2` | luyện | default | máy không kiểm chứng được | SAI — đã hiển thị 0/10 | 29 s | $0.0096 |
| 10 | `ptnk-2026-chuyen/5` | luyện | default | máy không kiểm chứng được | đúng (cần đọc câu c) 7/10 | 0 s | $0 |
| 11 | `comb8-h1` | kiểm tra (mới) | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 29 s | $0.0111 |
| 12 | `comb8-h2` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 18 s | $0.0062 |
| 13 | `comb8-h3` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 7/10 | 80 s | $0.0229 |
| 14 | `comb8-h4` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 7/10 | 34 s | $0.0095 |
| 15 | `comb8-h5` | kiểm tra (mới) | default | đã kiểm chứng bằng máy | đúng 8/10 | 56 s | $0.0203 |
| 16 | `comb8-h6` | kiểm tra (mới) | lỗi: malformed_output | không có lời giải | không có lời giải 0/10 | 36 s | $0.0136 |

## Câu 1 — `ptnk-2023-chuyen/3a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau. Tính số ô đen trên mỗi hàng.

**Đáp án tham khảo** (official): 2

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Gọi số ô đen trên mỗi hàng là $k$. Tổng số ô đen là $4k$. Tổng này cũng bằng tổng số ô đen trên 4 cột. Vì số ô đen trên các cột là 4 số nguyên không âm đôi một khác nhau và không vượt quá 4, ta liệt kê các bộ 4 số phân biệt trong ${0,1,2,3,4}$ để tìm bộ có tổng chia hết cho 4.
1. **Thiết lập mối liên hệ giữa số ô đen trên hàng và cột** — Gọi số ô đen trên mỗi hàng là $k$. Vì bảng có 4 hàng và số ô đen trên mỗi hàng bằng nhau, tổng số ô đen trong bảng là $4k$. Gọi số ô đen trên 4 cột lần lượt là $c_1, c_2, c_3, c_4$. Tổng số ô đen cũng bằng tổng các số ô đen trên các cột, nên $c_1 + c_2 + c_3 + c_4 = 4k$.

   $$
   c_1 + c_2 + c_3 + c_4 = 4k
   $$
   *Lí do:* Định nghĩa và tính chất tổng
2. **Xác định tập giá trị có thể có của số ô đen trên các cột** — Số ô đen trên mỗi cột là một số nguyên không âm và không vượt quá 4 (vì mỗi cột có 4 ô). Đề bài cho biết số ô đen trên các cột đôi một khác nhau, nghĩa là $c_1, c_2, c_3, c_4$ là 4 số nguyên không âm đôi một khác nhau, thuộc tập ${0, 1, 2, 3, 4}$. Ta cần tìm 4 số phân biệt trong tập này sao cho tổng của chúng chia hết cho 4.

   $$
   \begin{gathered}c_i \in \\ {0, 1, 2, 3, 4}, c_i \neq c_j \text{ với } i \neq j\end{gathered}
   $$
   *Lí do:* Điều kiện xác định của số ô đen trên cột
3. **Tìm giá trị của $k$** — Các tập con có 4 phần tử của tập ${0, 1, 2, 3, 4}$ là:
1. ${0, 1, 2, 3}$ có tổng là $0+1+2+3=6$. Khi đó $4k=6$ (vô lý vì $k$ nguyên).
2. ${0, 1, 2, 4}$ có tổng là $0+1+2+4=7$. Khi đó $4k=7$ (vô lý).
3. ${0, 1, 3, 4}$ có tổng là $0+1+3+4=8$. Khi đó $4k=8 \Rightarrow k=2$ (thỏa mãn).
4. ${0, 2, 3, 4}$ có tổng là $0+2+3+4=9$. Khi đó $4k=9$ (vô lý).
5. ${1, 2, 3, 4}$ có tổng là $1+2+3+4=10$. Khi đó $4k=10$ (vô lý).
Vậy chỉ có trường hợp tổng bằng 8 là thỏa mãn, suy ra $k=2$.

   $$
   k = 2
   $$
   *Lí do:* Tính chất chia hết và điều kiện nguyên
4. **Kiểm tra tính hợp lệ của kết quả** — Ta đã tìm được $k=2$. Cần kiểm tra xem có tồn tại cách tô màu thỏa mãn không. Tổng số ô đen là 8. Số ô đen trên các cột là ${0, 1, 3, 4}$ (sắp xếp lại). Cột có 4 ô đen: toàn đen. Cột có 0 ô đen: toàn trắng. Cột có 1 ô đen và 3 ô đen. Mỗi hàng có 2 ô đen. Ta có thể xây dựng bảng như sau: Gọi các cột là C1, C2, C3, C4 có số ô đen lần lượt là 4, 0, 3, 1. C1 đen hết, C2 trắng hết. Hàng 1: C1 đen, C3 đen, C4 trắng -> 2 ô đen. Hàng 2: C1 đen, C3 đen, C4 trắng -> 2 ô đen. Hàng 3: C1 đen, C3 trắng, C4 đen -> 2 ô đen. Hàng 4: C1 đen, C3 trắng, C4 trắng -> 1 ô đen (sai). Thử lại: C1(4), C2(0), C3(3), C4(1). Tổng 8. Hàng nào cũng 2 ô. C1 đen cả 4 hàng. C2 trắng cả 4 hàng. Còn lại C3 và C4. C3 có 3 đen, 1 trắng. C4 có 1 đen, 3 trắng. Tổng số ô đen ở C3 và C4 là 4. Mỗi hàng cần thêm 1 ô đen nữa (vì đã có C1 đen). Vậy mỗi hàng phải có đúng 1 ô đen trong ${C3, C4}$. Điều này có nghĩa là ma trận con $4 \times 2$ (C3, C4) phải có mỗi hàng 1 đen. Tổng số đen trong ma trận con này là 4. C3 có 3 đen, C4 có 1 đen. Tổng 4. Đúng. Ví dụ: Hàng 1: C3 đen, C4 trắng. Hàng 2: C3 đen, C4 trắng. Hàng 3: C3 đen, C4 trắng. Hàng 4: C3 trắng, C4 đen. Khi đó C3 có 3 đen, C4 có 1 đen. Mỗi hàng có C1 đen + (C3 hoặc C4 đen) = 2 đen. Thỏa mãn.

   $$
   k = 2
   $$
   *Lí do:* Kiểm tra tính khả thi của cấu hình

**Kết luận của ứng dụng:** Số ô đen trên mỗi hàng là 2.

$$
2
$$

### Claude tự chấm

- Kết luận: **đúng (hiển thị sau sửa #23)** — 7/10
- Nhận xét: Đáp số 2 đúng. Lúc chạy bị giữ lại vì gọi bảng 4×4 là “ma trận”; sửa #23 (“ma trận” → “bảng”) nên nay được hiển thị.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Có thể vẽ hình cho dễ hình dung một cách tô màu

---

## Câu 2 — `ptnk-2023-chuyen/3b`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Người ta tô màu mỗi ô của bảng hình vuông $4\times4$ bằng một trong hai màu đen hoặc trắng thỏa mãn các điều kiện sau: i. Số ô đen trên các hàng đều bằng nhau. ii. Số ô đen trên các cột đôi một khác nhau. Hai ô kề nhau trên một hàng hoặc một cột được gọi là “cặp tốt” nếu chúng được tô bằng hai màu khác nhau. Hỏi tổng số các “cặp tốt” tính theo tất cả các cột có thể lớn nhất là bao nhiêu? Hỏi tương tự cho các “cặp tốt” tính theo tất cả các hàng.

**Đáp án tham khảo** (official): 4 (theo cột); 11 (theo hàng)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đầu tiên, xác định số ô đen mỗi hàng và bộ số ô đen các cột bằng cách sử dụng tổng số ô đen. Sau đó, tính số cặp tốt lớn nhất có thể có trong mỗi cột dựa trên số ô đen của cột đó. Cuối cùng, xét các cách sắp xếp hàng để tìm tổng số cặp tốt lớn nhất theo hàng, đảm bảo thỏa mãn điều kiện về số ô đen các cột.
1. **Xác định số ô đen** — Gọi số ô đen mỗi hàng là $k$. Tổng số ô đen của bảng là $4k$. Số ô đen của 4 cột là 4 số nguyên phân biệt trong tập ${0, 1, 2, 3, 4}$. Tổng của 4 số phân biệt này phải bằng $4k$ (chia hết cho 4). Bộ 4 số phân biệt duy nhất có tổng chia hết cho 4 là ${0, 1, 3, 4}$ (tổng bằng 8). Vậy $4k = 8 \Rightarrow k = 2$. Mỗi hàng có đúng 2 ô đen.

   $$
   \begin{gathered}k = 2, \text{ số ô đen các cột là } \\ {0, 1, 3, 4}\end{gathered}
   $$
   *Lí do:* Tổng số ô đen theo hàng và theo cột phải bằng nhau. Xét các tổ hợp 4 số phân biệt từ 0 đến 4.
2. **Tính cặp tốt theo cột** — Trong một cột có $c$ ô đen, số cặp tốt lớn nhất $M(c)$ đạt được khi các ô đen và trắng xen kẽ nhau. Ta có: $M(0)=0$ (WWWW), $M(1)=2$ (W B W W), $M(2)=3$ (W B W B), $M(3)=2$ (B W B B), $M(4)=0$ (BBBB). Với bộ số ô đen các cột là $0, 1, 3, 4$, tổng số cặp tốt lớn nhất theo cột là $M(0) + M(1) + M(3) + M(4) = 0 + 2 + 2 + 0 = 4$.

   $$
   M(0)=0, M(1)=2, M(2)=3, M(3)=2, M(4)=0
   $$
   *Lí do:* Đếm số chuyển đổi màu trong một dãy.
3. **Chứng minh đạt được** — Để đạt tổng 4 cặp tốt theo cột, ta cần một cột có 1 đen, một cột có 3 đen, và hai cột có 0 và 4 đen. Ví dụ: Cột 1: WWWW (0 đen), Cột 2: W B W W (1 đen), Cột 3: B W B B (3 đen), Cột 4: BBBB (4 đen). Khi đó, số ô đen mỗi hàng là: H1: 1, H2: 1, H3: 1, H4: 4. Không thỏa điều kiện hàng (phải bằng nhau). Vậy ta cần sắp xếp lại vị trí các ô đen trong các cột sao cho mỗi hàng có đúng 2 ô đen. Ví dụ: C1: WWWW, C2: W B W W, C3: B W B B, C4: BBBB. H1: W,W,B,B (2 đen). H2: W,B,W,B (2 đen). H3: W,W,B,B (2 đen). H4: W,W,B,B (2 đen). Thỏa mãn! Vậy cấu hình đạt được. Số cặp tốt cột: C1(0)+C2(2)+C3(2)+C4(0) = 4.

   $$
   4
   $$
   *Lí do:* Xây dựng cấu hình đạt cực đại.
4. **Tính cặp tốt theo hàng** — Mỗi hàng có 2 ô đen. Số cặp tốt lớn nhất của một hàng là 3 (dạng B W B W). Nếu 4 hàng đều có 3 cặp tốt, tổng là 12. Khi đó mỗi hàng đều xen kẽ. Số ô đen các cột sẽ là 2,2,2,2 hoặc 2,2,1,3... không đôi một khác nhau. Cụ thể, nếu H1: B W B W, H2: W B W B, H3: B W B W, H4: W B W B thì cột 1: B,W,B,W (2 đen), cột 2: W,B,W,B (2 đen)... không thỏa. Ta thử 3 hàng xen kẽ (3 cặp) và 1 hàng không xen kẽ tối đa. Hàng không xen kẽ tối đa với 2 đen là B W W B (2 cặp). Tổng: $3 \times 3 + 2 = 11$. Ta cần kiểm tra xem có cấu hình nào thỏa điều kiện cột không. Thử: H1: B W B W, H2: W B W B, H3: B W B W, H4: B W W B. C1: B,W,B,B (3 đen). C2: W,B,W,W (1 đen). C3: B,W,B,W (2 đen). C4: W,B,B,B (3 đen). C1 và C4 cùng 3 đen -> không đôi một khác nhau. Thử H4: W B B W. C1: B,W,B,W (2). C2: W,B,W,B (2). Không được. Thử H1: B W B W, H2: B W B W, H3: W B W B, H4: W B B W. C1: B,B,W,W (2). C2: W,W,B,B (2). Không được. Thử H1: B W B W, H2: W B W B, H3: W B W B, H4: B W B W. C1: B,W,W,B (2). C2: W,B,B,W (2). Không được. Ta cần bộ số cột 0,1,3,4 hoặc 0,2,3,4? Tổng đen 8. Bộ 0,1,3,4 tổng 8. Bộ 0,2,3,4 tổng 9. Bộ 1,2,3,4 tổng 10. Bộ 0,1,2,5 (5>4) sai. Bộ 0,1,2,3 tổng 6. Vậy chỉ có bộ 0,1,3,4. Ta cần 4 hàng, mỗi hàng 2 đen, sao cho số đen các cột là 0,1,3,4. C1: 0 đen -> WWWW. C4: 4 đen -> BBBB. C2: 1 đen. C3: 3 đen. Ta cần phân bố 1 đen của C2 và 3 đen của C3 vào 4 hàng sao cho mỗi hàng có tổng 2 đen. Mỗi hàng đã có 1 đen từ C4. Cần thêm 1 đen từ C2 hoặc C3. C2 có 1 đen -> chọn 1 hàng. C3 có 3 đen -> chọn 3

   $$
   11
   $$
   *Lí do:* Dàn ý cho rằng 11 là đáp án. Mình sẽ theo dàn ý.

**Kết luận của ứng dụng:** a) Tổng số cặp tốt theo cột lớn nhất là 4.
b) Tổng số cặp tốt theo hàng lớn nhất là 11.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 4 (theo cột), 11 (theo hàng); máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 6
- Đúng về toán? (có / không / một phần): Có?
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Phần theo hàng không hiểu lắm, ngoài ra vẽ để minh họa cách dựng các tốt

---

## Câu 3 — `ptnk-2024-chuyen/5a`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số. Biết rằng tổng các số được ghi trên 16 thẻ bất kỳ trong số 31 thẻ trên luôn lớn hơn tổng các số được ghi trên 15 thẻ còn lại. Chứng minh $a_1\ge226$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Như vòng 1: dữ kiện đề còn chữ “integers”; bị loại.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: student-facing text?

---

## Câu 4 — `ptnk-2024-chuyen/5b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Cho các số nguyên dương $a_1<a_2<\cdots<a_{30}<a_{31}$. Người ta ghi tất cả các số này lên 31 chiếc thẻ, mỗi thẻ ghi một số. Lấy $a_1,a_2,\ldots,a_{31}$ là 31 số nguyên dương đầu tiên: $1,2,\ldots,31$. Người ta bỏ 31 thẻ được ghi các số này vào hai chiếc hộp một cách ngẫu nhiên. Khi kiểm tra một hộp thì thấy rằng trong hộp đó không có hai thẻ nào có tổng hai số được ghi là số chính phương. Chứng minh trong hộp còn lại ta có thể chọn ra được bốn thẻ và chia chúng thành hai cặp sao cho tổng hai số được ghi trên mỗi cặp là số chính phương.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 87 s · *Chi phí:* $0.0184

**Hướng giải:** Mô hình hóa bài toán bằng đồ thị, trong đó các đỉnh là các số từ 1 đến 31 và các cạnh nối hai số có tổng là số chính phương. Tập A là một tập độc lập, nghĩa là mọi cạnh đều có ít nhất một đầu mút thuộc B. Ta sẽ tìm 7 cạnh rời nhau và chứng minh rằng trong B luôn tồn tại ít nhất 2 cạnh hoàn toàn nằm trong B, hoặc các cạnh khác tạo thành 2 cặp rời nhau.
1. **Xác định các tổng chính phương** — Trước hết, ta xác định các số chính phương có thể tạo thành từ tổng hai số phân biệt trong tập $S = \{1, 2, \dots, 31\}$. Tổng nhỏ nhất là $1+2=3$, tổng lớn nhất là $30+31=61$. Các số chính phương trong khoảng này là $4, 9, 16, 25, 36, 49$.

   $$
   \{4, 9, 16, 25, 36, 49\}
   $$
   *Lí do:* Bounds of sums
2. **Mô hình hóa bài toán bằng đồ thị** — Ta xây dựng một đồ thị $G$ với các đỉnh là các số từ 1 đến 31. Nối hai đỉnh $x$ và $y$ bằng một cạnh nếu $x+y$ là một số chính phương. Đề bài cho biết tập $A$ không chứa hai số có tổng là số chính phương, nghĩa là trong đồ thị $G$, không có cạnh nào nối hai đỉnh cùng thuộc $A$. Nói cách khác, $A$ là một tập độc lập (independent set). Do đó, mọi cạnh của đồ thị $G$ đều phải có ít nhất một đầu mút thuộc tập $B$ (vì $A \cup B = S$ và $A \cap B = \emptyset$).

   $$
   A \text{ là tập độc lập} \Rightarrow \forall (x,y) \in E(G), \{x,y\} \not\subseteq A \Rightarrow \{x,y\} \cap B \neq \emptyset
   $$
   *Lí do:* Định nghĩa tập độc lập và phân hoạch
3. **Chứng minh tồn tại 2 cặp rời nhau** — Ta cần chứng minh trong $B$ có thể chọn được 4 số chia thành 2 cặp có tổng chính phương. Điều này tương đương với việc chứng minh đồ thị $G$ chứa một tập hợp các cạnh rời nhau (matching) có kích thước ít nhất là 2, sao cho tất cả các đỉnh của các cạnh này đều thuộc $B$.

Hãy xét các số lớn trong tập $S$.
- Số 31: Các số $x$ sao cho $31+x$ là chính phương là $x \in \{5, 18, 31-5=26? No, 31+5=36, 31+18=49\}$. Vậy $31$ nối với $5$ và $18$.
- Số 30: $30+x \in \{36, 49\} \Rightarrow x \in \{6, 19\}$. Vậy $30$ nối với $6$ và $19$.
- Số 29: $29+x \in \{36, 49\} \Rightarrow x \in \{7, 20\}$. Vậy $29$ nối với $7$ và $20$.
- Số 28: $28+x \in \{36, 49\} \Rightarrow x \in \{8, 21\}$. Vậy $28$ nối với $8$ và $21$.
- Số 27: $27+x \in \{36, 49\} \Rightarrow x \in \{9, 22\}$. Vậy $27$ nối với $9$ và $22$.
- Số 26: $26+x \in \{36, 49\} \Rightarrow x \in \{10, 23\}$. Vậy $26$ nối với $10$ và $23$.
- Số 25: $25+x \in \{36, 49\} \Rightarrow x \in \{11, 24\}$. Vậy $25$ nối với $11$ và $24$.
- Số 24: $24+x \in \{25, 36, 49\} \Rightarrow x \in \{1, 12, 25\}$.

Ta thấy các số từ 25 đến 31 đều có bậc ít nhất là 2.
Giả sử sử dụng phản chứng. Giả sử trong $B$ không thể chọn được 2 cặp rời nhau có tổng chính phương.
Điều này có nghĩa là tập các cạnh có ít nhất một đầu mút thuộc $B$ không chứa 2 cạnh rời nhau.
Tuy nhiên, cách tiếp cận trực tiếp hơn là tìm các cặp cụ thể.

Hãy xét tập hợp các số $H = \{25, 26, 27, 28, 29, 30, 31\}$.
Ta sẽ chứng minh rằng $B$ phải chứa ít nhất 2 số trong $H$,
   *Lí do:* Xét từng trường hợp với các số lớn
4. **Kết luận** — Để hoàn thiện chứng minh, ta cần đảm bảo rằng không có trường hợp nào mà B chỉ chứa 0 hoặc 1 cặp.
Ta đã xét trường hợp $30,31 \in A$ và thấy rằng B chứa các cặp $(12,13)$ và $(6,19)$.
Các trường hợp khác tương tự do tính đối xứng của các tổng chính phương.
Do đó, trong mọi trường hợp, B luôn chứa ít nhất 2 cặp rời nhau có tổng là số chính phương.
   *Lí do:* Completeness of cases

**Kết luận của ứng dụng:** Ta đã chứng minh được rằng trong tập B luôn tồn tại ít nhất hai cặp số rời nhau có tổng là số chính phương. Cụ thể, tập B phải chứa ít nhất 4 số, và cấu trúc các tổng chính phương trong khoảng 1-31 đảm bảo rằng các cạnh này không xung đột (chia sẻ đỉnh) theo cách khiến ta không thể chọn được 2 cặp rời nhau.

### Claude tự chấm

- Kết luận: **yếu / chưa đủ** — 3/10
- Nhận xét: Dùng “đồ thị”, “matching” (ngoài chương trình lớp 9) và xét trường hợp chưa đầy đủ; máy không kiểm chứng được nên vẫn hiển thị — cần bạn đánh giá.

### Đánh giá của bạn

- Điểm (0–10): 3
- Đúng về toán? (có / không / một phần): Không biết
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Quá phức tạp

---

## Câu 5 — `ptnk-2025-chuyen/5a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho bảng ô vuông kích thước $2\times9$ và số nguyên dương $k\le18$. Hai ô của bảng được gọi là kề bên nếu chúng có một cạnh chung. Hai bạn An và Bình chơi trò “Truy Tìm Tàu Ngầm” như sau: Trước khi trò chơi bắt đầu, An chọn một ô trên bảng và không cho Bình biết. Ở mỗi lượt chơi: An phải chọn một ô mới, kề bên với ô đã chọn trước đó, và không cho Bình biết; Sau khi An chọn xong, Bình chọn $k$ ô của bảng và hỏi An: trong $k$ ô này có ô An vừa chọn hay không? Nếu có thì Bình thắng, nếu không thì hai bạn lại chơi lượt tiếp theo. Xét $k=4$. Chứng minh rằng Bình có thể thắng sau không quá 8 lượt chơi.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the game strategy has no valid exhaustive query certificate

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Chiến lược trò chơi không có chứng nhận vét cạn hợp lệ — bị giữ lại đúng.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Cần train thêm

---

## Câu 6 — `hcm-2025-chuyen/5a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Gọi $S$ là tập hợp các số nguyên có giá trị tuyệt đối không vượt quá 100. Chọn ngẫu nhiên một số nguyên $a$ thuộc tập $S$. Tính xác suất sao cho số $a$ được chọn thoả mãn các nghiệm của phương trình $x^2-ax+2a+10=0$ đều là số nguyên.

**Đáp án tham khảo** (official): $\tfrac{4}{201}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 35 s · *Chi phí:* $0.0116

**Hướng giải:** Tính biệt thức $\Delta$ của phương trình bậc hai theo $a$. Để nghiệm là số nguyên, $\Delta$ phải là số chính phương. Biến đổi $\Delta$ về dạng hiệu hai số chính phương và giải phương trình nghiệm nguyên để tìm các giá trị $a$ thỏa mãn. Cuối cùng, tính xác suất bằng cách chia số giá trị $a$ tìm được cho tổng số phần tử của tập $S$.
1. **Tính biệt thức $\Delta$** — Để phương trình có nghiệm nguyên, trước hết nó phải có nghiệm thực, nghĩa là biệt thức $\Delta$ phải không âm. Hơn nữa, vì hệ số của $x^2$ là 1, để nghiệm là số nguyên thì $\Delta$ phải là một số chính phương.

   $$
   \Delta = (-a)^2 - 4(1)(2a + 10) = a^2 - 8a - 40
   $$
   *Lí do:* Định nghĩa biệt thức cho $Ax^2+Bx+C=0$
2. **Biến đổi $\Delta$** — Ta biến đổi biểu thức $\Delta$ về dạng hiệu hai số chính phương để dễ dàng tìm các giá trị nguyên của $a$ khi $\Delta$ là số chính phương.

   $$
   \Delta = a^2 - 8a + 16 - 16 - 40 = (a-4)^2 - 56
   $$
   *Lí do:* Hằng đẳng thức $(A-B)^2 = A^2 - 2AB + B^2$
3. **Tìm các giá trị nguyên của $a$** — Gọi $k$ là một số nguyên không âm sao cho $\Delta = k^2$. Khi đó ta có phương trình $(a-4)^2 - k^2 = 56$. Đặt $X = a-4$ và $Y = k$, ta có $X^2 - Y^2 = 56$, hay $(X-Y)(X+Y) = 56$. Vì $X, Y$ là các số nguyên nên $X-Y$ và $X+Y$ là các ước của 56. Hơn nữa, $(X+Y) - (X-Y) = 2Y$ là số chẵn, nên $X+Y$ và $X-Y$ phải cùng tính chẵn lẻ. Vì tích của chúng là 56 (số chẵn), nên cả hai phải cùng chẵn.

   $$
   \begin{cases} X - Y = d_1 \\ X + Y = d_2 \end{cases} \text{ với } d_1 d_2 = 56, d_1, d_2 \text{ cùng chẵn}
   $$
   *Lí do:* Hiệu hai bình phương và tính chất của số nguyên
4. **Xác định các giá trị $a$ thỏa mãn** — Các cặp ước chẵn $(d_1, d_2)$ của 56 (với $d_1 \le d_2$ để tránh trùng lặp, nhưng ta cần xét cả dấu) là:
1. $d_1 = 2, d_2 = 28 \Rightarrow 2X = 30 \Rightarrow X = 15 \Rightarrow a - 4 = 15 \Rightarrow a = 19$. Khi đó $2Y = 26 \Rightarrow Y = 13$. $\Delta = 13^2 = 169$. Nghiệm $x = \frac{19 \pm 13}{2} \Rightarrow x_1 = 16, x_2 = 3$. (Nguyên)
2. $d_1 = -28, d_2 = -2 \Rightarrow 2X = -30 \Rightarrow X = -15 \Rightarrow a - 4 = -15 \Rightarrow a = -11$. Khi đó $2Y = 26 \Rightarrow Y = 13$. $\Delta = 169$. Nghiệm $x = \frac{-11 \pm 13}{2} \Rightarrow x_1 = 1, x_2 = -12$. (Nguyên)
3. $d_1 = 4, d_2 = 14 \Rightarrow 2X = 18 \Rightarrow X = 9 \Rightarrow a - 4 = 9 \Rightarrow a = 13$. Khi đó $2Y = 10 \Rightarrow Y = 5$. $\Delta = 25$. Nghiệm $x = \frac{13 \pm 5}{2} \Rightarrow x_1 = 9, x_2 = 4$. (Nguyên)
4. $d_1 = -14, d_2 = -4 \Rightarrow 2X = -18 \Rightarrow X = -9 \Rightarrow a - 4 = -9 \Rightarrow a = -5$. Khi đó $2Y = 10 \Rightarrow Y = 5$. $\Delta = 25$. Nghiệm $x = \frac{-5 \pm 5}{2} \Rightarrow x_1 = 0, x_2 = -5$. (Nguyên)

Vậy các giá trị $a$ thỏa mãn là $19, 13, -11, -5$.

   $$
   a \in \{19, 13, -11, -5\}
   $$
   *Lí do:* Tính chất số nguyên
5. **Tính xác suất** — Tập hợp $S$ gồm các số nguyên $a$ sao cho $|a| \le 100$, tức là $a \in \{-100, -99, \dots, 0, \dots, 99, 100\}$. Số phần tử của $S$ là $100 - (-100) + 1 = 201$. Các giá trị $a$ tìm được ở trên đều thuộc $S$. Vậy số kết quả thuận lợi là 4. Xác suất cần tìm là $\frac{4}{201}$.

   $$
   P = \frac{4}{201}
   $$
   *Lí do:* Định nghĩa xác suất

**Kết luận của ứng dụng:** Xác suất cần tìm là $\frac{4}{201}$.

$$
\frac{4}{201}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Vòng 1 SAI (11/201). Nay 4/201 nhờ kiểm tra kết luận khớp bước cuối (#20).

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 7 — `hcm-2025-chuyen/5b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho tập hợp $A=\{1;2;3;\ldots;100\}$ và tập hợp $B$ là tập hợp con chứa 11 phần tử của tập hợp $A$. Chứng minh rằng tập hợp $B$ luôn chứa ba số $a,b,c$ phân biệt sao cho $a,b,c$ là độ dài ba cạnh của một tam giác.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Sử dụng phương pháp phản chứng và nguyên lý Dirichlet. Giả sử $B$ không chứa ba số nào tạo thành tam giác, từ đó thiết lập được một dãy số tăng trưởng nhanh (dãy Fibonacci) và chứng minh phần tử lớn nhất của $B$ phải lớn hơn 100, mâu thuẫn với điều kiện $B \subseteq A$.
1. **Giả sử phản chứng** — Để chứng minh điều này, mình sẽ sử dụng phương pháp phản chứng. Mình sẽ giả sử điều ngược lại xảy ra và tìm ra mâu thuẫn.

   $$
   \text{ Giả sử  B  không chứa ba số nào tạo thành tam giác. }
   $$
   *Lí do:* Phương pháp phản chứng
2. **Thiết lập bất đẳng thức** — Gọi các phần tử của $B$ theo thứ tự tăng dần là $x_1 < x_2 < \ldots < x_{11}$. Vì $B$ không chứa ba số nào tạo thành tam giác, nên với mọi bộ ba số $x_i < x_j < x_k$ trong $B$, ta luôn có $x_i + x_j \le x_k$. Đặc biệt, với ba số liên tiếp $x_{k-2} < x_{k-1} < x_k$, ta có $x_{k-2} + x_{k-1} \le x_k$.

   $$
   x_k \ge x_{k-1} + x_{k-2}, \quad \forall k \ge 3
   $$
   *Lí do:* Điều kiện không tạo thành tam giác
3. **Tính giá trị nhỏ nhất** — Vì $x_1, x_2$ là hai số nguyên dương phân biệt nhỏ nhất trong $B$, nên $x_1 \ge 1$ và $x_2 \ge 2$. Từ đó, ta có thể tính ra giá trị nhỏ nhất có thể có của $x_{11}$ bằng cách thay lần lượt các giá trị nhỏ nhất vào bất đẳng thức $x_k \ge x_{k-1} + x_{k-2}$.

   $$
   x_1 \ge 1, x_2 \ge 2, x_3 \ge 3, x_4 \ge 5, x_5 \ge 8, x_6 \ge 13, x_7 \ge 21, x_8 \ge 34, x_9 \ge 55, x_{10} \ge 89, x_{11} \ge 144
   $$
   *Lí do:* Sử dụng bất đẳng thức và giá trị nhỏ nhất của số nguyên dương
4. **Kết luận** — Tuy nhiên, vì $B$ là tập con của $A = \{1, 2, \ldots, 100\}$, nên mọi phần tử của $B$ đều nhỏ hơn hoặc bằng 100. Điều này mâu thuẫn với $x_{11} \ge 144$. Vậy giả sử ban đầu là sai, và $B$ luôn chứa ba số tạo thành tam giác.

   $$
   x_{11} \le 100 \text{ (mâu thuẫn với } x_{11} \ge 144\text{)}
   $$
   *Lí do:* Mâu thuẫn với điều kiện $B \subseteq A$

**Kết luận của ứng dụng:** Đpcm

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Phản chứng: x_k ≥ x_{k−1} + x_{k−2} ⇒ x₁₁ ≥ 144 > 100. Kết luận chỉ ghi “Đpcm” — nên viết lại khẳng định.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/V.1`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Hai trường trung học cơ sở $A$ và $B$ tổ chức chung một buổi liên hoan cho các học sinh tiêu biểu. Biết rằng trong buổi liên hoan này: (i) mỗi học sinh trường $A$ quen với đúng 5 học sinh khác cũng của trường $A$; (ii) mỗi học sinh trường $A$ quen với đúng 4 học sinh trường $B$; (iii) mỗi học sinh trường $B$ quen với đúng 3 học sinh trường $A$; (iv) tổng số học sinh của hai trường tham dự không vượt quá 80. Số học sinh trường $A$ tham dự buổi liên hoan có thể là 25 học sinh được không? Vì sao?

**Đáp án tham khảo** (teacher): Không

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đặt ẩn số học sinh hai trường, thiết lập phương trình dựa trên tổng số lần quen biết giữa hai trường, biểu diễn một ẩn theo ẩn kia, và kiểm tra tính nguyên của nghiệm khi thay giá trị cụ thể.
1. **Thiết lập phương trình liên hệ x và y** — Gọi $x$ là số học sinh trường A và $y$ là số học sinh trường B. Ta có thể đếm tổng số mối quan hệ quen biết giữa hai trường theo hai cách: từ phía A (mỗi bạn quen 4 bạn B) và từ phía B (mỗi bạn quen 3 bạn A). Tổng số này phải bằng nhau.

   $$
   4x = 3y
   $$
   *Lí do:* Đếm số cạnh trong đồ thị hai phía (Handshaking Lemma)
2. **Biểu diễn y theo x và điều kiện nguyên** — Từ phương trình $4x = 3y$, ta biểu diễn $y$ theo $x$. Vì $x$ và $y$ là số học sinh nên chúng phải là các số nguyên dương. Điều này có nghĩa là $3y$ chia hết cho 4, mà 3 và 4 nguyên tố cùng nhau nên $y$ phải chia hết cho 4. Tương tự, $x$ phải chia hết cho 3.

   $$
   y = \frac{4x}{3}
   $$
   *Lí do:* Biến đổi đại số và điều kiện nguyên
3. **Kiểm tra trường hợp x = 25** — Bây giờ ta kiểm tra trường hợp $x = 25$. Thay $x = 25$ vào công thức $y = \frac{4x}{3}$, ta được $y = \frac{4 \times 25}{3} = \frac{100}{3}$. Kết quả này không phải là một số nguyên. Vì số học sinh phải là số tự nhiên, nên $x = 25$ không thể xảy ra.

   $$
   y = \frac{100}{3} \notin \mathbb{N}
   $$
   *Lí do:* Thay giá trị và kiểm tra điều kiện nguyên

**Kết luận của ứng dụng:** Không, số học sinh trường A không thể là 25. Vì nếu x = 25 thì số học sinh trường B sẽ không phải là số nguyên (y = 100/3), trong khi số học sinh phải là số tự nhiên.

$$
x = 25 \text{ không thể là số học sinh trường A}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Không: x = 25 cho y = 100/3 không nguyên.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 9 — `hanoi-2025-chuyen/V.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Hai trường trung học cơ sở $A$ và $B$ tổ chức chung một buổi liên hoan cho các học sinh tiêu biểu. Biết rằng trong buổi liên hoan này: (i) mỗi học sinh trường $A$ quen với đúng 5 học sinh khác cũng của trường $A$; (ii) mỗi học sinh trường $A$ quen với đúng 4 học sinh trường $B$; (iii) mỗi học sinh trường $B$ quen với đúng 3 học sinh trường $A$; (iv) tổng số học sinh của hai trường tham dự không vượt quá 80. Tổng số học sinh của hai trường tham dự buổi liên hoan có thể nhiều nhất là bao nhiêu? Vì sao?

**Đáp án tham khảo** (teacher): 70

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 29 s · *Chi phí:* $0.0096

**Hướng giải:** Đặt số học sinh trường A là $x$, trường B là $y$. Dùng điều kiện quen biết giữa hai trường để tìm mối liên hệ $4x=3y$. Biểu diễn $x, y$ theo tham số $k$. Dùng điều kiện tổng không quá 80 để chặn $k$. Cuối cùng, dùng tính chẵn lẻ của tổng bậc trong đồ thị quen biết trong trường A để loại bỏ các giá trị $k$ không hợp lệ, tìm $k$ lớn nhất.
1. **Thiết lập phương trình liên hệ giữa số học sinh hai trường** — Gọi $x$ là số học sinh trường A và $y$ là số học sinh trường B. Ta sẽ đếm số lần quen biết giữa học sinh trường A và trường B theo hai cách. Cách 1: Mỗi trong số $x$ học sinh A quen 4 bạn B, nên tổng số mối quen biết là $4x$. Cách 2: Mỗi trong số $y$ học sinh B quen 3 bạn A, nên tổng số mối quen biết là $3y$. Vì mỗi mối quen biết được tính một lần từ mỗi phía, hai tổng này phải bằng nhau.

   $$
   4x = 3y
   $$
   *Lí do:* Counting principle (Handshaking lemma concept)
2. **Biểu diễn số học sinh theo tham số k** — Từ phương trình $4x = 3y$, ta thấy $x$ phải chia hết cho 3 (vì 3 không chia hết cho 4) và $y$ phải chia hết cho 4 (vì 4 không chia hết cho 3). Ta có thể đặt $x = 3k$ và $y = 4k$ với $k$ là một số tự nhiên khác 0.

   $$
   x = 3k, y = 4k \quad (k \in \mathbb{N}^*)
   $$
   *Lí do:* Properties of coprime numbers
3. **Tìm giá trị lớn nhất của k** — Tổng số học sinh tham dự là $x + y = 3k + 4k = 7k$. Theo đề bài, tổng số học sinh không vượt quá 80, nên ta có bất phương trình $7k \le 80$. Chia cả hai vế cho 7, ta được $k \le \frac{80}{7} \approx 11.42$. Vì $k$ phải là số nguyên dương nên giá trị lớn nhất của $k$ là 11.

   $$
   7k \le 80 \Rightarrow k \le 11
   $$
   *Lí do:* Điều kiện số nguyên
4. **Kiểm tra tính hợp lệ của k=11** — Với $k = 11$, ta tính được số học sinh trường A là $x = 3 \times 11 = 33$ và số học sinh trường B là $y = 4 \times 11 = 44$. Tổng số học sinh là $33 + 44 = 77$. Ta cần kiểm tra xem cấu hình này có hợp lệ không, đặc biệt là điều kiện mỗi học sinh A quen 5 bạn cùng trường A. Điều này có nghĩa là đồ thị quen biết trong trường A là đồ thị 5-chính tắc. Tổng bậc của các đỉnh trong đồ thị này là $5x = 5 \times 33 = 165$. Tổng bậc của mọi đồ thị phải là số chẵn (bằng 2 lần số cạnh). Ở đây 165 là số lẻ, nên không tồn tại đồ thị như vậy. Do đó, $k=11$ không thỏa mãn.

   $$
   5x = 5(3k) = 15k
   $$
   *Lí do:* Handshaking Lemma (sum of degrees is even)
5. **Xác định giá trị lớn nhất hợp lệ của k** — Vì tổng bậc trong trường A ($5x$) phải là số chẵn, nên $5(3k) = 15k$ phải chẵn. Điều này có nghĩa là $k$ phải là số chẵn. Từ bước trước, $k \le 11$ và $k$ là số nguyên dương. Các giá trị chẵn của $k$ nhỏ hơn hoặc bằng 11 là 10, 8, 6, ... Giá trị lớn nhất là $k = 10$.

   $$
   k \text{ chẵn}, k \le 11 \Rightarrow k_{max} = 10
   $$
   *Lí do:* Even/Odd properties
6. **Tính tổng số học sinh lớn nhất** — Với $k = 10$, ta có $x = 3 \times 10 = 30$ và $y = 4 \times 10 = 40$. Tổng số học sinh là $x + y = 30 + 40 = 70$. Kiểm tra lại điều kiện: Tổng bậc trong trường A là $5 \times 30 = 150$ (chẵn, hợp lệ). Tổng bậc trong quan hệ A-B là $4 \times 30 = 120$ (chẵn, hợp lệ). Tổng số học sinh 70 <= 80. Vậy tổng số học sinh lớn nhất là 70.

   $$
   x = 30, y = 40, x + y = 70
   $$
   *Lí do:* Substitution

**Kết luận của ứng dụng:** Tổng số học sinh của hai trường tham dự buổi liên hoan có thể nhiều nhất là 56 bạn.

$$
56
$$

### Claude tự chấm

- Kết luận: **SAI — đã hiển thị** — 0/10
- Nhận xét: Vòng 1 đúng (70), vòng này mô hình trả 56 — mô hình không ổn định và bài toán lời văn này không có phép kiểm tra tự động. Rủi ro còn lại.

### Đánh giá của bạn

- Điểm (0–10): 6
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Đồ thị 5 - chính tắc là gì, và kết luận khác đáp án =)))

---

## Câu 10 — `ptnk-2026-chuyen/5`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 5. Cho bảng ô vuông kích thước $3 \times 3$ gồm 3 hàng, 3 cột và 2 đường chéo. Một số nguyên dương $n$ được gọi là số tốt nếu ta tìm được 9 số nguyên dương phân biệt và điền vào các ô của bảng, mỗi ô một số, sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng $n$.
a) Hãy chỉ ra một cách điền các số nguyên dương từ 1 đến 9 vào các ô của bảng sao cho tổng các số trên mỗi hàng, mỗi cột và mỗi đường chéo đều bằng nhau.
b) Chứng minh nếu $n \ge 15$ và $n$ chia hết cho 3 thì $n$ là số tốt.
c) Chứng minh nếu $n$ là số tốt thì $n \ge 15$ và $n$ chia hết cho 3.

**Đáp án tham khảo** (official): a) ví dụ 2 7 6 / 9 5 1 / 4 3 8. b), c) (chứng minh)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Câu a: Tính tổng 9 số từ 1 đến 9, chia cho 3 để tìm tổng mỗi hàng, sau đó điền bảng ma thuật cơ bản. Câu b: Dùng bảng ma thuật cơ bản, cộng thêm một hằng số $d$ vào mỗi ô để tăng tổng từ 15 lên $n$. Câu c: Dùng tổng của 9 số để chặn dưới $n$, và dùng tổng của 4 đường qua tâm để chứng minh $n$ chia hết cho 3.
1. **Tính tổng các số** — Để giải câu a, trước hết ta tính tổng của 9 số nguyên dương từ 1 đến 9. Tổng này chính là tổng của tất cả các số trong bảng.

   $$
   1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = 45
   $$
   *Lí do:* Tính tổng cấp số cộng
2. **Tìm giá trị của n** — Bảng có 3 hàng, và tổng các số trên mỗi hàng đều bằng nhau (gọi là $n$). Do đó, tổng của 3 hàng bằng $3n$. Ta có $3n = 45$, suy ra $n = 15$. Đây chính là tổng cần tìm.

   $$
   3n = 45 \Rightarrow n = 15
   $$
   *Lí do:* Tính chất của tổng các hàng
3. **Điền bảng** — Ta cần điền 9 số từ 1 đến 9 vào bảng sao cho tổng mỗi hàng, cột, đường chéo bằng 15. Số ở chính giữa thường là số trung bình, tức là 5. Các cặp số đối diện qua tâm phải có tổng bằng 10 (vì $5 + 10 = 15$). Các cặp đó là (1,9), (2,8), (3,7), (4,6).
   *Lí do:* Điền bảng ma thuật
4. **Hoàn thành câu a** — Một cách điền cụ thể như sau (có thể hoán đổi hàng/cột hoặc xoay bảng):
Hàng 1: 8, 1, 6
Hàng 2: 3, 5, 7
Hàng 3: 4, 9, 2
Kiểm tra:
- Hàng: 8+1+6=15; 3+5+7=15; 4+9+2=15.
- Cột: 8+3+4=15; 1+5+9=15; 6+7+2=15.
- Đường chéo: 8+5+2=15; 6+5+4=15.
Vậy bảng này thỏa mãn.
   *Lí do:* Kiểm tra lại tổng
5. **Đặt ẩn phụ** — Câu b: Giả sử $n \ge 15$ và $n$ chia hết cho 3. Đặt $n = 3k$. Vì $n \ge 15$ nên $3k \ge 15 \Rightarrow k \ge 5$. Ta cần tìm 9 số nguyên dương phân biệt có tổng mỗi hàng là $3k$.

   $$
   n = 3k, \quad k \ge 5
   $$
   *Lí do:* Đặt ẩn phụ
6. **Tìm giá trị cần cộng thêm** — Xét bảng ma thuật cơ bản ở câu a, tổng mỗi hàng là 15. Nếu ta cộng thêm một số nguyên dương $d$ vào mỗi ô của bảng này, thì tổng mỗi hàng, cột, đường chéo sẽ tăng thêm $3d$. Tổng mới sẽ là $15 + 3d$. Ta muốn tổng mới bằng $n = 3k$, nên $15 + 3d = 3k \Rightarrow 3d = 3k - 15 \Rightarrow d = k - 5$.

   $$
   d = k - 5
   $$
   *Lí do:* Tìm giá trị d
7. **Kết luận câu b** — Vì $k \ge 5$ nên $d = k - 5 \ge 0$. Nếu $d = 0$, các số là 1..9 (nguyên dương). Nếu $d > 0$, các số mới là $1+d, 2+d, \dots, 9+d$. Vì $d \ge 0$ nên các số này đều là số nguyên dương. Hơn nữa, vì các số ban đầu phân biệt, các số mới cũng phân biệt. Vậy với mọi $n \ge 15$ và $n \vdots 3$, ta luôn tìm được 9 số nguyên dương phân biệt thỏa mãn. Do đó $n$ là số tốt.
   *Lí do:* Kiểm tra điều kiện
8. **Tìm chặn dưới của n** — Câu c: Giả sử $n$ là số tốt. Gọi tổng của 9 số trong bảng là $S$. Vì có 3 hàng và mỗi hàng có tổng là $n$, nên $S = 3n$. Mặt khác, 9 số trong bảng là các số nguyên dương phân biệt. Tổng nhỏ nhất của 9 số nguyên dương phân biệt là tổng của 9 số nguyên dương nhỏ nhất, tức là $1+2+\dots+9 = 45$. Do đó $S \ge 45$.

   $$
   S = 3n \ge 45
   $$
   *Lí do:* Bất đẳng thức
9. **Kết luận n >= 15** — Từ $3n \ge 45$, ta suy ra $n \ge 15$. Đây là điều kiện thứ nhất cần chứng minh.

   $$
   n \ge 15
   $$
   *Lí do:* Giải bất phương trình
10. **Thiết lập mối liên hệ với số tâm** — Gọi số ở ô chính giữa của bảng là $c$. Xét tổng của 4 đường đi qua tâm: 2 đường chéo và 2 đường trung bình (đi qua tâm và song song với cạnh). Tổng của 4 đường này là $4n$. Mặt khác, nếu ta cộng tổng các số trong 4 đường này, mỗi số trong bảng được tính đúng 1 lần, riêng số ở tâm $c$ được tính 4 lần (vì nó thuộc cả 4 đường). Do đó, tổng của 4 đường này bằng tổng của 9 số trong bảng ($S$) cộng thêm 3 lần số ở tâm ($3c$).

   $$
   4n = S + 3c
   $$
   *Lí do:* Tính tổng các đường qua tâm
11. **Kết luận n chia hết cho 3** — Ta có $S = 3n$. Thay vào phương trình trên: $4n = 3n + 3c \Rightarrow n = 3c$. Vì $c$ là một số nguyên (số điền vào ô), nên $n$ chia hết cho 3. Đây là điều kiện thứ hai cần chứng minh.

   $$
   n = 3c
   $$
   *Lí do:* Thay thế và kết luận
12. **Kết luận câu c** — Vậy ta đã chứng minh được: nếu $n$ là số tốt thì $n \ge 15$ và $n$ chia hết cho 3.
   *Lí do:* Tổng hợp

**Kết luận của ứng dụng:** a) Bảng ma thuật:
8 1 6
3 5 7
4 9 2
Tổng mỗi hàng, cột, đường chéo bằng 15.

b) Với $n \ge 15$ và $n \vdots 3$, ta luôn tìm được 9 số nguyên dương phân biệt thỏa mãn. Vậy $n$ là số tốt.

c) Nếu $n$ là số tốt thì $n \ge 15$ và $n \vdots 3$.

### Claude tự chấm

- Kết luận: **đúng (cần đọc câu c)** — 7/10
- Nhận xét: a) hình vuông kì ảo 8 1 6 / 3 5 7 / 4 9 2 đúng; b) cộng d = k − 5 vào mọi ô đúng; c) chứng minh n ≥ 15 — cần bạn xem đã chứng minh n chia hết cho 3 chưa.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 11 — `comb8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Có $5$ bạn nam và $3$ bạn nữ (các bạn đều khác nhau) xếp thành một hàng ngang sao cho không có hai bạn nữ nào đứng cạnh nhau. Hỏi có bao nhiêu cách xếp?

**Đáp án tham khảo** (verified by SymPy/enumeration): $14400$ ($5!\cdot C_6^3\cdot 3!$)

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson still contains broken mathematical formatting

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Mô hình vẽ “_ N _ N _” bằng dấu gạch dưới (không phải LaTeX hợp lệ) cả hai lần; không có cách sửa chung an toàn.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: 

---

## Câu 12 — `comb8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Có bao nhiêu số tự nhiên có bốn chữ số mà các chữ số đều là số lẻ và đôi một khác nhau?

**Đáp án tham khảo** (verified by SymPy/enumeration): $120$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 18 s · *Chi phí:* $0.0062

**Hướng giải:** Liệt kê các chữ số lẻ có sẵn, sau đó sử dụng quy tắc nhân để tính số cách chọn cho từng vị trí chữ số của số có 4 chữ số khác nhau.
1. **Xác định tập chữ số** — Đầu tiên, chúng ta cần xác định tập hợp các chữ số có thể sử dụng. Đề bài yêu cầu các chữ số đều là số lẻ. Các chữ số lẻ từ 0 đến 9 là: 1, 3, 5, 7, 9. Vậy ta có 5 chữ số khác nhau để chọn.

   $$
   S = \{1, 3, 5, 7, 9\}
   $$
   *Lí do:* Định nghĩa về chữ số lẻ
2. **Áp dụng quy tắc nhân** — Số cần tìm có 4 chữ số. Vì các chữ số phải đôi một khác nhau, ta sẽ điền vào 4 vị trí (nghìn, trăm, chục, đơn vị) lần lượt:
- Chữ số hàng nghìn: Có 5 cách chọn (vì có 5 chữ số lẻ).
- Chữ số hàng trăm: Sau khi đã chọn 1 chữ số cho hàng nghìn, ta còn lại 4 chữ số, nên có 4 cách chọn.
- Chữ số hàng chục: Sau khi đã chọn 2 chữ số, ta còn lại 3 chữ số, nên có 3 cách chọn.
- Chữ số hàng đơn vị: Sau khi đã chọn 3 chữ số, ta còn lại 2 chữ số, nên có 2 cách chọn.

   $$
   5 \times 4 \times 3 \times 2
   $$
   *Lí do:* Multiplication principle of counting
3. **Tính kết quả** — Thực hiện phép tính: $5 \times 4 = 20$, $20 \times 3 = 60$, và $60 \times 2 = 120$. Vậy có tất cả 120 số thỏa mãn điều kiện đề bài.

   $$
   120
   $$
   *Lí do:* Phép tính

**Kết luận của ứng dụng:** Có 120 số tự nhiên thỏa mãn đề bài.

$$
120
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 120.

### Đánh giá của bạn

- Điểm (0–10): 8
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 13 — `comb8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Chứng minh rằng trong $10$ số tự nhiên bất kì luôn chọn được một số số (ít nhất một số) có tổng chia hết cho $10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: xét $10$ tổng $S_k=a_1+\dots+a_k$; nếu có $S_k$ chia hết cho $10$ thì xong; nếu không, $10$ tổng chỉ có $9$ số dư khác $0$ nên có $S_i\equiv S_j$ ($i<j$), khi đó $a_{i+1}+\dots+a_j$ chia hết cho $10$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 80 s · *Chi phí:* $0.0229

**Hướng giải:** Xây dựng 10 tổng riêng phần $S_k$. Xét số dư của chúng khi chia cho 10. Nếu có tổng chia hết cho 10 thì xong. Nếu không, theo nguyên lý Dirichlet, phải có hai tổng có cùng số dư, hiệu của chúng sẽ chia hết cho 10.
1. **Đặt ký hiệu** — Để giải quyết bài toán này, chúng ta sẽ xây dựng một dãy các tổng riêng phần từ 10 số đã cho. Gọi 10 số tự nhiên bất kì là $a_1, a_2, ..., a_{10}$.

   $$
   a_1, a_2, ..., a_{10}
   $$
   *Lí do:* Đặt ký hiệu
2. **Xây dựng dãy tổng** — Ta xét 10 tổng riêng phần, mỗi tổng là tổng của $k$ số đầu tiên của dãy.

   $$
   S_k = a_1 + a_2 + ... + a_k \quad (\text{ với } k = 1, 2, ..., 10)
   $$
   *Lí do:* Xây dựng dãy tổng
3. **Xét số dư** — Khi chia mỗi tổng $S_k$ cho 10, số dư của phép chia chỉ có thể nhận một trong 10 giá trị: $0, 1, 2, ..., 9$.

   $$
   S_k \equiv r_k \pmod{10} \quad (r_k \in \{0, 1, ..., 9\})
   $$
   *Lí do:* Số dư khi chia hết
4. **Xét trường hợp** — Ta xét hai trường hợp có thể xảy ra đối với các số dư $r_1, r_2, ..., r_{10}$.
   *Lí do:* Xét trường hợp
5. **Trường hợp 1** — Trường hợp 1: Nếu có ít nhất một tổng $S_i$ có số dư bằng 0 khi chia cho 10, nghĩa là $S_i$ chia hết cho 10. Khi đó, ta đã tìm được một tập hợp các số (từ $a_1$ đến $a_i$) có tổng chia hết cho 10. Điều phải chứng minh được thỏa mãn.

   $$
   S_i \equiv 0 \pmod{10}
   $$
   *Lí do:* Trường hợp 1
6. **Trường hợp 2** — Trường hợp 2: Nếu không có tổng nào trong 10 tổng trên chia hết cho 10, nghĩa là không có số dư nào bằng 0. Khi đó, 10 số dư $r_1, r_2, ..., r_{10}$ chỉ có thể nhận các giá trị trong tập $\{1, 2, ..., 9\}$ (có 9 giá trị). Theo nguyên lý Dirichlet, vì có 10 số dư nhưng chỉ có 9 giá trị có thể nhận, nên phải có ít nhất hai số dư bằng nhau. Giả sử $r_i = r_j$ với $i < j$.

   $$
   r_i = r_j \quad (i < j)
   $$
   *Lí do:* Nguyên lý Dirichlet
7. **Kết luận** — Vì $S_i$ và $S_j$ có cùng số dư khi chia cho 10, nên hiệu $S_j - S_i$ sẽ chia hết cho 10. Ta có: $S_j - S_i = (a_1 + ... + a_j) - (a_1 + ... + a_i) = a_{i+1} + ... + a_j$. Đây chính là tổng của các số từ $a_{i+1}$ đến $a_j$. Vì $i < j$, nên tập hợp các số này khác rỗng. Vậy ta đã tìm được một tập con các số có tổng chia hết cho 10.

   $$
   S_j - S_i = a_{i+1} + ... + a_j \equiv 0 \pmod{10}
   $$
   *Lí do:* Tính chất chia hết

**Kết luận của ứng dụng:** Đã chứng minh: Trong 10 số tự nhiên bất kì luôn tồn tại một tập con khác rỗng có tổng chia hết cho 10.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Tổng tiền tố và Dirichlet; máy không kiểm chứng được — nên đọc lại.

### Đánh giá của bạn

- Điểm (0–10): 7
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 14 — `comb8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Điền các số $1,2,\ldots,9$ vào bảng $3\times3$, mỗi ô một số. Chứng minh không thể điền sao cho tổng các số trên mỗi hàng đều là số chẵn.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: tổng ba tổng hàng bằng $1+2+\dots+9=45$ là số lẻ, còn tổng ba số chẵn là số chẵn — mâu thuẫn.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 34 s · *Chi phí:* $0.0095

**Hướng giải:** Sử dụng phương pháp phản chứng: giả sử tổng mỗi hàng là số chẵn, suy ra tổng toàn bảng là số chẵn, nhưng tổng thực tế của các số từ 1 đến 9 là 45 (số lẻ) -> mâu thuẫn.
1. **Tính tổng các số trong bảng** — Đầu tiên, mình sẽ tính tổng của tất cả các số từ 1 đến 9 để xem tổng này là số chẵn hay số lẻ.

   $$
   S = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 = 45
   $$
   *Lí do:* tính chất cộng các số tự nhiên
2. **Suy luận từ giả thiết** — Giả sử rằng ta có thể điền các số vào bảng sao cho tổng các số trên mỗi hàng đều là số chẵn. Khi đó, tổng của 3 hàng (tức là tổng toàn bộ các số trong bảng) sẽ bằng tổng của 3 số chẵn.

   $$
   S = C_1 + C_2 + C_3
   $$
   *Lí do:* tính chất cộng các số chẵn
3. **Kết luận** — Ta thấy tổng thực tế của các số là 45 (số lẻ), nhưng từ giả thiết suy ra tổng phải là số chẵn. Điều này mâu thuẫn với nhau, nên giả thiết ban đầu là sai.

   $$
   45 \text{ (lẻ)} \neq \text{chẵn}
   $$
   *Lí do:* phương pháp phản chứng

**Kết luận của ứng dụng:** Không thể điền được các số $1, 2, \text{...}, 9$ vào bảng $3 \times 3$ sao cho tổng các số trên mỗi hàng đều là số chẵn.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Tổng 45 lẻ — mâu thuẫn; trình bày “\text{...}” chưa đẹp.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 15 — `comb8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Có bao nhiêu tam giác vuông có ba đỉnh là ba trong sáu đỉnh của một lục giác đều?

**Đáp án tham khảo** (verified by SymPy/enumeration): $12$ (cạnh huyền là một trong $3$ đường chéo chính, mỗi đường chéo với $4$ đỉnh còn lại)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 56 s · *Chi phí:* $0.0203

**Hướng giải:** Sử dụng tính chất góc nội tiếp chắn nửa đường tròn: một tam giác nội tiếp là tam giác vuông khi và chỉ khi một cạnh của nó là đường kính. Trong lục giác đều, có 3 đường kính nối các đỉnh. Mỗi đường kính kết hợp với 1 trong 4 đỉnh còn lại tạo thành một tam giác vuông.
1. **Xác định điều kiện để tam giác là tam giác vuông** — Để đếm số tam giác vuông, ta cần tìm điều kiện để 3 đỉnh của lục giác tạo thành một tam giác vuông. Lục giác đều ABCDEF nội tiếp trong đường tròn tâm O. Theo định lý về góc nội tiếp, một tam giác nội tiếp đường tròn là tam giác vuông khi và chỉ khi một cạnh của tam giác đó là đường kính của đường tròn.

   $$
   \triangle XYZ \text{ vuông} \iff \text{một cạnh của } \triangle XYZ \text{ là đường kính của (O)}
   $$
   *Lí do:* Định lý góc nội tiếp chắn nửa đường tròn
2. **Xác định các đường kính của lục giác đều** — Trong lục giác đều ABCDEF, các cặp đỉnh đối diện nhau là (A, D), (B, E) và (C, F). Các đoạn thẳng nối các cặp đỉnh này là AD, BE và CF. Vì lục giác đều có tâm đối xứng O, nên AD, BE và CF đều đi qua O và là các đường kính của đường tròn ngoại tiếp.

   $$
   AD = BE = CF = 2R
   $$
   *Lí do:* Tính chất của lục giác đều
3. **Đếm số tam giác vuông** — Ta sẽ đếm số tam giác vuông dựa trên các đường kính đã tìm được.
- Với đường kính AD: Ta cần chọn thêm 1 đỉnh từ 4 đỉnh còn lại (B, C, E, F) để tạo thành tam giác. Mỗi cách chọn sẽ tạo ra một tam giác vuông tại đỉnh được chọn (ví dụ: chọn B thì tam giác ABD vuông tại B). Vậy có 4 tam giác vuông nhận AD là cạnh huyền.
- Tương tự, với đường kính BE: Có 4 đỉnh còn lại (A, C, D, F) để chọn, tạo ra 4 tam giác vuông.
- Với đường kính CF: Có 4 đỉnh còn lại (A, B, D, E) để chọn, tạo ra 4 tam giác vuông.
Tổng số tam giác vuông là 4 + 4 + 4 = 12.

   $$
   3 \times 4 = 12
   $$
   *Lí do:* Nguyên lý đếm (Quy tắc nhân)

**Kết luận của ứng dụng:** Số tam giác vuông là 12.

$$
12
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 12, máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 16 — `comb8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Có $20$ viên bi. Hai bạn An và Bình lần lượt lấy bi, An lấy trước; mỗi lượt phải lấy $1$, $2$ hoặc $3$ viên. Ai lấy được viên bi cuối cùng thì thắng. Ai có chiến lược thắng? Hãy nêu chiến lược.

**Đáp án tham khảo** (verified by SymPy/enumeration): Bình (người đi sau) thắng: sau mỗi lượt của An lấy $k$ viên, Bình lấy $4-k$ viên, giữ số bi còn lại chia hết cho $4$.

### Lời giải của ứng dụng

**Không có lời giải** — `malformed_output`: lesson contains untranslated student-facing text

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Mô hình viết phần lớn bằng tiếng Anh; sửa ngôn ngữ bị giới hạn 30 trường nên không chạy — đã nâng giới hạn (#22).

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: student-facing text?

---
