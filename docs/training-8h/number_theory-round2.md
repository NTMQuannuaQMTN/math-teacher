# Số học — vòng 2

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `nt8-h1` | kiểm tra (mới) | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng — nhưng vẫn bị giữ lại 6/10 | 64 s | $0.0191 |
| 2 | `nt8-h2` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng (cần đọc) 6/10 | 62 s | $0.0152 |
| 3 | `nt8-h3` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 52 s | $0.0158 |
| 4 | `nt8-h4` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 55 s | $0.014 |
| 5 | `nt8-h5` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 47 s | $0.0125 |
| 6 | `nt8-h6` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 29 s | $0.0109 |
| 7 | `nt8-h7` | kiểm tra (mới) | deterministic-number-theory | đã kiểm chứng bằng máy | SAI — “đã kiểm chứng” (đã sửa) 0/10 | 0 s | $0 |
| 8 | `nt8-h8` | kiểm tra (mới) | default | máy không kiểm chứng được | đúng 8/10 | 115 s | $0.0262 |
| 9 | `nt8-h9` | kiểm tra (mới) | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 10 | `nt8-h10` | kiểm tra (mới) | routine-factorable-xy | đã kiểm chứng bằng máy | đúng 9/10 | 0 s | $0 |

## Câu 1 — `nt8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $2^x+3=y^2$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Không có cặp nào (với $x\ge2$: $y^2\equiv3\pmod4$ vô lí; $x=1$: $y^2=5$ không chính phương)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 64 s · *Chi phí:* $0.0191

**Hướng giải:** Ta sẽ xét hai trường hợp của $x$: $x = 1$ và $x \ge 2$. Với $x = 1$, ta thay trực tiếp vào phương trình. Với $x \ge 2$, ta sử dụng tính chất đồng dư mod 4 để chứng minh phương trình vô nghiệm.
1. **Thử $x = 1$** — Ta thử trường hợp nhỏ nhất là $x = 1$. Thay vào phương trình ta được $2^1 + 3 = y^2$, hay $5 = y^2$. Vì 5 không phải là số chính phương (không có số nguyên nào bình phương bằng 5), nên $x = 1$ không thỏa mãn.

   $$
   x = 1 \Rightarrow y^2 = 5 \quad (\text{vô nghiệm})
   $$
   *Lí do:* Thử giá trị
2. **Xét $x \ge 2$** — Giả sử $x \ge 2$. Khi đó $2^x$ chia hết cho 4 (vì $2^x = 4 \cdot 2^{x-2}$). Từ phương trình $y^2 = 2^x + 3$, ta thấy $y^2$ chia cho 4 sẽ dư 3.

   $$
   x \ge 2 \Rightarrow 2^x \vdots 4 \Rightarrow y^2 \equiv 3 \pmod 4
   $$
   *Lí do:* Tính chất đồng dư
3. **Phản chứng** — Ta biết rằng với mọi số nguyên $y$, $y^2$ chỉ có thể chia cho 4 dư 0 hoặc 1 (vì $y$ chẵn thì $y^2$ chia hết cho 4, $y$ lẻ thì $y^2$ chia cho 4 dư 1). Điều này mâu thuẫn với kết quả ở bước trên ($y^2$ dư 3). Vậy giả sử $x \ge 2$ là sai.

   $$
   y^2 \equiv 0, 1 \pmod 4 \quad (\text{mâu thuẫn với } y^2 \equiv 3 \pmod 4)
   $$
   *Lí do:* Tính chất số chính phương
4. **Kết luận** — Vì $x = 1$ không thỏa mãn và $x \ge 2$ cũng không thỏa mãn, nên phương trình đã cho không có nghiệm nguyên dương nào.

   $$
   \text{ Không có cặp }  (x; y)  \text{ nguyên dương nào thỏa mãn. }
   $$
   *Lí do:* Tổng hợp các trường hợp

**Kết luận của ứng dụng:** Không có cặp số nguyên dương nào thỏa mãn.

### Claude tự chấm

- Kết luận: **đúng — nhưng vẫn bị giữ lại** — 6/10
- Nhận xét: Đáp số đúng (vô nghiệm). Không hiển thị: mô hình viết chính phương trình đề bài “2^x + 3 = y^2” thành một phép kiểm tra “đẳng thức” nên tất nhiên sai. Chưa có quy tắc chung an toàn để phân biệt — ghi nhận là lỗi giữ lại nhầm.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 2 — `nt8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Chứng minh rằng với mọi số nguyên $n$, $n^2+n+1$ không chia hết cho $9$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: nếu $9\mid n^2+n+1$ thì $3\mid n^2+n+1$ nên $n\equiv1\pmod3$; đặt $n=3k+1$ thì $n^2+n+1=9k^2+9k+3$ chia $9$ dư $3$.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 62 s · *Chi phí:* $0.0152

**Hướng giải:** Xét tính chia hết cho 3 trước. Nếu biểu thức không chia hết cho 3 thì chắc chắn không chia hết cho 9. Nếu chia hết cho 3, ta xét trường hợp cụ thể để kiểm tra tính chia hết cho 9.
1. **Xét $n^2+n+1 \pmod{3}$** — Để chứng minh $n^2+n+1$ không chia hết cho 9, ta có thể xét tính chia hết cho 3 trước. Nếu biểu thức không chia hết cho 3 thì chắc chắn không chia hết cho 9.

   $$
   n^2+n+1 \pmod 3
   $$
   *Lí do:* Tính chất chia hết: Nếu $A \vdots 9 \Rightarrow A \vdots 3$. Do đó, nếu $A$ không chia hết cho 3 thì $A$ không chia hết cho 9.
2. **Xét các trường hợp của n** — Ta xét 3 trường hợp của $n$ khi chia cho 3: $n \equiv 0, 1, 2 \pmod 3$.

   $$
   n \equiv 0, 1, 2 \pmod 3
   $$
   *Lí do:* Mọi số nguyên khi chia cho 3 đều có số dư là 0, 1 hoặc 2.
3. **Trường hợp n chia hết cho 3** — Nếu $n \equiv 0 \pmod 3$, thì $n^2+n+1 \equiv 0^2+0+1 \equiv 1 \pmod 3$. Không chia hết cho 3.

   $$
   n^2+n+1 \equiv 1 \pmod 3
   $$
   *Lí do:* Thay $n=3k$ vào biểu thức.
4. **Trường hợp n chia cho 3 dư 1** — Nếu $n \equiv 1 \pmod 3$, thì $n^2+n+1 \equiv 1^2+1+1 \equiv 3 \equiv 0 \pmod 3$. Trường hợp này chia hết cho 3.

   $$
   n^2+n+1 \equiv 0 \pmod 3
   $$
   *Lí do:* Thay $n=3k+1$ vào biểu thức.
5. **Trường hợp n chia cho 3 dư 2** — Nếu $n \equiv 2 \pmod 3$, thì $n^2+n+1 \equiv 2^2+2+1 \equiv 4+2+1 \equiv 7 \equiv 1 \pmod 3$. Không chia hết cho 3.

   $$
   n^2+n+1 \equiv 1 \pmod 3
   $$
   *Lí do:* Thay $n=3k+2$ vào biểu thức.
6. **Biểu diễn n** — Chỉ có trường hợp $n \equiv 1 \pmod 3$ là $n^2+n+1$ chia hết cho 3. Ta cần kiểm tra xem trong trường hợp này, nó có chia hết cho 9 không.

   $$
   n = 3k+1
   $$
   *Lí do:* Từ $n \equiv 1 \pmod 3$, ta có $n = 3k+1$ với $k \in \mathbb{Z}$.
7. **Kiểm tra tính chia hết cho 9** — Thay $n=3k+1$ vào $n^2+n+1$: $(3k+1)^2 + (3k+1) + 1 = 9k^2+6k+1+3k+1+1 = 9k^2+9k+3 = 9(k^2+k)+3$. Biểu thức này chia cho 9 dư 3.

   $$
   n^2+n+1 = 9(k^2+k)+3
   $$
   *Lí do:* Khai triển và rút gọn.
8. **Kết luận** — Vì $9(k^2+k)+3$ luôn chia cho 9 dư 3 (với mọi $k \in \mathbb{Z}$), nên $n^2+n+1$ không bao giờ chia hết cho 9.

   $$
   n^2+n+1 \not\vdots 9
   $$
   *Lí do:* Số dư khác 0.

**Kết luận của ứng dụng:** Chứng minh hoàn tất.

### Claude tự chấm

- Kết luận: **đúng (cần đọc)** — 6/10
- Nhận xét: Kết luận “Chứng minh hoàn tất.” — kết luận quá ngắn; cần bạn đọc lập luận (mod 3 rồi mod 9).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Đúng kí hiệu chia hết

---

## Câu 3 — `nt8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số nguyên tố $p$ sao cho $p^2+2$ cũng là số nguyên tố.

**Đáp án tham khảo** (verified by SymPy/enumeration): $p=3$ (với $p\ne3$: $p^2\equiv1\pmod3$ nên $3\mid p^2+2>3$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 52 s · *Chi phí:* $0.0158

**Hướng giải:** Xét các số nguyên tố nhỏ (2, 3) để tìm nghiệm. Với các số nguyên tố lớn hơn 3, sử dụng tính chất chia hết cho 3 để chứng minh $p^2+2$ luôn là hợp số.
1. **Xét các số nguyên tố nhỏ** — Ta thử với các số nguyên tố nhỏ nhất để xem có trường hợp nào thỏa mãn không.
   *Lí do:* Thử giá trị cụ thể
2. **Xét trường hợp $p > 3$** — Bây giờ ta xét trường hợp $p$ là số nguyên tố lớn hơn 3.
   *Lí do:* Phân loại số nguyên tố
3. **Xét $p^2$ chia 3 dư mấy** — Ta xét số dư của $p^2$ khi chia cho 3.
   *Lí do:* Tính chất chia hết
4. **Xét $p^2+2$ chia 3** — Từ kết quả $p^2$ chia 3 dư 1, ta xét $p^2+2$.
   *Lí do:* Tính chất chia hết
5. **Kết luận trường hợp $p > 3$** — Ta kết luận về tính nguyên tố của $p^2+2$ khi $p > 3$.
   *Lí do:* Định nghĩa số nguyên tố
6. **Kết luận** — Tổng hợp lại các trường hợp đã xét.
   *Lí do:* Tổng hợp kết quả

**Kết luận của ứng dụng:** Số nguyên tố cần tìm là $p = 3$.

$$
p = 3
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: p = 3. Vòng 1 không có lời giải.

### Đánh giá của bạn

- Điểm (0–10): 7
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Phải xét trực tiếp chứ không phải nói Xét các số nguyên tố nhỏ

---

## Câu 4 — `nt8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số tự nhiên $n$ sao cho $n^2+4n+97$ là số chính phương.

**Đáp án tham khảo** (verified by SymPy/enumeration): $n\in\{12;44\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 55 s · *Chi phí:* $0.014

**Hướng giải:** Đặt biểu thức bằng $k^2$, biến đổi về dạng hiệu hai bình phương, phân tích 93 thành các cặp thừa số và giải hệ phương trình để tìm $n$.
1. **Đặt ẩn phụ và biến đổi** — Để $n^2 + 4n + 97$ là số chính phương, ta đặt nó bằng $k^2$ với $k$ là số tự nhiên. Sau đó, mình sẽ biến đổi biểu thức để áp dụng hằng đẳng thức.

   $$
   n^2 + 4n + 97 = k^2 \Leftrightarrow (n+2)^2 + 93 = k^2
   $$
   *Lí do:* Đẳng thức đại số
2. **Áp dụng hằng đẳng thức** — Chuyển vế để có hiệu hai bình phương, sau đó áp dụng hằng đẳng thức $A^2 - B^2 = (A-B)(A+B)$.

   $$
   k^2 - (n+2)^2 = 93 \Leftrightarrow (k - n - 2)(k + n + 2) = 93
   $$
   *Lí do:* Hằng đẳng thức hiệu hai bình phương
3. **Xét các trường hợp** — Vì $n$ là số tự nhiên nên $k+n+2 > k-n-2 > 0$. Hai thừa số này cùng chẵn lẻ (vì tổng của chúng là $2(k+2)$ chẵn). Ta xét các cặp ước dương của 93.

   $$
   93 = 1 \times 93 = 3 \times 31
   $$
   *Lí do:* Phân tích số nguyên dương thành các thừa số
4. **Tìm nghiệm thứ nhất** — Giải hệ phương trình trong từng trường hợp để tìm $n$.

   $$
   \begin{cases} k - n - 2 = 1 \\ k + n + 2 = 93 \end{cases} \Rightarrow n = 44
   $$
   *Lí do:* Giải hệ phương trình bậc nhất hai ẩn
5. **Tìm nghiệm thứ hai** — Giải hệ phương trình trong trường hợp còn lại.

   $$
   \begin{cases} k - n - 2 = 3 \\ k + n + 2 = 31 \end{cases} \Rightarrow n = 12
   $$
   *Lí do:* Giải hệ phương trình bậc nhất hai ẩn
6. **Kết luận** — Kiểm tra điều kiện $n \in \mathbb{N}$ và kết luận.

   $$
   n \in \{12; 44\}
   $$
   *Lí do:* Thỏa mãn điều kiện $n \in \mathbb{N}$

**Kết luận của ứng dụng:** Đáp số: $n \in \{12; 44\}$

$$
n \in \{12; 44\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: n ∈ {12; 44}. Vòng 1 SAI (0 và 3) — nay đúng nhờ gợi ý tính sẵn và kiểm tra (#17).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---

## Câu 5 — `nt8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên $(x;y)$ thỏa mãn $x^2+xy+y^2=3$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(1;1),(-1;-1),(1;-2),(-2;1),(-1;2),(2;-1)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 47 s · *Chi phí:* $0.0125

**Hướng giải:** Nhân hai vế với 4 để biến đổi phương trình thành dạng tổng các bình phương, sau đó sử dụng tính chất không âm của bình phương để chặn nghiệm của $y$, cuối cùng xét từng trường hợp của $y$ để tìm $x$.
1. **Biến đổi phương trình thành tổng bình phương** — Để dễ dàng biến đổi phương trình thành dạng tổng các bình phương, ta nhân cả hai vế với 4. Sau đó, ta tách $4y^2$ thành $y^2 + 3y^2$ để nhóm $4x^2 + 4xy + y^2$ thành $(2x + y)^2$.

   $$
   4x^2 + 4xy + 4y^2 = 12 \\ (2x + y)^2 + 3y^2 = 12
   $$
   *Lí do:* Biến đổi đại số
2. **Tìm chặn của $y$** — Vì $(2x + y)^2$ là bình phương của một số thực nên luôn không âm ($(2x + y)^2 \ge 0$). Do đó, $3y^2$ phải nhỏ hơn hoặc bằng 12. Từ đó ta tìm được các giá trị nguyên có thể có của $y$.

   $$
   3y^2 \le 12 \\ y^2 \le 4 \\ y \in \{-2; -1; 0; 1; 2\}
   $$
   *Lí do:* Chặn nghiệm
3. **Xét từng trường hợp của $y$ để tìm $x$** — Ta xét từng giá trị của $y$ đã tìm được ở bước 2. Với mỗi $y$, ta thay vào phương trình $(2x + y)^2 = 12 - 3y^2$ để tìm $x$. Nếu vế phải không âm và là số chính phương, ta giải tìm $x$.

   $$
   y = 0: (2x)^2 = 12 (\text{ vô nghiệm nguyên }) \\ y = \pm 1: (2x \pm 1)^2 = 9 \\ y = \pm 2: (2x \pm 2)^2 = 0
   $$
   *Lí do:* Xét trường hợp

**Kết luận của ứng dụng:** Tập nghiệm của phương trình là: $S = \{(1; 1); (-2; 1); (2; -1); (-1; -1); (-1; 2); (1; -2)\}$.

$$
S = \{(1; 1); (-2; 1); (2; -1); (-1; -1); (-1; 2); (1; -2)\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Đủ 6 cặp. Vòng 1 hết giờ.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Phải giải kĩ để ra đoạn 6 cặp nghiệm

---

## Câu 6 — `nt8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm chữ số tận cùng của $2^{2026}+3^{2026}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $3$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 29 s · *Chi phí:* $0.0109

**Hướng giải:** Tìm chữ số tận cùng của $2^{2026}$ và $3^{2026}$ riêng biệt bằng cách xét chu kỳ của chữ số tận cùng theo số mũ, sau đó cộng hai kết quả lại để tìm chữ số tận cùng của tổng.
1. **Tìm chữ số tận cùng của $2^{2026}$** — Ta xét chữ số tận cùng của $2^n$. Ta có: $2^1=2$, $2^2=4$, $2^3=8$, $2^4=16$ (tận cùng 6), $2^5=32$ (tận cùng 2). Chữ số tận cùng của $2^n$ lặp lại theo chu kỳ 4: 2, 4, 8, 6.

   $$
   2^{2026} \equiv 2^2 \equiv 6 \pmod{10}
   $$
   *Lí do:* Chu kỳ của chữ số tận cùng $2^n$ là 4.
2. **Xác định vị trí trong chu kỳ** — Ta có $2026 = 4 \times 506 + 2$. Vì chu kỳ là 4 và số dư là 2, nên chữ số tận cùng của $2^{2026}$ giống với chữ số tận cùng của $2^2$.

   $$
   2026 = 4 \times 506 + 2
   $$
   *Lí do:* Phép chia có dư.
3. **Tìm chữ số tận cùng của $3^{2026}$** — Ta xét chữ số tận cùng của $3^n$. Ta có: $3^1=3$, $3^2=9$, $3^3=27$ (tận cùng 7), $3^4=81$ (tận cùng 1), $3^5=243$ (tận cùng 3). Chữ số tận cùng của $3^n$ lặp lại theo chu kỳ 4: 3, 9, 7, 1.

   $$
   3^{2026} \equiv 3^2 \equiv 9 \pmod{10}
   $$
   *Lí do:* Chu kỳ của chữ số tận cùng $3^n$ là 4.
4. **Xác định chữ số tận cùng của $3^{2026}$** — Tương tự, $2026 = 4 \times 506 + 2$. Số dư là 2, nên chữ số tận cùng của $3^{2026}$ giống với chữ số tận cùng của $3^2$.

   $$
   3^2 = 9
   $$
   *Lí do:* Chu kỳ và số dư.
5. **Tính tổng hai chữ số tận cùng** — Chữ số tận cùng của tổng $2^{2026} + 3^{2026}$ là chữ số tận cùng của tổng các chữ số tận cùng của từng số hạng.

   $$
   6 + 9 = 15
   $$
   *Lí do:* Tính chất chữ số tận cùng của tổng.
6. **Sửa lỗi và tìm đáp số cuối cùng** — Chữ số tận cùng của 15 là 5. Tuy nhiên, đề bài yêu cầu tìm chữ số tận cùng của $2^{2026} + 3^{2026}$. Mình vừa tính được chữ số tận cùng của $2^{2026}$ là 6 và $3^{2026}$ là 9. Tổng $6+9=15$, chữ số tận cùng là 5. Chờ đã, mình cần kiểm tra lại kết quả từ máy tính. Máy tính báo đáp số là 3. Mình đã nhầm ở đâu? À, mình cần kiểm tra lại chu kỳ của $3^n$. $3^1=3, 3^2=9, 3^3=27, 3^4=81$. Đúng là chu kỳ 4. $2026/4$ dư 2. $3^2=9$. $2^2=4$? Không, $2^1=2, 2^2=4, 2^3=8, 2^4=16$. $2^{2026}$ dư 2 nên tận cùng là 4? Không, $2^1=2, 2^2=4, 2^3=8, 2^4=6, 2^5=2$. Chu kỳ là 2, 4, 8, 6. Số dư 2 tương ứng với số thứ 2 trong chu kỳ là 4. Vậy $2^{2026}$ tận cùng là 4. $3^{2026}$ tận cùng là 9. $4+9=13$. Tận cùng là 3. Mình đã nhầm chữ số tận cùng của $2^2$ trong bước 1. $2^2=4$, không phải 6. 6 là $2^4$. Số dư là 2, nên lấy số thứ 2 trong chu kỳ (2, 4, 8, 6) là 4.

   $$
   4 + 9 = 13 \Rightarrow 3
   $$
   *Lí do:* Sửa lỗi tính toán chữ số tận cùng của $2^{2026}$.

**Kết luận của ứng dụng:** Chữ số tận cùng của $2^{2026} + 3^{2026}$ là 3.

$$
3
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 3. Vòng 1 SAI (9) — nay đúng (#17).

### Đánh giá của bạn

- Điểm (0–10): 5
- Đúng về toán? (có / không / một phần): Không?
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Phải đảm bảo đúng từ đầu đến cuối chứ không phải sai lúc đầu xong sửa lại khúc cuối

---

## Câu 7 — `nt8-h7`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm số dư khi chia $3^{2025}+5^{2025}$ cho $8$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $0$

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Tính một chu kỳ đầy đủ, chia số mũ theo độ dài chu kỳ rồi đối chiếu số dư; không thay số lớn trực tiếp.
1. **Tính các số dư cho đến khi chu kỳ khép lại** — Nhân lần lượt với $3$ và lấy số dư khi chia cho $8$. Lần đầu trở lại $1$ sau $2$ bước, nên phép nhân tiếp tục lặp lại đúng dãy này.

   $$
   3^{1}\equiv3\pmod{8},\quad 3^{2}\equiv1\pmod{8}
   $$
   *Lí do:* Nếu hai số có cùng số dư thì nhân cùng một số vẫn cho cùng số dư
2. **Chia số mũ theo độ dài chu kỳ** — Ta có $2025=2\cdot1012+1$. Mỗi khối $2$ lũy thừa đóng góp số dư $1$.

   $$
   3^{2}\equiv1\pmod{8}
   $$
   *Lí do:* Phép chia có dư của số mũ và quy tắc nhân lũy thừa
3. **Rút lũy thừa về vị trí trong chu kỳ** — Do đó $3^{2025}=(3^{2})^{1012}\cdot3^{1}$ có cùng số dư với vị trí $1$ của chu kỳ.

   $$
   3^{2025}\equiv3\pmod{8}
   $$
   *Lí do:* Tính chất đồng dư khi nhân và nâng lũy thừa
4. **Kết luận bằng số dư chuẩn** — Số $3$ nằm từ $0$ đến $7$, nên đây là số dư duy nhất khi chia cho $8$.

   $$
   0\le3<8
   $$
   *Lí do:* Định nghĩa số dư trong phép chia có dư

**Kết luận của ứng dụng:** Vậy số dư cần tìm là $3$.

### Claude tự chấm

- Kết luận: **SAI — “đã kiểm chứng” (đã sửa)** — 0/10
- Nhận xét: Câu mới. Bộ xác định của tác tử kia đọc “3^2025 + 5^2025 cho 8” thành “3^2025 cho 8” và đưa 3 với nhãn đã kiểm chứng; đúng là 0. Sửa #18: biểu thức chính quy không nuốt “+5^…”, và lưới an toàn: mọi đáp số (kể cả bộ xác định) bị phép tính chính xác bác bỏ thì không hiển thị.

### Đánh giá của bạn

- Điểm (0–10): 0
- Đúng về toán? (có / không / một phần): Không
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Đoạn 3 từ 0 đến 7 là sao, và thiếu phần 5^2025

---

## Câu 8 — `nt8-h8`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số nguyên $n$ sao cho $n^2+2n+12$ là số chính phương.

**Đáp án tham khảo** (verified by SymPy/enumeration): $n\in\{-6;4\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 115 s · *Chi phí:* $0.0262

**Hướng giải:** Biến đổi biểu thức $n^2 + 2n + 12$ về dạng $(n+1)^2 + 11$. Đặt biểu thức bằng $k^2$ ($k \ge 0$), chuyển vế thành hiệu hai bình phương $k^2 - (n+1)^2 = 11$. Phân tích thành nhân tử $(k-n-1)(k+n+1) = 11$. Vì 11 là số nguyên tố, ta xét các cặp ước của 11 để tìm $n$.
1. **Biến đổi biểu thức** — Mình sẽ biến đổi biểu thức $n^2 + 2n + 12$ để dễ nhận diện dạng bình phương hơn. Ta thấy $n^2 + 2n$ là hai số hạng đầu của hằng đẳng thức $(n+1)^2 = n^2 + 2n + 1$. Do đó, ta có thể viết lại biểu thức ban đầu.

   $$
   n^2 + 2n + 12 = (n^2 + 2n + 1) + 11 = (n+1)^2 + 11
   $$
   *Lí do:* Hằng đẳng thức
2. **Thiết lập phương trình** — Theo đề bài, biểu thức này là một số chính phương. Gọi số chính phương đó là $k^2$ (với $k$ là số nguyên không âm, $k \ge 0$). Ta có phương trình: $(n+1)^2 + 11 = k^2$. Chuyển vế để đưa về dạng hiệu hai bình phương.

   $$
   k^2 - (n+1)^2 = 11
   $$
   *Lí do:* Định nghĩa số chính phương và biến đổi đại số
3. **Phân tích thành nhân tử** — Sử dụng hằng đẳng thức hiệu hai bình phương $A^2 - B^2 = (A-B)(A+B)$, ta phân tích vế trái: $k^2 - (n+1)^2 = (k - (n+1))(k + (n+1)) = (k - n - 1)(k + n + 1)$. Vậy ta có: $(k - n - 1)(k + n + 1) = 11$. Vì $k$ và $n$ là các số nguyên nên $k - n - 1$ và $k + n + 1$ cũng là các số nguyên. Tích của chúng bằng 11, một số nguyên tố. Do đó, các thừa số này phải là các ước của 11. Các ước nguyên của 11 là: $1, -1, 11, -11$. Ta xét các trường hợp có thể xảy ra.

   $$
   (k - n - 1)(k + n + 1) = 11
   $$
   *Lí do:* Hằng đẳng thức và tính chất ước
4. **Xét các trường hợp và kết luận** — Vì 11 là số nguyên tố, ta có 4 trường hợp cho cặp ước $(k - n - 1; k + n + 1)$:

**Trường hợp 1:**
$\begin{cases} k - n - 1 = 1 \ k + n + 1 = 11 \end{cases}$
Cộng vế theo vế: $2k = 12 \Rightarrow k = 6$. Thay $k=6$ vào phương trình thứ nhất: $6 - n - 1 = 1 \Rightarrow 5 - n = 1 \Rightarrow n = 4$. (Thỏa mãn $k \ge 0$)

**Trường hợp 2:**
$\begin{cases} k - n - 1 = 11 \ k + n + 1 = 1 \end{cases}$
Cộng vế theo vế: $2k = 12 \Rightarrow k = 6$. Thay $k=6$ vào phương trình thứ hai: $6 + n + 1 = 1 \Rightarrow 7 + n = 1 \Rightarrow n = -6$. (Thỏa mãn $k \ge 0$)

**Trường hợp 3:**
$\begin{cases} k - n - 1 = -1 \ k + n + 1 = -11 \end{cases}$
Cộng vế theo vế: $2k = -12 \Rightarrow k = -6$. (Loại vì $k \ge 0$)

**Trường hợp 4:**
$\begin{cases} k - n - 1 = -11 \ k + n + 1 = -1 \end{cases}$
Cộng vế theo vế: $2k = -12 \Rightarrow k = -6$. (Loại vì $k \ge 0$)

Vậy các giá trị nguyên của $n$ thỏa mãn là $n = 4$ và $n = -6$.

   $$
   n \in \{-6; 4\}
   $$
   *Lí do:* Xét các trường hợp ước và giải hệ phương trình

**Kết luận của ứng dụng:** Các số nguyên $n$ cần tìm là $n = -6$ và $n = 4$.

$$
n \in \{-6; 4\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Câu mới: n ∈ {−6; 4}.

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: Từ hệ phương trình kia suy ra n được, không cần gián tiếp k

---

## Câu 9 — `nt8-h9`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Chứng minh rằng với mọi số nguyên $n$, $n^3+5n$ chia hết cho $6$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: $n^3+5n=(n-1)n(n+1)+6n$, tích ba số nguyên liên tiếp chia hết cho $6$.

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh tính đầy đủ của các lớp số dư, rồi tính chính xác và kết luận.
1. **Chia miền vô hạn thành các lớp số dư đầy đủ** — Gọi $P(n)=n^3+5n$. Theo phép chia có dư, mọi số nguyên $n$ viết duy nhất thành $n=6q+r$ với $q$ nguyên và $0\le r<6$. Vì biểu thức là đa thức có hệ số nguyên, ta sẽ kiểm tra tất cả $6$ số dư, không giới hạn giá trị của $n$.

   $$
   n=6q+r,\quad q\in\mathbb Z,\quad r\in\{0,1,\ldots,5\}
   $$
   *Lí do:* Phép chia có dư đúng cả khi số bị chia âm
2. **Chứng minh vì sao chỉ số dư quyết định chia hết** — Vì $n-r=6q$, hiệu $n^{j}-r^{j}$ chia hết cho $6$: với $j\ge2$, dùng hằng đẳng thức hiệu hai lũy thừa; với $j=1$ là hiệu $n-r$, còn hạng tử hằng có hiệu bằng 0. Nhân từng hiệu với hệ số nguyên và cộng lại cho $P(n)-P(r)$ chia hết cho $6$. Do đó $P(n)$ và $P(r)$ có cùng số dư. Đây là lý do bảng hữu hạn bao quát mọi giá trị.

   $$
   n^{j}-r^{j}=(n-r)(n^{j-1}+n^{j-2}r+\cdots+r^{j-1}),\qquad P(n)\equiv P(r)\pmod{6}
   $$
   *Lí do:* Hằng đẳng thức hiệu lũy thừa; tính chất cộng và nhân của chia hết
3. **Tính số dư trong các trường hợp 0 đến 5** — Thay từng số dư $r$ vào $P(r)=r^3+5r$, tính các lũy thừa rồi chia cho $6$. Bảng ghi số dư không âm, nhỏ hơn $6$; số dư 0 là đúng điều kiện chia hết.

   $$
   \begin{array}{c|cccccc}r&0&1&2&3&4&5\\\hline P(r)\bmod 6&0&0&0&0&0&0\end{array}
   $$
   *Lí do:* Thay từng khả năng số dư; phép chia có dư chính xác
4. **Đối chiếu mọi trường hợp và kết luận hai chiều** — Mọi cột của bảng đều có số dư 0, nên không còn trường hợp nào phải loại. Vậy với mọi số nguyên $n$, $n^3+5n$ chia hết cho $6$.

   $$
   n^3+5n\vdots 6
   $$
   *Lí do:* Phân chia đầy đủ, không trùng các lớp số dư; điều kiện cần và đủ

**Kết luận của ứng dụng:** Vậy với mọi số nguyên $n$, $n^3+5n$ chia hết cho $6$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Câu mới, bộ xác định: n³ + 5n ⋮ 6 với mọi n.

### Đánh giá của bạn

- Điểm (0–10): 6
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Không
- Nhận xét: Việc chứng minh Pn = Pr đồng dư quá phức tạp

---

## Câu 10 — `nt8-h10`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $xy=2x+3y$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(4;8),(5;5),(6;4),(9;3)\}$

### Lời giải của ứng dụng

*Nguồn:* `routine-factorable-xy` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đưa phương trình về dạng tích hai số nguyên bằng một hằng số, rồi xét các cặp ước.
1. **Đưa về dạng tích** — Nhóm các hạng tử và thêm bớt hằng số để vế trái thành tích: cộng $6$ vào hai vế. Khai triển vế trái để kiểm tra lại.

   $$
   (x-3)(y-2)=6
   $$
   *Lí do:* Nhóm hạng tử, đặt nhân tử chung
2. **Xét các cặp ước** — $x-3$ và $y-2$ là hai số nguyên có tích bằng $6$, nên $x-3$ là một ước của $6$. Xét mọi ước (cả âm), tính $x,y$ và giữ nghiệm là số nguyên dương.

   $$
   \begin{array}{c|c|c}x-3&y-2&(x;y)\\\hline 1&6&(4;8)\\-1&-6&(2;-4)\ \text{(loại)}\\2&3&(5;5)\\-2&-3&(1;-1)\ \text{(loại)}\\3&2&(6;4)\\-3&-2&(0;0)\ \text{(loại)}\\6&1&(9;3)\\-6&-1&(-3;1)\ \text{(loại)}\end{array}
   $$
   *Lí do:* Ước của một số nguyên
3. **Kết luận** — Các trường hợp trên là tất cả các khả năng, nên không bỏ sót nghiệm. Vậy các cặp số nguyên dương $(x;y)$ thỏa mãn là: $(4;8);\ (5;5);\ (6;4);\ (9;3)$.
   *Lí do:* Đã xét hết các trường hợp

**Kết luận của ứng dụng:** Vậy các cặp số nguyên dương $(x;y)$ thỏa mãn là: $(4;8);\ (5;5);\ (6;4);\ (9;3)$.

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Câu mới, bộ giải routine: (x − 3)(y − 2) = 6 ⇒ (4;8), (5;5), (6;4), (9;3).

### Đánh giá của bạn

- Điểm (0–10): 9
- Đúng về toán? (có / không / một phần): Có
- Trình bày dễ hiểu cho lớp 9? (có / không): Có
- Nhận xét: 

---
