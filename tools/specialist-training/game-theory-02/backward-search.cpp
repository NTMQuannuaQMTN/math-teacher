// Independent universal-predecessor solver. Maximal winning belief sets,
// with no geometric symmetry reduction; coordinate-defined neighbours.
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <vector>
using namespace std;
int main(int argc,char**argv){
 int n=stoi(argv[1]),k=stoi(argv[2]),bound=stoi(argv[3]),V=2*n,N=1<<V;auto start=chrono::steady_clock::now();
 vector<int> adjacency(V),pre(N),maximal{0};
 for(int v=0;v<V;v++)for(int w=0;w<V;w++)if(abs(v/n-w/n)+abs(v%n-w%n)==1)adjacency[v]|=1<<w;
 for(int u=0;u<N;u++)for(int v=0;v<V;v++)if((adjacency[v]&u)==adjacency[v])pre[u]|=1<<v;
 vector<int>counts;long long enumerated=0;
 for(int h=1;h<=bound;h++){
  vector<unsigned char> candidate(N);for(int t:maximal)candidate[t]=1;
  for(int t:maximal){vector<int>outside;for(int v=0;v<V;v++)if(!(t>>v&1))outside.push_back(v);
   auto visit=[&](auto&&self,int offset,int left,int u)->void{
    if(left==0){candidate[pre[u]]=1;enumerated++;return;}
    for(int j=offset;j+left<=(int)outside.size();j++)self(self,j+1,left-1,u|(1<<outside[j]));
   };
   visit(visit,0,min(k,(int)outside.size()),t);
  }
  if(candidate[N-1]){
   cout<<"{\"columns\":"<<n<<",\"k\":"<<k<<",\"optimalTurns\":"<<h<<",\"enumerated\":"<<enumerated<<",\"elapsedSeconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<",\"maximalWinningCounts\":[";
   for(size_t i=0;i<counts.size();i++)cout<<(i?",":"")<<counts[i];cout<<"]}\n";return 0;
  }
  vector<unsigned char>super=candidate;
  for(int bit=0;bit<V;bit++)for(int s=0;s<N;s++)if(!(s>>bit&1))super[s]|=super[s|(1<<bit)];
  maximal.clear();for(int s=0;s<N;s++)if(candidate[s]){bool dominated=false;for(int bit=0;bit<V;bit++)if(!(s>>bit&1)&&super[s|(1<<bit)]){dominated=true;break;}if(!dominated)maximal.push_back(s);}
  counts.push_back(maximal.size());cerr<<"h="<<h<<" maximal="<<maximal.size()<<"\n";
 }
 cout<<"{\"solved\":false,\"lowerBound\":"<<bound+1<<"}\n";
}
