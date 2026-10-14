"""Build an independent anti-overfitting benchmark.

The statements were written for this iteration.  Development may be inspected;
validation is used only after fixes; final remains sealed until the freeze.
"""

import json
from pathlib import Path

OUT = Path("tools/math-ai-4h-03/benchmark-v1.jsonl")
rows = []


def add(topic, split, ident, family, statement, answer, fragments, relation):
    rows.append({
        "benchmarkVersion": "math-ai-4h-03-v1",
        "id": ident,
        "topic": topic,
        "split": split,
        "family": family,
        "originalStatement": statement,
        "normalizedStatement": statement,
        "referenceAnswer": answer,
        "referenceEvidence": "Independent hand derivation plus family-specific executable certificate",
        "generalizationRelation": relation,
        "inputMode": "text_confirmed_no_ocr",
        "allowedMethods": ["Chương trình Toán lớp 9 Việt Nam", "Phương pháp thi vào lớp 10 chuyên phù hợp"],
        "evaluationCriteria": {
            "mustReturnWithinMs": 30000,
            "acceptAllFragments": fragments,
            "requireSchemaAndLatex": True,
            "requireVietnamese": True,
            "requireReasons": True,
            "requireCompleteCoverage": True,
            "controlledFailureAllowed": True,
        },
    })


# Algebra: parameter changes and surface-form changes are paired deliberately.
add("algebra", "development", "a4-p-exact", "quadratic-interpolation", "Cho đa thức P(x) có bậc không quá hai, biết P(0)=2, P(1)=5, P(2)=10. Tính P(4) và giải thích các bước.", "P(4)=26", ["26"], "new coefficients, canonical wording")
add("algebra", "development", "a4-p-paraphrase", "quadratic-interpolation", "Đa thức P có bậc không vượt quá 2 và P(0)=-1, P(1)=2, P(2)=9. Hãy tìm P(3), trình bày đầy đủ.", "P(3)=20", ["20"], "Vietnamese paraphrase and notation variation")
add("algebra", "development", "a4-median-exact", "absolute-median", "Tìm giá trị nhỏ nhất của |x-2|+|x+5|+|x-8| với x thực và tất cả giá trị x đạt giá trị nhỏ nhất.", "Giá trị nhỏ nhất 13 tại x=2", ["13", "x=2"], "new ordered constants")
add("algebra", "development", "a4-median-paraphrase", "absolute-median", "Với t là số thực, hãy tìm min của |t-10| + |t+3| + |t-4| và nêu mọi t đạt min.", "Giá trị nhỏ nhất 13 tại t=4", ["13", "t=4"], "renamed variable, reordered summands, synonym")
add("algebra", "development", "a4-sophie-exact", "sophie-germain", "Phân tích x^4+4y^4 thành tích các đa thức với hệ số nguyên và chứng minh đẳng thức.", "(x²-2xy+2y²)(x²+2xy+2y²)", ["x^2", "2xy", "2y^2"], "canonical identity with proof requirement")
add("algebra", "development", "a4-sophie-renamed", "sophie-germain", "Hãy chứng minh rồi phân tích a^4+4b^4 thành tích hai đa thức hệ số nguyên.", "(a²-2ab+2b²)(a²+2ab+2b²)", ["a^2", "2ab", "2b^2"], "renamed variables and reordered request")
add("algebra", "development", "a4-telescope-exact", "telescoping", "Với số nguyên dương n, tính tổng S=\\frac{1}{1\\cdot2}+\\frac{1}{2\\cdot3}+\\cdots+\\frac{1}{n(n+1)}. Chứng minh công thức.", "S=n/(n+1)", ["n", "n+1"], "canonical finite telescoping sum")
add("algebra", "development", "a4-telescope-paraphrase", "telescoping", "Cho n là số nguyên dương. Tính và chứng minh T=1/(1·2)+1/(2·3)+...+1/[n(n+1)].", "T=n/(n+1)", ["n", "n+1"], "plain-text operators and renamed sum")
add("algebra", "validation", "a4-val-poly-q", "quadratic-interpolation", "Biết Q là đa thức bậc nhiều nhất 2, Q(0)=4, Q(1)=1, Q(2)=0. Tính Q(5) và giải thích từng bước.", "Q(5)=9", ["9"], "held-out polynomial name and phrase")
add("algebra", "validation", "a4-val-median-u", "absolute-median", "Tìm GTNN của |u+7|+|u-6|+|u-1| trên tập số thực, đồng thời tìm u đạt GTNN.", "GTNN 13 tại u=1", ["13", "u=1"], "held-out abbreviation, variable, order")
add("algebra", "final", "a4-final-sophie-pq", "sophie-germain", "Phân tích p^4+4q^4 thành nhân tử với hệ số nguyên; khai triển lại để kiểm chứng.", "(p²-2pq+2q²)(p²+2pq+2q²)", ["p^2", "2pq", "2q^2"], "sealed variable rename and validation wording")
add("algebra", "final", "a4-final-telescope-sigma", "telescoping", "Cho N nguyên dương. Tính tổng U=\\sum_{k=1}^{N}\\frac{1}{k(k+1)} và chứng minh kết quả không bỏ qua bước triệt tiêu.", "U=N/(N+1)", ["N", "N+1"], "sealed sigma notation and uppercase parameter")

# Geometry: same theorems under changed numbers and natural wording.
add("geometry", "development", "g4-ceva-exact", "ceva", "Cho tam giác ABC. Điểm D thuộc cạnh BC, điểm E thuộc cạnh CA, với BD/DC=2 và CE/EA=4. Hai đường thẳng AD và BE cắt nhau tại P. Đường thẳng CP cắt cạnh AB tại F. Tính AF/FB và chứng minh.", "AF/FB=1/8", ["AF", "FB", "1", "8"], "new ratios, canonical wording")
add("geometry", "development", "g4-ceva-paraphrase", "ceva", "Trong tam giác ABC, D nằm trên BC, E nằm trên CA và BD:DC=3, CE:EA=5. AD giao BE tại P; CP gặp AB tại F. Hãy chứng minh và tính AF:FB.", "AF/FB=1/15", ["AF", "FB", "15"], "ratio colon and compact paraphrase")
add("geometry", "development", "g4-menelaus-exact", "menelaus", "Cho tam giác ABC. Điểm D thuộc cạnh AB, điểm E thuộc cạnh BC, với AD/DB=2 và BE/EC=3. Đường thẳng DE cắt đường thẳng AC tại F. Xác định vị trí F và tính AF/FC, kèm chứng minh.", "F ngoài đoạn AC về phía C; AF/FC=6", ["phía", "C", "6"], "new ratios, canonical wording")
add("geometry", "development", "g4-menelaus-paraphrase", "menelaus", "Tam giác ABC có D ở trên AB, E ở trên BC, AD:DB=1, BE:EC=3. Gọi F là giao điểm của DE với đường thẳng AC. F ở đâu và AF:FC bằng bao nhiêu? Chứng minh.", "F ngoài đoạn AC về phía C; AF/FC=3", ["ngoài", "C", "3"], "colon ratios and reordered definitions")
add("geometry", "development", "g4-area-131514", "triangle-area", "Cho tam giác ABC có AB=13, AC=15, BC=14. Tính diện tích tam giác bằng phương pháp lớp 9 và chứng minh các phép tính.", "Diện tích 84", ["84"], "new integer-altitude triple")
add("geometry", "development", "g4-area-paraphrase", "triangle-area", "Một tam giác ABC có ba cạnh AB=15, AC=13, BC=14. Không dùng công thức Heron, hãy dựng đường cao và tính diện tích từng bước.", "Diện tích 84", ["84"], "method constraint and side swap")
add("geometry", "development", "g4-hex-exact", "regular-hexagon", "Cho lục giác đều ABCDEF nội tiếp đường tròn tâm O, bán kính bằng 7. Tính độ dài cạnh và diện tích lục giác, chứng minh các bước.", "Cạnh 7, diện tích 147√3/2", ["7", "147", "3", "2"], "new radius, canonical wording")
add("geometry", "development", "g4-hex-paraphrase", "regular-hexagon", "Lục giác đều ABCDEF được nội tiếp đường tròn (O;8). Hãy tính cạnh và diện tích, giải thích bằng cách chia thành các tam giác.", "Cạnh 8, diện tích 96√3", ["8", "96", "3"], "circle shorthand and method hint")
add("geometry", "validation", "g4-val-ceva", "ceva", "Xét tam giác ABC với D∈BC, E∈CA, BD/DC=4, CE/EA=2. Nếu AD∩BE=P và CP∩AB=F, hãy tìm AF/FB và chứng minh từ các tỉ số diện tích.", "AF/FB=1/8", ["AF", "FB", "8"], "held-out symbols and method request")
add("geometry", "validation", "g4-val-area", "triangle-area", "Tam giác ABC có độ dài các cạnh AB=5, AC=5, BC=6. Hạ đường cao và tính diện tích, trình bày đủ lý do.", "Diện tích 12", ["12"], "held-out isosceles integer altitude")
add("geometry", "final", "g4-final-menelaus", "menelaus", "Cho D thuộc AB và E thuộc BC của tam giác ABC sao cho AD/DB=3, BE/EC=2. DE gặp đường thẳng AC ở F. Xác định đúng phía của F và tỉ số AF/FC, có chứng minh.", "F ngoài đoạn AC về phía C; AF/FC=6", ["phía", "C", "6"], "sealed compressed statement")
add("geometry", "final", "g4-final-hex", "regular-hexagon", "Một lục giác đều nội tiếp đường tròn bán kính 10. Tính cạnh và diện tích của nó bằng kiến thức lớp 9.", "Cạnh 10, diện tích 150√3", ["10", "150", "3"], "sealed omitted labels and natural phrasing")

# Number theory: arithmetic parameters are independently recomputed.
add("number_theory", "development", "n4-power-exact", "power-remainder", "Tìm số dư khi chia 7^{103} cho 5 và chứng minh.", "Số dư 3", ["3"], "new base, exponent and modulus")
add("number_theory", "development", "n4-power-paraphrase", "power-remainder", "Khi 3^{80} được chia cho 7 thì dư bao nhiêu? Hãy chứng minh bằng chu kỳ số dư.", "Số dư 2", ["2"], "question inversion and explicit method")
add("number_theory", "development", "n4-gcd-exact", "gcd-powers", "Tính \\gcd(2^{18}-1,2^{30}-1) và giải thích bằng thuật toán Euclid.", "UCLN bằng 63", ["63"], "new exponents")
add("number_theory", "development", "n4-gcd-paraphrase", "gcd-powers", "Dùng thuật toán Euclid để tìm UCLN của 3^{12}-1 và 3^{18}-1.", "UCLN bằng 728", ["728"], "Vietnamese operator and reordered request")
add("number_theory", "development", "n4-squares-exact", "sum-two-squares", "Tìm tất cả các cặp số nguyên (x,y) thỏa mãn x^2+y^2=65. Chứng minh không bỏ sót nghiệm.", "16 cặp có thứ tự", ["16", "(1,8)", "(4,7)"], "new total with two absolute patterns")
add("number_theory", "development", "n4-squares-paraphrase", "sum-two-squares", "Liệt kê đầy đủ mọi cặp số nguyên có thứ tự (a,b) sao cho a^2+b^2=25 và chứng minh tính đầy đủ.", "12 cặp có thứ tự", ["12", "(0,5)", "(3,4)"], "renamed variables and boundary containing zero")
add("number_theory", "development", "n4-repunit-exact", "repunit-11", "Chứng minh số có đúng 34 chữ số 1 liên tiếp trong hệ thập phân chia hết cho 11.", "Chia hết cho 11", ["34", "11"], "new even length")
add("number_theory", "development", "n4-repunit-paraphrase", "repunit-11", "Số tự nhiên viết bởi 2024 chữ số 1 có chia hết cho 11 không? Chứng minh câu trả lời.", "Có, chia hết cho 11", ["2024", "11"], "yes/no paraphrase and large even length")
add("number_theory", "validation", "n4-val-power", "power-remainder", "Hãy tính 11^{57} mod 7 và giải thích vì sao chu kỳ đã xét bao quát số mũ.", "Số dư 1", ["1", "7"], "held-out mod notation")
add("number_theory", "validation", "n4-val-squares", "sum-two-squares", "Có bao nhiêu cặp (u,v) nguyên thỏa u^2+v^2=50? Liệt kê chúng để chứng minh không thiếu.", "12 cặp có thứ tự", ["12", "(1,7)", "(5,5)"], "held-out count-first phrasing and equal coordinates")
add("number_theory", "final", "n4-final-gcd", "gcd-powers", "Tìm ước chung lớn nhất của 5^{14}-1 và 5^{21}-1; chứng minh bằng phép chia Euclid trên số mũ.", "UCLN bằng 78124", ["78124"], "sealed words-only gcd and new base")
add("number_theory", "final", "n4-final-repunit", "repunit-11", "Chứng minh rằng số gồm 18 chữ số đều bằng 1 là một bội của 11.", "Chia hết cho 11", ["18", "11"], "sealed natural-language repunit")

# Combinatorics: include counting, constructive existence, invariant and strategy.
add("combinatorics", "development", "c4-select-exact", "selection-count", "Có 8 học sinh nam và 7 học sinh nữ. Chọn đồng thời 4 học sinh. Có bao nhiêu cách chọn sao cho có ít nhất 2 học sinh nữ?", "903 cách", ["903"], "new counts and threshold")
add("combinatorics", "development", "c4-select-paraphrase", "selection-count", "Một nhóm có 9 nam và 6 nữ. Hỏi có bao nhiêu nhóm 5 bạn chứa tối thiểu 2 nữ? Giải thích không đếm trùng.", "2121 cách", ["2121"], "synonyms and omitted canonical lead-in")
add("combinatorics", "development", "c4-handshake-exact", "handshakes", "Có 13 người, mỗi cặp người bắt tay nhau đúng một lần. Có bao nhiêu cái bắt tay? Giải thích vì sao không đếm trùng.", "78 cái bắt tay", ["78"], "new population")
add("combinatorics", "development", "c4-handshake-paraphrase", "handshakes", "Trong buổi gặp có 16 người và hai người bất kỳ bắt tay đúng một lần. Tính tổng số lần bắt tay, chỉ rõ cách khử đếm hai lần.", "120 cái bắt tay", ["120"], "context paraphrase")
add("combinatorics", "development", "c4-probability", "pair-probability", "Trong hộp có 5 viên bi đỏ và 7 viên bi xanh, các viên phân biệt. Rút đồng thời ngẫu nhiên 2 viên, mọi cặp có khả năng như nhau. Tính xác suất hai viên cùng màu.", "31/66", ["31", "66"], "new color counts")
add("combinatorics", "development", "c4-pigeon", "pigeonhole", "Chọn 9 số nguyên bất kỳ. Chứng minh luôn có hai số có hiệu chia hết cho 8.", "Ghép theo 8 lớp số dư", ["8", "số dư"], "new threshold exactly modulus plus one")
add("combinatorics", "development", "c4-coins", "parity-invariant", "Ban đầu có 11 đồng xu đều ngửa. Mỗi lượt phải lật đúng 2 đồng xu phân biệt. Có thể làm cho cả 11 đồng xu đều sấp không? Chứng minh cho mọi dãy lượt đi.", "Không thể", ["không thể", "chẵn", "lẻ"], "new odd board size")
add("combinatorics", "development", "c4-domino", "pairing-strategy", "An và Bình luân phiên đặt một quân domino phủ đúng hai ô kề cạnh còn trống trên bàn cờ 2×10. An đi trước. Ai không còn nước đi hợp lệ thì thua. Ai có chiến lược thắng? Hãy nêu rõ nước đáp cho mọi nước đi của đối phương, chứng minh nước đáp luôn hợp lệ và trò chơi kết thúc.", "Bình thắng bằng quay 180 độ", ["Bình", "180", "mọi nước"], "new even board size")
add("combinatorics", "validation", "c4-val-inclusion", "inclusion-exclusion", "Trong một lớp có 40 học sinh, 25 em thích Toán, 21 em thích Văn và 12 em thích cả hai môn. Có bao nhiêu em không thích môn nào trong hai môn đó?", "6 học sinh", ["6"], "held-out inclusion-exclusion parameters")
add("combinatorics", "validation", "c4-val-pairs", "constructive-pairs", "Cho tập S=\\{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16\\}. Chọn bất kỳ 9 số phân biệt thuộc S. Chứng minh có hai số được chọn có tổng bằng 17 và chỉ rõ cách tìm hai số đó.", "Có cặp tổng 17", ["17", "cách", "chọn"], "held-out constructive witness")
add("combinatorics", "final", "c4-final-domino", "pairing-strategy", "Trên bảng 2×12, Minh và Lan thay nhau đặt domino vào hai ô kề cạnh còn trống; Minh đi trước và người hết nước đi thua. Ai thắng nếu chơi đúng, và người đó phải đáp thế nào sau mọi nước của đối thủ? Chứng minh đáp án.", "Lan thắng bằng quay 180 độ", ["Lan", "180", "mọi nước"], "sealed player rename and compressed game rules")
add("combinatorics", "final", "c4-final-coins", "parity-invariant", "Có 15 đồng xu đang ngửa. Mỗi bước lật chính xác hai đồng khác nhau. Liệu sau hữu hạn bước tất cả có thể cùng sấp? Chứng minh cho mọi cách chọn.", "Không thể", ["không thể", "chẵn", "lẻ"], "sealed natural paraphrase and new odd size")

assert len(rows) == 48
for topic in ("algebra", "geometry", "number_theory", "combinatorics"):
    group = [r for r in rows if r["topic"] == topic]
    assert len(group) == 12
    assert {s: sum(r["split"] == s for r in group) for s in ("development", "validation", "final")} == {"development": 8, "validation": 2, "final": 2}
assert len({r["normalizedStatement"] for r in rows}) == len(rows)
OUT.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
print(json.dumps({"output": str(OUT), "count": len(rows), "splits": {s: sum(r["split"] == s for r in rows) for s in ("development", "validation", "final")}}, ensure_ascii=False))
