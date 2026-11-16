// data/slam-draws.json (every draw, by wiki name) -> data/slamruns.json keyed by player id:
// { "<id>": { titles:[{year,slam,seed,opp,oppSeed,score,road:[...]}], finals:[{year,slam,opp,score,road}] } }
const fs=require('fs');const D=JSON.parse(fs.readFileSync(process.env.IN||'data/slam-draws.json','utf8')),P=JSON.parse(fs.readFileSync('data/players.json','utf8'));
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
const ALIAS={'kerry melville':'kerry melville reid','ann haydon':'ann haydon jones','margaret smith':'margaret court','evonne goolagong':'evonne goolagong cawley','chris evert lloyd':'chris evert','billie jean moffitt':'billie jean king','martina navratilova':'martina navratilova','virginia ruzici':'virginia ruzici','li na':'li na','na li':'li na','zheng qinwen':'zheng qinwen','qinwen zheng':'zheng qinwen','guillermo vilas':'guillermo vilas'};
const byNorm={};P.forEach(p=>{byNorm[norm(p.name)]=p;byNorm[norm(p.name.split(' ').slice(-1)[0])]=byNorm[norm(p.name.split(' ').slice(-1)[0])]||p});
const find=n=>{const k=ALIAS[norm(n)]||norm(n);if(byNorm[k])return byNorm[k];const l=norm(n).split(' ').slice(-1)[0];const c=P.filter(p=>norm(p.name).split(' ').slice(-1)[0]===l&&norm(n).startsWith(norm(p.name).split(' ')[0].slice(0,3)));return c.length===1?c[0]:null};
const out={};const unmatched={};let t=0,f=0;const BR={};
Object.entries(D).sort((a,b)=>a[1].year-b[1].year).forEach(([key,d])=>{
 BR[key]={year:d.year,event:d.slam,gender:d.gender,champion:d.champion,runnerUp:d.runnerUp,rounds:d.rounds,bracket:d.bracket||[]};
 if(d.slam==='oly'){[[d.champion,true],[d.runnerUp,false]].forEach(([who,gold])=>{const p=find(who);if(!p)return;const o=out[p.id]||(out[p.id]={titles:[],finals:[]});(o.olympics||(o.olympics=[])).push({year:d.year,gold,opp:gold?d.runnerUp:d.champion,score:d.score,road:(d.roads[who]||[]).filter(m=>m.round!=='Final')})});return;}
 const add=(who,isTitle)=>{const p=find(who);if(!p){if(isTitle)unmatched[who]=(unmatched[who]||0)+1;return}const o=out[p.id]||(out[p.id]={titles:[],finals:[]});
  const rec={year:d.year,slam:d.slam,seed:isTitle?d.champSeed:d.runnerSeed,opp:isTitle?d.runnerUp:d.champion,oppSeed:isTitle?d.runnerSeed:d.champSeed,score:d.score,road:(d.roads[who]||[]).filter(m=>m.round!=='Final')};
  if(d.page.includes('December'))rec.note='December';if(d.page.includes('January'))rec.note='January';
  (isTitle?o.titles:o.finals).push(rec);isTitle?t++:f++};
 add(d.champion,true);add(d.runnerUp,false);
});
// sanity: compare title counts with players.json slam totals
const diff=[];P.forEach(p=>{if(p.slams.ao+p.slams.rg+p.slams.w+p.slams.uso===0)return;const n=(out[p.id]?.titles||[]).length,want=p.slams.ao+p.slams.rg+p.slams.w+p.slams.uso;if(n!==want)diff.push(`${p.name}: wiki ${n} vs data ${want}`)});
fs.writeFileSync('data/slamruns.json',JSON.stringify(out));fs.writeFileSync('data/brackets.json',JSON.stringify(BR));
console.log('players with runs',Object.keys(out).length,'titles',t,'finals',f);console.log('count mismatches:\n'+diff.join('\n'));console.log('unmatched champions:',unmatched);
