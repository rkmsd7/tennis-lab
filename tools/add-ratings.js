// Adds `ratings` {serve,forehand,backhand,return,volley,movement,mental} (0–100) to every player.
// Curated for the famous names; the rest are derived from titles, era, hand and backhand.
const fs=require('fs');const P=JSON.parse(fs.readFileSync('data/players.json','utf8'));
const K=['serve','forehand','backhand','return','volley','movement','mental'];
const C={
'novak-djokovic':[86,90,99,99,80,97,99],'rafael-nadal':[82,99,90,93,85,96,99],'roger-federer':[93,98,88,88,95,96,94],
'pete-sampras':[99,92,80,78,95,88,92],'andre-agassi':[78,94,93,99,70,85,88],'andy-murray':[85,84,94,96,85,94,90],
'stan-wawrinka':[88,90,96,78,75,80,82],'carlos-alcaraz':[85,96,88,90,92,98,90],'jannik-sinner':[90,95,95,93,78,92,93],
'daniil-medvedev':[90,86,92,94,72,90,88],'alexander-zverev':[92,84,93,86,76,88,80],'juan-martin-del-potro':[88,99,82,82,70,78,84],
'dominic-thiem':[86,94,90,80,72,86,82],'gael-monfils':[88,90,80,85,80,99,70],'bjorn-borg':[80,90,92,90,72,97,97],
'john-mcenroe':[92,85,85,86,99,90,85],'jimmy-connors':[70,85,92,97,80,90,95],'ivan-lendl':[90,97,85,85,70,88,94],
'boris-becker':[97,88,82,80,96,85,90],'stefan-edberg':[85,78,92,82,99,92,86],'mats-wilander':[72,84,90,90,75,90,95],
'jim-courier':[82,95,80,84,65,82,90],'gustavo-kuerten':[84,90,96,80,72,88,86],'marat-safin':[92,92,94,86,72,82,70],
'lleyton-hewitt':[72,84,88,97,70,97,96],'andy-roddick':[99,93,74,78,72,82,85],'goran-ivanisevic':[99,84,82,70,85,78,72],
'rod-laver':[86,92,88,86,94,92,96],'ken-rosewall':[70,84,98,92,92,90,95],'john-newcombe':[94,90,80,78,95,84,88],
'arthur-ashe':[92,86,88,78,88,84,88],'guillermo-vilas':[76,92,90,86,70,88,92],'patrick-rafter':[84,80,80,80,99,94,86],
'marin-cilic':[94,90,86,80,72,78,80],'michael-chang':[68,84,86,94,70,99,94],'thomas-muster':[80,94,84,86,65,92,96],
'sergi-bruguera':[72,92,86,86,65,92,88],'yevgeny-kafelnikov':[82,86,92,88,78,82,78],'carlos-moya':[86,96,78,80,68,84,82],
'juan-carlos-ferrero':[82,94,84,88,70,94,86],'richard-krajicek':[98,88,78,70,90,78,78],'michael-stich':[94,86,88,76,92,86,80],
'pat-cash':[86,80,80,76,99,90,82],'yannick-noah':[88,86,78,78,96,94,84],'ilie-nastase':[78,88,88,86,90,94,70],
'stan-smith':[94,86,82,78,94,82,88],'roy-emerson':[86,88,86,82,94,92,90],'john-isner':[99,88,70,62,78,62,80],
'nick-kyrgios':[97,92,82,78,86,84,60],'grigor-dimitrov':[86,88,90,82,90,92,78],'kei-nishikori':[76,92,94,92,70,92,84],
'david-ferrer':[70,86,86,96,66,97,97],'tomas-berdych':[90,94,88,80,72,78,78],'jo-wilfried-tsonga':[92,94,80,78,88,86,80],
'casper-ruud':[84,94,82,84,68,86,88],'stefanos-tsitsipas':[90,94,80,78,88,88,80],'holger-rune':[86,90,90,86,80,90,74],
'taylor-fritz':[94,92,86,84,72,80,84],'alex-de-minaur':[76,82,86,94,76,99,92],'jack-draper':[90,92,84,86,78,84,82],
'ben-shelton':[98,92,78,76,82,86,78],'lorenzo-musetti':[82,86,94,82,86,88,80],'andrey-rublev':[88,98,82,84,66,84,74],
'hubert-hurkacz':[97,86,84,76,86,80,80],'frances-tiafoe':[86,90,82,82,80,90,76],'tommy-paul':[82,86,86,88,80,94,84],
'felix-auger-aliassime':[94,92,82,80,82,86,78],'matteo-berrettini':[96,96,76,74,80,80,80],'arthur-fils':[90,94,84,82,76,90,78],
'joao-fonseca':[88,97,84,80,70,86,76],'jakub-mensik':[96,86,88,80,74,84,78],'denis-shapovalov':[90,88,92,76,80,86,68],
'serena-williams':[99,95,92,92,80,88,98],'venus-williams':[95,90,88,85,85,90,88],'steffi-graf':[90,99,80,85,80,97,95],
'martina-navratilova':[92,85,88,85,99,95,95],'monica-seles':[75,95,99,96,65,85,97],'chris-evert':[65,90,97,92,70,90,99],
'justine-henin':[82,92,99,88,88,94,93],'maria-sharapova':[88,94,94,90,60,78,97],'naomi-osaka':[93,95,88,86,60,82,85],
'iga-swiatek':[82,99,90,92,75,97,93],'aryna-sabalenka':[92,96,92,90,70,85,86],'ashleigh-barty':[84,88,86,86,90,92,92],
'kim-clijsters':[82,92,90,90,75,98,88],'lindsay-davenport':[90,95,88,82,70,70,85],'martina-hingis':[65,85,88,92,85,92,95],
'victoria-azarenka':[80,88,95,96,70,88,90],'petra-kvitova':[94,97,88,78,72,78,80],'simona-halep':[72,88,90,94,70,96,88],
'angelique-kerber':[70,80,92,94,72,94,90],'garbine-muguruza':[86,92,88,84,72,85,82],'coco-gauff':[90,82,94,96,78,99,88],
'elena-rybakina':[97,94,88,82,72,84,84],'margaret-court':[90,88,84,82,96,90,92],'billie-jean-king':[84,84,86,84,97,90,94],
'evonne-goolagong-cawley':[78,86,90,82,94,96,80],'tracy-austin':[68,88,94,92,62,86,95],'hana-mandlikova':[86,92,86,80,90,90,74],
'arantxa-sanchez-vicario':[66,86,86,96,68,98,95],'jennifer-capriati':[82,94,90,88,66,84,86],'amelie-mauresmo':[84,86,94,80,92,90,76],
'jelena-ostapenko':[80,98,92,84,62,76,70],'madison-keys':[94,97,86,80,70,80,80],'marketa-vondrousova':[74,82,88,86,86,92,82],
'barbora-krejcikova':[80,86,88,86,90,86,84],'emma-raducanu':[80,86,90,90,70,88,78],'bianca-andreescu':[82,90,88,86,84,86,80],
'sofia-kenin':[74,86,92,90,70,86,86],'jessica-pegula':[80,86,92,94,74,88,88],'mirra-andreeva':[76,86,92,88,76,92,84],
'zheng-qinwen':[94,94,84,82,70,86,84],'paula-badosa':[84,92,86,84,70,86,78],'jasmine-paolini':[70,88,86,90,76,97,88],
'elina-svitolina':[74,84,90,92,72,94,88],'ons-jabeur':[80,88,84,82,96,90,76],'caroline-wozniacki':[72,82,90,94,66,97,90],
'sloane-stephens':[78,90,86,88,70,96,78],'samantha-stosur':[92,95,76,78,86,84,74],'svetlana-kuznetsova':[82,92,86,86,80,90,78],
'ana-ivanovic':[80,96,84,82,62,84,76],'jelena-jankovic':[70,82,94,92,66,94,84],'dinara-safina':[82,90,92,84,62,80,76],
'mary-pierce':[88,96,86,80,66,72,78],'conchita-martinez':[66,88,86,88,72,88,86],'jana-novotna':[84,80,86,80,97,88,78],
'gabriela-sabatini':[78,90,88,80,86,86,78],'iva-majoli':[72,90,84,84,64,84,80],'virginia-wade':[86,84,80,78,92,86,82],
'francesca-schiavone':[72,88,86,82,86,92,86],'li-na':[82,92,92,88,68,88,80],'flavia-pennetta':[76,88,86,88,74,84,80],
'marion-bartoli':[74,88,92,94,68,82,86],'anastasia-myskina':[72,84,88,90,70,92,80]};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)/4294967295};
for(const p of P){
 const cur=C[p.id];
 if(cur){p.ratings=Object.fromEntries(K.map((k,i)=>[k,cur[i]]));continue;}
 const t=p.slams.ao+p.slams.rg+p.slams.w+p.slams.uso; const base=62+Math.min(26,t*4);
 const j=(k)=>Math.round((hash(p.id+k)-0.5)*10);
 const r={serve:base+(p.slams.w>0?6:0)+(p.tour==='ATP'?4:0)+j('s'),
  forehand:base+(p.slams.rg>0?5:0)+j('f'),
  backhand:base+(p.backhand==='2'?4:1)+j('b'),
  return:base+(p.backhand==='2'?3:0)+(p.slams.ao+p.slams.uso>0?3:0)+j('r'),
  volley:base-6+(p.era==='classic'?10:0)+(p.slams.w>0?6:0)+(p.backhand==='1'?3:0)+j('v'),
  movement:base+(p.slams.rg>0?6:0)+(p.active?4:0)+j('m'),
  mental:base+Math.min(12,t*3)+j('x')};
 p.ratings=Object.fromEntries(K.map(k=>[k,Math.max(55,Math.min(96,r[k]))]));
}
fs.writeFileSync('data/players.json',JSON.stringify(P,null,1));
console.log('rated',P.length,'curated',P.filter(p=>C[p.id]).length,'unknown curated ids',Object.keys(C).filter(id=>!P.find(p=>p.id===id)));
