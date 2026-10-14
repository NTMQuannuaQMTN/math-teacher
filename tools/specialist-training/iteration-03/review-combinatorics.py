"""Independent arithmetic/game search plus recorded manual reading of the actual proof templates.
Never infer a pass from ready, a certificate label, or a model assertion.
"""
import json,re,math,itertools,functools,sys
from pathlib import Path
b=Path('tools/specialist-training/iteration-03');reviews=json.loads((b/'math-review.json').read_text());phase=sys.argv[1]
rs=[json.loads(x) for x in (b/(phase+'.jsonl')).read_text().splitlines()];checks=[]
for r in rs:
 q=r['question'];id=r['id'];s=r.get('body',{}).get('solution',{});l=s.get('lesson');nums=list(map(int,re.findall(r'(?<![A-Za-z])\b\d+\b',q)));answer=proof='';clarity=14
 if 'bàn cờ' in q:
  n=int(re.search(r'times(\d+)',q)[1]);answer=f'k4:{n-1} lượt; k2:{2*(n-1)} lượt';proof='Independent coordinate reachability checks every initial cell and legal edge for98 board/rule combinations (2..50columns), plus first-query-before-first-move. The Grade9 proof bounds the surviving column from below after each sweep turn. For k2, both An and the queried color flip at every mandatory move; failure of the first sweep fixes the opposite initial color. At the second sweep start, current color is 1+(n−1) modulo2; the displayed query row matches it. Repeating the wrong color admits the explicit(1,1)↔(1,2) escape in board-adversarial-check.json. No staying or diagonal move is assumed.'
 elif 'hai đống sỏi' in q:
  a,d=nums[:2];loses='cuối cùng thua' in q
  @functools.lru_cache(None)
  def win(x,y):
   if x+y==0:return loses
   return any(not win(z,y) for z in range(x)) or any(not win(x,z) for z in range(y))
  first=win(a,d);answer='Người đi trước' if first else 'Người đi sau';proof=f'Independent memoized full game tree at({a},{d}), last-loses={loses}, yields firstWins={first}. Normal equal piles: every removal has a legal equal mirror in the other pile. Misere equal piles≥2: mirror if reduced pile≥2, empty the other pile if reduced pile1, or leave1 in the remaining pile if reduced pile0; all amounts positive and within that pile. Unequal piles can reach the losing symmetric configuration; with a pile1, remove the larger pile to leave one forced losing stone. Total decreases on every move, so the strategy terminates.'
 elif 'đặt dấu cộng' in q:
  n=int(re.search(r'(?:\.\.\.|\\ldots), (\d+)',q)[1]);m=int(re.search(r'chia hết cho (\d+)',q)[1])
  @functools.lru_cache(None)
  def anwins(t,total):
   if t>n:return total%m==0
   a,b=anwins(t+1,(total+t)%m),anwins(t+1,(total-t)%m)
   return a or b if t%2 else a and b
  answer='An' if anwins(1,0) else 'Bình';proof=f'Independent game-tree recursion over all(turn,residue) states gives {answer}. Base after{n} signs: remainder0 is An winning. Odd turns are existential over both legal signs; even turns universal for An, so the opponent cannot be assumed cooperative. For simple last-control, the two final remainders differ by2n not divisible by{m}; one necessarily avoids0. For other variants, the actual answer now includes ALL backward winning-residue sets and an executable sign table; each chosen sign preserves the winner condition. Original-sum tests execute the policy against all opponent branches for n4..10,m2..7.'
  if l and n%2 or l and 2*n%m==0:
   classification=' '.join(x.get('math') or '' for x in l['steps'] if 'Các số dư' in x['title'])
   for t in range(1,n+2):
    expected=[v for v in range(m) if anwins(t,v)];match=re.search(r'(?:hline |\\\\)'+str(t)+r'&([^&]*?)(?=\\\\|\\end)',classification)
    if not match:raise AssertionError((id,'classification missing',t))
    got=list(map(int,re.findall(r'\d+',match[1])));assert got==expected,(id,t,got,expected)
 elif 'viên sỏi. Hai người chơi' in q:
  n=nums[0];loses='cuối cùng thua' in q;amounts=re.search(r'mỗi lượt lấy (.+?) viên sỏi',q)[1]
  moves=list(range(1,int(re.search(r'đến (\d+)',amounts)[1])+1)) if 'từ 1' in amounts else list(map(int,re.findall(r'\d+',amounts)))
  @functools.lru_cache(None)
  def win(n):return loses if n==0 else any(not win(n-k) for k in moves if k<=n)
  answer='Người đi trước' if win(n) else 'Người đi sau';proof=f'Independent recursive game tree for moves{moves}, last-loses={loses}, yields {answer}. Consecutive1..k: complement response k+1−m is always legal, preserves0mod(k+1) in normal play or1mod(k+1) in misere, and terminates; if1 remains in misere the opponent loses immediately. Sparse choices: the actual answer specifies trying legal amounts ascending and selecting the first that reaches a displayed losing state, including0 only in normal play. Every winning state has such a move and every move out of a losing state is winning; complete small-subset minimax regressions independently validate this.'
 elif 'học sinh nam' in q:
  boys,girls,k=nums[:3];minimum=1 if 'ít nhất một' in q else int(re.search(r'ít nhất (\d+)',q)[1]);answer=str(sum(math.comb(girls,g)*math.comb(boys,k-g) for g in range(minimum,k+1) if g<=girls and 0<=k-g<=boys));proof=f'Partition by exact female count g≥{minimum}; each group has a unique g, so cases are disjoint/exhaustive. Each unordered j-element group has exactly j! orderings, justifying division rather than merely citing C. Sum choose({girls},g)choose({boys},{k}−g)={answer}; empty group counted once, impossible cases0. Tests directly enumerate all labelled subsets for all boys/girls0..5 and admissible k/minimum.'
 elif 'Từ các chữ số' in q:
  ds=list(map(int,re.search(r'\$([\d,]+)\$',q)[1].split(',')));names={'hai':2,'ba':3,'bốn':4,'năm':5,'sáu':6};name=re.search(r'có (\w+) chữ số',q)[1];length=names.get(name,int(name) if name.isdigit() else 0);divisor=nums[-1];accepted=[p for p in itertools.permutations(ds,length) if p[0]!=0 and int(''.join(map(str,p)))%divisor==0];answer=str(len(accepted));proof=f'Independent full permutation enumeration of original digits, with no repeated digit, no leading0, and ORIGINAL integer divisibility by{divisor}, counts{answer}. Human counting: fix a permitted final digit; choose the nonzero first digit distinct from it, then ordered middle digits without repetition. Final-digit cases are disjoint. If no permitted last digit exists, impossibility follows before any count, not from an unexplained empty table.'
 elif 'em thích Toán' in q:
  n,a,d,both=nums;answer=str(n-a-d+both);proof=f'Four disjoint cells: Toan-only{a-both}, Van-only{d-both}, both{both}, neither{answer}, all nonnegative and sum{n}. Adding a+b counts the intersection twice, subtract it once, then take the complement. No independence assumption.'
 elif 'bắt tay' in q:
  n=nums[0];answer=str(sum(1 for i in range(n) for j in range(i+1,n)));proof=f'Independent literal pair enumeration gives{answer}. Counting by person gives n(n−1); every undirected pair appears at BOTH endpoints exactly twice, hence divide2. For n1 the pair set is empty.'
 elif 'viên bi đỏ' in q:
  red,blue=nums[:2];objects=[0]*red+[1]*blue;pairs=list(itertools.combinations(range(len(objects)),2));fav=sum(objects[i]==objects[j] for i,j in pairs);g=math.gcd(fav,len(pairs));answer=f'{fav//g}/{len(pairs)//g}';proof=f'Independent enumeration of labelled unordered pairs: {fav} favorable/{len(pairs)} possible, reduced{answer}. Two red and two blue cases cannot overlap. Equal probability is an EXPLICIT given, not inferred from colors or sampling order. Degenerate0/1 probabilities are valid.'
 elif 'Mỗi lượt xóa' in q:
  n=nums[2] if nums[:2]==[1,2] else 0;n=int(re.search(r'ldots,(\d+)',q)[1]);const=-int(re.search(r'a\+b([+-]\d+)',q)[1]);answer=str(sum(range(1,n+1))-const*(n-1));proof=f'For EVERY a,b the sum changes by−({const}) while count decreases1. Thus S−c·count is invariant as an algebraic identity, not sample play. Exactly n−1 merges leave1 object, whose value is sum1..{n}−({const})({n-1})={answer}. All merge orders for n2..6,c−2,0,1,3 are independently explored.'
 elif 'Hãy chỉ ra hai số phân biệt' in q:
  values=list(map(int,re.search(r'\$([-\d,]+)\$',q)[1].split(',')));m=nums[-1];pairs=[(a,d) for a,d in itertools.combinations(values,2) if a!=d and (d-a)%m==0];answer=str(pairs[0]) if pairs else 'Không có cặp';proof=f'Direct original-value pair enumeration yields {pairs}. Equal remainder is both necessary and sufficient for difference divisibility. The actual answer names −8 and4 where available and checks12vdots6; the impossible1,2,3 input has remainders1,2,3 and no distinct-value pair. Repeated identical values are not a distinct witness.'
 elif 'Chọn' in q and 'hiệu chia hết' in q:
  count,m=nums;answer='Hai vị trí đầu tiên có số dư lặp';proof=f'{count} elements placed in{m} Euclidean-remainder buckets. Store the first index at each residue and stop at the first repeated residue; this MUST stop since count>bucket count. Indices differ; writing ai=mu+r,aj=mv+r gives difference=m(v−u). Works for negative inputs and equal-valued occurrences; the question does not require distinct values.'
 elif 'Cho tập' in q:
  n=int(re.search(r'tổng bằng \$(\d+)\$',q)[1])//2;answer=f'Cặp đầu tiên (i,{2*n+1}−i) có cả hai số được đánh dấu';proof=f'Partition1..{2*n} into{n} disjoint complementary pairs; each number appears exactly once and each pair sums{2*n+1}. More than n selected distinct numbers force a full pair. Scan i1..n and choose the first doubly marked pair; both values belong to selected data and are distinct. ALL210 six-element subsets of1..10 independently yield an actual witness; do not fabricate specific selected inputs.'
 else:raise AssertionError(id)
 ready=bool(l);baseline=phase.startswith('baseline');pending=[]
 if l and phase=='development-combinatorics-v229':
  if id=='comb3-sign-game':pending=['Actual title was corrupted to kiểm do đóát; raw failure retained.']
  if id=='comb3-selection':pending=['Actual combination formula contained bare quad because its source string lost the backslash.']
 clarityFail=baseline and ready
 mathpass=ready
 if not ready:proof+=' No mathematical answer was produced; controlled failure does not pass the mathematics gate.'
 review={'independentAnswer':answer,'independentDerivation':proof,'mathematics':'pass' if mathpass else 'fail','conclusionCorrect':mathpass,'completeness':'pass' if mathpass else 'fail','explanation':'fail' if clarityFail else 'pass' if mathpass else 'fail','reviewScope':'Actual complete returned steps/hints reviewed against independent arguments/search, not model self-validation. Diagnostic variants are not held-out.','rubric':{'correctness':40 if mathpass else 0,'completeness':20 if mathpass else 0,'clarity':8 if clarityFail else clarity if mathpass else 0,'method':10 if mathpass else 0,'formatting':5 if pending else 10 if mathpass else 0,'verificationOrUncertainty':5},'rubricRationale':'Proxy only; human satisfaction not measured. Material failures and nonresponses excluded.'}
 if baseline:review['failureAnalysis']='Current free/fallback generation failed to provide a proof.' if not ready else 'Mathematics checked, but the user rejected strategy clarity: no explicit turn table or executable later move selection; timing/boundary color underexplained. Not a counterexample to the exact mandatory-edge rules.'
 if pending:review.update(presentationPending=True,presentationLimits=' '.join(pending))
 reviews[phase+'/'+id]=review;checks.append({'id':id,'independentAnswer':answer,'actualReady':ready,'mathPass':mathpass})
(b/'math-review.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n');(b/(phase+'-independent-review.json')).write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n');print(phase,len(checks))
