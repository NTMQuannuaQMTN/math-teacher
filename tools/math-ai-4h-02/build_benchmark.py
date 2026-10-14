"""Build the fixed 48-problem benchmark from the versioned iteration-03 corpus."""

import json
from pathlib import Path


SOURCE = Path("tools/specialist-training/iteration-03/cases.json")
OUTPUT = Path("tools/math-ai-4h-02/benchmark-v1.jsonl")

SELECTIONS = {
    "algebra": {
        "development": ["alg3-linear", "alg3-rational", "alg3-radical", "alg3-system", "alg3-inequality", "alg3-vieta-proof", "held3-interpolation", "held3-median", "held3-quartic-factor", "held3-telescoping"],
        "validation": ["alg3-val-nested", "alg3-val-abs-none", "alg3-val-linear-system"],
        "final": ["alg3-valC-quartic-hole", "alg3-valC-two-radical-variant", "alg3-valD-root-product-variant"],
    },
    "geometry": {
        "development": ["geo3-midline", "geo3-cyclic", "geo3-tangents", "geo3-right-altitude", "geo3-circle-diameter", "geo3-ptnk-2025-circle", "held3-ceva", "held3-menelaus", "held3-heron-free", "held3-hexagon"],
        "validation": ["geo3-val-isosceles-47", "geo3-val-thales-fraction", "geo3-val-circle-general"],
        "final": ["geo3-val-altitude", "geo3-val-concurrent", "geo3-val-diameter"],
    },
    "number_theory": {
        "development": ["nt3-divisibility", "nt3-prime", "nt3-factors", "nt3-gcd-affine", "nt3-divisor-count", "nt3-linear-integer", "held3-power-residue", "held3-gcd-powers", "held3-sum-squares", "held3-repunit"],
        "validation": ["nt3-val-seventh", "nt3-val-odd-residues", "nt3-val-factorial-boundary"],
        "final": ["nt3-val-cube-negative", "nt3-val-linear-positive-empty", "nt3-val-equation-square"],
    },
    "combinatorics": {
        "development": ["comb3-selection", "comb3-pigeonhole", "comb3-invariant", "comb3-takeaway-normal", "comb3-digits", "comb3-board-user", "held3-adjacent", "held3-rectangles", "held3-coin-invariant", "held3-domino-game"],
        "validation": ["comb3-val-board-2", "comb3-val-piles-4-4-thắng", "comb3-val-digits-9-2-5"],
        "final": ["comb3-val-sign-9-3", "comb3-val-inclusion-all", "comb3-val-pair-large"],
    },
}

REFERENCES = {
    "alg3-linear": ("x=17/4", ["17", "4"]),
    "alg3-rational": ("Vô nghiệm: rút gọn cho x=2 nhưng x=2 bị loại bởi điều kiện xác định", ["vô nghiệm", "2"]),
    "alg3-radical": ("x=3", ["3"]),
    "alg3-system": ("(x,y)=(2,7) hoặc (7,2)", ["2", "7"]),
    "alg3-inequality": ("x thuộc [-1,3/2], loại x=-1 nên (-1,3/2]", ["-1", "3", "2"]),
    "alg3-vieta-proof": ("Delta'=m^2+1>0 với mọi m thực", ["m", "1", ">0"]),
    "alg3-val-nested": ("x=3 hoặc x=-2, cùng điều kiện x khác 1", ["3", "-2", "1"]),
    "alg3-val-abs-none": ("Vô nghiệm vì giá trị tuyệt đối không âm", ["vô nghiệm"]),
    "alg3-val-linear-system": ("x=2, y=1", ["2", "1"]),
    "alg3-valC-quartic-hole": ("Vô nghiệm: rút gọn cho x^2+1=2 chỉ cho x=±1 nhưng bị loại", ["vô nghiệm", "1"]),
    "alg3-valC-two-radical-variant": ("x=3", ["3"]),
    "alg3-valD-root-product-variant": ("Tương đương m=0", ["m=0"]),
    "held3-interpolation": ("P(3)=19", ["19"]),
    "held3-median": ("Giá trị nhỏ nhất là 6, đạt duy nhất tại x=4", ["6", "4"]),
    "held3-quartic-factor": ("x^4+4y^4=(x^2-2xy+2y^2)(x^2+2xy+2y^2)", ["x", "y", "2"]),
    "held3-telescoping": ("Tổng bằng n/(n+1)", ["n", "n+1"]),
    "geo3-midline": ("Định lý đường trung bình: MN song song BC và MN=BC/2", ["MN", "BC"]),
    "geo3-cyclic": ("Hai góc BEC và BFC cùng bằng 90 độ nên BCEF nội tiếp", ["90", "nội tiếp"]),
    "geo3-tangents": ("Hai tam giác vuông ABO, ACO bằng nhau; AB=AC và AO vuông góc BC", ["AB", "AC", "AO", "BC"]),
    "geo3-right-altitude": ("Đồng dạng cho AB^2=BH.BC và AH^2=BH.CH", ["AB", "BH", "BC", "AH", "CH"]),
    "geo3-circle-diameter": ("Tam giác ACB vuông; hệ thức lượng CA^2=AH.AB", ["CA", "AH", "AB"]),
    "geo3-ptnk-2025-circle": ("Phải chứng minh lần lượt AEDF nội tiếp rồi O thuộc đường tròn ấy, không suy từ hình", ["A", "D", "E", "F", "O", "nội tiếp"]),
    "geo3-val-isosceles-47": ("Q=R=66.5 độ", ["66", "5"]),
    "geo3-val-thales-fraction": ("XY=91/11", ["91", "11"]),
    "geo3-val-circle-general": ("Kết luận vẫn đúng; phải xét đầy đủ vị trí của E và F thay vì suy từ hình", ["A", "D", "E", "F", "O", "nội tiếp"]),
    "geo3-val-altitude": ("Đồng dạng cho XY^2=YT.YZ và XT^2=YT.ZT", ["XY", "YT", "YZ", "XT", "ZT"]),
    "geo3-val-concurrent": ("T là trực tâm nên RT vuông góc PQ", ["RT", "PQ"]),
    "geo3-val-diameter": ("Tam giác PRQ vuông; RP^2=PS.PQ", ["RP", "PS", "PQ"]),
    "held3-ceva": ("AF/FB=1/6", ["1", "6"]),
    "held3-menelaus": ("F nằm ngoài đoạn AC về phía C và AF/FC=6", ["6", "ngoài"]),
    "held3-heron-free": ("Diện tích bằng 84", ["84"]),
    "held3-hexagon": ("Cạnh bằng 5; diện tích bằng 75 căn 3 chia 2", ["5", "75", "3", "2"]),
    "nt3-divisibility": ("Ba số liên tiếp có một bội 3 và ít nhất một số chẵn", ["3", "2", "6"]),
    "nt3-prime": ("p=3", ["p=3"]),
    "nt3-factors": ("(x-4)(y-3)=20; liệt kê đủ các ước nguyên", ["20"]),
    "nt3-gcd-affine": ("UCLN(n+2,n+8) là ước dương của 6: 1,2,3,6", ["1", "2", "3", "6"]),
    "nt3-divisor-count": ("12,18,20,28,32,44,45,50,52,63,68,75,76,92,98", ["12", "18", "20", "98"]),
    "nt3-linear-integer": ("x=8+11t, y=-5-7t với t nguyên", ["11", "7"]),
    "nt3-val-seventh": ("Chứng minh đồng thời chia hết cho 2,3,7", ["2", "3", "7", "42"]),
    "nt3-val-odd-residues": ("Mọi k lẻ và chỉ các k lẻ, tương đương k đồng dư 1,3,5,7 modulo 8", ["1", "3", "5", "7", "8"]),
    "nt3-val-factorial-boundary": ("0!=1 nên có 0 chữ số 0 tận cùng", ["0", "1"]),
    "nt3-val-cube-negative": ("(u,v)=(-2,-1) và (1,2)", ["-2", "-1", "1", "2"]),
    "nt3-val-linear-positive-empty": ("Không có cặp số nguyên dương", ["không"]),
    "nt3-val-equation-square": ("Không có số nguyên n", ["không"]),
    "held3-power-residue": ("Số dư là 2", ["2"]),
    "held3-gcd-powers": ("Ước chung lớn nhất bằng 63", ["63"]),
    "held3-sum-squares": ("Có 12 cặp số nguyên có thứ tự", ["12"]),
    "held3-repunit": ("Số gồm 2026 chữ số 1 chia hết cho 11", ["11"]),
    "comb3-selection": ("C(10,3)-C(6,3)=100", ["100"]),
    "comb3-pigeonhole": ("Có 6 lớp số dư modulo 6 cho 7 số", ["6", "7"]),
    "comb3-invariant": ("Tổng trừ số lượng giảm là bất biến; kết quả 106", ["106"]),
    "comb3-takeaway-normal": ("Người đi trước lấy 1 rồi bù tổng 4", ["1", "4"]),
    "comb3-digits": ("36", ["36"]),
    "comb3-board-user": ("Lịch truy bắt được kiểm tra vét cạn: k=4 trong 6 lượt, k=2 trong 16 lượt", ["6", "16"]),
    "comb3-val-board-2": ("k=4 bắt ngay; k=2 có lịch không quá 2 lượt", ["1", "2"]),
    "comb3-val-piles-4-4-thắng": ("Người đi trước không có chiến lược thắng; đối thủ bắt chước để giữ hai đống bằng nhau", ["không", "bằng"]),
    "comb3-val-digits-9-2-5": ("4 số", ["4"]),
    "comb3-val-sign-9-3": ("Phải nêu người thắng và chiến lược đáp lại cho mọi nước", ["chiến lược"]),
    "comb3-val-inclusion-all": ("0 học sinh", ["0"]),
    "comb3-val-pair-large": ("Chia thành sáu cặp tổng 13; chọn 8 số nên có đủ một cặp", ["13", "6", "8"]),
    "held3-adjacent": ("Có 240 cách", ["240"]),
    "held3-rectangles": ("Có 18 hình chữ nhật", ["18"]),
    "held3-coin-invariant": ("Không thể lật tất cả về mặt sấp vì bất biến chẵn lẻ", ["không", "chẵn", "lẻ"]),
    "held3-domino-game": ("Bình thắng bằng cách đối xứng qua phép quay 180 độ", ["Bình", "180"]),
}


rows_by_id = {row["id"]: row for row in json.loads(SOURCE.read_text())}
out = []
for domain, splits in SELECTIONS.items():
    for evaluation_split, ids in splits.items():
        for problem_id in ids:
            source = rows_by_id[problem_id]
            reference_answer, accept_all = REFERENCES[problem_id]
            out.append(
                {
                    "benchmarkVersion": "math-ai-4h-02-v1",
                    "id": problem_id,
                    "topic": domain,
                    "difficulty": source.get("difficulty", "Không xác định"),
                    "type": source.get("type", "Không xác định"),
                    "originalStatement": source["text"],
                    "normalizedStatement": source["text"],
                    "referenceAnswer": reference_answer,
                    "referenceEvidence": f'worker regression tests and deterministic family verifier for {source.get("type", problem_id)}',
                    "allowedMethods": ["Chương trình Toán lớp 9 Việt Nam", "Phương pháp thi vào lớp 10 chuyên phù hợp"],
                    "inputMode": "text_confirmed_no_ocr",
                    "evaluationCriteria": {
                        "mustReturnWithinMs": 30000,
                        "acceptAllFragments": accept_all,
                        "requireSchemaAndLatex": True,
                        "requireVietnamese": True,
                        "requireReasons": True,
                        "controlledFailureAllowed": True,
                    },
                    "split": evaluation_split,
                    "source": source.get("source", "iteration-03 curated corpus"),
                }
            )

assert len(out) == 64
assert all(sum(row["topic"] == domain for row in out) == 16 for domain in SELECTIONS)
OUTPUT.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in out))
print(json.dumps({"output": str(OUTPUT), "count": len(out)}, ensure_ascii=False))
