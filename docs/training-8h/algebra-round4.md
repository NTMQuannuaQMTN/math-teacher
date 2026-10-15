# Đại số — vòng 4

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/1` | luyện (chạy lại) | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | không hiển thị 2/10 | 158 s | $0.0416 |
| 2 | `ptnk-2023-chuyen/2a` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 71 s | $0.0161 |
| 3 | `ptnk-2024-chuyen/1.1` | luyện | default | đã kiểm chứng bằng máy | đúng 7/10 | 52 s | $0.0142 |
| 4 | `ptnk-2024-chuyen/2` | luyện | default | kiểm chứng một phần | đúng 9/10 | 67 s | $0.0182 |
| 5 | `hcm-2025-chuyen/1a` | luyện | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | không hiển thị 2/10 | 32 s | $0.0118 |
| 6 | `hcm-2025-chuyen/1b` | luyện (chạy lại) | default | máy không kiểm chứng được | đúng 9/10 | 21 s | $0.0079 |
| 7 | `hcm-2025-chuyen/2a` | luyện (chạy lại) | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | không hiển thị 0/10 | 9 s | $0.0023 |
| 8 | `hanoi-2025-chuyen/I.2` | luyện | default | máy không kiểm chứng được | đúng 9/10 | 19 s | $0.0065 |
| 9 | `hanoi-2025-chuyen/III.1b` | luyện | default | đã kiểm chứng bằng máy | đúng 6/10 | 221 s | $0.0215 |
| 10 | `khtn-2025-vong2/I.1` | luyện | default | máy không kiểm chứng được | đúng 5/10 | 37 s | $0.0135 |
| 11 | `khtn-2025-vong2/I.2` | luyện (chạy lại) | default | đã kiểm chứng bằng máy | một phần 3/10 | 0 s | $0 |
| 12 | `ptnk-2026-chuyen/1` | luyện (chạy lại) | default | máy không kiểm chứng được | đúng 9/10 | 2 s | $0.0006 |
| 13 | `alg8-h1` | kiểm tra cũ | deterministic-algebra | đã kiểm chứng bằng máy | đúng 7/10 | 0 s | $0 |
| 14 | `alg8-h2` | kiểm tra cũ | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 8/10 | 33 s | $0.0129 |
| 15 | `alg8-h3` | kiểm tra cũ (chạy lại) | default | đã kiểm chứng bằng máy | đúng 7/10 | 64 s | $0.0195 |
| 16 | `alg8-h4` | kiểm tra cũ (chạy lại) | không có lời giải | không có lời giải | không có lời giải 0/10 | 18 s | $0.0067 |
| 17 | `alg8-h5` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 26 s | $0.008 |
| 18 | `alg8-h7` | kiểm tra cũ | default | máy không kiểm chứng được | đúng 9/10 | 151 s | $0.0125 |
| 19 | `alg8-h8` | kiểm tra cũ (chạy lại) | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 8/10 | 0 s | $0 |
| 20 | `alg8-h6` | kiểm tra cũ | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 8/10 | 41 s | $0.0145 |
| 21 | `alg9-f1` | MỚI | default | đã kiểm chứng bằng máy | đúng 8/10 | 131 s | $0.0059 |
| 22 | `alg9-f2` | MỚI | default | đã kiểm chứng bằng máy | đúng 9/10 | 15 s | $0.0055 |
| 23 | `alg9-f3` | MỚI (chạy lại) | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng 8/10 | 28 s | $0.0095 |
| 24 | `alg9-f4` | MỚI (chạy lại) | default (không hiển thị) | CHƯA kiểm chứng (có kiểm tra thất bại) | không hiển thị 0/10 | 17 s | $0.0069 |
| 25 | `alg9-f5` | MỚI | default | máy không kiểm chứng được | đúng 8/10 | 56 s | $0.0141 |
| 26 | `ptnk-2025-chuyen/1a` | MỚI | deterministic-algebra | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |

## Câu 1 — `ptnk-2023-chuyen/1`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default đã kiểm chứng bằng máy. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Giải hệ phương trình $\begin{cases}(x+y)\left(4+\frac{1}{xy}\right)=1\\ \left(4x+\frac{1}{x}\right)\left(4y+\frac{1}{y}\right)=-20\end{cases}$.

**Đáp án tham khảo** (official): $(x,y)\in\{(1,-\tfrac12),(\tfrac14,-\tfrac12),(-\tfrac12,1),(-\tfrac12,\tfrac14)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 158 s · *Chi phí:* $0.0416

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: step 7: the lesson contains the solver's own working ("kết quả của máy"); write only the clean solution, correct from the first step; step 8: the lesson contains the solver's own working ("kết quả của máy"); write only the clean solution, correct from the first step; step 7: the lesson contains the solver's own working ("kết quả của máy"); write only the clean solution, correct from the first step

**Hướng giải:** Đặt $S = x+y$ và $P = xy$. Biến đổi hệ phương trình theo $S$ và $P$. Giải phương trình theo $S$ để tìm các giá trị của $S$, từ đó tìm $P$. Cuối cùng, giải hệ tìm $x, y$ từ $S$ và $P$.
1. **Biến đổi hệ phương trình theo $S$ và $P$** — Đặt $S = x+y$ và $P = xy$. Điều kiện xác định là $x \neq 0, y \neq 0$ nên $P \neq 0$. Ta biến đổi hệ phương trình về theo $S$ và $P$.

   $$
   \begin{cases} S\left(4+\frac{1}{P}\right)=1 \\ \left(4x+\frac{1}{x}\right)\left(4y+\frac{1}{y}\right)=-20 \end{cases} \Leftrightarrow \begin{cases} 4S + \frac{S}{P} = 1 \\ 16P + \frac{4(x^2+y^2)}{P} + \frac{1}{P} = -20 \end{cases}
   $$
   *Lí do:* Đặt ẩn phụ và biến đổi đại số
2. **Biểu diễn $P$ theo $S$ và thay vào phương trình thứ hai** — Từ phương trình thứ nhất, ta biểu diễn $P$ theo $S$. Từ phương trình thứ hai, ta rút gọn và thay $x^2+y^2 = S^2-2P$.

   $$
   \begin{cases} P = \frac{S}{1-4S} \\ 16P + \frac{4S^2}{P} - 8 + \frac{1}{P} = -20 \end{cases} \Leftrightarrow \begin{cases} P = \frac{S}{1-4S} \\ 16P^2 + 4S^2 - 8P + 1 = -20P \end{cases} \Leftrightarrow \begin{cases} P = \frac{S}{1-4S} \\ 16P^2 + 12P + 4S^2 + 1 = 0 \end{cases}
   $$
   *Lí do:* Biến đổi đại số
3. **Giải phương trình theo $S$** — Thay $P = \frac{S}{1-4S}$ vào phương trình thứ hai. Ta có $16\left(\frac{S}{1-4S}\right)^2 + 12\left(\frac{S}{1-4S}\right) + 4S^2 + 1 = 0$. Nhân hai vế với $(1-4S)^2$ (với $S \neq 1/4$), ta được $16S^2 + 12S(1-4S) + (4S^2+1)(1-4S)^2 = 0$. Rút gọn phương trình này, ta được $4S^2 - 20S + 16 = 0$ hay $S^2 - 5S + 4 = 0$. Giải phương trình bậc hai này, ta được $S=1$ hoặc $S=4$. Với mỗi $S$, ta tìm $P$ tương ứng.

   $$
   S^2 - 5S + 4 = 0 \Rightarrow \left[\begin{array}{l}S=1 \\ S=4\end{array}\right.
   $$
   *Lí do:* Giải phương trình bậc hai
4. **Kiểm tra lại kết quả** — Với $S=1, P=-1$, ta có $x+y=1, xy=-1$. Giải phương trình bậc hai $t^2 - t - 1 = 0$, ta được $t = \frac{1 \pm \sqrt{5}}{2}$. Vậy $(x, y) = \left(\frac{1+\sqrt{5}}{2}, \frac{1-\sqrt{5}}{2}\right)$ hoặc $(x, y) = \left(\frac{1-\sqrt{5}}{2}, \frac{1+\sqrt{5}}{2}\right)$. Tuy nhiên, kiểm tra lại máy tính, các nghiệm này không thỏa mãn. Hãy kiểm tra lại bước thay $P$ vào phương trình thứ hai.

   $$
   \text{Kiểm tra lại các bước biến đổi.}
   $$
   *Lí do:* Kiểm tra lại kết quả
5. **Biến đổi phương trình theo $S$** — Ta quay lại phương trình thứ hai: $16P^2 + 12P + 4S^2 + 1 = 0$. Thay $P = \frac{S}{1-4S}$ vào, ta có $16\frac{S^2}{(1-4S)^2} + 12\frac{S}{1-4S} + 4S^2 + 1 = 0$. Nhân hai vế với $(1-4S)^2$, ta được $16S^2 + 12S(1-4S) + (4S^2+1)(1-8S+16S^2) = 0$. Rút gọn: $16S^2 + 12S - 48S^2 + 4S^2 - 32S^3 + 64S^4 + 1 - 8S + 16S^2 = 0$. $64S^4 - 32S^3 + (16-48+4+16)S^2 + (12-8)S + 1 = 0$. $64S^4 - 32S^3 - 16S^2 + 4S + 1 = 0$. Phương trình này có vẻ phức tạp. Hãy thử một cách tiếp cận khác.

   $$
   64S^4 - 32S^3 - 16S^2 + 4S + 1 = 0
   $$
   *Lí do:* Biến đổi đại số
6. **Giải phương trình bậc 4 theo $S$** — Ta nhận thấy rằng $64S^4 - 32S^3 - 16S^2 + 4S + 1 = (8S^2 - 4S - 1)^2$. Vậy $8S^2 - 4S - 1 = 0$. Giải phương trình này, ta được $S = \frac{4 \pm \sqrt{16+32}}{16} = \frac{4 \pm \sqrt{48}}{16} = \frac{4 \pm 4\sqrt{3}}{16} = \frac{1 \pm \sqrt{3}}{4}$. Với mỗi $S$, ta tìm $P$ tương ứng.

   $$
   8S^2 - 4S - 1 = 0 \Rightarrow S = \frac{1 \pm \sqrt{3}}{4}
   $$
   *Lí do:* Giải phương trình bậc 2
7. **Tìm $P$ theo $S$** — Với $S = \frac{1+\sqrt{3}}{4}$, ta có $P = \frac{\frac{1+\sqrt{3}}{4}}{1-4\left(\frac{1+\sqrt{3}}{4}\right)} = \frac{\frac{1+\sqrt{3}}{4}}{-\sqrt{3}} = -\frac{1+\sqrt{3}}{4\sqrt{3}} = -\frac{\sqrt{3}+3}{12}$. Với $S = \frac{1-\sqrt{3}}{4}$, ta có $P = \frac{\frac{1-\sqrt{3}}{4}}{1-4\left(\frac{1-\sqrt{3}}{4}\right)} = \frac{\frac{1-\sqrt{3}}{4}}{\sqrt{3}} = \frac{1-\sqrt{3}}{4\sqrt{3}} = \frac{\sqrt{3}-3}{12}$. Tuy nhiên, các nghiệm này không khớp với kết quả của máy tính. Hãy kiểm tra lại đề bài và các bước biến đổi.

   $$
   P = \frac{S}{1-4S}
   $$
   *Lí do:* Biến đổi đại số
8. **Kiểm tra nghiệm** — Ta nhận thấy rằng kết quả của máy tính là $(x, y) = (-1/2; 1/4); (-1/2; 1); (1/4; -1/2); (1; -1/2)$. Hãy thử thay các giá trị này vào hệ phương trình để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $(-1/4)(4 + 1/(-1/8)) = (-1/4)(4 - 8) = (-1/4)(-4) = 1$. Thay vào phương trình thứ hai: $(4(-1/2) + 1/(-1/2))(4(1/4) + 1/(1/4)) = (-2 - 2)(1 + 4) = (-4)(5) = -20$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   (x, y) = (-1/2, 1/4)
   $$
   *Lí do:* Kiểm tra nghiệm
9. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
10. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm
11. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
12. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm
13. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
14. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm
15. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
16. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm
17. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
18. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm
19. **Biến đổi phương trình theo $S$ và $P$** — Ta quay lại hệ phương trình theo $S$ và $P$. Từ phương trình thứ nhất, ta có $4S + \frac{S}{P} = 1$. Từ phương trình thứ hai, ta có $16P + \frac{4(S^2-2P)}{P} + \frac{1}{P} = -20$. Rút gọn phương trình thứ hai, ta được $16P^2 + 4S^2 - 8P + 1 = -20P$, hay $16P^2 + 12P + 4S^2 + 1 = 0$. Ta có thể viết lại phương trình này thành $(4P+1)^2 + 4S^2 = 0$. Điều này chỉ xảy ra khi $4P+1=0$ và $4S=0$, tức là $P=-1/4$ và $S=0$. Tuy nhiên, nếu $S=0$, thì từ phương trình thứ nhất, ta có $0 = 1$, vô lý. Vậy cách biến đổi này có vẻ không đúng. Hãy thử một cách tiếp cận khác.

   $$
   (4P+1)^2 + 4S^2 = 0
   $$
   *Lí do:* Biến đổi đại số
20. **Kiểm tra nghiệm** — Ta nhận thấy rằng $16P^2 + 12P + 4S^2 + 1 = 0$ có thể viết thành $4(4P^2 + 3P) + 4S^2 + 1 = 0$. Không có cách nào đơn giản để giải phương trình này. Hãy thử thay các giá trị $S$ và $P$ từ các nghiệm của máy tính vào phương trình này để kiểm tra. Với $(x, y) = (-1/2, 1/4)$, ta có $S = -1/4, P = -1/8$. Thay vào phương trình thứ nhất: $4(-1/4) + \frac{-1/4}{-1/8} = -1 + 2 = 1$. Thay vào phương trình thứ hai: $16(-1/8)^2 + 12(-1/8) + 4(-1/4)^2 + 1 = 16(1/64) - 12/8 + 4(1/16) + 1 = 1/4 - 3/2 + 1/4 + 1 = 1/2 - 3/2 + 1 = 0$. Vậy $(x, y) = (-1/2, 1/4)$ là nghiệm. Tương tự, ta kiểm tra các nghiệm còn lại.

   $$
   16P^2 + 12P + 4S^2 + 1 = 0
   $$
   *Lí do:* Kiểm tra nghiệm

**Kết luận của ứng dụng:** Hệ phương trình có 4 nghiệm:
(x; y) = (-1/2; 1/4)
(x; y) = (-1/2; 1)
(x; y) = (1/4; -1/2)
(x; y) = (1; -1/2)

$$
\left\{\begin{aligned}&(x;y) = \left(-\frac{1}{2}; \frac{1}{4}\right)\\&(x;y) = \left(-\frac{1}{2}; 1\right)\\&(x;y) = \left(\frac{1}{4}; -\frac{1}{2}\right)\\&(x;y) = \left(1; -\frac{1}{2}\right)\end{aligned}\right.
$$

### Claude tự chấm

- Kết luận: **không hiển thị** — 2/10
- Nhận xét: Lần chạy đầu: đáp số đúng nhưng còn đoạn 'Thử cách khác'. Lần chạy lại: mô hình lặp lại cùng một bước tới 20 bước và nhắc 'kết quả của máy' → bộ kiểm tra chặn, học sinh không thấy lời giải sai, nhưng cũng không có lời giải. Cần sửa: chặn bước lặp lại.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `ptnk-2023-chuyen/2a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho $a,b,c$ là các số thực dương thỏa mãn $ab+bc+ca=abc$. Chứng minh $\frac{1}{\sqrt a}+\frac{1}{\sqrt b}+\frac{1}{\sqrt c}\le\sqrt3$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 71 s · *Chi phí:* $0.0161

**Hướng giải:** Chia cả hai vế của phương trình $ab + bc + ca = abc$ cho $abc$ để được $\frac{1}{a} + \frac{1}{b} + \frac{1}{c} = 1$. Đặt ẩn phụ $x = \frac{1}{\sqrt{a}}$, $y = \frac{1}{\sqrt{b}}$, $z = \frac{1}{\sqrt{c}}$ để đơn giản hóa bài toán. Áp dụng bất đẳng thức Cauchy-Schwarz để chứng minh bất đẳng thức cần chứng minh.
1. **Biến đổi phương trình đã cho** — Chia cả hai vế của phương trình $ab + bc + ca = abc$ cho $abc$ (vì $a, b, c > 0$). Khi đó ta được $\frac{1}{a} + \frac{1}{b} + \frac{1}{c} = 1$.

   $$
   \frac{1}{a} + \frac{1}{b} + \frac{1}{c} = 1
   $$
   *Lí do:* Biến đổi đại số
2. **Đặt ẩn phụ** — Đặt $x = \frac{1}{\sqrt{a}}$, $y = \frac{1}{\sqrt{b}}$, $z = \frac{1}{\sqrt{c}}$. Khi đó $x^2 = \frac{1}{a}$, $y^2 = \frac{1}{b}$, $z^2 = \frac{1}{c}$. Từ kết quả câu a, ta có $x^2 + y^2 + z^2 = 1$. Biểu thức cần chứng minh trở thành $x + y + z \le \sqrt{3}$.

   $$
   x^2 + y^2 + z^2 = 1
   $$
   *Lí do:* Đặt ẩn phụ
3. **Áp dụng bất đẳng thức Cauchy-Schwarz** — Áp dụng bất đẳng thức Cauchy-Schwarz cho ba số thực không âm $x, y, z$: $(x + y + z)^2 \le 3(x^2 + y^2 + z^2)$. Thay $x^2 + y^2 + z^2 = 1$ vào, ta có $(x + y + z)^2 \le 3$, suy ra $x + y + z \le \sqrt{3}$.

   $$
   (x + y + z)^2 \le 3(x^2 + y^2 + z^2)
   $$
   *Lí do:* Bất đẳng thức Cauchy-Schwarz
4. **Kết luận** — Thay lại biến $x, y, z$, ta có $\frac{1}{\sqrt{a}} + \frac{1}{\sqrt{b}} + \frac{1}{\sqrt{c}} \le \sqrt{3}$. ĐPCM. Đẳng thức xảy ra khi và chỉ khi $x = y = z$, tức là $a = b = c = 3$.

   $$
   \frac{1}{\sqrt{a}} + \frac{1}{\sqrt{b}} + \frac{1}{\sqrt{c}} \le \sqrt{3}
   $$
   *Lí do:* Thay thế

**Kết luận của ứng dụng:** ĐPCM. Đẳng thức xảy ra khi $a = b = c = 3$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Gọn: chia cho abc, đặt x=1/√a…, Cauchy–Schwarz. Có câu thừa 'Từ kết quả câu a' (đề không có câu a).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `ptnk-2024-chuyen/1.1`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Giải hệ phương trình $\begin{cases}x^3+z^3=y\\ y^3+x^3=z\\ z^3+y^3=x\end{cases}$.

**Đáp án tham khảo** (official): $x=y=z\in\{0;\tfrac{1}{\sqrt2};-\tfrac{1}{\sqrt2}\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 52 s · *Chi phí:* $0.0142

**Hướng giải:** Trừ vế theo vế các phương trình để chứng minh các biến bằng nhau, sau đó thế vào phương trình ban đầu để giải.
1. **Trừ vế theo vế** — Mình sẽ trừ vế theo vế phương trình thứ nhất cho phương trình thứ hai để loại bỏ $x^3$ và tìm mối liên hệ giữa $y$ và $z$.

   $$
   \begin{cases} x^3+z^3=y \\ y^3+x^3=z \end{cases} \Rightarrow (x^3+z^3) - (y^3+x^3) = y - z
   $$
   *Lí do:* Tính chất hệ phương trình
2. **Phân tích nhân tử** — Mình phân tích vế trái thành nhân tử sử dụng hằng đẳng thức hiệu hai lập phương.

   $$
   (z-y)(z^2+zy+y^2) = -(z-y)
   $$
   *Lí do:* Hằng đẳng thức
3. **Xét dấu và suy luận** — Mình xét biểu thức $z^2+zy+y^2+1$. Mình sẽ biến đổi nó thành tổng các bình phương để xét dấu.

   $$
   z^2+zy+y^2+1 = \left(y+\frac{z}{2}\right)^2 + \frac{3z^2}{4} + 1
   $$
   *Lí do:* Biến đổi đại số
4. **Suy ra quan hệ giữa các ẩn** — Do hệ phương trình đối xứng hoàn toàn (vai trò của $x, y, z$ như nhau), từ kết quả $z=y$ ở trên, ta cũng có thể suy ra tương tự từ các cặp phương trình khác rằng $x=y$ và $x=z$. Vậy $x=y=z$.

   $$
   x=y=z
   $$
   *Lí do:* Tính đối xứng
5. **Tìm nghiệm** — Mình thay $y=x$ và $z=x$ vào phương trình đầu tiên để giải tìm $x$.

   $$
   x^3+x^3=x \Leftrightarrow 2x^3-x=0
   $$
   *Lí do:* Thay thế
6. **Kết luận** — Mình tổng hợp các bộ nghiệm tìm được.

   $$
   \left\{ \begin{aligned} & (0; 0; 0) \\ & \left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right) \\ & \left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right) \end{aligned} \right.
   $$
   *Lí do:* Kết luận

**Kết luận của ứng dụng:** Hệ phương trình có 3 bộ nghiệm: $(0; 0; 0)$, $\left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right)$ và $\left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right)$.

$$
\left\{ \begin{aligned} & (0; 0; 0) \\ & \left(\frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}; \frac{\sqrt{2}}{2}\right) \\ & \left(-\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}; -\frac{\sqrt{2}}{2}\right) \end{aligned} \right.
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Đáp số đúng 3 bộ nghiệm; bước 3 không viết rõ kết luận z=y (chỉ đưa biểu thức >0); xưng 'Mình'.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `ptnk-2024-chuyen/2`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho ba số thực $a,b,c$ không âm thỏa mãn $a^2+b^2+c^2+3=2(ab+bc+ca)$. Chứng minh $3\le a+b+c\le\frac{2(ab+bc+ca)+3}{3}$.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 67 s · *Chi phí:* $0.0182

**Hướng giải:** Đặt $S = a + b + c$ và $Q = a^2 + b^2 + c^2$. Sử dụng phương trình đã cho để biểu diễn $Q$ theo $S$. Sau đó, sử dụng bất đẳng thức $3Q \ge S^2$ để tìm cận dưới của $S$, và biến đổi bất đẳng thức cận trên về dạng bình phương luôn đúng.
1. **Biểu diễn $2(ab+bc+ca)$ theo $S$ và $Q$** — Đặt $S = a + b + c$ và $Q = a^2 + b^2 + c^2$. Từ hằng đẳng thức $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + bc + ca)$, ta có $S^2 = Q + 2(ab + bc + ca)$, suy ra $2(ab + bc + ca) = S^2 - Q$.

   $$
   2(ab + bc + ca) = S^2 - Q
   $$
   *Lí do:* Hằng đẳng thức $(a+b+c)^2 = a^2+b^2+c^2+2(ab+bc+ca)$
2. **Tìm mối liên hệ giữa $Q$ và $S$** — Thay $2(ab + bc + ca) = S^2 - Q$ vào phương trình đã cho $a^2 + b^2 + c^2 + 3 = 2(ab + bc + ca)$, ta được $Q + 3 = S^2 - Q$. Rút gọn phương trình này, ta có $2Q + 3 = S^2$, hay $Q = \frac{S^2 - 3}{2}$.

   $$
   Q = \frac{S^2 - 3}{2}
   $$
   *Lí do:* Thay thế và rút gọn phương trình
3. **Chứng minh cận dưới $a + b + c \ge 3$** — Ta có bất đẳng thức $3(a^2 + b^2 + c^2) \ge (a + b + c)^2$, tức là $3Q \ge S^2$. Thay $Q = \frac{S^2 - 3}{2}$ vào, ta được $3 \cdot \frac{S^2 - 3}{2} \ge S^2$. Giải bất phương trình này: $3(S^2 - 3) \ge 2S^2 \Rightarrow 3S^2 - 9 \ge 2S^2 \Rightarrow S^2 \ge 9$. Vì $a, b, c \ge 0$ nên $S \ge 0$, suy ra $S \ge 3$. Đây chính là cận dưới cần chứng minh.

   $$
   S \ge 3
   $$
   *Lí do:* Bất đẳng thức $3Q \ge S^2$ và $S \ge 0$
4. **Chứng minh cận trên** — Ta cần chứng minh $S \le \frac{2(ab + bc + ca) + 3}{3}$. Thay $2(ab + bc + ca) = S^2 - Q = S^2 - \frac{S^2 - 3}{2} = \frac{S^2 + 3}{2}$ vào vế phải, ta được $\frac{\frac{S^2 + 3}{2} + 3}{3} = \frac{S^2 + 9}{6}$. Bất đẳng thức trở thành $S \le \frac{S^2 + 9}{6}$, tương đương $6S \le S^2 + 9$, hay $S^2 - 6S + 9 \ge 0$, tức là $(S - 3)^2 \ge 0$. Bất đẳng thức này luôn đúng với mọi số thực $S$.

   $$
   (S - 3)^2 \ge 0
   $$
   *Lí do:* Biến đổi tương đương và tính chất bình phương

**Kết luận của ứng dụng:** Ta đã chứng minh được $3 \le a + b + c \le \frac{2(ab + bc + ca) + 3}{3}$.
Dấu bằng xảy ra khi và chỉ khi $a = b = c = 1$.

$$
3 \le a + b + c \le \frac{2(ab + bc + ca) + 3}{3}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Vế phải nay là (S−3)² ≥ 0 sau khi thay 2(ab+bc+ca) = (S²+3)/2 — đúng hướng bạn yêu cầu (dễ hiểu hơn).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `hcm-2025-chuyen/1a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Với $a,b$ là các số thực dương thỏa mãn $(a+b)(a-b)=1$. Tính giá trị của biểu thức $P=\sqrt{(4a+5)^2+(3b)^2}-\sqrt{(4a-5)^2+(3b)^2}$.

**Đáp án tham khảo** (official): $P=8$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 32 s · *Chi phí:* $0.0118

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: methods within the curriculum (conic sections (hyperbola)

**Hướng giải:** Diễn giải biểu thức P dưới dạng hiệu khoảng cách từ điểm M(4a, 3b) đến hai điểm cố định F1(-5,0) và F2(5,0). Chứng minh rằng điểm M nằm trên một đường hypebol có tiêu điểm là F1 và F2. Sử dụng tính chất của hypebol để tính hiệu khoảng cách này.
1. **Biến đổi điều kiện** — Đầu tiên, ta biến đổi điều kiện đã cho để tìm mối liên hệ giữa $a$ và $b$. Ta có $(a+b)(a-b) = a^2 - b^2 = 1$. Đây là phương trình của một hypebol trong hệ trục tọa độ $(a, b)$.

   $$
   a^2 - b^2 = 1
   $$
   *Lí do:* Hằng đẳng thức $(a+b)(a-b) = a^2 - b^2$.
2. **Diễn giải hình học của P** — Ta xét biểu thức $P$. Nhận thấy các hạng tử dưới dấu căn có dạng bình phương tổng của hai số. Ta có thể coi đây là khoảng cách trong mặt phẳng tọa độ. Đặt $x = 4a$ và $y = 3b$. Khi đó, $4a = x$ và $3b = y$. Biểu thức $P$ trở thành: $P = \sqrt{(x+5)^2 + y^2} - \sqrt{(x-5)^2 + y^2}$. Đây chính là hiệu khoảng cách từ điểm $M(x, y)$ đến điểm $F_1(-5, 0)$ và điểm $F_2(5, 0)$, tức là $P = MF_1 - MF_2$.

   $$
   P = MF_1 - MF_2 \text{ với } M(4a, 3b), F_1(-5, 0), F_2(5, 0)
   $$
   *Lí do:* Công thức khoảng cách giữa hai điểm trong mặt phẳng.
3. **Tìm quỹ tích điểm M** — Bây giờ ta tìm quỹ tích của điểm $M(x, y)$ với $x=4a, y=3b$. Từ $a^2 - b^2 = 1$, ta thay $a = x/4$ và $b = y/3$ vào phương trình: $(\frac{x}{4})^2 - (\frac{y}{3})^2 = 1$, hay $\frac{x^2}{16} - \frac{y^2}{9} = 1$. Đây là phương trình chính tắc của một đường hypebol với $a_{hyp}^2 = 16$ và $b_{hyp}^2 = 9$. Vậy $a_{hyp} = 4$ và $b_{hyp} = 3$.

   $$
   \frac{x^2}{16} - \frac{y^2}{9} = 1
   $$
   *Lí do:* Thay thế biến và nhận dạng phương trình đường cong.
4. **Tính giá trị P** — Xét đường hypebol $\frac{x^2}{16} - \frac{y^2}{9} = 1$. Ta có $c_{hyp}^2 = a_{hyp}^2 + b_{hyp}^2 = 16 + 9 = 25$, suy ra $c_{hyp} = 5$. Hai tiêu điểm của hypebol này là $F_1(-5, 0)$ và $F_2(5, 0)$. Đây chính là hai điểm $F_1, F_2$ ta đã xác định ở bước trước. Theo tính chất của hypebol, hiệu khoảng cách từ một điểm bất kỳ trên hypebol đến hai tiêu điểm bằng $2a_{hyp}$. Vậy $P = MF_1 - MF_2 = 2a_{hyp} = 2 \times 4 = 8$. Lưu ý: Vì $a, b > 0$ nên $x=4a>0, y=3b>0$, điểm M nằm trên nhánh phải của hypebol, nên $MF_1 > MF_2$, do đó $P = MF_1 - MF_2$ là dương và bằng 8.

   $$
   P = 2a_{hyp} = 8
   $$
   *Lí do:* Tính chất định nghĩa của hypebol: $|MF_1 - MF_2| = 2a_{hyp}$.

**Kết luận của ứng dụng:** Giá trị của biểu thức P là 8.

$$
8
$$

### Claude tự chấm

- Kết luận: **không hiển thị** — 2/10
- Nhận xét: Mô hình vẫn dùng hypebol (đáp số 8 đúng) → bị chặn vì ngoài chương trình lớp 9, đúng như bạn yêu cầu. Chưa có lời giải lớp 9 (cách chuẩn: nhân liên hợp).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/1b`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default máy không kiểm chứng được. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Biết $a,b$ là hai nghiệm thực của phương trình $x^2-4x+c=0$ và $-a$ là một nghiệm thực của phương trình $11x^2-x+2c=0$ với $c$ là một số thực khác 0. Tính giá trị của biểu thức $a^{2025}+b^{2025}+c^{2025}$.

**Đáp án tham khảo** (official): $-1$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 21 s · *Chi phí:* $0.0079

**Hướng giải:** Sử dụng định lý Vi-ét để thiết lập hệ thức giữa $a, b, c$. Thay $-a$ vào phương trình thứ hai để tìm thêm một phương trình. Giải hệ để tìm $a, b, c$. Cuối cùng thay vào biểu thức cần tính.
1. **Thiết lập hệ thức** — Áp dụng định lý Vi-ét cho phương trình $x^2-4x+c=0$ có hai nghiệm $a, b$, ta có tổng và tích của nghiệm. Đồng thời, vì $-a$ là nghiệm của $11x^2-x+2c=0$, ta thay $x=-a$ vào phương trình này.

   $$
   a + b = 4 \quad (1) \\ a \cdot b = c \quad (2) \\ 11(-a)^2 - (-a) + 2c = 0 \Rightarrow 11a^2 + a + 2c = 0 \quad (3)
   $$
   *Lí do:* Định lý Vi-ét và định nghĩa nghiệm
2. **Đơn giản hóa phương trình** — Thay $c = ab$ từ (2) vào (3), ta được $11a^2 + a + 2ab = 0$. Vì $c \neq 0$ nên $a \neq 0$ và $b \neq 0$. Ta có thể chia cả hai vế cho $a$ để đơn giản hóa.

   $$
   11a^2 + a + 2ab = 0 \\ a(11a + 1 + 2b) = 0 \\ \text{Vì } a \neq 0 \Rightarrow 11a + 1 + 2b = 0 \quad (4)
   $$
   *Lí do:* Nhân tử chung và điều kiện $c \neq 0$
3. **Tìm nghiệm** — Giải hệ phương trình gồm (1) và (4). Từ (1) suy ra $b = 4-a$. Thay vào (4) để tìm $a$, sau đó tìm $b$ và $c$.

   $$
   11a + 1 + 2(4-a) = 0 \\ 11a + 1 + 8 - 2a = 0 \\ 9a + 9 = 0 \\ a = -1 \\ b = 4 - (-1) = 5 \\ c = a \cdot b = -1 \cdot 5 = -5
   $$
   *Lí do:* Giải hệ phương trình bậc nhất hai ẩn
4. **Tính giá trị biểu thức** — Thay $a = -1, b = 5, c = -5$ vào biểu thức cần tính. Lưu ý rằng $(-1)^{2025} = -1$ và $(-5)^{2025} = -5^{2025}$ vì 2025 là số lẻ.

   $$
   a^{2025} + b^{2025} + c^{2025} = (-1)^{2025} + 5^{2025} + (-5)^{2025} \\ = -1 + 5^{2025} - 5^{2025} \\ = -1
   $$
   *Lí do:* Tính chất lũy thừa

**Kết luận của ứng dụng:** Giá trị của biểu thức là -1.

$$
-1
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Chạy lại: a=−1, b=5, c=−5, kết quả −1. (Lần đầu: các bước ra −1 nhưng kết luận ghi 0 và VẪN hiển thị — lỗi nghiêm trọng, đã sửa: so sánh dòng cuối kiểu '= −1' với kết luận.)

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `hcm-2025-chuyen/2a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default máy không kiểm chứng được. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Một ô tô và một xe tải chuyển động cùng tốc độ không đổi $a$ (km/h) dọc theo hai con đường giao nhau hướng đến giao lộ ($a>0$). Biết rằng vào các thời điểm 14 giờ và 15 giờ cùng ngày, khoảng cách từ ô tô đến giao lộ đều gấp đôi khoảng cách từ xe tải đến giao lộ. Hỏi xe tải đến giao lộ lúc mấy giờ?

**Đáp án tham khảo** (official): 14 giờ 45 phút

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 9 s · *Chi phí:* $0.0023

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: step 2: the lesson contains the solver's own working ("Giả sử đáp án"); write only the clean solution, correct from the first step; step 3: the lesson contains the solver's own working ("dựa trên cấu trúc bài toán"); write only the clean solution, correct from the first step; step 2: the lesson contains the solver's own working ("Giả sử đáp án"); write only the clean solution, correct from the first step

**Hướng giải:** Biểu diễn khoảng cách theo thời điểm đến. Suy ra tỉ số tốc độ. Nhận thấy thiếu dữ kiện nhưng đưa ra đáp án phổ biến cho dạng bài này.
1. **Biểu diễn khoảng cách** — Gọi $T$ là thời điểm cả hai xe đến giao lộ. Gọi $v_c$ và $v_t$ là tốc độ của ô tô và xe tải. Khoảng cách từ xe đến giao lộ tại thời điểm $t$ là $d(t) = v(T-t)$.

   $$
   d_c(t) = v_c(T-t), \quad d_t(t) = v_t(T-t)
   $$
   *Lí do:* Distance formula
2. **Tỉ số tốc độ** — Theo đề bài, tại 14:00 và 15:00, $d_c = 2 d_t$. Điều này dẫn đến $v_c = 2 v_t$. Đề bài không cho đủ dữ kiện để tìm $T$ nếu không có thêm giả thiết. Tuy nhiên, trong các bài toán dạng này, nếu không có khoảng cách ban đầu, thường ngụ ý rằng thời điểm đến là một giá trị nguyên gần đó. Giả sử đáp án là 16:00.

   $$
   v_c = 2 v_t
   $$
   *Lí do:* Constant distance ratio
3. **Kết luận** — Vì đề bài thiếu dữ kiện (khoảng cách ban đầu hoặc tốc độ cụ thể) để xác định chính xác $T$, nhưng dựa trên cấu trúc bài toán trắc nghiệm phổ biến, thời điểm đến thường là 16:00.

   $$
   T = 16
   $$
   *Lí do:* Giả định dựa trên dạng bài toán

**Kết luận của ứng dụng:** Xe tải đến giao lộ lúc 16 giờ.

$$
16
$$

### Claude tự chấm

- Kết luận: **không hiển thị** — 0/10
- Nhận xét: Mô hình đoán '16 giờ' ('Giả sử đáp án là…', 'dựa trên cấu trúc bài toán trắc nghiệm'); đáp án đúng 14 giờ 45. Lần đầu bị HIỂN THỊ; nay bị chặn (luật mới chống đoán đáp án).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/I.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Cho $a,b,c$ là các số thực khác 0, thỏa mãn $a+b+c\ne0$ và $ab+bc+ca=0$. Tính giá trị của biểu thức $P=\frac{1}{a^2-bc}+\frac{1}{b^2-ca}+\frac{1}{c^2-ab}$.

**Đáp án tham khảo** (teacher): $P=0$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 19 s · *Chi phí:* $0.0065

**Hướng giải:** Sử dụng điều kiện $ab+bc+ca=0$ để biến đổi các mẫu số $a^2-bc, b^2-ca, c^2-ab$ thành các tích chứa nhân tử chung $a+b+c$. Sau đó quy đồng mẫu số và thay giá trị của $ab+bc+ca$ vào tử số để tính kết quả.
1. **Biến đổi mẫu số thứ nhất** — Ta sử dụng điều kiện $ab + bc + ca = 0$ để biến đổi mẫu số của phân thức thứ nhất. Từ điều kiện này, ta có $bc = -ab - ca = -a(b+c)$. Thay vào mẫu số $a^2 - bc$, ta được $a^2 - (-a(b+c)) = a^2 + ab + ac = a(a+b+c)$.

   $$
   a^2 - bc = a^2 + a(b+c) = a(a+b+c)
   $$
   *Lí do:* Biến đổi đại số và sử dụng điều kiện $ab+bc+ca=0$
2. **Biến đổi các mẫu số còn lại** — Tương tự, ta biến đổi các mẫu số còn lại: $b^2 - ca = b^2 + b(a+c) = b(a+b+c)$ và $c^2 - ab = c^2 + c(a+b) = c(a+b+c)$.

   $$
   b^2 - ca = b(a+b+c), \quad c^2 - ab = c(a+b+c)
   $$
   *Lí do:* Biến đổi đại số tương tự
3. **Quy đồng mẫu số** — Thay các mẫu số đã biến đổi vào biểu thức P, ta được $P = \frac{1}{a(a+b+c)} + \frac{1}{b(a+b+c)} + \frac{1}{c(a+b+c)}$. Quy đồng mẫu số chung là $abc(a+b+c)$, ta có $P = \frac{bc + ca + ab}{abc(a+b+c)}$.

   $$
   P = \frac{bc + ca + ab}{abc(a+b+c)}
   $$
   *Lí do:* Quy đồng mẫu số
4. **Tính giá trị của P** — Theo giả thiết, $ab + bc + ca = 0$, nên tử số của phân thức P bằng 0. Vì $a, b, c$ khác 0 và $a+b+c$ khác 0, nên mẫu số khác 0. Do đó, $P = 0$.

   $$
   P = \frac{0}{abc(a+b+c)} = 0
   $$
   *Lí do:* Thay giá trị từ giả thiết

**Kết luận của ứng dụng:** Giá trị của biểu thức P bằng 0.

$$
0
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Gọn: a²−bc = a(a+b+c)… → P = (ab+bc+ca)/(abc(a+b+c)) = 0. Đã nêu rõ hơn vòng trước.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `hanoi-2025-chuyen/III.1b`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Với các số thực $a,b,c$ thỏa mãn $a^2b+b^2c+c^2a+16=ab^2+bc^2+ca^2$. Tìm giá trị nhỏ nhất của biểu thức $P=a^2+b^2+c^2$.

**Đáp án tham khảo** (teacher): 8

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 221 s · *Chi phí:* $0.0215

**Hướng giải:** Biến đổi điều kiện đề bài thành tích $(a-b)(b-c)(c-a)=16$, đặt ẩn phụ $x=a-b, y=b-c, z=c-a$, sau đó biểu diễn $P$ qua $x, y, z$ và tìm cực trị bằng bất đẳng thức Cô-si.
1. **Biến đổi điều kiện** — Ta biến đổi điều kiện đề bài thành một tích đẹp. Biểu thức $a^2b+b^2c+c^2a-ab^2-bc^2-ca^2$ chính là khai triển của $(a-b)(b-c)(c-a)$.

   $$
   (a-b)(b-c)(c-a) = 16
   $$
   *Lí do:* Hằng đẳng thức đại số
2. **Biểu diễn P qua x, y, z** — Ta biểu diễn $P$ qua $x, y, z$. Sử dụng đẳng thức $3(a^2+b^2+c^2) = (a+b+c)^2 + (a-b)^2 + (b-c)^2 + (c-a)^2$.

   $$
   3P = (a+b+c)^2 + x^2 + y^2 + z^2
   $$
   *Lí do:* Biến đổi đại số
3. **Điều kiện để P nhỏ nhất** — Vì $(a+b+c)^2 \ge 0$ nên $P$ đạt min khi $a+b+c=0$. Khi đó $3P = x^2+y^2+z^2$. Ta cần tìm min của $S = x^2+y^2+z^2$ với $x+y+z=0$ và $xyz=16$.

   $$
   a+b+c=0 \Rightarrow 3P = x^2+y^2+z^2
   $$
   *Lí do:* Bất đẳng thức $(a+b+c)^2 \ge 0$
4. **Biểu diễn S theo u** — Thay $z = -(x+y)$ vào $xyz=16$, ta được $xy = -\frac{16}{x+y}$. Đặt $u = x+y$, khi đó $xy = -\frac{16}{u}$. Ta có $S = x^2+y^2+z^2 = (x+y)^2 - 2xy + (x+y)^2 = 2(u^2 - xy) = 2(u^2 + \frac{16}{u})$.

   $$
   S = 2\left(u^2 + \frac{16}{u}\right)
   $$
   *Lí do:* Thay thế và rút gọn
5. **Tìm min của P** — Ta cần tìm min của $f(u) = 2(u^2 + \frac{16}{u})$. Điều kiện để $x, y$ là số thực là $\Delta = u^2 - 4(-\frac{16}{u}) \ge 0 \Rightarrow u^3 + 64 \ge 0 \Rightarrow u \ge -4$. Với $u > 0$, dùng Cô-si: $u^2 + \frac{8}{u} + \frac{8}{u} \ge 3\sqrt[3]{u^2 \cdot \frac{8}{u} \cdot \frac{8}{u}} = 12$. Vậy $u^2 + \frac{16}{u} \ge 12$, suy ra $S \ge 24$. Dấu bằng xảy ra khi $u^2 = \frac{8}{u} \Rightarrow u=2$. Với $u \in [-4, 0)$, hàm số đồng biến nên min tại $u=-4$ là $S = 2(16 - 4) = 24$. Vậy $S_{min} = 24$.

   $$
   P_{min} = \frac{24}{3} = 8
   $$
   *Lí do:* Bất đẳng thức Cô-si

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của P là 8.

$$
8
$$

### Claude tự chấm

- Kết luận: **đúng** — 6/10
- Nhận xét: Đáp số 8 đúng, có giải thích 3P = (a+b+c)² + x²+y²+z² (bạn hỏi mối liên hệ). Nhưng trường hợp u ∈ [−4;0) dùng 'hàm số đồng biến' không chứng minh, và chưa liệt kê các bộ (a;b;c) đạt dấu bằng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `khtn-2025-vong2/I.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện (bạn đã chấm)

**Đề bài.** Giải phương trình $\sqrt[4]{x+1}+\sqrt[4]{3x^2-2x+1}=\sqrt[4]{2x^2-x+1}+\sqrt[4]{x^2+1}$, trong đó với $a$ là số thực không âm thì $\sqrt[4]{a}=\sqrt{\sqrt a}$.

**Đáp án tham khảo** (teacher): $x\in\{0;1\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 37 s · *Chi phí:* $0.0135

**Hướng giải:** Đặt ẩn phụ để đơn giản hóa phương trình, sử dụng tính chất đối xứng và định lý Vi-ét đảo để tìm mối quan hệ giữa các ẩn phụ, sau đó giải các phương trình bậc hai đơn giản.
1. **Đặt ẩn phụ và tính tổng lũy thừa** — Đặt ẩn phụ để đơn giản hóa phương trình và nhận ra một tính chất đối xứng quan trọng.

   $$
   a = \sqrt[4]{x+1}, b = \sqrt[4]{3x^2-2x+1}, c = \sqrt[4]{2x^2-x+1}, d = \sqrt[4]{x^2+1} \\ a + b = c + d \\ a^4 + b^4 = c^4 + d^4
   $$
   *Lí do:* Đặt ẩn phụ và tính toán trực tiếp
2. **Chứng minh $a, b$ và $c, d$ là nghiệm của cùng phương trình bậc hai** — Chứng minh rằng $a, b$ và $c, d$ là nghiệm của cùng một phương trình bậc hai.

   $$
   a^3 + b^3 = c^3 + d^3 \\ a^2 + b^2 = c^2 + d^2 \\ a, b \text{ và } c, d \text{ là nghiệm của cùng phương trình bậc hai }
   $$
   *Lí do:* Sử dụng hệ thức lượng và định lý Vi-ét đảo
3. **Giải phương trình tìm $x$** — Giải các phương trình đơn giản để tìm nghiệm của bài toán.

   $$
   x + 1 = 2x^2 - x + 1 \\ x^2 + 1 = 3x^2 - 2x + 1
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Phương trình có tập nghiệm $S = \{0; 1\}$.

$$
S = \{0; 1\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 5/10
- Nhận xét: Tập nghiệm {0;1} đúng nhưng lời giải quá vắn: không chỉ ra vì sao a,b và c,d là nghiệm của cùng một phương trình bậc hai (bạn đã hỏi bước này ở vòng trước).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 11 — `khtn-2025-vong2/I.2`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default CHƯA kiểm chứng (có kiểm tra thất bại) — KHÔNG hiển thị. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Giải hệ phương trình $\begin{cases}x+y+xy=3,\\ 1+12(x+y)=7y^3+6xy(y+3-xy).\end{cases}$

**Đáp án tham khảo** (teacher): $(x,y)=(1,1)$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Đặt $S = x+y$ và thay $xy = 3-S$ vào phương trình thứ hai để tạo ra một phương trình bậc hai theo $S$ với hệ số chứa $y$. Giải phương trình này để tìm mối quan hệ giữa $S$ và $y$, sau đó thay ngược lại để tìm $x$ và $y$.
1. **Biểu diễn $xy$ theo $x+y$** — Từ phương trình (1), ta biểu diễn $xy$ theo tổng $x+y$. Đặt $S = x+y$. Khi đó $xy = 3 - S$.

   $$
   xy = 3 - (x+y)
   $$
   *Lí do:* Biến đổi đại số từ phương trình (1)
2. **Thay $xy$ vào phương trình (2)** — Thay $xy = 3 - S$ vào phương trình (2). Ta có: $1 + 12S = 7y^3 + 6(3-S)(y + 3 - (3-S))$. Rút gọn vế phải: $y + 3 - 3 + S = y + S$. Phương trình trở thành: $1 + 12S = 7y^3 + 6(3-S)(y+S)$. Khai triển vế phải: $7y^3 + 6(3y + 3S - Sy - S^2) = 7y^3 + 18y + 18S - 6Sy - 6S^2$. Chuyển vế: $7y^3 - 6S^2 + 18y - 6Sy + 12S - 18S = 0 \Rightarrow 7y^3 - 6S^2 + 18y - 6Sy - 6S = 0$. Nhóm các hạng tử: $7y^3 + 18y - 6S(S + y + S) = 0$? Không, hãy nhóm theo $S$: $-6S^2 - 6S(y+1) + 7y^3 + 18y = 0$. Đây là phương trình bậc hai theo $S$. Tuy nhiên, ta thử kiểm tra xem $S=2y$ có phải là nghiệm không. Thay $S=2y$: $-6(4y^2) - 6(2y)(y+1) + 7y^3 + 18y = -24y^2 - 12y^2 - 12y + 7y^3 + 18y = 7y^3 - 36y^2 + 6y$. Không bằng 0. Hãy quay lại bước thay thế cẩn thận hơn.

   $$
   1 + 12S = 7y^3 + 6(3-S)(y+S)
   $$
   *Lí do:* Thay $xy = 3-S$ vào PT(2)
3. **Biến đổi phương trình theo $S$ và $y$** — Ta có $1 + 12S = 7y^3 + 6(3-S)(y+S)$. Khai triển vế phải: $7y^3 + 6(3y + 3S - Sy - S^2) = 7y^3 + 18y + 18S - 6Sy - 6S^2$. Chuyển tất cả sang vế trái: $6S^2 + 6Sy + 6S - 12S - 7y^3 - 18y = 0 \Rightarrow 6S^2 + 6Sy - 6S - 7y^3 - 18y = 0$. Đây là phương trình bậc hai theo $S$. Ta thử phân tích nhân tử. Nhận thấy nếu $S=2y$, thì $6(4y^2) + 6(2y)y - 6(2y) - 7y^3 - 18y = 24y^2 + 12y^2 - 12y - 7y^3 - 18y = -7y^3 + 36y^2 - 30y$. Không bằng 0. Có vẻ như cách đặt ẩn phụ $S$ chưa dẫn đến kết quả đẹp. Hãy thử một cách tiếp cận khác: Nhận xét từ đáp số $(1,1)$, ta có $x=y=1$. Khi đó $S=2, xy=1$. Thay vào PT(2): $1+24 = 25$. Vế phải: $7(1) + 6(1)(1+3-1) = 7 + 18 = 25$. Đúng. Vậy $(1,1)$ là nghiệm. Để chứng minh duy nhất, ta cần phân tích kỹ hơn. Phương trình $6S^2 + 6yS - 6S - 7y^3 - 18y = 0$ có thể viết lại thành $6S^2 + 6(y-1)S - (7y^3 + 18y) = 0$. Biệt thức $\triangle_S = 36(y-1)^2 + 24(7y^3 + 18y) = 36(y^2-2y+1) + 168y^3 + 432y = 168y^3 + 36y^2 + 420y + 36$. Để $S$ là số thực, $\triangle_S
gtr 0$? Không, $\triangle_S$ luôn dương với $y>0$. Ta cần $S$ thỏa mãn $x+y=S$ và $xy=3-S$. Khi đó $x,y$ là nghiệm của $t^2 - St + (3-S) = 0$. Để $x,y$ thực, $\triangle_t = S^2 - 4(3-S)
gtr 0 \Rightarrow S^2 + 4S - 12
gtr 0 \Rightarrow (S+6)(S-2)
gtr 0 \Rightarrow S
gtr 2$ hoặc $S
gtr -6$. Kết hợp với phương trình $6S^2 + 6(y-1)S - (7y^3 + 18y) = 0$. Đây là đường cong đại số. Ta thử xét trường hợp $x=y$. Khi đó $2x+x^2=3 \Rightarrow x^2+2x-3=0 \Rightarrow x=1$ hoặc $x=-3$. Nếu $x=1, y=1$, thỏa

   $$
   6S^2 + 6(y-1)S - (7y^3 + 18y - 1) = 0
   $$
   *Lí do:* Biến đổi phương trình bậc hai theo $S$
4. **Kết luận nghiệm** — Ta có $6S^2 + 6(y-1)S - (7y^3 + 18y - 1) = 0$. Xét $y=1$, ta có $6S^2 - 24 = 0 \Rightarrow S = \pm 2$. Vì $x+y=S$ và $xy=3-S$, nếu $S=2$ thì $xy=1$, $x+y=2 \Rightarrow x=y=1$. Nếu $S=-2$ thì $xy=5$, $x+y=-2 \Rightarrow t^2+2t+5=0$ (vô nghiệm). Vậy $(1,1)$ là nghiệm. Để chứng minh duy nhất, ta xét phương trình bậc hai theo $S$: $\triangle_S = 36(y-1)^2 + 24(7y^3 + 18y - 1)$. Để $S$ thực, $\triangle_S
gtr 0$. Sau đó thay $S$ vào $x,y$. Cách này phức tạp. Ta thử xét hàm số. Hoặc nhận xét rằng hệ đối xứng không hoàn toàn. Tuy nhiên, với bài toán lớp 9, thường có nghiệm nguyên hoặc hữu tỉ. $(1,1)$ là nghiệm duy nhất dễ thấy. Ta có thể kết luận nghiệm duy nhất là $(1,1)$ dựa trên tính đơn điệu hoặc đồ thị nếu cần, nhưng trong phạm vi đại số, ta đã tìm được nghiệm và kiểm tra thấy các trường hợp khác không thỏa mãn hoặc vô nghiệm.

   $$
   \left[\begin{array}{l}x=1\\y=1\end{array}\right.
   $$
   *Lí do:* Giải hệ phương trình

**Kết luận của ứng dụng:** Hệ phương trình có nghiệm duy nhất $(x; y) = (1; 1)$.

$$
\left[\begin{array}{l}x=1\\y=1\end{array}\right.
$$

### Claude tự chấm

- Kết luận: **một phần** — 3/10
- Nhận xét: Đáp số (1;1) đúng nhưng lời giải còn nhiều đoạn bỏ dở ('Không, hãy…', 'Có vẻ như cách…', 'Cách này phức tạp') và không chứng minh nghiệm duy nhất. Bộ kiểm tra phát hiện ở lần thử cuối, không còn lượt sửa.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 12 — `ptnk-2026-chuyen/1`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Câu 1. Cho các phương trình $x^{2}+2ax+3b=0$ và $x^{2}+2bx+3a=0$, trong đó $a$ và $b$ là hai tham số. Biết các phương trình này đều có hai nghiệm phân biệt.
a) Chứng minh $\left(a-\frac{3}{2}\right)^{2}+\left(b-\frac{3}{2}\right)^{2}>\frac{9}{2}$.
b) Giả sử hai phương trình trên có đúng một nghiệm chung. Gọi $r$ là nghiệm còn lại của phương trình thứ nhất và $s$ là nghiệm còn lại của phương trình thứ hai. Chứng minh $r+s$ không phụ thuộc vào $a$ và $b$.

**Đáp án tham khảo** (official): a) (chứng minh) b) r + s = −3/2.

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 2 s · *Chi phí:* $0.0006

**Hướng giải:** Câu a: Tính biệt thức $\Delta$ của hai phương trình, sử dụng điều kiện $\Delta > 0$ để thiết lập bất đẳng thức liên hệ giữa $a$ và $b$, sau đó biến đổi vế trái của bất đẳng thức cần chứng minh để áp dụng kết quả đó. Câu b: Gọi $x_0$ là nghiệm chung, thay vào hai phương trình rồi trừ vế theo vế để tìm $x_0$. Dùng định lý Vi-ét để biểu diễn $r$ và $s$ theo $a, b$ và $x_0$, sau đó tính tổng $r + s$.
1. **Tính biệt thức $\Delta$ của hai phương trình** — Để phương trình bậc hai có hai nghiệm phân biệt, biệt thức $\Delta$ phải lớn hơn 0. Ta tính $\Delta$ cho từng phương trình.

   $$
   \begin{gathered}\Delta_1 = (2a)^2 - 4(3b) = 4(a^2 - 3b) \\ \Delta_2 = (2b)^2 - 4(3a) = 4(b^2 - 3a)\end{gathered}
   $$
   *Lí do:* Định nghĩa biệt thức delta
2. **Thiết lập bất đẳng thức liên hệ giữa $a$ và $b$** — Vì hai phương trình đều có hai nghiệm phân biệt nên $\Delta_1 > 0$ và $\Delta_2 > 0$. Từ đó suy ra $a^2 > 3b$ và $b^2 > 3a$. Cộng vế theo vế hai bất đẳng thức cùng chiều này, ta được $a^2 + b^2 > 3(a + b)$.

   $$
   a^2 > 3b \quad \text{và} \quad b^2 > 3a \Rightarrow a^2 + b^2 > 3(a + b)
   $$
   *Lí do:* Property of inequalities
3. **Chứng minh bất đẳng thức** — Ta biến đổi vế trái của bất đẳng thức cần chứng minh bằng cách khai triển hằng đẳng thức $(A-B)^2$. Sau đó thay bất đẳng thức $a^2 + b^2 > 3(a + b)$ từ bước trước vào để hoàn tất chứng minh.

   $$
   \begin{gathered}\left(a - \frac{3}{2}\right)^2 + \left(b - \frac{3}{2}\right)^2 = a^2 - 3a + \frac{9}{4} + b^2 - 3b + \frac{9}{4} \\ = (a^2 + b^2) - 3(a + b) + \frac{9}{2} \\ > 3(a + b) - 3(a + b) + \frac{9}{2} = \frac{9}{2}\end{gathered}
   $$
   *Lí do:* Algebraic identities và inequality substitution
4. **Tìm nghiệm chung $x_0$** — Gọi $x_0$ là nghiệm chung. Thay $x_0$ vào cả hai phương trình rồi trừ vế theo vế, ta được $(a - b)(2x_0 - 3) = 0$. Vì hai phương trình có đúng một nghiệm chung nên $a \neq b$ (nếu $a=b$ thì hai phương trình trùng nhau và có hai nghiệm chung). Do đó $2x_0 - 3 = 0 \Rightarrow x_0 = \frac{3}{2}$.

   $$
   \begin{cases} x_0^2 + 2ax_0 + 3b = 0 \ 1 \ x_0^2 + 2bx_0 + 3a = 0 \ (2) \end{cases}
1 - 2 \Rightarrow 2(a - b)x_0 + 3(b - a) = 0 \Rightarrow (a - b)(2x_0 - 3) = 0
\text{Vì } a \neq b \Rightarrow x_0 = \frac{3}{2}
   $$
   *Lí do:* Định nghĩa nghiệm chung
5. **Tìm tổng $a + b$** — Thay $x_0 = \frac{3}{2}$ vào phương trình thứ nhất: $(\frac{3}{2})^2 + 2a(\frac{3}{2}) + 3b = 0 \Rightarrow \frac{9}{4} + 3a + 3b = 0 \Rightarrow a + b = -\frac{3}{4}$.

   $$
   \left(\frac{3}{2}\right)^2 + 2a\left(\frac{3}{2}\right) + 3b = 0 \Rightarrow \frac{9}{4} + 3(a + b) = 0 \Rightarrow a + b = -\frac{3}{4}
   $$
   *Lí do:* Định nghĩa nghiệm
6. **Tính $r + s$ và kết luận** — Theo định lý Vi-ét, tổng hai nghiệm của phương trình thứ nhất là $-2a$, nên $r + x_0 = -2a \Rightarrow r = -2a - x_0$. Tương tự, $s = -2b - x_0$. Tính $r + s = -2(a + b) - 2x_0$. Thay $a + b = -\frac{3}{4}$ và $x_0 = \frac{3}{2}$, ta có $r + s = -2(-\frac{3}{4}) - 2(\frac{3}{2}) = \frac{3}{2} - 3 = -\frac{3}{2}$. Kết quả này không chứa $a$ và $b$.

   $$
   \begin{gathered}r = -2a - x_0, \quad s = -2b - x_0 \\ r + s = -2(a + b) - 2x_0 = -2\left(-\frac{3}{4}\right) - 2\left(\frac{3}{2}\right) = \frac{3}{2} - 3 = -\frac{3}{2}\end{gathered}
   $$
   *Lí do:* Vieta's formulas

**Kết luận của ứng dụng:** a) Đã chứng minh bất đẳng thức đúng.
b) $r + s = -\frac{3}{2}$ (không phụ thuộc vào $a$ và $b$).

$$
r + s = -\frac{3}{2}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Chạy lại: câu a) cộng Δ₁, Δ₂ > 0; câu b) nghiệm chung 3/2, r+s = −3/2. Lỗi 'rac' đã hết.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 13 — `alg8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

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

- Kết luận: **đúng** — 7/10
- Nhận xét: Mô-đun chứng nhận: đúng nhưng văn mẫu cứng ('5 ≥ 0', '1x = −(−4)').

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 14 — `alg8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Giải hệ phương trình $\begin{cases}x^2+y^2=10\\x+y+xy=7\end{cases}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(1;3),(3;1)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 33 s · *Chi phí:* $0.0129

**Hướng giải:** Đặt ẩn phụ $S=x+y, P=xy$ để biến đổi hệ phương trình thành hệ phương trình bậc nhất hoặc bậc hai đơn giản hơn, sau đó giải tìm $S$ và $P$, cuối cùng dùng định lý Vi-ét đảo để tìm $x$ và $y$.
1. **Đặt ẩn phụ và biến đổi hệ** — Đặt $S = x+y$ và $P = xy$. Từ $x^2+y^2=10$, ta có $S^2 - 2P = 10$. Từ $x+y+xy=7$, ta có $S+P=7$. Ta có hệ mới: $\begin{cases} S^2 - 2P = 10 \\ S + P = 7 \end{cases}$.

   $$
   \begin{cases} S^2 - 2P = 10 \\ S + P = 7 \end{cases}
   $$
   *Lí do:* Biến đổi đại số và đặt ẩn phụ
2. **Giải hệ tìm S và P** — Từ $S+P=7$ suy ra $P = 7-S$. Thay vào $S^2 - 2P = 10$ ta được $S^2 - 2(7-S) = 10 \Leftrightarrow S^2 + 2S - 24 = 0$. Phương trình này có nghiệm $S_1 = 4, S_2 = -6$. Với $S=4 \Rightarrow P=3$. Với $S=-6 \Rightarrow P=13$.

   $$
   \begin{cases} S=4, P=3 \\ S=-6, P=13 \end{cases}
   $$
   *Lí do:* Giải phương trình bậc hai
3. **Tìm x và y từ S và P** — Với $S=4, P=3$, $x, y$ là nghiệm của $t^2 - 4t + 3 = 0$. Phương trình này có $\Delta' = 4-3=1 > 0$, nghiệm $t=1, t=3$. Vậy $(x,y) = (1,3)$ hoặc $(3,1)$. Với $S=-6, P=13$, $x, y$ là nghiệm của $t^2 + 6t + 13 = 0$. Phương trình này có $\Delta' = 9-13=-4 < 0$, vô nghiệm thực.

   $$
   \left[\begin{array}{l}x=1\\y=3\end{array}\right.\; ; \; \left[\begin{array}{l}x=3\\y=1\end{array}\right.
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Hệ phương trình có hai nghiệm: $(x; y) = (1; 3)$ và $(x; y) = (3; 1)$.

$$
\left[\begin{array}{l}x=1\\y=3\end{array}\right.\; ; \; \left[\begin{array}{l}x=3\\y=1\end{array}\right.
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: S,P chuẩn; loại S=−6 vì Δ' < 0. Trạng thái 'chưa kiểm chứng' chỉ do một công thức hiển thị chưa đẹp.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 15 — `alg8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default đã kiểm chứng bằng máy. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho hai số thực dương $a,b$ thỏa mãn $a+b=2$. Tìm giá trị nhỏ nhất của biểu thức $P=\frac{1}{a}+\frac{4}{b}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\min P=\frac92$, đạt khi $a=\frac23$, $b=\frac43$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 64 s · *Chi phí:* $0.0195

**Hướng giải:** Biến đổi biểu thức $P$ bằng cách nhân tử và mẫu với $a+b$, sau đó áp dụng bất đẳng thức Cô-si (Cô-si) để tìm giá trị nhỏ nhất. Cuối cùng, giải hệ phương trình để tìm $a$ và $b$ khi dấu bằng xảy ra.
1. **Biến đổi biểu thức P** — Ta biến đổi biểu thức $P$ bằng cách nhân tử và mẫu với $a+b$ (vì $a+b=2$).

   $$
   P = \frac{1}{a} + \frac{4}{b} = \frac{a+b}{a} + \frac{4(a+b)}{b} = 1 + \frac{b}{a} + \frac{4a}{b} + 4 = 5 + \frac{b}{a} + \frac{4a}{b}
   $$
   *Lí do:* Biến đổi đại số
2. **Áp dụng BĐT Cô-si** — Áp dụng bất đẳng thức Cô-si (Cô-si) cho hai số dương $\frac{b}{a}$ và $\frac{4a}{b}$.

   $$
   \frac{b}{a} + \frac{4a}{b} \ge 2\sqrt{\frac{b}{a} \cdot \frac{4a}{b}} = 2\sqrt{4} = 4
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si)
3. **Tìm điều kiện dấu bằng** — Từ kết quả trên, ta có $P \ge 5 + 4 = 9$. Dấu bằng xảy ra khi $\frac{b}{a} = \frac{4a}{b} \Leftrightarrow b^2 = 4a^2 \Leftrightarrow b = 2a$ (vì $a,b > 0$). Kết hợp với $a+b=2$, ta giải hệ phương trình: $\begin{cases} b = 2a \\ a + b = 2 \end{cases} \Rightarrow a + 2a = 2 \Rightarrow 3a = 2 \Rightarrow a = \frac{2}{3}$. Suy ra $b = 2 \cdot \frac{2}{3} = \frac{4}{3}$. Vậy $P_{min} = 9$ khi $a = \frac{2}{3}, b = \frac{4}{3}$.

   $$
   \begin{cases} b = 2a \\ a + b = 2 \end{cases} \Rightarrow a = \frac{2}{3}, b = \frac{4}{3}
   $$
   *Lí do:* Giải hệ phương trình
4. **Kết luận** — Kết luận giá trị nhỏ nhất của biểu thức $P$.

   $$
   P_{min} = \frac{9}{2}
   $$
   *Lí do:* Kết luận

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của biểu thức $P$ là $\frac{9}{2}$ khi $a = \frac{2}{3}$ và $b = \frac{4}{3}$.

$$
P_{min} = \frac{9}{2}
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Chạy lại: nhân với (a+b)/2 rồi Cô-si — gọn hơn lần đầu (lần đầu còn bước sai rồi bỏ). Nhưng bước 3 ghi 'P ≥ 5+4 = 9' và 'P_min = 9' (quên chia 2) trước khi kết luận 9/2 — sai giữa chừng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 16 — `alg8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default máy không kiểm chứng được. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho phương trình $x^2-(m+2)x+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=6$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m=-1\pm\sqrt3$ (phương trình luôn có hai nghiệm phân biệt vì $\Delta=m^2+4>0$)

### Lời giải của ứng dụng

**Không có lời giải.** Không có lời giải (lỗi hệ thống: incomplete).

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Lần đầu: các bước ra m = −1 ± √3 nhưng kết luận 'Không tồn tại' và VẪN hiển thị (bộ đọc đáp số không hiểu '\text{ hoặc }'/'không tồn tại giá trị $m$' — đã sửa). Lần chạy lại: mô hình không viết được lời giải đúng → không hiển thị.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 17 — `alg8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho các số thực $a,b,c$ thỏa mãn $a+b+c=0$ và $a^2+b^2+c^2=6$. Tính $a^4+b^4+c^4$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $18$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 26 s · *Chi phí:* $0.008

**Hướng giải:** Sử dụng hằng đẳng thức $(a+b+c)^2$ để tìm $ab+bc+ca$. Sau đó sử dụng hằng đẳng thức $(a^2+b^2+c^2)^2$ để liên hệ $a^4+b^4+c^4$ với $a^2b^2+b^2c^2+c^2a^2$. Cuối cùng, dùng $(ab+bc+ca)^2$ để tính $a^2b^2+b^2c^2+c^2a^2$ và thay vào để tìm kết quả.
1. **Tìm giá trị của $ab+bc+ca$** — Để tìm giá trị của $ab+bc+ca$, ta bình phương hai vế của phương trình $a+b+c=0$. Áp dụng hằng đẳng thức $(a+b+c)^2 = a^2+b^2+c^2 + 2(ab+bc+ca)$, ta có thể thay các giá trị đã biết vào để tính toán.

   $$
   (a+b+c)^2 = 0^2 \Rightarrow a^2+b^2+c^2 + 2(ab+bc+ca) = 0 \Rightarrow 6 + 2(ab+bc+ca) = 0 \Rightarrow 2(ab+bc+ca) = -6 \Rightarrow ab+bc+ca = -3
   $$
   *Lí do:* Hằng đẳng thức $(a+b+c)^2$ và phép thế giá trị.
2. **Khai triển bình phương $a^2+b^2+c^2$** — Ta cần tính $a^4+b^4+c^4$. Ta bình phương biểu thức $a^2+b^2+c^2$. Áp dụng hằng đẳng thức $(x+y+z)^2 = x^2+y^2+z^2 + 2(xy+yz+zx)$ với $x=a^2, y=b^2, z=c^2$, ta có $(a^2+b^2+c^2)^2 = a^4+b^4+c^4 + 2(a^2b^2+b^2c^2+c^2a^2)$. Ta cần tính tiếp $a^2b^2+b^2c^2+c^2a^2$.

   $$
   (a^2+b^2+c^2)^2 = a^4+b^4+c^4 + 2(a^2b^2+b^2c^2+c^2a^2)
   $$
   *Lí do:* Hằng đẳng thức $(a^2+b^2+c^2)^2$.
3. **Tính $a^2b^2+b^2c^2+c^2a^2$** — Ta có $(ab+bc+ca)^2 = a^2b^2+b^2c^2+c^2a^2 + 2abc(a+b+c)$. Vì $a+b+c=0$ nên $2abc(a+b+c) = 0$. Do đó $a^2b^2+b^2c^2+c^2a^2 = (ab+bc+ca)^2$. Thay giá trị $ab+bc+ca = -3$ đã tìm được ở bước 1 vào, ta tính được $a^2b^2+b^2c^2+c^2a^2$. Sau đó thay vào phương trình ở bước 2 để tìm $a^4+b^4+c^4$.

   $$
   (ab+bc+ca)^2 = a^2b^2+b^2c^2+c^2a^2 + 2abc(a+b+c) \Rightarrow (-3)^2 = a^2b^2+b^2c^2+c^2a^2 + 0 \Rightarrow a^2b^2+b^2c^2+c^2a^2 = 9
   $$
   *Lí do:* Hằng đẳng thức $(ab+bc+ca)^2$ và điều kiện $a+b+c=0$.
4. **Tính giá trị cuối cùng** — Thay $a^2b^2+b^2c^2+c^2a^2 = 9$ vào phương trình từ bước 2: $36 = a^4+b^4+c^4 + 2(9)$. Từ đó suy ra $a^4+b^4+c^4 = 36 - 18 = 18$.

   $$
   36 = a^4+b^4+c^4 + 2(9) \Rightarrow a^4+b^4+c^4 = 36 - 18 = 18
   $$
   *Lí do:* Thay số và giải phương trình.

**Kết luận của ứng dụng:** Giá trị của biểu thức $a^4 + b^4 + c^4$ là $18$.

$$
18
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Chuẩn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 18 — `alg8-h7`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Cho phương trình $x^2-2mx+m^2-1=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m=\pm2$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 151 s · *Chi phí:* $0.0125

**Hướng giải:** Sử dụng hệ thức Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo $m$, sau đó giải phương trình tìm $m$ và kiểm tra điều kiện $\Delta \ge 0$.
1. **Tính biệt thức $\Delta$** — Ta có phương trình $x^2 - 2mx + m^2 - 1 = 0$. Để phương trình có hai nghiệm $x_1, x_2$, ta cần $\Delta \ge 0$. Ta có $\Delta = (-2m)^2 - 4(m^2 - 1) = 4m^2 - 4m^2 + 4 = 4 > 0$. Vậy phương trình luôn có hai nghiệm phân biệt với mọi $m$.

   $$
   \Delta = 4 > 0
   $$
   *Lí do:* Điều kiện để phương trình bậc hai có nghiệm
2. **Áp dụng hệ thức Vi-ét** — Áp dụng hệ thức Vi-ét, ta có $x_1 + x_2 = 2m$ và $x_1 \cdot x_2 = m^2 - 1$. Ta biến đổi $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2 = (2m)^2 - 2(m^2 - 1) = 4m^2 - 2m^2 + 2 = 2m^2 + 2$. Theo đề bài, $x_1^2 + x_2^2 = 10$, nên $2m^2 + 2 = 10$.

   $$
   2m^2 + 2 = 10
   $$
   *Lí do:* Hệ thức Vi-ét và hằng đẳng thức
3. **Giải phương trình tìm $m$** — Giải phương trình $2m^2 + 2 = 10 \Leftrightarrow 2m^2 = 8 \Leftrightarrow m^2 = 4 \Leftrightarrow m = 2$ hoặc $m = -2$. Vì $\Delta = 4 > 0$ với mọi $m$, nên cả hai giá trị $m = 2$ và $m = -2$ đều thỏa mãn điều kiện để phương trình có hai nghiệm phân biệt.

   $$
   m = 2 \text{ hoặc } m = -2
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Vậy $m = 2$ hoặc $m = -2$.

$$
m = 2 \text{ hoặc } m = -2
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Chuẩn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 19 — `alg8-h8`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: không có lời giải. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho phương trình $x^2-(2m+1)x+m^2+m=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=13$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m\in\{-3;2\}$ (hai nghiệm là $m$ và $m+1$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Sử dụng định lý Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo tham số $m$, sau đó giải phương trình theo $m$ và kiểm tra điều kiện có hai nghiệm phân biệt.
1. **Tính biệt thức $\Delta$** — Trước hết, để phương trình có hai nghiệm phân biệt, biệt thức $\Delta$ phải lớn hơn 0.

   $$
   \Delta = [-(2m+1)]^2 - 4(1)(m^2+m) = (2m+1)^2 - 4(m^2+m) = 4m^2 + 4m + 1 - 4m^2 - 4m = 1
   $$
   *Lí do:* Tính biệt thức $\Delta$ của phương trình bậc hai.
2. **Xét điều kiện có hai nghiệm phân biệt** — Vì $\Delta = 1 > 0$ với mọi $m$, nên phương trình luôn có hai nghiệm phân biệt với mọi giá trị của $m$.

   $$
   \Delta = 1 > 0 \quad \forall m
   $$
   *Lí do:* Từ $\Delta = 1$, suy ra phương trình luôn có hai nghiệm phân biệt.
3. **Áp dụng định lý Vi-ét** — Áp dụng định lý Vi-ét, ta có tổng và tích của hai nghiệm theo $m$. Sau đó, biến đổi $x_1^2 + x_2^2$ thành $(x_1 + x_2)^2 - 2x_1 x_2$.

   $$
   \begin{cases} x_1 + x_2 = 2m + 1 \\ x_1 x_2 = m^2 + m \end{cases}
   $$
   *Lí do:* Áp dụng định lý Vi-ét cho phương trình $x^2 - (2m+1)x + m^2 + m = 0$.
4. **Biểu diễn $x_1^2 + x_2^2$ theo $m$** — Thay các biểu thức theo $m$ vào điều kiện $x_1^2 + x_2^2 = 13$ để tìm $m$.

   $$
   x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = (2m+1)^2 - 2(m^2+m) = 4m^2 + 4m + 1 - 2m^2 - 2m = 2m^2 + 2m + 1
   $$
   *Lí do:* Biến đổi biểu thức $x_1^2 + x_2^2$ theo $m$.
5. **Lập và giải phương trình theo $m$** — Giải phương trình $2m^2 + 2m + 1 = 13$ để tìm $m$.

   $$
   2m^2 + 2m + 1 = 13 \Leftrightarrow 2m^2 + 2m - 12 = 0 \Leftrightarrow m^2 + m - 6 = 0
   $$
   *Lí do:* Giải phương trình bậc hai theo $m$.
6. **Tìm giá trị của $m$** — Phương trình $m^2 + m - 6 = 0$ có $a+b+c = 1+1-6 \neq 0$ và $a-b+c = 1-1-6 \neq 0$, nhưng ta có thể phân tích nhân tử: $m^2 + m - 6 = (m-2)(m+3) = 0$. Vậy $m = 2$ hoặc $m = -3$. Cả hai giá trị này đều thỏa mãn điều kiện $\Delta > 0$.

   $$
   \left[ \begin{array}{l} m = 2 \\ m = -3 \end{array} \right.
   $$
   *Lí do:* Giải phương trình $m^2 + m - 6 = 0$.

**Kết luận của ứng dụng:** Giá trị của $m$ là $2$ hoặc $-3$.

$$
m = 2 \text{ hoặc } m = -3
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chạy lại: Δ = 1, m ∈ {2; −3}. Câu thừa 'a+b+c ≠ 0, a−b+c ≠ 0, nhưng…'.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 20 — `alg8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra vòng trước (bạn đã chấm)

**Đề bài.** Một người đi xe đạp từ $A$ đến $B$ cách nhau $36$ km. Lúc về, người đó tăng vận tốc thêm $3$ km/h nên thời gian về ít hơn thời gian đi $36$ phút. Tính vận tốc của người đó lúc đi.

**Đáp án tham khảo** (verified by SymPy/enumeration): $12$ km/h

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 41 s · *Chi phí:* $0.0145

**Hướng giải:** Đổi 36 phút sang giờ, đặt ẩn vận tốc đi là $v$, lập phương trình dựa trên hiệu thời gian đi và về, rồi giải phương trình bậc hai theo $v$.
1. **Đổi đơn vị thời gian** — Đầu tiên, bạn đổi đơn vị thời gian cho đồng nhất với vận tốc (km/h). 36 phút bằng $\frac{36}{60}$ giờ, tức là $\frac{3}{5}$ giờ.

   $$
   36 \text{ phút} = \frac{36}{60} \text{ giờ} = \frac{3}{5} \text{ giờ}
   $$
   *Lí do:* Đổi đơn vị
2. **Biểu diễn thời gian** — Gọi vận tốc lúc đi là $v$ (km/h). Điều kiện $v > 0$. Vận tốc lúc về là $v + 3$ (km/h). Thời gian đi là $\frac{36}{v}$ (giờ) và thời gian về là $\frac{36}{v+3}$ (giờ).

   $$
   t_{đi} = \frac{36}{v}, \quad t_{về} = \frac{36}{v+3}
   $$
   *Lí do:* Công thức $t = \frac{S}{v}$
3. **Lập phương trình** — Theo đề bài, thời gian về ít hơn thời gian đi là $\frac{3}{5}$ giờ, nên ta có phương trình: $\frac{36}{v} - \frac{36}{v+3} = \frac{3}{5}$.

   $$
   \frac{36}{v} - \frac{36}{v+3} = \frac{3}{5}
   $$
   *Lí do:* Đề bài
4. **Giải phương trình** — Quy đồng mẫu thức hai vế phương trình: $\frac{36(v+3) - 36v}{v(v+3)} = \frac{3}{5}$. Rút gọn tử số: $36v + 108 - 36v = 108$. Phương trình trở thành: $\frac{108}{v(v+3)} = \frac{3}{5}$. Nhân chéo: $108 \cdot 5 = 3v(v+3)$, hay $540 = 3v^2 + 9v$. Chia cả hai vế cho 3: $v^2 + 3v - 180 = 0$.

   $$
   v^2 + 3v - 180 = 0
   $$
   *Lí do:* Giải phương trình
5. **Tìm nghiệm thích hợp** — Phương trình $v^2 + 3v - 180 = 0$ có $a - c = 1 - (-180) = 181$ không phải số chính phương. Ta dùng công thức nghiệm: $\Delta = 3^2 - 4(1)(-180) = 9 + 720 = 729$. $\sqrt{729} = 27$. Nghiệm là $v = \frac{-3 \pm 27}{2}$. Ta có $v_1 = \frac{24}{2} = 12$ và $v_2 = \frac{-30}{2} = -15$. Vì $v > 0$ nên $v = 12$ (nhận), $v = -15$ (loại).

   $$
   v = 12 \text{ (km/h)}
   $$
   *Lí do:* Giải phương trình bậc hai

**Kết luận của ứng dụng:** Vận tốc của người đó lúc đi là 12 km/h.

$$
v = 12 \text{ km/h}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Đúng; có nhận xét thừa 'a − c = 181 không phải số chính phương'.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 21 — `alg9-f1`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Giải phương trình $x+\sqrt{2x+3}=6$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $x=3$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 131 s · *Chi phí:* $0.0059

**Hướng giải:** Đặt ẩn phụ $t = \sqrt{2x+3}$ để chuyển phương trình chứa căn về phương trình bậc hai theo $t$, giải tìm $t$ rồi tìm $x$.
1. **Điều kiện xác định** — Trước hết, ta xác định điều kiện để căn thức có nghĩa.

   $$
   2x + 3 \ge 0 \Leftrightarrow x \ge -\frac{3}{2}
   $$
   *Lí do:* Điều kiện xác định của căn thức bậc hai
2. **Đặt ẩn phụ** — Đặt ẩn phụ $t = \sqrt{2x+3}$ với $t \ge 0$. Khi đó $t^2 = 2x+3$, suy ra $x = \frac{t^2-3}{2}$. Thay vào phương trình ban đầu.

   $$
   \frac{t^2-3}{2} + t = 6 \Leftrightarrow t^2 + 2t - 15 = 0
   $$
   *Lí do:* Đặt ẩn phụ và biến đổi đại số
3. **Giải phương trình theo t** — Giải phương trình bậc hai $t^2 + 2t - 15 = 0$. Ta có $a+b+c = 1+2-15 \ne 0$, nhưng $a-b+c = 1-2-15 \ne 0$. Tuy nhiên, ta có thể phân tích nhân tử: $t^2 + 2t - 15 = (t+5)(t-3) = 0$. Vậy $t = -5$ hoặc $t = 3$. Do điều kiện $t \ge 0$, ta chọn $t = 3$.

   $$
   \left[ \begin{array}{l} t = -5 \text{ (loại)} \\ t = 3 \text{ (nhận)} \end{array} \right.
   $$
   *Lí do:* Giải phương trình bậc hai và điều kiện ẩn phụ
4. **Tìm x** — Với $t = 3$, ta có $\sqrt{2x+3} = 3$. Bình phương hai vế: $2x+3 = 9 \Rightarrow 2x = 6 \Rightarrow x = 3$. Kiểm tra điều kiện: $x = 3 \ge -1.5$ (thỏa mãn).

   $$
   x = 3
   $$
   *Lí do:* Tìm x từ t và kiểm tra điều kiện

**Kết luận của ứng dụng:** Phương trình có nghiệm duy nhất $x = 3$.

$$
x = 3
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Đặt t = √(2x+3); có câu thừa về a+b+c.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 22 — `alg9-f2`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Giải hệ phương trình $\begin{cases}x+y=5\\x^3+y^3=35\end{cases}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(2;3),(3;2)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 15 s · *Chi phí:* $0.0055

**Hướng giải:** Sử dụng hằng đẳng thức $x^3 + y^3 = (x + y)(x^2 - xy + y^2)$ để tìm tích $xy$. Sau đó, áp dụng định lý Vi-ét đảo để tìm $x$ và $y$ thông qua phương trình bậc hai.
1. **Tìm tích $xy$** — Ta sử dụng hằng đẳng thức $x^3 + y^3 = (x + y)(x^2 - xy + y^2)$ để biến đổi phương trình thứ hai. Sau đó, biến đổi $x^2 - xy + y^2$ thành $(x + y)^2 - 3xy$ để thay các giá trị đã biết vào.

   $$
   35 = 5 \cdot ((x + y)^2 - 3xy) \Rightarrow 7 = 25 - 3xy \Rightarrow 3xy = 18 \Rightarrow xy = 6
   $$
   *Lí do:* Hằng đẳng thức $x^3 + y^3 = (x + y)(x^2 - xy + y^2)$ và biến đổi đại số.
2. **Tìm $x$ và $y$** — Ta có hệ mới: $x + y = 5$ và $xy = 6$. Theo định lý Vi-ét đảo, $x$ và $y$ là hai nghiệm của phương trình bậc hai $X^2 - 5X + 6 = 0$. Giải phương trình này ta tìm được $x$ và $y$.

   $$
   X^2 - 5X + 6 = 0 \Rightarrow \Delta = 25 - 24 = 1 \Rightarrow X = \frac{5 \pm 1}{2} \Rightarrow \left[\begin{array}{l}X = 3\\X = 2\end{array}\right.
   $$
   *Lí do:* Định lý Vi-ét đảo và công thức nghiệm phương trình bậc hai.

**Kết luận của ứng dụng:** Hệ phương trình có hai nghiệm: $(x; y) = (2; 3)$ và $(x; y) = (3; 2)$.

$$
\begin{cases}x=2\\y=3\end{cases} \text{ hoặc } \begin{cases}x=3\\y=2\end{cases}
$$

### Claude tự chấm

- Kết luận: **đúng** — 9/10
- Nhận xét: Gọn: x³+y³ = (x+y)((x+y)²−3xy) → xy = 6.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 23 — `alg9-f3`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default máy không kiểm chứng được. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Cho phương trình $x^2-2(m-1)x+m-3=0$ ($m$ là tham số). Tìm $m$ để phương trình có hai nghiệm $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=10$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $m\in\{0;\frac52\}$ ($\Delta'=m^2-3m+4>0$ với mọi $m$)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 28 s · *Chi phí:* $0.0095

**Hướng giải:** Tính biệt thức $\Delta$ để đảm bảo phương trình có hai nghiệm. Sử dụng định lý Vi-ét để biểu diễn $x_1^2 + x_2^2$ theo $m$. Giải phương trình tìm $m$ và kiểm tra điều kiện.
1. **Tính biệt thức $\Delta$** — Trước hết, ta tính biệt thức $\Delta$ để đảm bảo phương trình có nghiệm.

   $$
   \Delta = [-2(m-1)]^2 - 4(1)(m-3) = 4(m-1)^2 - 4(m-3) = 4(m^2 - 2m + 1) - 4m + 12 = 4m^2 - 8m + 4 - 4m + 12 = 4m^2 - 12m + 16
   $$
   *Lí do:* Công thức tính biệt thức $\Delta = b^2 - 4ac$
2. **Áp dụng định lý Vi-ét** — Áp dụng định lý Vi-ét, ta có tổng và tích của hai nghiệm.

   $$
   \begin{cases} x_1 + x_2 = 2(m-1) \\ x_1 x_2 = m - 3 \end{cases}
   $$
   *Lí do:* Định lý Vi-ét cho phương trình $x^2 + bx + c = 0$
3. **Biến đổi biểu thức $x_1^2 + x_2^2$** — Biến đổi biểu thức $x_1^2 + x_2^2$ theo $S$ và $P$, sau đó thay vào điều kiện đề bài.

   $$
   x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = [2(m-1)]^2 - 2(m-3) = 4(m^2 - 2m + 1) - 2m + 6 = 4m^2 - 8m + 4 - 2m + 6 = 4m^2 - 10m + 10
   $$
   *Lí do:* Hằng đẳng thức $(a+b)^2 = a^2 + 2ab + b^2$
4. **Giải phương trình tìm $m$** — Giải phương trình tìm $m$ từ điều kiện $x_1^2 + x_2^2 = 10$.

   $$
   4m^2 - 10m + 10 = 10 \Leftrightarrow 4m^2 - 10m = 0 \Leftrightarrow 2m(2m - 5) = 0 \Leftrightarrow \left[\begin{array}{l} m = 0 \\ m = \frac{5}{2} \end{array}\right.
   $$
   *Lí do:* Giải phương trình bậc hai
5. **Kiểm tra điều kiện** — Kiểm tra điều kiện để phương trình có hai nghiệm. Ta đã chứng minh $\Delta > 0$ với mọi $m$, nên cả hai giá trị $m$ đều thỏa mãn.

   $$
   \Delta = 4(m^2 - 3m + 4) = 4[(m - \frac{3}{2})^2 + \frac{7}{4}] > 0 \quad \forall m
   $$
   *Lí do:* Biểu thức $\Delta$ luôn dương với mọi $m$

**Kết luận của ứng dụng:** Giá trị của $m$ là $m = 0$ hoặc $m = \frac{5}{2}$.

$$
m = 0 \text{ hoặc } m = \frac{5}{2}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Chạy lại: m ∈ {0; 5/2}, Δ > 0 với mọi m. (Lần đầu: các bước đúng nhưng kết luận 'm = 2 hoặc −1/3' và VẪN hiển thị — đã sửa bộ đọc đáp số.)

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 24 — `alg9-f4`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

> **Chạy lại sau khi sửa lỗi.** Lần chạy đầu của vòng này: default máy không kiểm chứng được. Dưới đây là kết quả lần chạy lại.

**Đề bài.** Rút gọn biểu thức $A=\left(\frac{\sqrt x}{\sqrt x-1}-\frac{1}{x-\sqrt x}\right):\frac{\sqrt x+1}{x-1}$ với $x>0$, $x\ne1$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $A=\frac{x-1}{\sqrt x}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 17 s · *Chi phí:* $0.0069

> **KHÔNG HIỂN THỊ cho học sinh** — bộ kiểm tra phát hiện: (sqrt(4)/(sqrt(4)-1) - 1/(4-sqrt(4))) / ((sqrt(4)+1)/(4-1))

**Hướng giải:** Phân tích các mẫu thức thành nhân tử để quy đồng, rút gọn biểu thức trong ngoặc, sau đó thực hiện phép chia và rút gọn kết quả cuối cùng.
1. **Phân tích mẫu thức** — Để tính được giá trị trong ngoặc, ta cần quy đồng mẫu thức. Đầu tiên, ta phân tích các mẫu thức thành nhân tử.

   $$
   x - \sqrt{x} = \sqrt{x}(\sqrt{x} - 1) \quad \text{và} \quad x - 1 = (\sqrt{x} - 1)(\sqrt{x} + 1)
   $$
   *Lí do:* Phân tích đa thức thành nhân tử (đặt nhân tử chung và hằng đẳng thức hiệu hai bình phương).
2. **Rút gọn biểu thức trong ngoặc** — Ta quy đồng và thực hiện phép trừ trong ngoặc đơn.

   $$
   \begin{aligned} \frac{\sqrt x}{\sqrt x-1}-\frac{1}{x-\sqrt x} &= \frac{\sqrt x \cdot \sqrt x}{\sqrt x(\sqrt x-1)} - \frac{1}{\sqrt x(\sqrt x-1)} \\ &= \frac{x - 1}{\sqrt x(\sqrt x-1)} \\ &= \frac{(\sqrt x-1)(\sqrt x+1)}{\sqrt x(\sqrt x-1)} \\ &= \frac{\sqrt x+1}{\sqrt x} \end{aligned}
   $$
   *Lí do:* Quy đồng mẫu thức, trừ phân thức và rút gọn phân thức bằng cách hủy bỏ nhân tử chung $(\sqrt{x}-1)$.
3. **Thực hiện phép chia** — Thực hiện phép chia bằng cách nhân với phân thức đảo ngược.

   $$
   A = \frac{\sqrt x+1}{\sqrt x} : \frac{\sqrt x+1}{x-1} = \frac{\sqrt x+1}{\sqrt x} \cdot \frac{x-1}{\sqrt x+1}
   $$
   *Lí do:* Phép chia phân thức.
4. **Kết quả cuối cùng** — Rút gọn kết quả cuối cùng.

   $$
   A = \frac{x-1}{x} \cdot \frac{x}{x-1} = 1
   $$
   *Lí do:* Nhân hai căn thức $\sqrt{x} \cdot \sqrt{x} = x$ và rút gọn phân thức.

**Kết luận của ứng dụng:** Biểu thức đã rút gọn là $A = 1$.

$$
A = 1
$$

### Claude tự chấm

- Kết luận: **không hiển thị** — 0/10
- Nhận xét: Cả hai lần mô hình rút gọn sai ra A = 1 (đúng: (x−1)/√x); lần đầu còn có 'Wait' và VẪN hiển thị, nay bị chặn (phép thử số x=4 phát hiện).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 25 — `alg9-f5`

*Nguồn đề:* authored 2026-10-15 11:00 before the second run's model calls (verified); never used for a fix · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho ba số thực dương $a,b,c$ thỏa mãn $a+b+c=3$. Tìm giá trị nhỏ nhất của $P=\frac{a^2}{b}+\frac{b^2}{c}+\frac{c^2}{a}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $\min P=3$, đạt khi $a=b=c=1$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 56 s · *Chi phí:* $0.0141

**Hướng giải:** Áp dụng bất đẳng thức Cô-si (Cô-si) cho từng cặp số $\frac{a^2}{b}$ và $b$, $\frac{b^2}{c}$ và $c$, $\frac{c^2}{a}$ và $a$. Sau đó cộng vế theo vế các bất đẳng thức và thay $a + b + c = 3$ để tìm giá trị nhỏ nhất của $P$.
1. **Áp dụng BĐT Cô-si cho cặp số đầu tiên** — Mình sẽ áp dụng bất đẳng thức Cô-si (Cô-si) cho hai số dương $\frac{a^2}{b}$ và $b$.

   $$
   \frac{a^2}{b} + b \ge 2\sqrt{\frac{a^2}{b} \cdot b} = 2a
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si) cho hai số dương
2. **Áp dụng BĐT Cô-si cho các cặp số còn lại** — Tương tự, mình áp dụng bất đẳng thức Cô-si cho hai cặp số còn lại.

   $$
   \frac{b^2}{c} + c \ge 2b, \quad \frac{c^2}{a} + a \ge 2c
   $$
   *Lí do:* Bất đẳng thức Cô-si (Cô-si) cho hai số dương
3. **Cộng vế theo vế các bất đẳng thức** — Cộng vế theo vế ba bất đẳng thức vừa tìm được, ta được một bất đẳng thức mới liên quan đến $P$.

   $$
   \left(\frac{a^2}{b} + b\right) + \left(\frac{b^2}{c} + c\right) + \left(\frac{c^2}{a} + a\right) \ge 2a + 2b + 2c
   $$
   *Lí do:* Cộng vế theo vế các bất đẳng thức
4. **Tìm giá trị nhỏ nhất của P** — Thay $a + b + c = 3$ vào bất đẳng thức trên, mình sẽ tìm được giá trị nhỏ nhất của $P$.

   $$
   P + 3 \ge 2 \cdot 3 \Rightarrow P \ge 6 - 3 \Rightarrow P \ge 3
   $$
   *Lí do:* Thay $a + b + c = 3$ vào bất đẳng thức
5. **Xét điều kiện dấu bằng** — Dấu bằng trong bất đẳng thức Cô-si xảy ra khi các số hạng bằng nhau, tức là $\frac{a^2}{b} = b$, $\frac{b^2}{c} = c$, $\frac{c^2}{a} = a$. Điều này dẫn đến $a = b = c$. Kết hợp với $a + b + c = 3$, ta tìm được bộ số cụ thể.

   $$
   a = b = c = 1
   $$
   *Lí do:* Điều kiện dấu bằng trong bất đẳng thức Cô-si
6. **Kết luận** — Vậy giá trị nhỏ nhất của $P$ là 3, đạt được khi $a = b = c = 1$.

   $$
   P_{min} = 3
   $$
   *Lí do:* Kết hợp kết quả tìm được và điều kiện dấu bằng

**Kết luận của ứng dụng:** Giá trị nhỏ nhất của $P$ là $3$, đạt được khi $a = b = c = 1$.

$$
3
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Cô-si a²/b + b ≥ 2a, cộng lại — chuẩn; xưng 'mình'.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 26 — `ptnk-2025-chuyen/1a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* câu MỚI — chưa từng dùng để sửa lỗi

**Đề bài.** Cho phương trình $x^2-2(m+1)x+2m=0$ ($m$ là tham số). Chứng minh rằng với mọi $m$ phương trình luôn có hai nghiệm phân biệt $x_1,x_2$.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

*Nguồn:* `deterministic-algebra` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Xác định hệ số, tính biệt thức theo tham số, hoàn thành bình phương để xét dấu với mọi giá trị; nếu khẳng định sai thì chỉ ra phản ví dụ cụ thể.
1. **Xác định các hệ số và điều kiện dùng biệt thức** — Xét phương trình theo ẩn $x$; $m$ là tham số. Hệ số bậc hai $a=1\ne0$ không phụ thuộc tham số, nên ở mọi giá trị của tham số ta thực sự có phương trình bậc hai.

   $$
   a=1,\quad b=-2m-2,\quad c=2m
   $$
   *Lí do:* Hệ số của phương trình bậc hai; phân biệt ẩn và tham số
2. **Tính biệt thức theo tham số** — Thay đúng hệ số bậc nhất và hạng tử tự do vào công thức biệt thức, khai triển bình phương rồi thu gọn. Điều kiện để có hai nghiệm thực phân biệt là biệt thức dương, chứ không phải chỉ không âm.

   $$
   \begin{gathered}\Delta=b^2-4ac=(-2m-2)^2-4(1)(2m)\\\Delta=4m^{2}+4\end{gathered}
   $$
   *Lí do:* Công thức biệt thức và điều kiện có hai nghiệm phân biệt
3. **Chứng minh dấu với mọi giá trị tham số** — Hoàn thành bình phương như biểu thức bên dưới. Bình phương luôn không âm, hệ số của nó dương, còn hằng số $4$ dương. Vì thế biệt thức luôn lớn hơn hoặc bằng hằng số dương này ở mọi số thực $m$.

   $$
   \Delta=4m^{2}+4\ge4>0
   $$
   *Lí do:* Bình phương không âm; xét dấu hằng số
4. **Áp dụng điều kiện nghiệm và kết luận** — Hệ số bậc hai khác không và biệt thức dương đã được chứng minh cho mọi tham số, nên công thức nghiệm cho hai nghiệm thực phân biệt. Vậy với mọi số thực $m$, phương trình đã cho có hai nghiệm thực phân biệt.
   *Lí do:* Phân loại nghiệm thực của phương trình bậc hai bằng biệt thức

**Kết luận của ứng dụng:** Vậy với mọi số thực $m$, phương trình đã cho có hai nghiệm thực phân biệt.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Mô-đun chứng nhận: Δ = 4m²+4 > 0. Hơi dài.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
