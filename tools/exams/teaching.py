"""
Teaching records for the TRAINING split (PTNK 2023–2025): one concise, auditable lesson per problem whose
answer is computer-verified (tools/exams/verify_exams.py). Written by Claude from the verified answer and the
knowledge annotation — not copied from the answer keys. Proof-only geometry/game items are excluded until a
teacher reviews them (no unverified training targets).

Fields: type (Nhận dạng), knowledge (Kiến thức cần), key_idea (Ý chính), hints (gợi ý từ nhẹ đến rõ),
solution (các bước), answer (Kết luận), takeaway (Bài học dùng lại), grade_level_note.
"""

T = {}

T["ptnk-2023-chuyen/1"] = dict(
    type="Hệ phương trình không mẫu mực – đặt ẩn phụ",
    knowledge=["Đặt ẩn phụ", "Vi-ét đảo: hai số có tổng S, tích P là nghiệm của t² − St + P = 0", "Điều kiện x, y ≠ 0"],
    key_idea=r"Khai triển $(x+y)\left(4+\frac{1}{xy}\right)=\left(4x+\frac1x\right)+\left(4y+\frac1y\right)$ nên hai phương trình chỉ chứa $u=4x+\frac1x$ và $v=4y+\frac1y$.",
    hints=[r"Bạn thử khai triển vế trái phương trình thứ nhất xem có biểu thức nào giống phương trình thứ hai không?",
           r"Đặt $u=4x+\frac1x$, $v=4y+\frac1y$: hệ trở thành gì?",
           r"$u+v=1$, $uv=-20$ nên $u, v$ là nghiệm của $t^2-t-20=0$."],
    solution=[r"Điều kiện $x\ne0$, $y\ne0$.", r"Đặt $u=4x+\frac1x$, $v=4y+\frac1y$, hệ trở thành $u+v=1$, $uv=-20$.", r"$u,v$ là nghiệm của $t^2-t-20=0$: $\{u,v\}=\{5,-4\}$.",
              r"$4x+\frac1x=5\Leftrightarrow4x^2-5x+1=0\Leftrightarrow x\in\{1;\frac14\}$; $4y+\frac1y=-4\Leftrightarrow(2y+1)^2=0\Leftrightarrow y=-\frac12$.", r"Trường hợp ngược lại đổi vai trò $x$ và $y$."],
    answer=r"$(x,y)\in\{(1;-\tfrac12),(\tfrac14;-\tfrac12),(-\tfrac12;1),(-\tfrac12;\tfrac14)\}$",
    takeaway="Khi một hệ chứa các biểu thức lặp lại, hãy tìm cách viết cả hai phương trình theo cùng những biểu thức đó rồi đặt ẩn phụ.",
)
T["ptnk-2023-chuyen/2a"] = dict(
    type="Bất đẳng thức có điều kiện", knowledge=["Biến đổi giả thiết", r"$(p+q+r)^2\le3(p^2+q^2+r^2)$"],
    key_idea=r"$ab+bc+ca=abc\Leftrightarrow\frac1a+\frac1b+\frac1c=1$ (chia hai vế cho $abc>0$).",
    hints=["Chia hai vế của giả thiết cho abc thì được điều gì?", r"Đặt $p=\frac1{\sqrt a}$, … thì $p^2+q^2+r^2$ bằng bao nhiêu?", r"Dùng $(p+q+r)^2\le3(p^2+q^2+r^2)$."],
    solution=[r"Từ giả thiết: $\frac1a+\frac1b+\frac1c=1$.", r"Với $p=\frac1{\sqrt a}, q=\frac1{\sqrt b}, r=\frac1{\sqrt c}$: $p^2+q^2+r^2=1$.",
              r"$(p+q+r)^2\le3(p^2+q^2+r^2)=3$ (vì $(p-q)^2+(q-r)^2+(r-p)^2\ge0$), nên $p+q+r\le\sqrt3$."],
    answer="đpcm; dấu bằng khi a = b = c = 3",
    takeaway="Đổi giả thiết dạng tích về dạng nghịch đảo; bất đẳng thức (p+q+r)² ≤ 3(p²+q²+r²) chỉ là tổng các bình phương không âm.",
)
T["ptnk-2023-chuyen/2b"] = dict(
    type="Bất đẳng thức có điều kiện (hai vế)", knowledge=[r"$(a+b+c)^2\ge3(ab+bc+ca)$", "Cô-si cho hai số"],
    key_idea=r"Vế phải: thay $ab+bc+ca=abc$. Vế trái: $\frac1a+\frac1b\ge\frac{2}{\sqrt{ab}}$, cộng ba bất đẳng thức rồi nhân với $\sqrt{abc}$.",
    hints=["Vế phải: so sánh (a + b + c)² với ab + bc + ca.", r"Vế trái: Cô-si cho $\frac1a$ và $\frac1b$ được gì?", r"Cộng lại: $1\ge\frac1{\sqrt{ab}}+\frac1{\sqrt{bc}}+\frac1{\sqrt{ca}}$; nhân hai vế với $\sqrt{abc}$."],
    solution=[r"$(a+b+c)^2\ge3(ab+bc+ca)=3abc$ nên $abc\le\frac{(a+b+c)^2}{3}$.", r"$\frac1a+\frac1b\ge\frac2{\sqrt{ab}}$ (Cô-si); cộng ba bất đẳng thức: $1=\sum\frac1a\ge\sum\frac1{\sqrt{ab}}$.",
              r"Nhân với $\sqrt{abc}>0$: $\sqrt{abc}\ge\sqrt a+\sqrt b+\sqrt c$, bình phương hai vế."],
    answer="đpcm; dấu bằng khi a = b = c = 3", takeaway="Hai vế của một chuỗi bất đẳng thức thường dùng hai công cụ khác nhau; xử lý từng vế riêng.",
)
T["ptnk-2023-chuyen/3a"] = dict(
    type="Tổ hợp – đếm bằng hai cách", knowledge=["Đếm theo hàng và theo cột", "Chia hết"],
    key_idea="Gọi x là số ô đen mỗi hàng: tổng ô đen là 4x; theo cột là tổng bốn số khác nhau trong {0, 1, 2, 3, 4}.",
    hints=["Tổng số ô đen tính theo hàng là bao nhiêu?", "Số ô đen trên mỗi cột có thể nhận những giá trị nào?", "0 + 1 + 2 + 3 + 4 = 10; bỏ số nào thì tổng chia hết cho 4?"],
    solution=["Tổng ô đen = 4x (theo hàng).", "Theo cột: bốn số đôi một khác nhau trong {0, …, 4}, tổng bằng 10 − (số bị bỏ).", "Tổng chia hết cho 4 nên bỏ số 2: tổng 8 = 4x, x = 2."],
    answer="Mỗi hàng có 2 ô đen", takeaway="Đếm cùng một đại lượng bằng hai cách để có phương trình hoặc ràng buộc chia hết.",
)
T["ptnk-2023-chuyen/3b"] = dict(
    type="Tổ hợp – cực trị trên bảng", knowledge=["Đếm", "Phản chứng", "Xây dựng ví dụ"],
    key_idea="Theo cột: chỉ cột có 1 hoặc 3 ô đen tạo cặp tốt, tối đa 2 mỗi cột. Theo hàng: mỗi hàng tối đa 3, nhưng 12 buộc các hàng xen kẽ, mâu thuẫn với cột toàn đen.",
    hints=["Cột có 0 hoặc 4 ô đen có cặp tốt nào không?", "Một cột có 1 hoặc 3 ô đen thì có tối đa mấy cặp tốt?", "Theo hàng, nếu mỗi hàng có đủ 3 cặp tốt thì các hàng trông như thế nào?"],
    solution=["Các cột có 0, 1, 3, 4 ô đen; cột 0 và 4 không có cặp tốt, cột 1 và 3 có tối đa 2: tối đa 4, và có cách tô đạt 4.",
              "Mỗi hàng có 2 ô đen, tối đa 3 cặp tốt mỗi hàng: tối đa 12.", "Nếu đạt 12 thì mỗi hàng đen trắng xen kẽ, khi đó không thể có cột 4 ô đen: mâu thuẫn. Vậy tối đa 11 (có cách tô đạt 11)."],
    answer="Theo cột: 4; theo hàng: 11", takeaway="Chặn trên, rồi kiểm tra trường hợp đạt chặn; nếu không đạt được thì dùng phản chứng để giảm chặn.",
)
T["ptnk-2023-chuyen/4a"] = dict(
    type="Số học – tính chẵn lẻ", knowledge=["Tính chẵn lẻ"], key_idea=r"$m^2-n=1$ nên $m^2$ và $n$ khác tính chẵn lẻ, do đó $m, n$ khác tính chẵn lẻ.",
    hints=["m² và n khác nhau 1 đơn vị nói gì về tính chẵn lẻ?", "m và m² cùng tính chẵn lẻ.", "Xét tính chẵn lẻ của n² − m."],
    solution=[r"$m^2=n+1$: $m^2$ và $n$ khác tính chẵn lẻ, nên $m$ và $n$ khác tính chẵn lẻ.", r"$n^2$ cùng tính chẵn lẻ với $n$, nên $n^2-m$ là hiệu hai số khác tính chẵn lẻ: số lẻ."],
    answer="a là số lẻ", takeaway="Trong bài số học, xét chẵn lẻ là bước kiểm tra đầu tiên.",
)
T["ptnk-2023-chuyen/4b"] = dict(
    type="Số học – phân tích nhân tử và xét trường hợp", knowledge=["Trừ vế theo vế", "Ước của 3·2ᵏ", "Tính chẵn lẻ"],
    key_idea=r"Trừ hai đẳng thức: $(n^2-m)-(m^2-n)=(n-m)(n+m+1)=3\cdot2^k$, trong đó $n-m$ lẻ nên $n-m\in\{1;3\}$.",
    hints=["Lấy n² − m trừ m² − n được gì? Phân tích thành nhân tử.", "Trong hai thừa số (n − m) và (n + m + 1), thừa số nào lẻ?", "Thừa số lẻ là ước lẻ của 3·2ᵏ: chỉ có 1 hoặc 3."],
    solution=[r"$a-1=n^2-m-m^2+n=(n-m)(n+m+1)=3\cdot2^k$.", r"$n-m$ lẻ (câu a) nên $n-m\in\{1;3\}$.",
              r"Nếu $n-m=1$: thế $n=m+1$ vào $m^2-n=1$ được $m=2$, $n=3$, $a=7=3\cdot2+1$, $k=1$.", r"Nếu $n-m=3$: $m^2-m-4=0$ không có nghiệm nguyên."],
    answer="k = 1", takeaway="Biến hiệu của hai đẳng thức thành tích, rồi dùng chẵn lẻ để giới hạn các ước.",
)
T["ptnk-2023-chuyen/4c"] = dict(
    type="Số học – số chính phương", knowledge=["Kẹp giữa hai số chính phương liên tiếp"], key_idea=r"$n=m^2-1$ nên $a=(m^2-1)^2-m$ nằm giữa $(m^2-2)^2$ và $(m^2-1)^2$ khi $m\ge2$.",
    hints=["Biểu diễn a theo m.", "So sánh a với (m² − 1)² và (m² − 2)².", "Xét riêng m = 0, 1."],
    solution=[r"$a=(m^2-1)^2-m$.", r"Với $m\ge2$: $(m^2-2)^2=(m^2-1)^2-(2m^2-3)<(m^2-1)^2-m<(m^2-1)^2$, nên $a$ không chính phương.",
              r"$m=0$ thì $n=-1$ (loại); $m=1$ thì $n=0$, $a=-1$ không chính phương."],
    answer="a không là số chính phương", takeaway="Một số nằm thật sự giữa hai bình phương liên tiếp thì không là số chính phương.",
)
T["ptnk-2024-chuyen/1.1"] = dict(
    type="Hệ hoán vị vòng quanh", knowledge=["Trừ vế theo vế", "Hằng đẳng thức a³ − b³", "Tổng bình phương không âm"],
    key_idea=r"Lấy (1) − (2): $z^3-y^3=y-z\Leftrightarrow(z-y)(z^2+zy+y^2+1)=0$, thừa số sau luôn dương.",
    hints=["Trừ phương trình (1) cho (2): có nhân tử chung nào?", r"$z^2+zy+y^2+1$ có thể bằng 0 không?", r"Khi $x=y=z$, giải $2x^3=x$."],
    solution=[r"(1) − (2): $(z-y)(z^2+zy+y^2+1)=0$; $z^2+zy+y^2=\left(z+\frac y2\right)^2+\frac{3y^2}4\ge0$ nên $y=z$.", r"Tương tự $x=z$.", r"$2x^3=x\Leftrightarrow x\in\{0;\pm\frac1{\sqrt2}\}$."],
    answer=r"$x=y=z\in\{0;\tfrac1{\sqrt2};-\tfrac1{\sqrt2}\}$", takeaway="Hệ hoán vị vòng quanh: trừ vế theo vế để được (x − y)·(biểu thức luôn dương) = 0.",
)
T["ptnk-2024-chuyen/1.2"] = dict(
    type="Phương trình tích có chứa căn – đếm số nghiệm", knowledge=["Điều kiện xác định", "Δ', Vi-ét (dấu của nghiệm)"],
    key_idea=r"Nghiệm $x=1$ từ $\sqrt x=1$; phương trình bậc hai có hai nghiệm dương phân biệt khác 1 vì $x=1$ là nghiệm chỉ khi $(a-2)(b-2)=1$.",
    hints=["Điều kiện của x là gì? Phương trình tích tách thành mấy phương trình?", "Phương trình bậc hai có mấy nghiệm, dấu thế nào (Δ', S, P)?", "Có khi nào nghiệm của phương trình bậc hai trùng với x = 1?"],
    solution=[r"ĐK $x\ge0$; $\sqrt x=1\Leftrightarrow x=1$.", r"$\Delta'=(a+b)^2-ab-2=a^2+ab+b^2-2>0$, $S=2(a+b)>0$, $P=ab+2>0$: hai nghiệm dương phân biệt.",
              r"$x=1$ là nghiệm của phương trình bậc hai $\Leftrightarrow(a-2)(b-2)=1\Leftrightarrow a=b\in\{1;3\}$, trái giả thiết $a\ne b$."],
    answer="Phương trình có đúng ba nghiệm phân biệt", takeaway="Đếm nghiệm của phương trình tích: đếm từng nhân tử, rồi loại các nghiệm trùng nhau.",
)
T["ptnk-2024-chuyen/2"] = dict(
    type="Bất đẳng thức đối xứng có điều kiện", knowledge=[r"$(a+b+c)^2=a^2+b^2+c^2+2(ab+bc+ca)$", r"$(a+b+c)^2\ge3(ab+bc+ca)$"],
    key_idea=r"Giả thiết tương đương $(a+b+c)^2+3=4(ab+bc+ca)$; viết mọi thứ theo $s=a+b+c$.",
    hints=["Cộng 2(ab + bc + ca) vào hai vế của giả thiết thì được gì?", "Dùng s² ≥ 3(ab + bc + ca) cho vế trái.", "Vế phải quy về (s − 3)² ≥ 0."],
    solution=[r"Giả thiết $\Leftrightarrow s^2+3=4q$ với $s=a+b+c$, $q=ab+bc+ca$.", r"$s^2\ge3q=\frac34(s^2+3)\Rightarrow s^2\ge9\Rightarrow s\ge3$.", r"$s\le\frac{2q+3}{3}\Leftrightarrow3s\le\frac{s^2+3}{2}+3\Leftrightarrow(s-3)^2\ge0$."],
    answer="đpcm; dấu bằng khi a + b + c = 3", takeaway="Với bài đối xứng, đưa về tổng s và tích q rồi chỉ còn một biến.",
)
T["ptnk-2024-chuyen/3a"] = dict(
    type="Dãy số dạng αⁿ + βⁿ", knowledge=["Vi-ét: α + β = 4, αβ = 1"], key_idea=r"$2\pm\sqrt3$ là hai nghiệm của $t^2-4t+1=0$, nên $t^{n+2}=4t^{n+1}-t^n$ với mỗi nghiệm.",
    hints=[r"Tổng và tích của $2+\sqrt3$ và $2-\sqrt3$ bằng bao nhiêu?", "Chúng là nghiệm của phương trình bậc hai nào?", "Nhân phương trình đó với tⁿ rồi cộng cho hai nghiệm."],
    solution=[r"$\alpha=2+\sqrt3$, $\beta=2-\sqrt3$ thỏa $t^2=4t-1$.", r"Nhân với $t^n$: $\alpha^{n+2}=4\alpha^{n+1}-\alpha^n$, tương tự với $\beta$; cộng lại được $a_{n+2}=4a_{n+1}-a_n$."],
    answer="đpcm", takeaway="Dãy αⁿ + βⁿ thỏa hệ thức truy hồi có hệ số là tổng và tích của α, β.",
)
T["ptnk-2024-chuyen/3b"] = dict(
    type="Chia hết trong dãy truy hồi", knowledge=["Đồng dư", "Quy nạp"], key_idea=r"Theo mod 4: $a_{n+2}\equiv-a_n$, với $a_0=2$, $a_1=4$.",
    hints=["Tính vài số hạng đầu: a₀, a₁, a₂, a₃.", "Rút gọn hệ thức truy hồi theo modulo 4.", "Số hạng chỉ số lẻ liên hệ thế nào với a₁?"],
    solution=[r"$4a_{n+1}\equiv0\pmod4$ nên $a_{n+2}\equiv-a_n\pmod4$.", r"Chỉ số lẻ: $a_n\equiv\pm a_1=\pm4\equiv0$; chỉ số chẵn: $a_n\equiv\pm a_0=\pm2\not\equiv0\pmod4$."],
    answer="a_n chia hết cho 4 khi và chỉ khi n lẻ", takeaway="Đưa hệ thức truy hồi về modulo cần xét, rồi theo dõi số dư.",
)
T["ptnk-2024-chuyen/3c"] = dict(
    type="Chia hết trong dãy truy hồi – tuần hoàn", knowledge=["Đồng dư", "Tính tuần hoàn"], key_idea="Mọi aₙ đều chẵn, nên chỉ cần xét chia hết cho 7; dãy số dư mod 7 tuần hoàn.",
    hints=["aₙ có luôn chẵn không?", "Lập bảng aₙ mod 7: 2, 4, 0, 3, 5, 3, 0, 4, 2, …", "Các chỉ số có số dư 0 cách nhau bao nhiêu?"],
    solution=["a₀ = 2, a₁ = 4 chẵn và hệ thức giữ tính chẵn: mọi aₙ chẵn.", "Mod 7: 2, 4, 0, 3, 5, 3, 0, 4, 2, 4, … (chu kỳ 8); aₙ ≡ 0 khi n ≡ 2 hoặc 6 (mod 8)."],
    answer="n = 4k + 2 (k tự nhiên)", takeaway="Với chia hết cho hợp số, tách thành các thừa số nguyên tố cùng nhau và xét từng modulo.",
)
T["ptnk-2024-chuyen/5a"] = dict(
    type="Cực hạn – ghép cặp hiệu", knowledge=["Nguyên lý cực hạn", "Bất đẳng thức giữa các số nguyên tăng dần"],
    key_idea=r"Áp dụng giả thiết cho 16 số nhỏ nhất: $a_1>\sum_{i=2}^{16}(a_{i+15}-a_i)$ và mỗi hiệu $\ge15$.",
    hints=["Chọn 16 thẻ nào để giả thiết \"khó\" nhất?", "Ghép a₁₇ với a₂, a₁₈ với a₃, …: mỗi hiệu ít nhất bao nhiêu?", "Có 15 hiệu như vậy."],
    solution=[r"Giả thiết với 16 thẻ nhỏ nhất: $a_1+\cdots+a_{16}>a_{17}+\cdots+a_{31}$.", r"$\Rightarrow a_1>(a_{17}-a_2)+\cdots+(a_{31}-a_{16})$, mỗi hiệu $\ge15$ (15 bước tăng).", r"$a_1>225\Rightarrow a_1\ge226$ (đạt được với $a_i=225+i$)."],
    answer="a₁ ≥ 226", takeaway="Áp dụng giả thiết cho trường hợp xấu nhất, rồi ghép cặp để chặn từng phần.",
)
T["ptnk-2025-chuyen/1a"] = dict(
    type="Phương trình bậc hai có tham số", knowledge=["Δ'"], key_idea=r"$\Delta'=(m+1)^2-2m=m^2+1>0$.",
    hints=["Tính Δ'.", "Δ' có thể âm hay bằng 0 không?"], solution=[r"$\Delta'=(m+1)^2-2m=m^2+1\ge1>0$ với mọi $m$."], answer="đpcm", takeaway="Biệt thức là tổng bình phương cộng số dương thì luôn dương.",
)
T["ptnk-2025-chuyen/1b"] = dict(
    type="Biểu thức đối xứng của nghiệm", knowledge=["Vi-ét", r"$x^2+y^2\ge\frac{(x+y)^2}{2}$"], key_idea=r"$x_1^4+x_2^4\ge\frac{(x_1^2+x_2^2)^2}{2}$ và $x_1^2+x_2^2=4(m^2+m+1)\ge3$.",
    hints=["Tính x₁² + x₂² theo m bằng Vi-ét.", r"So sánh $x_1^4+x_2^4$ với $\frac{(x_1^2+x_2^2)^2}{2}$.", "Dấu bằng có thể xảy ra không?"],
    solution=[r"$S=2(m+1)$, $P=2m$: $x_1^2+x_2^2=S^2-2P=4\left(m^2+m+1\right)=4\left(m+\frac12\right)^2+3\ge3$.",
              r"$x_1^4+x_2^4\ge\frac{(x_1^2+x_2^2)^2}{2}\ge\frac92$ (vì $(x_1^2-x_2^2)^2\ge0$).",
              r"Dấu bằng cần đồng thời $m=-\frac12$ và $x_1^2=x_2^2$; nhưng $x_1\ne x_2$ và $x_1+x_2=S=1\ne0$ nên $x_1^2\ne x_2^2$. Vậy $x_1^4+x_2^4>\frac92$."],
    answer="đpcm", takeaway="Bất đẳng thức chặt: chỉ ra rằng các điều kiện để dấu bằng xảy ra không thể cùng đúng.",
)
T["ptnk-2025-chuyen/1c"] = dict(
    type="Biểu thức chứa căn – đơn điệu", knowledge=["Nhân liên hợp", "Tính đơn điệu", "Vi-ét"],
    key_idea=r"$(x+\sqrt{x^2+1})(-x+\sqrt{x^2+1})=1$ và $f(t)=t+\sqrt{t^2+1}$ đồng biến, nên tích bằng 1 khi và chỉ khi $x_2=-x_1$.",
    hints=[r"Tính $(x+\sqrt{x^2+1})(-x+\sqrt{x^2+1})$.", r"Nếu tích bằng 1 thì $x_2+\sqrt{x_2^2+1}$ bằng biểu thức nào của $x_1$?", "Hàm t + √(t² + 1) đơn điệu thế nào? Từ đó x₁ + x₂ = ?"],
    solution=[r"$f(x_1)f(x_2)=1\Leftrightarrow f(x_2)=\frac1{f(x_1)}=f(-x_1)$.", r"$f$ đồng biến nên $x_2=-x_1\Leftrightarrow S=2(m+1)=0\Leftrightarrow m=-1$.", "Ngược lại m = −1 thì x₂ = −x₁ và tích bằng 1."],
    answer="m = −1", takeaway="Biểu thức t + √(t² + 1) có \"nghịch đảo\" là −t + √(t² + 1).",
)
T["ptnk-2025-chuyen/2a"] = dict(
    type="Hệ phương trình tuyến tính – xây dựng ví dụ", knowledge=["Hệ phương trình bậc nhất"],
    key_idea="(a + b) + (c + d) = (b + c) + (d + a) nên tổng cạnh CD phải bằng tổng hai cạnh BC, DA: CD = 3, {BC, DA} = {1, 2}.",
    hints=["Ghi a, b, c, d ở A, B, C, D. Tổng a + b + c + d tính theo hai cặp cạnh đối nhau.", "Suy ra cạnh CD mang tổng bao nhiêu?", "Chọn b = t rồi tính a, c, d."],
    solution=["a + b = 0 nên c + d = (b + c) + (d + a): CD = 3, BC và DA mang 1 và 2.", "Chọn BC = 1, DA = 2, b = −1/4: a = 1/4, c = 5/4, d = 7/4 (đôi một phân biệt)."],
    answer="Ví dụ A = 1/4, B = −1/4, C = 5/4, D = 7/4", takeaway="Cộng các điều kiện theo hai cách để tìm ràng buộc ẩn trước khi chọn số.",
)
T["ptnk-2025-chuyen/2b"] = dict(
    type="Cực trị trên họ nghiệm một tham số", knowledge=["Hoàn thành bình phương"],
    key_idea="Mọi cách ghi là b = t, a = −t, c = s₁ − t, d = 3 − s₁ + t; tổng bình phương là tam thức bậc hai theo t.",
    hints=["Biểu diễn a, c, d theo b = t (hai trường hợp BC = 1 hoặc 2).", "Tổng bình phương là hàm bậc hai của t: đỉnh ở đâu?", "Kiểm tra bốn số tại đỉnh có đôi một phân biệt."],
    solution=["Trường hợp BC = 1, DA = 2: Q(t) = 4t² + 2t + 5, nhỏ nhất tại t = −1/4: Q = 19/4.", "Trường hợp còn lại đối xứng, cũng 19/4."],
    answer="Giá trị nhỏ nhất 19/4", takeaway="Viết mọi nghiệm theo một tham số rồi tìm cực trị của tam thức bậc hai.",
)
T["ptnk-2025-chuyen/3a"] = dict(
    type="Số học – chia hết", knowledge=["Chia hết"], key_idea=r"$3m\mid m^2+m+9$ buộc $m\mid9$ và $3\mid m^2+m$.",
    hints=["Với n = 3, điều kiện là gì?", "m chia hết m² + m nên m phải chia hết số nào?", "Thử các ước của 9."],
    solution=[r"$3m\mid m^2+m+9\Rightarrow m\mid9$, $m\in\{1;3;9\}$.", r"$m=1$: $11$ không chia hết cho 3; $m=3$: $21$ không chia hết cho 9; $m=9$: $99$ không chia hết cho 27."],
    answer="Không tồn tại", takeaway="Từ A ⋮ m và A = m·(…) + c suy ra c ⋮ m.",
)
T["ptnk-2025-chuyen/3b"] = dict(
    type="Số học – đặt m = kn", knowledge=["Chia hết", "Đánh giá"], key_idea=r"$m=kn$: $\frac{m^2+m+n^2}{mn}=k+\frac1n+\frac1k\in\mathbb Z$, nên $\frac1n+\frac1k\in\{1;2\}$.",
    hints=["Đặt m = kn và viết thương thành tổng.", "1/n + 1/k nằm trong khoảng nào và phải là số nguyên nào?", "Giải từng trường hợp."],
    solution=[r"$\frac{k^2n^2+kn+n^2}{kn^2}=k+\frac1n+\frac1k$.", r"$0<\frac1n+\frac1k\le2$: bằng 2 khi $n=k=1$; bằng 1 khi $n=k=2$.", "Vậy (m, n) = (1, 1) hoặc (4, 2)."],
    answer="(m, n) ∈ {(1, 1); (4, 2)}", takeaway="Khi m chia hết cho n, đặt m = kn để thương thành tổng các phân số đơn vị.",
)

# Training targets only for verified items: build_dataset.py checks every key exists and has computed verification.
