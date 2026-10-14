"""Independent coordinate/path checker; never assumes random opponent moves."""
import json
from pathlib import Path
BASE=Path(__file__).resolve().parent

def check(n, queries):
    cells=[(r,c) for r in range(2) for c in range(n)]
    paths={cell:[cell] for cell in cells}
    counts=[]; possible=[]
    for query in queries:
        asked={cells[i] for i in query}
        assert len(asked)==len(query)
        following={}
        for dest in cells:
            if dest in asked: continue
            for src,path in paths.items():
                if abs(dest[0]-src[0])+abs(dest[1]-src[1])==1:
                    following[dest]=path+[dest];break
        paths=following;counts.append(len(paths));possible.append([[r+1,c+1] for r,c in sorted(paths)])
    return {'caughtEveryLegalPath':not paths,'survivors':counts,'possibleCellsAfterEachMiss':possible,'escapingPath':None if not paths else [[r+1,c+1] for r,c in next(iter(paths.values()))]}

if __name__=='__main__':
    results={}
    for k in [4,2]:
        data=json.loads((BASE/f'exact-9-{k}.json').read_text())
        results[str(k)]=check(9,data['queries']);assert results[str(k)]['caughtEveryLegalPath']
    # The screenshot's fixed-colour policy: even covering each black cell is insufficient.
    black=[i for i in range(18) if sum(divmod(i,9))%2==0]
    white=[i for i in range(18) if i not in black]
    bad=[]
    for t in range(8):
        color=black if t<4 else white
        q=color[(t%4)*2:(t%4)*2+4]
        bad.append((q+[cell for cell in color if cell not in q])[:4])
    results['incorrectFixedColour']={**check(9,bad),'queriesOneBased':[[[i//9+1,i%9+1] for i in q] for q in bad]}
    assert not results['incorrectFixedColour']['caughtEveryLegalPath']
    (BASE/'independent-path-check.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:{a:v for a,v in r.items() if a!='possibleCellsAfterEachMiss'} for k,r in results.items()},ensure_ascii=False))
