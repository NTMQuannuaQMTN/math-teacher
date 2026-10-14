"""Independent coordinate-pair reachability; no imports of application algorithms."""
import json
from pathlib import Path
cells={(r,c) for r in (1,2) for c in range(1,10)}
def check(queries):
    remaining=set(cells);sizes=[]
    for query in queries:
        moved={(r,c) for r,c in cells if any(abs(r-a)+abs(c-b)==1 for a,b in remaining)}
        remaining=moved-set(query);sizes.append(len(remaining))
    return sizes
four=[{(r,c) for r in (1,2) for c in (j,j+1)} for j in range(1,9)]
two=[{(1,j),(2,j+1)} for j in range(1,9)]+[{(2,j),(1,j+1)} for j in range(1,9)]
bad=[{(1,j),(2,j+1)} for j in range(1,9)]*2
result={'question':'Actual user 2×9 board game; moves share an edge and staying still is forbidden','fourQuerySurvivors':check(four),'twoQuerySurvivors':check(two),'repeatedSameSweepSurvivors':check(bad),'method':'Coordinates of all possible adversarial paths, removing queried cells after each obligatory move. Every initial square is included.'}
assert result['fourQuerySurvivors'][-1]==0 and result['twoQuerySurvivors'][-1]==0
assert result['repeatedSameSweepSurvivors'][-1]>0
Path('tools/specialist-training/iteration-02/board-reference.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
