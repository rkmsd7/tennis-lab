// Fetches every Grand Slam singles draw from Wikipedia (wikitext bracket templates) and traces the
// two finalists' paths round by round with scores. Raw pages are cached in CACHE; output is OUT.
// Usage: node tools/slam-draws.js [fromYear] [toYear]
const fs=require('fs'),path=require('path');
const CACHE=process.env.CACHE||path.join(process.env.TMPDIR||'/tmp','slam-wiki');fs.mkdirSync(CACHE,{recursive:true});
const OUT=process.env.OUT||'data/slam-draws.json';
const UA='TennisLab/1.0 (fan encyclopedia; github.com/rkmsd7/tennis-lab)';
const from=+process.argv[2]||1950, to=+process.argv[3]||2026;
const SLAMS=[['ao',y=>y>=1969?`${y} Australian Open`:`${y} Australian Championships`],['rg',y=>y>=1968?`${y} French Open`:`${y} French Championships`],['w',y=>`${y} Wimbledon Championships`],['uso',y=>y>=1968?`${y} US Open`:`${y} U.S. National Championships`],['oly',y=>y>=1988&&y%4===0?`Tennis at the ${y} Summer Olympics`:null]];
async function wikitext(title){
 const f=path.join(CACHE,title.replace(/[^\w]+/g,'_')+'.json');
 if(fs.existsSync(f))return JSON.parse(fs.readFileSync(f,'utf8')).text;
 const u=`https://en.wikipedia.org/w/api.php?action=parse&redirects=1&prop=wikitext&format=json&formatversion=2&page=${encodeURIComponent(title)}`;
 let j=null;for(let a=0;a<6;a++){const r=await fetch(u,{headers:{'User-Agent':UA}});const body=await r.text();try{j=JSON.parse(body);break}catch(e){const wait=(a+1)*20000;process.stdout.write(`throttled on ${title}; waiting ${wait/1000}s\n`);await new Promise(r=>setTimeout(r,wait))}}
 if(!j)throw new Error('throttled');const text=j.parse?j.parse.wikitext:null;
 fs.writeFileSync(f,JSON.stringify({title,text}));await new Promise(r=>setTimeout(r,900));return text;
}
// --- wikitext helpers ---
function templates(t){ // every {{NTeamBracket...}} with balanced braces
 const out=[];const re=/\{\{\s*(\d+)TeamBracket[^{}|]*/g;let m;
 while((m=re.exec(t))){let d=0,i=m.index;for(;i<t.length;i++){if(t.startsWith('{{',i)){d++;i++}else if(t.startsWith('}}',i)){d--;i++;if(d===0)break}}out.push({size:+m[1],body:t.slice(m.index+2,i-1)});}
 return out;
}
function params(body){ // split on top-level pipes
 const p={};let d=0,cur='',parts=[];for(let i=0;i<body.length;i++){const c=body[i];if(body.startsWith('{{',i)||body.startsWith('[[',i)){d++;cur+=body.slice(i,i+2);i++;continue}if(body.startsWith('}}',i)||body.startsWith(']]',i)){d--;cur+=body.slice(i,i+2);i++;continue}if(c==='|'&&d===0){parts.push(cur);cur='';continue}cur+=c}parts.push(cur);
 parts.slice(1).forEach(s=>{const k=s.indexOf('=');if(k<0)return;p[s.slice(0,k).trim()]=s.slice(k+1).trim()});return p;
}
const clean=s=>String(s||'').replace(/\{\{flagicon[^}]*\}\}/gi,'').replace(/\{\{[^}]*\}\}/g,'').replace(/<[^>]+>/g,'').replace(/'''/g,'').replace(/''/g,'').replace(/&nbsp;/g,' ').trim();
function name(s){ // prefer the link target (full name)
 if(!s)return'';const l=s.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);let n=l?l[1]:clean(s);n=n.replace(/\s*\((?:tennis|tennis player)[^)]*\)/i,'').replace(/^the\s+/i,'').trim();return clean(n);
}
const isBold=s=>/'''[^']*\[\[|\[\[[^\]]*\]\]'''|'''/.test(String(s||''))&&/'''/.test(s);
function setScore(w,l){ // one set, winner-first, tiebreak from loser's sup
 const num=x=>{const m=String(x||'').match(/(\d+)/);return m?+m[1]:null};const sup=x=>{const m=String(x||'').match(/<sup>\s*(\d+)\s*<\/sup>/);return m?m[1]:null};
 if(/w\/o/i.test(w)||/w\/o/i.test(l))return 'w/o';
 const a=num(w),b=num(l);if(a==null||b==null)return null;
 let s=`${a}–${b}`;const tb=a>b?sup(l):sup(w);if(tb!=null&&Math.abs(a-b)<=1&&Math.max(a,b)>=6)s+=`(${tb})`;
 if(/<sup>\s*r\s*<\/sup>|ret/i.test(w+l))s+=' ret.';return s;
}
function matches(tpl){ // -> [{rd, winner, loser, wseed, lseed, score}]
 const p=params(tpl.body);const out=[];const rounds=new Set();
 Object.keys(p).forEach(k=>{const m=k.match(/^RD(\d+)-team(\d+)$/);if(m)rounds.add(+m[1])});
 for(const rd of [...rounds].sort((a,b)=>a-b)){
  const slots=Object.keys(p).filter(k=>k.startsWith(`RD${rd}-team`)).map(k=>k.slice(`RD${rd}-team`.length)).sort((a,b)=>+a-+b);
  for(let i=0;i+1<slots.length;i+=2){
   const A=slots[i],B=slots[i+1];const ta=p[`RD${rd}-team${A}`],tb=p[`RD${rd}-team${B}`];if(!name(ta)||!name(tb))continue;
   const sa=[],sb=[];for(let s=1;s<=5;s++){sa.push(p[`RD${rd}-score${A}-${s}`]||'');sb.push(p[`RD${rd}-score${B}-${s}`]||'')}
   let aWins=isBold(ta),bWins=isBold(tb);
   if(aWins===bWins){ // fall back: count sets
    let ca=0,cb=0;for(let s=0;s<5;s++){const x=+(String(sa[s]).match(/\d+/)||[NaN])[0],y=+(String(sb[s]).match(/\d+/)||[NaN])[0];if(isNaN(x)||isNaN(y))continue;if(x>y)ca++;else if(y>x)cb++}aWins=ca>cb;bWins=cb>ca;if(aWins===bWins)continue;
   }
   const [W,L,wS,lS,ws,ls]=aWins?[ta,tb,sa,sb,p[`RD${rd}-seed${A}`],p[`RD${rd}-seed${B}`]]:[tb,ta,sb,sa,p[`RD${rd}-seed${B}`],p[`RD${rd}-seed${A}`]];
   const sets=[];for(let s=0;s<5;s++){const x=setScore(wS[s],lS[s]);if(x)sets.push(x)}
   out.push({rd,winner:name(W),loser:name(L),wseed:clean(ws),lseed:clean(ls),score:sets.join(' ')||(/w\/o/i.test(wS.join()+lS.join())?'w/o':'')});
  }
 }
 return {rounds:rounds.size,ms:out};
}
function ordinal(n){return ['First','Second','Third','Fourth','Fifth','Sixth','Seventh'][n-1]+' round'}
function trace(text){
 const tpls=templates(text).map(matches).filter(t=>t.ms.length&&t.rounds>=2);if(!tpls.length)return null;
 // The finals template holds the Final: the one whose last round decides a single match. Pick the last template whose top round has exactly one match.
 const topRound=t=>t.ms.filter(m=>m.rd===Math.max(...t.ms.map(x=>x.rd)));
 let fin=tpls.find(t=>topRound(t).length===1&&t.rounds>=2&&tpls.every(o=>o===t||!o.ms.some(m=>m.rd>t.rounds&&false)));
 if(!fin)fin=tpls.find(t=>topRound(t).length===1);if(!fin)return null;
 const sections=tpls.filter(t=>t!==fin);
 const secRounds=sections.length?Math.max(...sections.map(t=>t.rounds)):0;
 const T=sections.length?secRounds+Math.round(Math.log2(sections.length)):fin.rounds;
 const total=Math.max(T,fin.rounds);
 const label=k=>k===total?'Final':k===total-1?'Semifinal':k===total-2?'Quarterfinal':ordinal(k);
 const all=[];sections.forEach(t=>t.ms.forEach(m=>all.push({...m,k:m.rd})));fin.ms.forEach(m=>all.push({...m,k:total-fin.rounds+m.rd}));
 const final=all.find(m=>m.k===total);if(!final)return null;
 const road=n=>{const seen=new Set();return all.filter(m=>m.winner===n||m.loser===n).sort((a,b)=>a.k-b.k).filter(m=>{const key=m.k+'|'+(m.winner===n?m.loser:m.winner);if(seen.has(key))return false;seen.add(key);return true}).map(m=>({round:label(m.k),opp:m.winner===n?m.loser:m.winner,oppSeed:m.winner===n?m.lseed:m.wseed,score:m.score,win:m.winner===n}))};
 const seenB=new Set();const bracket=all.filter(m=>m.k>=total-3).filter(m=>{const key=m.k+'|'+m.winner+'|'+m.loser;if(seenB.has(key))return false;seenB.add(key);return true}).sort((a,b)=>a.k-b.k).map(m=>({r:label(m.k),w:m.winner,l:m.loser,ws:m.wseed,ls:m.lseed,s:m.score}));
 return {bracket,champion:final.winner,runnerUp:final.loser,champSeed:final.wseed,runnerSeed:final.lseed,score:final.score,rounds:total,roads:{[final.winner]:road(final.winner),[final.loser]:road(final.loser)}};
}
(async()=>{
 const out=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):{};let n=0,miss=[];
 for(let y=from;y<=to;y++)for(const [slam,title] of SLAMS)for(const g of ['Men','Women']){
  const key=`${y}|${slam}|${g}`;if(!process.env.REPARSE&&out[key]&&out[key].champion)continue;
  if(!title(y))continue;const variants=[`${title(y)} – ${g}'s singles`];if(slam==='ao'&&y===1977)variants.length=0,variants.push(`1977 Australian Open (January) – ${g}'s singles`,`1977 Australian Open (December) – ${g}'s singles`);
  for(const v of variants){try{const t=await wikitext(v);if(!t){miss.push(v);continue}const r=trace(t);if(!r){miss.push(v+' (no bracket)');continue}
   const k2=variants.length>1?`${key}|${v.includes('December')?'dec':'jan'}`:key;out[k2]={year:y,slam,gender:g,page:v,...r};n++;process.stdout.write(`${k2}: ${r.champion} d. ${r.runnerUp} ${r.score} [${r.roads[r.champion].length} rounds]\n`)}catch(e){miss.push(v+' ERR '+e.message)}}
  if(n%10===0)fs.writeFileSync(OUT,JSON.stringify(out));
 }
 fs.writeFileSync(OUT,JSON.stringify(out));console.log('done',Object.keys(out).length,'draws; missing:\n'+miss.join('\n'));
})();
