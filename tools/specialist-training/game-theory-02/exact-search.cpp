// Exact belief-state BFS. No sampled opponent paths. Symmetry and inclusion
// pruning preserve winning reachability: a subset has no more evasion paths.
#include <algorithm>
#include <chrono>
#include <cstdint>
#include <iostream>
#include <unordered_map>
#include <vector>
using U=uint32_t;
struct Edge {U parent=0,query=0;unsigned symmetry=0;};
int main(int argc,char**argv){
 const int n=argc>1?std::stoi(argv[1]):9,k=argc>2?std::stoi(argv[2]):4,limit=argc>3?std::stoi(argv[3]):16;
 const double seconds=argc>4?std::stod(argv[4]):60;
 if(n<2||n>10||(k!=2&&k!=4))return 2;
 const int V=2*n,N=1<<V;const U full=N-1,row=(1u<<n)-1;
 auto start=std::chrono::steady_clock::now();
 auto elapsed=[&](){return std::chrono::duration<double>(std::chrono::steady_clock::now()-start).count();};
 std::vector<U> reverse(1<<n),moved(N),canonical(N);std::vector<unsigned> symmetry(N);
 for(int x=0;x<(1<<n);x++)for(int b=0;b<n;b++)if(x&(1<<b))reverse[x]|=1u<<(n-1-b);
 auto transform=[&](U s,unsigned t){U a=s&row,b=(s>>n)&row;if(t&1)std::swap(a,b);if(t&2){a=reverse[a];b=reverse[b];}return a|(b<<n);};
 for(U s=0;s<U(N);s++){
  canonical[s]=s;for(unsigned t=1;t<4;t++){U v=transform(s,t);if(v<canonical[s]){canonical[s]=v;symmetry[s]=t;}}
  const U leftEnds=1u|(1u<<n),rightEnds=(1u<<(n-1))|(1u<<(V-1));
  moved[s]=((s&row)<<n)|(s>>n)|((s&~leftEnds)>>1)|((s&~rightEnds)<<1);
 }
 std::vector<unsigned char> seen(N),candidate(N),subset(N);std::vector<Edge> parent(N),temporary(N);
 std::vector<U> frontier={full};seen[full]=1;uint64_t actions=0;bool solved=false,timedOut=false;int depth=0;
 std::vector<size_t> generated,retained;
 for(int d=1;d<=limit&&!solved;d++){
  std::fill(candidate.begin(),candidate.end(),0);std::unordered_map<U,U> expansions;
  for(U s:frontier)expansions.emplace(moved[s],s);
  bool stop=false;
  for(auto [positions,previous]:expansions){
   if(__builtin_popcount(positions)<=k){U query=positions;for(int b=0;__builtin_popcount(query)<k;b++)query|=1u<<b;parent[0]={previous,query,0};solved=true;depth=d;break;}
   std::vector<int> bits;for(int b=0;b<V;b++)if(positions&(1u<<b))bits.push_back(b);
   auto choose=[&](auto&&self,int at,int remaining,U query)->void{
    if(stop)return;
    if(!remaining){
     actions++;U raw=positions&~query,child=canonical[raw];
     if(!seen[child]&&!candidate[child]){candidate[child]=1;temporary[child]={previous,query,symmetry[raw]};}
     if((actions&65535)==0&&elapsed()>seconds){stop=true;timedOut=true;}
     return;
    }
    for(int i=at;i+remaining<=int(bits.size());i++)self(self,i+1,remaining-1,query|(1u<<bits[i]));
   };choose(choose,0,k,0);
   if(stop)break;
  }
  if(solved||timedOut)break;
  subset=candidate;
  for(int b=0;b<V;b++)for(U s=0;s<U(N);s++)if(s&(1u<<b))subset[s]|=subset[s^(1u<<b)];
  std::vector<U> next;size_t count=0;
  for(U s=0;s<U(N);s++)if(candidate[s]){
   count++;bool dominated=false;for(int b=0;b<V&&!dominated;b++)if((s&(1u<<b))&&subset[s^(1u<<b)])dominated=true;
   if(!dominated){next.push_back(s);parent[s]=temporary[s];seen[s]=1;}
  }
  generated.push_back(count);retained.push_back(next.size());frontier=std::move(next);depth=d;
  std::cerr<<"n="<<n<<" k="<<k<<" completed="<<d<<" retained="<<frontier.size()<<" actions="<<actions<<" seconds="<<elapsed()<<std::endl;
  if(frontier.empty())break;
 }
 std::vector<U> plan;
 if(solved){U state=0;unsigned accumulated=0;for(int i=0;i<depth;i++){auto e=parent[state];accumulated^=e.symmetry;plan.push_back(transform(e.query,accumulated));state=e.parent;}std::reverse(plan.begin(),plan.end());if(state!=full)return 3;}
 std::cout<<"{\"columns\":"<<n<<",\"k\":"<<k<<",\"solved\":"<<(solved?"true":"false")<<",\"timedOut\":"<<(timedOut?"true":"false")<<",\"depth\":"<<depth<<",\"actionsEnumerated\":"<<actions<<",\"elapsedSeconds\":"<<elapsed()<<",\"queries\":[";
 for(size_t i=0;i<plan.size();i++){if(i)std::cout<<",";std::cout<<"[";bool first=true;for(int b=0;b<V;b++)if(plan[i]&(1u<<b)){if(!first)std::cout<<",";std::cout<<b;first=false;}std::cout<<"]";}
 std::cout<<"],\"generatedPerCompletedLevel\":[";for(size_t i=0;i<generated.size();i++){if(i)std::cout<<",";std::cout<<generated[i];}
 std::cout<<"],\"retainedPerCompletedLevel\":[";for(size_t i=0;i<retained.size();i++){if(i)std::cout<<",";std::cout<<retained[i];}std::cout<<"]}"<<std::endl;
}
