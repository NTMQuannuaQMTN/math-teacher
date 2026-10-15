# Số học — vòng 1

Câu hỏi, lời giải thực tế của ứng dụng (không chỉnh sửa), đáp án tham khảo, điểm Claude tự chấm và ô để bạn đánh giá.
Điền vào **Đánh giá của bạn** ở mỗi câu; Claude dùng các đánh giá này cho vòng sửa tiếp theo.

| # | Câu | Tập | Nguồn lời giải | Trạng thái máy | Claude chấm | Thời gian | Chi phí |
|---:|---|---|---|---|---|---:|---:|
| 1 | `ptnk-2023-chuyen/4a` | luyện | default | máy không kiểm chứng được | đúng 8/10 | 80 s | $0.0189 |
| 2 | `ptnk-2024-chuyen/3b` | luyện | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 3 | `ptnk-2024-chuyen/3c` | luyện | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 4 | `ptnk-2025-chuyen/3a` | luyện | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 5 | `ptnk-2025-chuyen/3b` | luyện | deterministic-number-theory | kiểm chứng một phần | đúng 7/10 | 0 s | $0 |
| 6 | `hcm-2025-chuyen/4a` | luyện | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 7 | `hanoi-2025-chuyen/II.1` | luyện | default | máy không kiểm chứng được | đúng 7/10 | 106 s | $0.0237 |
| 8 | `hanoi-2025-chuyen/II.2` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 97 s | $0.0227 |
| 9 | `khtn-2025-vong2/II.1` | luyện | default | đã kiểm chứng bằng máy | đúng 8/10 | 100 s | $0.0233 |
| 10 | `ptnk-2026-chuyen/3` | luyện | deterministic-number-theory | đã kiểm chứng bằng máy | đúng 8/10 | 0 s | $0 |
| 11 | `nt8-h1` | kiểm tra (mới) | default | CHƯA kiểm chứng (có kiểm tra thất bại) | đúng — nhưng bị giữ lại nhầm 6/10 | 130 s | $0.0055 |
| 12 | `nt8-h2` | kiểm tra (mới) | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 121 s | $0.0036 |
| 13 | `nt8-h3` | kiểm tra (mới) | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 121 s | $0.0035 |
| 14 | `nt8-h4` | kiểm tra (mới) | default | máy không kiểm chứng được | SAI — đã hiển thị 0/10 | 143 s | $0.0082 |
| 15 | `nt8-h5` | kiểm tra (mới) | lỗi: incomplete | không có lời giải | không có lời giải 0/10 | 230 s | $0 |
| 16 | `nt8-h6` | kiểm tra (mới) | default | máy không kiểm chứng được | SAI — đã hiển thị 0/10 | 25 s | $0.01 |

## Câu 1 — `ptnk-2023-chuyen/4a`

*Nguồn đề:* exam ptnk-2023-chuyen · *Tập:* luyện

**Đề bài.** Cho $m,n$ là các số nguyên không âm thỏa mãn $m^2-n=1$. Đặt $n^2-m=a$. Chứng minh rằng $a$ là số lẻ.

**Đáp án tham khảo** (official): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 80 s · *Chi phí:* $0.0189

**Hướng giải:** Mình sẽ biểu diễn $n$ theo $m$ từ phương trình đầu, thay vào biểu thức của $a$, sau đó nhóm các số hạng và xét tính chẵn lẻ của từng phần để chứng minh $a$ luôn lẻ.
1. **Biểu diễn $n$ theo $m$** — Từ phương trình $m^2 - n = 1$, bạn có thể dễ dàng tìm được $n$ theo $m$. Vì $m, n$ là số nguyên không âm, hãy xem $m$ phải thỏa mãn điều kiện gì nhé.

   $$
   n = m^2 - 1 \quad (m \ge 1)
   $$
   *Lí do:* Biến đổi đại số cơ bản
2. **Thay $n$ vào biểu thức của $a$** — Bây giờ bạn thay $n = m^2 - 1$ vào $a = n^2 - m$ để biểu diễn $a$ chỉ qua $m$.

   $$
   a = (m^2 - 1)^2 - m = m^4 - 2m^2 + 1 - m
   $$
   *Lí do:* Thay thế và khai triển hằng đẳng thức
3. **Nhóm các số hạng để xét tính chẵn lẻ** — Để chứng minh $a$ là số lẻ, mình sẽ nhóm $m^4 - m$ lại và viết lại $a$ thành tổng của các phần chẵn và phần lẻ.

   $$
   a = m(m^3 - 1) - 2m^2 + 1 = m(m - 1)(m^2 + m + 1) - 2m^2 + 1
   $$
   *Lí do:* Phân tích nhân tử và biến đổi đại số
4. **Xét tính chẵn lẻ của từng phần** — Tích $m(m - 1)$ là tích của hai số nguyên liên tiếp nên luôn chẵn. Do đó $m(m - 1)(m^2 + m + 1)$ chẵn. $2m^2$ cũng chẵn. Vậy $a$ là hiệu của hai số chẵn cộng với $1$.

   $$
   a = \text{số chẵn} - \text{số chẵn} + 1 \Rightarrow a \text{ là số lẻ}
   $$
   *Lí do:* Tính chất chẵn lẻ của số nguyên

**Kết luận của ứng dụng:** Ta đã chứng minh được $a$ luôn là số lẻ với mọi cặp số nguyên không âm $m, n$ thỏa mãn đề bài.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: n = m² − 1 (nên m ≥ 1), a = m(m − 1)(m² + m + 1) − 2m² + 1; m(m − 1) chẵn nên a lẻ. Gọn, đúng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 2 — `ptnk-2024-chuyen/3b`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Với mỗi số tự nhiên $n$, đặt $a_n=\left(2+\sqrt3\right)^n+\left(2-\sqrt3\right)^n$. Tìm $n$ để $a_n$ chia hết cho 4.

**Đáp án tham khảo** (official): $n$ lẻ

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh công thức truy hồi và tính nguyên, rồi theo dõi cặp số dư để chứng minh chu kỳ đầy đủ.
1. **Đặt tên cho hai cơ số và tính tổng, tích** — Đặt $p=2+\sqrt{3}$, $q=2-\sqrt{3}$. Khai triển, gộp các hạng tử cùng căn để tính tổng và tích như bên dưới. Tích $pq=1\ne0$ nên cả hai cơ số khác không; biểu thức xác định cả ở chỉ số $0$.

   $$
   p=2+\sqrt{3},\quad q=2-\sqrt{3},\quad p+q=(2+\sqrt{3})+(2-\sqrt{3})=4,\quad pq=(2+\sqrt{3})(2-\sqrt{3})=1,\quad a_n= p^{n}+q^{n}
   $$
   *Lí do:* Đặt tên; khai triển và rút gọn căn; điều kiện của lũy thừa
2. **Dựng phương trình bậc hai mà cả hai cơ số thỏa mãn** — Khai triển tích $(t-p)(t-q)$ rồi thay tổng và tích vừa tính. Cho $t=p$ hoặc $t=q$ làm tích bằng $0$, nên cả hai cơ số thỏa mãn phương trình bậc hai này. Chuyển hạng tử tự do sang vế phải để viết bình phương theo cơ số.

   $$
   \begin{gathered}(t-p)(t-q)=t^2-4t+1\\p^2=4p-1,\quad q^2=4q-1\end{gathered}
   $$
   *Lí do:* Khai triển tích; Vi-ét đảo; chuyển vế
3. **Nhân với lũy thừa rồi cộng hai đẳng thức** — Với mọi số nguyên $n\ge0$, nhân đẳng thức của $p$ với $p^{n}$ và của $q$ với $q^{n}$. Dùng quy tắc nhân các lũy thừa cùng cơ số, rồi cộng hai đẳng thức. Nhóm theo định nghĩa của dãy để được đúng quan hệ cần chứng minh; lập luận đúng ở mọi chỉ số, không chỉ một vài số đầu.

   $$
   \begin{gathered}p^{n+2}=4p^{n+1}-p^{n}\\q^{n+2}=4q^{n+1}-q^{n}\\a_{n+2}=4(p^{n+1}+q^{n+1})-(p^{n}+q^{n})\\a_{n+2}=4a_{n+1}-a_n\end{gathered}
   $$
   *Lí do:* Nhân đẳng thức; quy tắc lũy thừa; cộng và thay định nghĩa dãy
4. **Chứng minh mọi số hạng là số nguyên** — Hai cơ số khác0 cho $a_0=2$; tổng của chúng cho $a_1=4$. Đây đều là số nguyên. Công thức vừa chứng minh chỉ nhân với các hệ số nguyên rồi trừ, nên từ hai số hạng nguyên suy ra số hạng tiếp theo nguyên. Bắt đầu từ chỉ số0, lập luận lần lượt chứng minh tất cả số hạng nguyên; vì vậy phép xét chia hết có nghĩa.

   $$
   a_0=2,\quad a_1=4,\quad a_{n+2}=4a_{n+1}-a_n
   $$
   *Lí do:* Hai số hạng đầu nguyên; công thức truy hồi giữ tính nguyên
5. **Theo dõi hai số hạng liên tiếp để bảo đảm chu kỳ** — Xét cặp số dư $(a_n,a_{n+1})$ khi chia $4$. Công thức truy hồi xác định duy nhất cặp kế tiếp từ cặp hiện tại. Có nhiều nhất $16$ cặp; khi một cặp lặp lại, toàn bộ các cặp sau lặp theo cùng cách. Phải trùng cả hai số dư, không chỉ một số hạng.

   $$
   (u,v)\longmapsto(v,4v-u)\pmod{4}
   $$
   *Lí do:* Trạng thái gồm hai số hạng; chuyển trạng thái duy nhất trên tập hữu hạn
6. **Tính các cặp số dư từ chỉ số 0 đến 1** — Bắt đầu từ cặp số dư của $(2,4)$, dùng đúng công thức truy hồi để tính mỗi cặp kế tiếp. Bảng ghi cả hai số dư; những cột có số dư của $a_n$ bằng0 là chỉ số được nhận.

   $$
   \begin{array}{c|cc}n&0&1\\\hline a_n\bmod 4&2&0\\a_{n+1}\bmod 4&0&2\end{array}
   $$
   *Lí do:* Tính từng chuyển trạng thái; đối chiếu điều kiện chia hết
7. **Chứng minh phần trước chu kỳ và mọi chu kỳ tiếp theo** — Cặp ở chỉ số $2$ là $(2,0)$, đúng bằng cặp ở chỉ số $0$. Không cặp nào trước đó lặp. Vì chuyển trạng thái là duy nhất, từ chỉ số $0$ các cặp lặp theo chu kỳ $2$. Chu kỳ bắt đầu ngay ở chỉ số0, nên mọi chỉ số đều nằm trong một chu kỳ đã kiểm tra.

   $$
   (a_{2},a_{3})\equiv(a_{0},a_{1})\equiv(2,0)\pmod{4}
   $$
   *Lí do:* Cùng cặp đầu vào cho cùng cặp đầu ra ở mọi lần tiếp theo; chứng minh chu kỳ đầy đủ
8. **Kết luận mọi chỉ số thỏa mãn, không chỉ các số đầu** — Chu kỳ bắt đầu từ chỉ số0; trong mỗi chu kỳ, nhận đúng các vị trí có số dư0 của bảng. Các vị trí khác đều có số dư khác0, nên không chia hết. Vậy tất cả chỉ số cần tìm là $n=1+2k,\ k\in\mathbb Z,\ k\ge0$.
   *Lí do:* Phần đầu và chu kỳ bao quát mọi số tự nhiên; điều kiện cần và đủ

**Kết luận của ứng dụng:** Vậy tất cả chỉ số cần tìm là $n=1+2k,\ k\in\mathbb Z,\ k\ge0$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Bộ xác định (đã kiểm chứng): n lẻ.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 3 — `ptnk-2024-chuyen/3c`

*Nguồn đề:* exam ptnk-2024-chuyen · *Tập:* luyện

**Đề bài.** Với mỗi số tự nhiên $n$, đặt $a_n=\left(2+\sqrt3\right)^n+\left(2-\sqrt3\right)^n$. Tìm $n$ để $a_n$ chia hết cho 14.

**Đáp án tham khảo** (official): $n=4k+2$ (tức $n=8k+2$ hoặc $n=8k+6$)

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chứng minh công thức truy hồi và tính nguyên, rồi theo dõi cặp số dư để chứng minh chu kỳ đầy đủ.
1. **Đặt tên cho hai cơ số và tính tổng, tích** — Đặt $p=2+\sqrt{3}$, $q=2-\sqrt{3}$. Khai triển, gộp các hạng tử cùng căn để tính tổng và tích như bên dưới. Tích $pq=1\ne0$ nên cả hai cơ số khác không; biểu thức xác định cả ở chỉ số $0$.

   $$
   p=2+\sqrt{3},\quad q=2-\sqrt{3},\quad p+q=(2+\sqrt{3})+(2-\sqrt{3})=4,\quad pq=(2+\sqrt{3})(2-\sqrt{3})=1,\quad a_n= p^{n}+q^{n}
   $$
   *Lí do:* Đặt tên; khai triển và rút gọn căn; điều kiện của lũy thừa
2. **Dựng phương trình bậc hai mà cả hai cơ số thỏa mãn** — Khai triển tích $(t-p)(t-q)$ rồi thay tổng và tích vừa tính. Cho $t=p$ hoặc $t=q$ làm tích bằng $0$, nên cả hai cơ số thỏa mãn phương trình bậc hai này. Chuyển hạng tử tự do sang vế phải để viết bình phương theo cơ số.

   $$
   \begin{gathered}(t-p)(t-q)=t^2-4t+1\\p^2=4p-1,\quad q^2=4q-1\end{gathered}
   $$
   *Lí do:* Khai triển tích; Vi-ét đảo; chuyển vế
3. **Nhân với lũy thừa rồi cộng hai đẳng thức** — Với mọi số nguyên $n\ge0$, nhân đẳng thức của $p$ với $p^{n}$ và của $q$ với $q^{n}$. Dùng quy tắc nhân các lũy thừa cùng cơ số, rồi cộng hai đẳng thức. Nhóm theo định nghĩa của dãy để được đúng quan hệ cần chứng minh; lập luận đúng ở mọi chỉ số, không chỉ một vài số đầu.

   $$
   \begin{gathered}p^{n+2}=4p^{n+1}-p^{n}\\q^{n+2}=4q^{n+1}-q^{n}\\a_{n+2}=4(p^{n+1}+q^{n+1})-(p^{n}+q^{n})\\a_{n+2}=4a_{n+1}-a_n\end{gathered}
   $$
   *Lí do:* Nhân đẳng thức; quy tắc lũy thừa; cộng và thay định nghĩa dãy
4. **Chứng minh mọi số hạng là số nguyên** — Hai cơ số khác0 cho $a_0=2$; tổng của chúng cho $a_1=4$. Đây đều là số nguyên. Công thức vừa chứng minh chỉ nhân với các hệ số nguyên rồi trừ, nên từ hai số hạng nguyên suy ra số hạng tiếp theo nguyên. Bắt đầu từ chỉ số0, lập luận lần lượt chứng minh tất cả số hạng nguyên; vì vậy phép xét chia hết có nghĩa.

   $$
   a_0=2,\quad a_1=4,\quad a_{n+2}=4a_{n+1}-a_n
   $$
   *Lí do:* Hai số hạng đầu nguyên; công thức truy hồi giữ tính nguyên
5. **Theo dõi hai số hạng liên tiếp để bảo đảm chu kỳ** — Xét cặp số dư $(a_n,a_{n+1})$ khi chia $14$. Công thức truy hồi xác định duy nhất cặp kế tiếp từ cặp hiện tại. Có nhiều nhất $196$ cặp; khi một cặp lặp lại, toàn bộ các cặp sau lặp theo cùng cách. Phải trùng cả hai số dư, không chỉ một số hạng.

   $$
   (u,v)\longmapsto(v,4v-u)\pmod{14}
   $$
   *Lí do:* Trạng thái gồm hai số hạng; chuyển trạng thái duy nhất trên tập hữu hạn
6. **Tính các cặp số dư từ chỉ số 0 đến 7** — Bắt đầu từ cặp số dư của $(2,4)$, dùng đúng công thức truy hồi để tính mỗi cặp kế tiếp. Bảng ghi cả hai số dư; những cột có số dư của $a_n$ bằng0 là chỉ số được nhận.

   $$
   \begin{array}{c|cccccccc}n&0&1&2&3&4&5&6&7\\\hline a_n\bmod 14&2&4&0&10&12&10&0&4\\a_{n+1}\bmod 14&4&0&10&12&10&0&4&2\end{array}
   $$
   *Lí do:* Tính từng chuyển trạng thái; đối chiếu điều kiện chia hết
7. **Chứng minh phần trước chu kỳ và mọi chu kỳ tiếp theo** — Cặp ở chỉ số $8$ là $(2,4)$, đúng bằng cặp ở chỉ số $0$. Không cặp nào trước đó lặp. Vì chuyển trạng thái là duy nhất, từ chỉ số $0$ các cặp lặp theo chu kỳ $8$. Chu kỳ bắt đầu ngay ở chỉ số0, nên mọi chỉ số đều nằm trong một chu kỳ đã kiểm tra.

   $$
   (a_{8},a_{9})\equiv(a_{0},a_{1})\equiv(2,4)\pmod{14}
   $$
   *Lí do:* Cùng cặp đầu vào cho cùng cặp đầu ra ở mọi lần tiếp theo; chứng minh chu kỳ đầy đủ
8. **Kết luận mọi chỉ số thỏa mãn, không chỉ các số đầu** — Chu kỳ bắt đầu từ chỉ số0; trong mỗi chu kỳ, nhận đúng các vị trí có số dư0 của bảng. Các vị trí khác đều có số dư khác0, nên không chia hết. Vậy tất cả chỉ số cần tìm là $n=2+8k,\ k\in\mathbb Z,\ k\ge0$ hoặc $n=6+8k,\ k\in\mathbb Z,\ k\ge0$.
   *Lí do:* Phần đầu và chu kỳ bao quát mọi số tự nhiên; điều kiện cần và đủ

**Kết luận của ứng dụng:** Vậy tất cả chỉ số cần tìm là $n=2+8k,\ k\in\mathbb Z,\ k\ge0$ hoặc $n=6+8k,\ k\in\mathbb Z,\ k\ge0$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Bộ xác định: n = 8k + 2 hoặc 8k + 6 (tức n = 4k + 2).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 4 — `ptnk-2025-chuyen/3a`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$ (1). Chứng minh không tồn tại $m,n$ thỏa mãn (1) khi $n=3$.

**Đáp án tham khảo** (derived): proof

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Giữ miền nguyên dương, dùng các ước bắt buộc của tích và trừ bội để suy ra điều kiện hai chiều.
1. **Từ chia hết cho tích, chặn tập ứng viên bằng một ước cố định** — Vì $mn$ là ước của biểu thức nên $m$ cũng là ước của biểu thức. Trừ $m^2+m$, đều chia hết cho $m$, được $n^2$ chia hết cho $m$. Với $n=3$, suy ra $m$ là một ước dương của $9$; vì $m>0$, các ứng viên đều được liệt kê bên dưới.

   $$
   9\vdots m,\quad m\in\{1,3,9\}
   $$
   *Lí do:* Ước của tích; trừ các bội; liệt kê hết ước dương của số cố định
2. **Kiểm tra từng ứng viên trong điều kiện gốc** — Thay $n=3$ và từng giá trị $m$ vào cả tử và tích. Mỗi dòng bên dưới đều có số dư khác0 khi chia biểu thức cho tích, nên đều bị loại.

   $$
   \begin{gathered}m=1:\quad 11\not\vdots 3\\m=3:\quad 21\not\vdots 9\\m=9:\quad 99\not\vdots 27\end{gathered}
   $$
   *Lí do:* Thử tất cả ứng viên trong chính điều kiện gốc, không chỉ điều kiện cần
3. **Kết luận từ tập ứng viên đã xét đầy đủ** — Mọi cặp hợp lệ phải cho một trong các ước vừa xét, nhưng tất cả đều vi phạm điều kiện gốc. Vậy không tồn tại cặp số nguyên dương thỏa điều kiện khi $n=3$.
   *Lí do:* Điều kiện cần bao quát và loại hết từng ứng viên

**Kết luận của ứng dụng:** Vậy không tồn tại cặp số nguyên dương thỏa điều kiện khi $n=3$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Bộ xác định: không tồn tại khi n = 3.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 5 — `ptnk-2025-chuyen/3b`

*Nguồn đề:* exam ptnk-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho các số nguyên dương $m,n$ thỏa mãn: $m^2+m+n^2$ chia hết cho tích $mn$ (1). Tìm $m,n$ thỏa mãn (1) biết $m$ chia hết cho $n$.

**Đáp án tham khảo** (derived): $(m,n)\in\{(1,1);(4,2)\}$

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* kiểm chứng một phần · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Giữ miền nguyên dương, dùng các ước bắt buộc của tích và trừ bội để suy ra điều kiện hai chiều.
1. **Dùng giả thiết một ẩn chia hết cho ẩn kia** — Vì $m$ chia hết cho $n$ và cả hai nguyên dương, đặt $m=kn$ với $k$ nguyên dương. Từ điều kiện chia hết cho tích, $m$ là ước của $n^2$, nên $kn$ là ước của $n^2$; triệt tiêu $n\ne0$ cho $n$ chia hết cho $k$.

   $$
   m=kn,\quad n^2\vdots kn\Rightarrow n\vdots k
   $$
   *Lí do:* Tách bội nguyên dương; trừ các bội của m; triệt tiêu nhân tử khác0
2. **Suy ra điều kiện chia hết ngược lại** — Tích $mn=kn^2$ là ước của biểu thức, nên $n^2$ cũng là ước của biểu thức. Sau thay $m=kn$, trừ các hạng tử $k^2n^2+n^2$, suy ra $n^2$ là ước của $kn$, hay $k$ chia hết cho $n$. Hai số nguyên dương chia hết cho nhau phải bằng nhau, nên $k=n$ và $m=n^2$.

   $$
   kn\vdots n^2\Rightarrow k\vdots n,\quad k=n,\quad m=n^2
   $$
   *Lí do:* Trừ các bội của n²; hai số nguyên dương là ước của nhau thì bằng nhau
3. **Giảm điều kiện ban đầu và thử lại từng cặp** — Thay $m=n^2$, biểu thức là $n^4+2n^2$, tích là $n^3$. Chia hết tương đương $n^2+2$ chia hết cho $n$, hay $2$ chia hết cho $n$. Vì $n$ nguyên dương nên $n=1$ hoặc $2$, cho các cặp $(1,1)$ và $(4,2)$. Thử lại: cặp đầu cho tử3, tích1; cặp sau cho tử24, tích8, đều chia hết.

   $$
   n^4+2n^2\vdots n^3\Longleftrightarrow 2\vdots n\Longleftrightarrow n\in\{1,2\}
   $$
   *Lí do:* Triệt tiêu nhân tử khác0; trừ bội; xét hết các ước dương của2 và kiểm tra lại
4. **Kết luận đầy đủ** — Mọi nghiệm đều buộc phải thuộc hai cặp vừa suy ra; cả hai cặp đã được kiểm tra với điều kiện gốc và giả thiết chia hết bổ sung. Vậy tất cả các cặp cần tìm là $(m,n)=(1,1)$ hoặc $(4,2)$.
   *Lí do:* Điều kiện cần và đủ; đối chiếu mọi giả thiết

**Kết luận của ứng dụng:** Vậy tất cả các cặp cần tìm là $(m,n)=(1,1)$ hoặc $(4,2)$.

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Bộ xác định: (1,1), (4,2); trạng thái một phần.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 6 — `hcm-2025-chuyen/4a`

*Nguồn đề:* exam hcm-2025-chuyen · *Tập:* luyện

**Đề bài.** Số nguyên dương $n$ được gọi là số đẹp nếu tồn tại các số nguyên $a,b$ sao cho $n=a^2+7b^2$. Tìm hai số đẹp có hai chữ số và chia hết cho 11.

**Đáp án tham khảo** (official): hai trong các số 11, 44, 77, 88, 99 (ví dụ $11=2^2+7\cdot1^2$, $44=4^2+7\cdot2^2$)

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Chọn các bội trong đoạn yêu cầu, tìm biểu diễn và kiểm tra đầy đủ từng nhân chứng.
1. **Chỉ rõ đối tượng cần tìm và điều kiện của nhân chứng** — Cần nêu $2$ số khác nhau trong đoạn từ $10$ đến $99$, đều chia hết cho $11$. Với mỗi số, phải chỉ rõ hai số nguyên $a,b$ cho biểu diễn $n=a^2+7b^2$. Vì bình phương không phụ thuộc dấu, có thể tìm nhân chứng không âm.

   $$
   10\le n\le 99,\quad n\vdots 11,\quad n=a^2+7b^2
   $$
   *Lí do:* Dùng đủ định nghĩa số đẹp, số chữ số, chia hết và yêu cầu khác nhau
2. **Nêu nhân chứng cụ thể cho số 11** — Chọn $n=11$, $a=2$, $b=1$. Hai số trong biểu diễn đều nguyên. Tính $2^2=4$, $1^2=1$ rồi nhân với $7$, cộng lại đúng bằng $11$. Số này có đúng $2$ chữ số và bằng $11$ nhân $1$, nên thỏa cả điều kiện chia hết.

   $$
   \begin{gathered}2^2+7\cdot1^2=4+7=11\\11=11\cdot1\end{gathered}
   $$
   *Lí do:* Thay nhân chứng cụ thể; tính bình phương, tích và tổng; kiểm tra chữ số và chia hết
3. **Nêu nhân chứng cụ thể cho số 44** — Chọn $n=44$, $a=4$, $b=2$. Hai số trong biểu diễn đều nguyên. Tính $4^2=16$, $2^2=4$ rồi nhân với $7$, cộng lại đúng bằng $44$. Số này có đúng $2$ chữ số và bằng $11$ nhân $4$, nên thỏa cả điều kiện chia hết.

   $$
   \begin{gathered}4^2+7\cdot2^2=16+28=44\\44=11\cdot4\end{gathered}
   $$
   *Lí do:* Thay nhân chứng cụ thể; tính bình phương, tích và tổng; kiểm tra chữ số và chia hết
4. **Kết luận với các số và nhân chứng đã nêu** — Các số được chọn đôi một khác nhau, có đủ số chữ số, chia hết cho $11$ và mỗi số có biểu diễn đúng với hai số nguyên cụ thể. Do đó đã nêu đủ $2$ đối tượng theo yêu cầu. Vậy có thể chọn các số $11, 44$, với các cặp nhân chứng $(a,b)$ tương ứng là $(2,1), (4,2)$.
   *Lí do:* Mỗi đối tượng thỏa mọi điều kiện; đủ số lượng và khác nhau

**Kết luận của ứng dụng:** Vậy có thể chọn các số $11, 44$, với các cặp nhân chứng $(a,b)$ tương ứng là $(2,1), (4,2)$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: 11 = 2² + 7·1², 44 = 4² + 7·2².

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 7 — `hanoi-2025-chuyen/II.1`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Cho $a,b,c$ là các số nguyên thỏa mãn $3a^2-bc$, $3b^2-ca$, $3c^2-ab$ đều chia hết cho 4. Chứng minh $abc$ chia hết cho 8.

**Đáp án tham khảo** (teacher): proof

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 106 s · *Chi phí:* $0.0237

**Hướng giải:** Biến đổi điều kiện chia hết sang dạng đồng dư khi chia cho 4, sau đó xét tính chẵn lẻ của $a, b, c$ bằng cách loại trừ các trường hợp có số chẵn lẻ xen kẽ và trường hợp cả ba đều lẻ. Cuối cùng suy ra $a, b, c$ cùng chẵn để chứng minh $abc$ chia hết cho 8.
1. **Biến đổi điều kiện chia hết** — Ta chuyển vế và thay $3$ bằng $-1$ trong đồng dư thức khi chia cho $4$ để có các tổng dễ xét hơn.

   $$
   a^2 + bc \vdots 4, \quad b^2 + ca \vdots 4, \quad c^2 + ab \vdots 4
   $$
   *Lí do:* Tính chất đồng dư: $3 \equiv -1 \pmod 4$
2. **Xét tính chẵn lẻ của $a, b, c$** — Nếu có đúng một hoặc đúng hai số chẵn, ta sẽ dẫn đến mâu thuẫn vì bình phương số chẵn chia $4$ dư $0$ còn bình phương số lẻ chia $4$ dư $1$.

   $$
   a, b, c \text{ cùng chẵn hoặc cùng lẻ}
   $$
   *Lí do:* Xét trường hợp chẵn lẻ và tính chất bình phương khi chia cho 4
3. **Loại trừ trường hợp cả ba số đều lẻ** — Nếu $a, b, c$ lẻ thì $a^2 \equiv 1 \pmod 4$, suy ra $bc \equiv 3 \pmod 4$. Nhân ba vế lại ta được $(abc)^2 \equiv 27 \equiv 3 \pmod 4$, vô lý vì bình phương chỉ dư $0$ hoặc $1$.

   $$
   (abc)^2 \equiv 3 \pmod 4 \Rightarrow \text{vô lý}
   $$
   *Lí do:* Tính chất bình phương khi chia cho 4
4. **Kết luận** — Vậy $a, b, c$ phải cùng chẵn. Đặt $a=2x, b=2y, c=2z$ thì $abc = 8xyz$, chia hết cho $8$.

   $$
   abc = 8xyz \vdots 8
   $$
   *Lí do:* Định nghĩa số chẵn và tính chất chia hết

**Kết luận của ứng dụng:** Ta đã chứng minh được $a, b, c$ phải cùng chẵn, do đó $abc$ luôn chia hết cho $8$.

$$
abc \vdots 8
$$

### Claude tự chấm

- Kết luận: **đúng** — 7/10
- Nhận xét: Đưa về a² + bc ⋮ 4…, loại trường hợp cả ba lẻ bằng (abc)² ≡ 3 (mod 4). Thiếu: trường hợp “đúng một hoặc hai số chẵn” chỉ khẳng định, chưa xét cụ thể.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 8 — `hanoi-2025-chuyen/II.2`

*Nguồn đề:* exam hanoi-2025-chuyen · *Tập:* luyện

**Đề bài.** Tìm tất cả cặp số nguyên $(x,y)$ thỏa mãn $2(2x-y)(y-x)^2=15x-7y+7$.

**Đáp án tham khảo** (teacher): $(x,y)\in\{(-7,-14);(-2,-3);(4,7)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 97 s · *Chi phí:* $0.0227

**Hướng giải:** Đặt ẩn phụ $u = y - x$ để đơn giản hóa phương trình, sau đó biểu diễn $x$ theo $u$. Sử dụng điều kiện $x$ nguyên để thiết lập bất đẳng thức chặn $u$, từ đó thử các giá trị nguyên của $u$ tìm được.
1. **Đặt ẩn phụ và thay vào phương trình** — Bạn thử đặt $u = y - x$ để thay thế $y$ trong phương trình. Việc này giúp phương trình trở nên đơn giản hơn và chỉ còn hai biến $x$ và $u$.

   $$
   y = x + u \Rightarrow 2(x - u)u^2 = 8x - 7u + 7
   $$
   *Lí do:* Thay thế và rút gọn vế phải
2. **Biểu diễn $x$ theo $u$** — Bạn chuyển vế các hạng tử chứa $x$ về một vế, các hạng tử chứa $u$ về vế kia, rồi chia để tách $x$ ra. Hãy nhớ biến đổi tử số để xuất hiện mẫu số $2(u^2 - 4)$.

   $$
   x = u + \frac{u + 7}{2(u^2 - 4)}
   $$
   *Lí do:* Biến đổi đại số và chia đa thức
3. **Chặn giá trị của $u$ bằng tính chất chia hết** — Vì $x$ và $u$ nguyên nên phân số $\frac{u + 7}{2(u^2 - 4)}$ phải nguyên. Điều này xảy ra khi tử số bằng 0 hoặc giá trị tuyệt đối của mẫu số nhỏ hơn hoặc bằng giá trị tuyệt đối của tử số (với $u^2 \neq 4$). Bạn hãy giải các bất phương trình tương ứng để tìm các giá trị nguyên của $u$.

   $$
   |2(u^2 - 4)| \le |u + 7| \Rightarrow u \in \{-7, -2, -1, 0, 1, 2, 3\}
   $$
   *Lí do:* Điều kiện chia hết và chặn giá trị
4. **Thử giá trị và kết luận** — Bạn thay từng giá trị $u$ tìm được vào biểu thức của $x$, tính $y = x + u$ và kiểm tra lại với phương trình ban đầu. Lưu ý loại các trường hợp mẫu số bằng 0 hoặc không thỏa mãn.

   $$
   (x; y) \in \{(-7; -14); (-2; -3); (4; 7)\}
   $$
   *Lí do:* Kiểm tra nghiệm và kết luận

**Kết luận của ứng dụng:** Các cặp số nguyên $(x, y)$ thỏa mãn phương trình là $(-7; -14)$, $(-2; -3)$ và $(4; 7)$.

$$
(x; y) \in \{(-7; -14); (-2; -3); (4; 7)\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Ba cặp (−7; −14), (−2; −3), (4; 7); máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 9 — `khtn-2025-vong2/II.1`

*Nguồn đề:* exam khtn-2025-vong2 · *Tập:* luyện

**Đề bài.** Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $25^y+\left(4^x+1\right)\left(4x^2+3x+3\right)=\left(4^x+4x^2+3x+4\right)5^y$.

**Đáp án tham khảo** (teacher): $(x;y)\in\{(1;1);(2;2)\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 100 s · *Chi phí:* $0.0233

**Hướng giải:** Biến đổi phương trình thành dạng tích bằng cách nhận ra cấu trúc bậc hai theo $5^y$. Từ đó tách thành hai trường hợp, dùng đồng dư thức để xác định tính chẵn lẻ của số mũ và chặn giá trị của $x$ để tìm nghiệm nguyên dương.
1. **Biến đổi phương trình thành nhân tử** — Bạn để ý thấy tổng $4^x + 4x^2 + 3x + 4$ chính bằng tổng của hai thừa số $(4^x + 1)$ và $(4x^2 + 3x + 3)$. Mình sẽ đặt ẩn phụ để phương trình trở thành phương trình bậc hai theo $5^y$, từ đó dễ dàng phân tích thành nhân tử.

   $$
   (5^y - (4^x + 1))(5^y - (4x^2 + 3x + 3)) = 0
   $$
   *Lí do:* Phương pháp đặt ẩn phụ và phân tích đa thức thành nhân tử.
2. **Trường hợp 1: $5^y = 4^x + 1$** — Với $x \ge 2$, ta xét đồng dư khi chia cho 3 để tìm tính chẵn lẻ của $y$, sau đó xét khi chia cho 8 để tìm mâu thuẫn. Điều này sẽ buộc $x$ phải nhỏ hơn 2, tức $x = 1$. Thay vào phương trình ta tìm được $y = 1$. Vậy $(1; 1)$ là một nghiệm.

   $$
   x = 1 \Rightarrow 5^y = 5 \Rightarrow y = 1. \text{ Nghiệm } (1; 1).
   $$
   *Lí do:* Đồng dư thức và tính chất lũy thừa.
3. **Trường hợp 2: $5^y = 4x^2 + 3x + 3$** — Xét đồng dư khi chia cho 3, ta thấy $5^y \equiv (-1)^y \pmod 3$ và vế phải $\equiv x^2 \pmod 3$. Vì $x^2$ chỉ nhận giá trị 0 hoặc 1 khi chia cho 3, nên $(-1)^y$ phải bằng 1, suy ra $y$ chẵn. Đặt $y = 2k$, ta biến đổi vế trái thành hiệu hai bình phương.

   $$
   (5^k - 2x)(5^k + 2x) = 3(x + 1)
   $$
   *Lí do:* Đồng dư thức và hằng đẳng thức hiệu hai bình phương.
4. **Chặn và tìm nghiệm** — Đặt $A = 5^k - 2x$ và $B = 5^k + 2x$. Ta có $B - A = 4x$. Thay $B = A + 4x$ vào tích $AB = 3(x+1)$, ta được $A^2 + 4Ax = 3x + 3$. Vì $A \ge 1$ (do $5^k > 2x$), nên $1 + 4x \le 3x + 3$, suy ra $x \le 2$. Thử $x = 1$ (loại) và $x = 2$ (thỏa mãn, $y = 2$).

   $$
   \text{ Nghiệm } (2; 2).
   $$
   *Lí do:* Bất đẳng thức và thử giá trị.

**Kết luận của ứng dụng:** Các cặp số nguyên dương thỏa mãn là $(1; 1)$ và $(2; 2)$.

$$
(x; y) \in \{(1; 1); (2; 2)\}
$$

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: (1; 1), (2; 2); máy kiểm chứng.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 10 — `ptnk-2026-chuyen/3`

*Nguồn đề:* exam ptnk-2026-chuyen · *Tập:* luyện

**Đề bài.** Câu 3. Với mỗi số nguyên dương $n$, đặt $f(n)=(n+4)^{4}-n^{4}$.
a) Chứng minh $f(n)$ chia hết cho $16$ với mọi $n$.
b) Tìm $n$ để $f(n)$ chia hết cho $3$.
c) Tìm $n$ để $f(n)$ chia hết cho $24^{2}$.

**Đáp án tham khảo** (official): a) (chứng minh) b) n chia 3 dư 1 (n = 3k + 1). c) n chia 18 dư 16 (n = 18k + 16).

### Lời giải của ứng dụng

*Nguồn:* `deterministic-number-theory` · *Trạng thái máy:* đã kiểm chứng bằng máy · *Thời gian:* 0 s · *Chi phí:* $0

**Hướng giải:** Khai triển chung, giảm đúng môđun, chứng minh tính đầy đủ của số dư và kết hợp từng câu.
1. **Khai triển biểu thức chung cho cả ba câu** — Khai triển các lũy thừa và tích trong định nghĩa, gộp các hạng tử cùng bậc; các hạng tử đối nhau triệt tiêu. Ta được đa thức hệ số nguyên bên dưới. Các câu sau dùng cùng biểu thức này và giữ miền của $n$ như đề.

   $$
   f(n)=(n+4)^{4}-n^{4}=16n^{3}+96n^{2}+256n+256
   $$
   *Lí do:* Hằng đẳng thức và phép khai triển; thu gọn hệ số chính xác
2. **a) Tách nhân tử và giảm đúng điều kiện chia hết** — Từ khai triển, đặt $16$ làm nhân tử chung để được đẳng thức bên dưới. Đa thức còn lại có hệ số nguyên. Vì $16=16\cdot1$ và nhân tử chung khác0, $f(n)$ chia hết cho $16$ khi và chỉ khi đa thức còn lại chia hết cho $1$. Mọi số nguyên đều chia hết cho1, nên điều kiện này đúng với mọi giá trị.

   $$
   f(n)=16(n^{3}+6n^{2}+16n+16),\qquad 16=16\cdot1
   $$
   *Lí do:* Đặt nhân tử chung; triệt tiêu cùng nhân tử khác0 trong điều kiện chia hết
3. **b) Tách nhân tử và giảm đúng điều kiện chia hết** — Không cần tách thêm nhân tử; dùng trực tiếp đa thức đã khai triển. Đa thức còn lại có hệ số nguyên. Vì $3=1\cdot3$ và nhân tử chung khác0, $f(n)$ chia hết cho $3$ khi và chỉ khi đa thức còn lại chia hết cho $3$.

   $$
   f(n)=1(16n^{3}+96n^{2}+256n+256),\qquad 3=1\cdot3
   $$
   *Lí do:* Đặt nhân tử chung; triệt tiêu cùng nhân tử khác0 trong điều kiện chia hết
4. **b) Chứng minh các bảng số dư bao quát mọi giá trị** — Gọi đa thức còn lại là $Q(n)=16n^{3}+96n^{2}+256n+256$. Nếu $n$ và $r$ có cùng số dư khi chia một số $m$, hiệu từng lũy thừa của chúng chia hết cho $m$ nhờ hằng đẳng thức hiệu lũy thừa. Vì hệ số đều nguyên, $Q(n)-Q(r)$ cũng chia hết cho $m$. Do đó xét đủ các số dư là xét mọi giá trị. Môđun còn lại có phân tích $3=3$; các thừa số là lũy thừa của các nguyên tố khác nhau, nên đôi một nguyên tố cùng nhau. Điều kiện chia hết cho tích tương đương chia hết cho từng thừa số.

   $$
   Q(n)\equiv Q(r)\pmod{m}
   $$
   *Lí do:* Đa thức nguyên giữ đồng dư; tính chất chia hết với các ước nguyên tố cùng nhau
5. **b) Số dư khi chia 3: trường hợp 0 đến 2** — Thay từng $r$ vào $Q(r)$, tính rồi chia $3$. Chẳng hạn $Q(0)=256$ có số dư $1$. Chỉ cột có số dư0 được nhận.

   $$
   \begin{array}{c|ccc}r&0&1&2\\\hline Q(r)\bmod 3&1&0&2\end{array}
   $$
   *Lí do:* Tính chính xác tất cả lớp số dư trong bảng
6. **b) Kết hợp điều kiện và nêu toàn bộ nghiệm** — Xét tất cả lớp số dư khi chia $3$, các bảng đồng thời có số dư0 đúng tại $r\in\{1\}$.  Các biến đổi đều tương đương và đã giữ miền ban đầu. b) $n=3k+1$, $k\in\mathbb Z$, $k\ge0$.

   $$
   n\equiv 1\pmod{3}
   $$
   *Lí do:* Kết hợp toàn bộ điều kiện; ghép các lớp số dư đầy đủ; giữ miền gốc
7. **c) Tách nhân tử và giảm đúng điều kiện chia hết** — Từ khai triển, đặt $16$ làm nhân tử chung để được đẳng thức bên dưới. Đa thức còn lại có hệ số nguyên. Vì $576=16\cdot36$ và nhân tử chung khác0, $f(n)$ chia hết cho $576$ khi và chỉ khi đa thức còn lại chia hết cho $36$.

   $$
   f(n)=16(n^{3}+6n^{2}+16n+16),\qquad 576=16\cdot36
   $$
   *Lí do:* Đặt nhân tử chung; triệt tiêu cùng nhân tử khác0 trong điều kiện chia hết
8. **c) Chứng minh các bảng số dư bao quát mọi giá trị** — Gọi đa thức còn lại là $Q(n)=n^{3}+6n^{2}+16n+16$. Nếu $n$ và $r$ có cùng số dư khi chia một số $m$, hiệu từng lũy thừa của chúng chia hết cho $m$ nhờ hằng đẳng thức hiệu lũy thừa. Vì hệ số đều nguyên, $Q(n)-Q(r)$ cũng chia hết cho $m$. Do đó xét đủ các số dư là xét mọi giá trị. Môđun còn lại có phân tích $36=4\cdot 9$; các thừa số là lũy thừa của các nguyên tố khác nhau, nên đôi một nguyên tố cùng nhau. Điều kiện chia hết cho tích tương đương chia hết cho từng thừa số.

   $$
   Q(n)\equiv Q(r)\pmod{m}
   $$
   *Lí do:* Đa thức nguyên giữ đồng dư; tính chất chia hết với các ước nguyên tố cùng nhau
9. **c) Số dư khi chia 4: trường hợp 0 đến 3** — Thay từng $r$ vào $Q(r)$, tính rồi chia $4$. Chẳng hạn $Q(0)=16$ có số dư $0$. Chỉ cột có số dư0 được nhận.

   $$
   \begin{array}{c|cccc}r&0&1&2&3\\\hline Q(r)\bmod 4&0&3&0&1\end{array}
   $$
   *Lí do:* Tính chính xác tất cả lớp số dư trong bảng
10. **c) Số dư khi chia 9: trường hợp 0 đến 8** — Thay từng $r$ vào $Q(r)$, tính rồi chia $9$. Chẳng hạn $Q(0)=16$ có số dư $7$. Chỉ cột có số dư0 được nhận.

   $$
   \begin{array}{c|ccccccccc}r&0&1&2&3&4&5&6&7&8\\\hline Q(r)\bmod 9&7&3&8&1&6&2&4&0&5\end{array}
   $$
   *Lí do:* Tính chính xác tất cả lớp số dư trong bảng
11. **c) Kết hợp điều kiện và nêu toàn bộ nghiệm** — Xét tất cả lớp số dư khi chia $36$, các bảng đồng thời có số dư0 đúng tại $r\in\{16,34\}$. Các lớp này đúng bằng các lớp $16$ khi chia $18$, vì danh sách bao gồm trọn các số dư cách nhau $18$ trong mỗi lớp đó. Các biến đổi đều tương đương và đã giữ miền ban đầu. c) $n=18k+16$, $k\in\mathbb Z$, $k\ge0$.

   $$
   n\equiv 16\pmod{18}
   $$
   *Lí do:* Kết hợp toàn bộ điều kiện; ghép các lớp số dư đầy đủ; giữ miền gốc
12. **Kết luận riêng từng câu theo miền đề** — Các phép khai triển, tách nhân tử và xét số dư đã được chứng minh đầy đủ.
a) Mọi giá trị $n$ thuộc miền đề đều thỏa mãn.
b) $n=3k+1$, $k\in\mathbb Z$, $k\ge0$.
c) $n=18k+16$, $k\in\mathbb Z$, $k\ge0$.
   *Lí do:* Mỗi câu có điều kiện cần và đủ hoặc phản ví dụ rõ ràng; các kết luận trên từng dòng

**Kết luận của ứng dụng:** a) Mọi giá trị $n$ thuộc miền đề đều thỏa mãn.
b) $n=3k+1$, $k\in\mathbb Z$, $k\ge0$.
c) $n=18k+16$, $k\in\mathbb Z$, $k\ge0$.

### Claude tự chấm

- Kết luận: **đúng** — 8/10
- Nhận xét: Bộ xác định: b) n = 3k + 1, c) n = 18k + 16.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 11 — `nt8-h1`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên dương $(x;y)$ thỏa mãn $2^x+3=y^2$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Không có cặp nào (với $x\ge2$: $y^2\equiv3\pmod4$ vô lí; $x=1$: $y^2=5$ không chính phương)

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* CHƯA kiểm chứng (có kiểm tra thất bại) · *Thời gian:* 130 s · *Chi phí:* $0.0055

**Hướng giải:** Xét tính chất của số chính phương khi chia cho 4 để loại trừ các trường hợp $x \ge 2$, sau đó kiểm tra trường hợp còn lại $x = 1$.
1. **Xét số dư của $y^2$ khi chia cho 4** — Ta xét tính chẵn lẻ và số dư của $y^2$ khi chia cho 4. Vì $x$ là số nguyên dương, nếu $x \ge 2$ thì $2^x$ chia hết cho 4. Khi đó $y^2 = 2^x + 3$ sẽ có dạng $4k + 3$. Tuy nhiên, mọi số chính phương $y^2$ khi chia cho 4 chỉ có thể dư 0 hoặc 1 (vì nếu $y$ chẵn, $y=2k \Rightarrow y^2=4k^2 \equiv 0$; nếu $y$ lẻ, $y=2k+1 \Rightarrow y^2=4k^2+4k+1 \equiv 1$). Do đó, $y^2$ không thể dư 3 khi chia cho 4.

   $$
   y^2 \equiv 0 \text{ hoặc } 1 \pmod 4
   $$
   *Lí do:* Tính chất số chính phương
2. **Kiểm tra trường hợp $x = 1$** — Từ bước 1, ta thấy $x$ không thể lớn hơn hoặc bằng 2. Vậy chỉ còn trường hợp $x = 1$. Khi đó phương trình trở thành $2^1 + 3 = y^2$, hay $5 = y^2$. Vì 5 không phải là số chính phương (không có số nguyên nào bình phương bằng 5), nên phương trình vô nghiệm.

   $$
   x = 1 \Rightarrow y^2 = 5
   $$
   *Lí do:* Thay giá trị và kiểm tra

**Kết luận của ứng dụng:** Phương trình đã cho vô nghiệm (không có cặp số nguyên dương nào thỏa mãn).

$$
\text{Vô nghiệm}
$$

### Claude tự chấm

- Kết luận: **đúng — nhưng bị giữ lại nhầm** — 6/10
- Nhận xét: Đáp số đúng (vô nghiệm) nhưng không hiển thị: phép kiểm tra hai biến của mô hình bị tính là “sai” thay vì “không đánh giá được”. Sửa #16.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 12 — `nt8-h2`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Chứng minh rằng với mọi số nguyên $n$, $n^2+n+1$ không chia hết cho $9$.

**Đáp án tham khảo** (verified by SymPy/enumeration): Chứng minh: nếu $9\mid n^2+n+1$ thì $3\mid n^2+n+1$ nên $n\equiv1\pmod3$; đặt $n=3k+1$ thì $n^2+n+1=9k^2+9k+3$ chia $9$ dư $3$.

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish a problem that is within the curriculum

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Yêu cầu có suy nghĩ quá 115 s; lần thử lại không suy nghĩ thì mô hình bỏ cuộc.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 13 — `nt8-h3`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số nguyên tố $p$ sao cho $p^2+2$ cũng là số nguyên tố.

**Đáp án tham khảo** (verified by SymPy/enumeration): $p=3$ (với $p\ne3$: $p^2\equiv1\pmod3$ nên $3\mid p^2+2>3$)

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish a problem that is within the curriculum

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Như h2.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 14 — `nt8-h4`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các số tự nhiên $n$ sao cho $n^2+4n+97$ là số chính phương.

**Đáp án tham khảo** (verified by SymPy/enumeration): $n\in\{12;44\}$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 143 s · *Chi phí:* $0.0082

**Hướng giải:** Biến đổi biểu thức $n^2+4n+97$ về dạng hiệu hai bình phương bằng cách đặt nó bằng $k^2$, sau đó phân tích thành nhân tử và xét các ước của hằng số thu được.
1. **Biến đổi biểu thức** — Để ý rằng $n^2+4n$ gợi nhớ đến hằng đẳng thức $(n+2)^2 = n^2+4n+4$. Ta sẽ biến đổi biểu thức đã cho để xuất hiện $(n+2)^2$.

   $$
   n^2 + 4n + 97 = (n^2 + 4n + 4) + 93 = (n+2)^2 + 93
   $$
   *Lí do:* Hằng đẳng thức $(a+b)^2 = a^2+2ab+b^2$
2. **Thiết lập phương trình** — Gọi số chính phương đó là $k^2$ với $k$ là số tự nhiên. Ta có phương trình $(n+2)^2 + 93 = k^2$. Chuyển vế để xuất hiện hiệu hai bình phương.

   $$
   k^2 - (n+2)^2 = 93
   $$
   *Lí do:* Định nghĩa số chính phương và biến đổi đại số
3. **Phân tích thành nhân tử** — Sử dụng hằng đẳng thức hiệu hai bình phương $A^2 - B^2 = (A-B)(A+B)$ để phân tích vế trái. Đặt $A=k$ và $B=n+2$.

   $$
   (k - (n+2))(k + (n+2)) = 93
   $$
   *Lí do:* Hằng đẳng thức $A^2 - B^2 = (A-B)(A+B)$
4. **Xét các trường hợp** — Vì $n$ là số tự nhiên nên $n \ge 0$, suy ra $n+2 \ge 2$. Do đó $k^2 = (n+2)^2 + 93 > 4$, nên $k > 2$. Khi đó $k+n+2$ là một số nguyên dương. Ta có $k+n+2 > k-n-2$. Vì tích của hai thừa số bằng 93 (số nguyên dương) nên cả hai thừa số đều phải là các ước dương của 93. Các ước của 93 là 1, 3, 31, 93. Ta xét các trường hợp tích của hai ước dương bằng 93 với thừa số lớn hơn là $k+n+2$.

   $$
   \begin{cases} k - n - 2 = a \\ k + n + 2 = b \end{cases} \text{ với } a \cdot b = 93 \text{ và } a < b
   $$
   *Lí do:* Tính chất ước và bất đẳng thức
5. **Giải tìm n** — Các cặp $(a, b)$ thỏa mãn $a \cdot b = 93$ và $a < b$ là $(1, 93)$ và $(3, 31)$. Ta giải hệ phương trình để tìm $n$ trong mỗi trường hợp.

   $$
   \text{Trường hợp 1: } \begin{cases} k - n - 2 = 1 \\ k + n + 2 = 93 \end{cases} \Rightarrow 2(k) = 94 \Rightarrow k=47, n=44. \text{ Trường hợp 2: } \begin{cases} k - n - 2 = 3 \\ k + n + 2 = 31 \end{cases} \Rightarrow 2(k) = 34 \Rightarrow k=17, n=12.
   $$
   *Lí do:* Giải hệ phương trình bằng phương pháp cộng đại số
6. **Kết luận** — Kiểm tra lại các giá trị $n$ tìm được. Với $n=44$: $44^2+4(44)+97 = 1936+176+97 = 2209 = 47^2$ (thỏa mãn). Với $n=12$: $12^2+4(12)+97 = 144+48+97 = 289 = 17^2$ (thỏa mãn). Vậy các giá trị $n$ tìm được là $n=44$ và $n=12$.

   $$
   n \in \{12; 44\}
   $$
   *Lí do:* Thay giá trị vào biểu thức ban đầu

**Kết luận của ứng dụng:** Các số tự nhiên $n$ cần tìm là $n = 0$ và $n = 3$.

$$
n \in \{0; 3\}
$$

### Claude tự chấm

- Kết luận: **SAI — đã hiển thị** — 0/10
- Nhận xét: Ứng dụng nói n = 0 và n = 3; đúng là n ∈ {12; 44} (n = 0 cho 97, không chính phương). Hiển thị là “máy không kiểm chứng được”. Sửa #17: thay lại từng giá trị và tìm vét cạn.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 15 — `nt8-h5`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm tất cả các cặp số nguyên $(x;y)$ thỏa mãn $x^2+xy+y^2=3$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $(x;y)\in\{(1;1),(-1;-1),(1;-2),(-2;1),(-1;2),(2;-1)\}$

### Lời giải của ứng dụng

**Không có lời giải** — `incomplete`: the model could not finish this problem in time (local model request timed out)

### Claude tự chấm

- Kết luận: **không có lời giải** — 0/10
- Nhận xét: Hết thời gian cả hai lần (115 s mỗi lần).

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---

## Câu 16 — `nt8-h6`

*Nguồn đề:* authored 2026-10-14 (verified) · *Tập:* kiểm tra (câu mới, chưa dùng để sửa)

**Đề bài.** Tìm chữ số tận cùng của $2^{2026}+3^{2026}$.

**Đáp án tham khảo** (verified by SymPy/enumeration): $3$

### Lời giải của ứng dụng

*Nguồn:* `default` · *Trạng thái máy:* máy không kiểm chứng được · *Thời gian:* 25 s · *Chi phí:* $0.01

**Hướng giải:** Xác định chu kỳ lặp lại của chữ số tận cùng cho các lũy thừa của 2 và 3 (chu kỳ là 4). Sau đó, tìm số dư của số mũ 2026 khi chia cho 4 để suy ra chữ số tận cùng của từng lũy thừa, cuối cùng cộng hai chữ số này lại.
1. **Xác định chu kỳ của $2^n$** — Ta xét chữ số tận cùng của các lũy thừa của 2. Ta có: $2^1 = 2$, $2^2 = 4$, $2^3 = 8$, $2^4 = 16$ (tận cùng là 6), $2^5 = 32$ (tận cùng là 2). Chu kỳ lặp lại của chữ số tận cùng của $2^n$ là 4: 2, 4, 8, 6.

   $$
   2^n \text{ có chữ số tận cùng lặp lại theo chu kỳ 4: } \{2, 4, 8, 6\}
   $$
   *Lí do:* Quan sát quy luật của lũy thừa
2. **Xác định chu kỳ của $3^n$** — Ta xét chữ số tận cùng của các lũy thừa của 3. Ta có: $3^1 = 3$, $3^2 = 9$, $3^3 = 27$ (tận cùng là 7), $3^4 = 81$ (tận cùng là 1), $3^5 = 243$ (tận cùng là 3). Chu kỳ lặp lại của chữ số tận cùng của $3^n$ cũng là 4: 3, 9, 7, 1.

   $$
   3^n \text{ có chữ số tận cùng lặp lại theo chu kỳ 4: } \{3, 9, 7, 1\}
   $$
   *Lí do:* Quan sát quy luật của lũy thừa
3. **Tìm chữ số tận cùng của $2^{2026}$** — Để tìm chữ số tận cùng của $2^{2026}$, ta chia số mũ 2026 cho chu kỳ 4. Ta có $2026 = 4 \times 506 + 2$. Số dư là 2, nên chữ số tận cùng của $2^{2026}$ trùng với chữ số tận cùng của $2^2$, tức là 4.

   $$
   2026 = 4 \times 506 + 2 \Rightarrow 2^{2026} \equiv 2^2 \equiv 4 \pmod{10}
   $$
   *Lí do:* Tính chất của chu kỳ chữ số tận cùng
4. **Tìm chữ số tận cùng của $3^{2026}$** — Tương tự, để tìm chữ số tận cùng của $3^{2026}$, ta chia số mũ 2026 cho chu kỳ 4. Số dư là 2, nên chữ số tận cùng của $3^{2026}$ trùng với chữ số tận cùng của $3^2$, tức là 9.

   $$
   2026 = 4 \times 506 + 2 \Rightarrow 3^{2026} \equiv 3^2 \equiv 9 \pmod{10}
   $$
   *Lí do:* Tính chất của chu kỳ chữ số tận cùng
5. **Tìm chữ số tận cùng của tổng** — Chữ số tận cùng của tổng $2^{2026} + 3^{2026}$ là chữ số tận cùng của tổng hai chữ số tận cùng vừa tìm được. Ta có $4 + 9 = 13$. Chữ số tận cùng của 13 là 3.

   $$
   4 + 9 = 13 \Rightarrow \text{Chữ số tận cùng là } 3
   $$
   *Lí do:* Tính chất chữ số tận cùng của tổng

**Kết luận của ứng dụng:** Chữ số tận cùng của $2^{2026} + 3^{2026}$ là 9.

$$
9
$$

### Claude tự chấm

- Kết luận: **SAI — đã hiển thị** — 0/10
- Nhận xét: Ứng dụng nói 9; đúng là 3. Sửa #17: tính chính xác chữ số tận cùng/số dư của mọi biểu thức lũy thừa.

### Đánh giá của bạn

- Điểm (0–10): 
- Đúng về toán? (có / không / một phần): 
- Trình bày dễ hiểu cho lớp 9? (có / không): 
- Nhận xét: 

---
