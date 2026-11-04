// Adds current-generation and recent-era stars (no Slam required) to data/players.json. Idempotent.
const fs=require('fs');const f=__dirname+'/../data/players.json';const P=JSON.parse(fs.readFileSync(f));
const F={USA:'🇺🇸',AUS:'🇦🇺',GRE:'🇬🇷',DEN:'🇩🇰',NOR:'🇳🇴',GBR:'🇬🇧',ITA:'🇮🇹',FRA:'🇫🇷',ESP:'🇪🇸',CZE:'🇨🇿',CAN:'🇨🇦',BUL:'🇧🇬',JPN:'🇯🇵',SWE:'🇸🇪',RUS:'🏳️',ARG:'🇦🇷',GER:'🇩🇪',CRO:'🇭🇷',CHI:'🇨🇱',SUI:'🇨🇭',BEL:'🇧🇪',UKR:'🇺🇦',POL:'🇵🇱',PHI:'🇵🇭',ROU:'🇷🇴',TUN:'🇹🇳',CHN:'🇨🇳',SRB:'🇷🇸',LAT:'🇱🇻',KAZ:'🇰🇿',BLR:'🏳️',NED:'🇳🇱',AUT:'🇦🇹',BRA:'🇧🇷',SLO:'🇸🇮',RSA:'🇿🇦',CYP:'🇨🇾'};
const slug=n=>n.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const rows=`
Ben Shelton|USA|ATP|2002|R2|Explosive lefty server|modern
Taylor Fritz|USA|ATP|1997|R2|Big-serving baseliner|modern
Alex de Minaur|AUS|ATP|1999|R2|Speed and counter-punching|modern
Stefanos Tsitsipas|GRE|ATP|1998|R1|Aggressive all-court, one-handed backhand|modern
Holger Rune|DEN|ATP|2003|R2|Aggressive baseliner|modern
Casper Ruud|NOR|ATP|1998|R2|Clay-court forehand specialist|modern
Jack Draper|GBR|ATP|2001|L2|Heavy lefty forehand|modern
Flavio Cobolli|ITA|ATP|2002|R2|Fast-rising Italian baseliner|modern
Arthur Fils|FRA|ATP|2004|R2|Power baseliner|modern
Lorenzo Musetti|ITA|ATP|2002|R1|Artistic one-handed backhand|modern
Frances Tiafoe|USA|ATP|1998|R2|Athletic showman|modern
Tommy Paul|USA|ATP|1997|R2|All-court mover|modern
Rafael Jódar|ESP|ATP|2006|R2|Spanish prodigy|modern
Jakub Menšík|CZE|ATP|2005|R2|Big serve, flat backhand|modern
Jiří Lehečka|CZE|ATP|2001|R2|Clean power baseliner|modern
Learner Tien|USA|ATP|2005|L2|Crafty lefty counter-puncher|modern
Félix Auger-Aliassime|CAN|ATP|2000|R2|Serve and forehand|modern
Grigor Dimitrov|BUL|ATP|1991|R1|One-handed elegance|golden
Matteo Berrettini|ITA|ATP|1996|R2|Serve-forehand power|modern
Nick Kyrgios|AUS|ATP|1995|R2|Serve and showmanship|golden
Kei Nishikori|JPN|ATP|1989|R2|Early-ball counter-puncher|golden
Jo-Wilfried Tsonga|FRA|ATP|1985|R2|Athletic power|golden
David Ferrer|ESP|ATP|1982|R2|Relentless grinder|golden
Tomáš Berdych|CZE|ATP|1985|R2|Flat power baseliner|golden
Milos Raonic|CAN|ATP|1990|R2|Huge serve|golden
Robin Söderling|SWE|ATP|1984|R2|Flat power; the man who beat Nadal at RG|golden
David Nalbandian|ARG|ATP|1982|R2|Backhand artist|golden
Fernando Verdasco|ESP|ATP|1983|L2|Lefty forehand power|golden
Nikolay Davydenko|RUS|ATP|1981|R2|Early-ball baseliner|golden
Tommy Haas|GER|ATP|1978|R1|Classic all-court|golden
Marcos Baghdatis|CYP|ATP|1985|R2|Crowd favourite|golden
Jessica Pegula|USA|WTA|1994|R2|Flat, early-ball counter-puncher|modern
Elina Svitolina|UKR|WTA|1994|R2|Defensive baseliner|modern
Karolína Muchová|CZE|WTA|1996|R2|All-court variety|modern
Marta Kostyuk|UKR|WTA|2002|R2|Aggressive baseliner|modern
Diana Shnaider|RUS|WTA|2004|L2|Lefty power|modern
Maja Chwalińska|POL|WTA|2001|R2|Crafty baseliner|modern
Iva Jovic|USA|WTA|2007|R2|Teen prodigy|modern
Alexandra Eala|PHI|WTA|2005|L2|Lefty counter-puncher|modern
Victoria Mboko|CAN|WTA|2006|R2|Power prodigy|modern
Belinda Bencic|SUI|WTA|1997|R2|Clean early-ball hitter; Olympic champion 2020|modern
Ons Jabeur|TUN|WTA|1994|R2|Drop shots and variety|modern
Jasmine Paolini|ITA|WTA|1996|R2|Energetic baseliner|modern
Zheng Qinwen|CHN|WTA|2002|R2|Big serve and forehand; Olympic champion 2024|modern
Amanda Anisimova|USA|WTA|2001|R2|Flat power|modern
Madison Keys|USA|WTA|1995|R2|Power baseliner|modern
Maria Sakkari|GRE|WTA|1995|R2|Athletic baseliner|modern
Paula Badosa|ESP|WTA|1997|R2|Power baseliner|modern
Daria Kasatkina|AUS|WTA|1997|R2|Variety and touch|modern
Emma Navarro|USA|WTA|2001|R2|Consistent counter-puncher|modern
Clara Tauson|DEN|WTA|2002|R2|Flat power|modern
Karolína Plíšková|CZE|WTA|1992|R2|Serve and flat power|golden
Agnieszka Radwańska|POL|WTA|1989|R2|Touch and angles|golden
Jelena Janković|SRB|WTA|1985|R2|Two-handed backhand defence|golden
Dinara Safina|RUS|WTA|1986|R2|Power baseliner|golden
Elena Dementieva|RUS|WTA|1981|R2|Movement and groundstrokes|golden
Vera Zvonareva|RUS|WTA|1984|R2|Consistent baseliner|golden
Samantha Stosur|AUS|WTA|1984|R2|Kick serve and heavy forehand|golden
Lucie Šafářová|CZE|WTA|1987|L2|Lefty power|golden
Sabine Lisicki|GER|WTA|1989|R2|Big serve|golden
Roberta Vinci|ITA|WTA|1983|R1|Slice and net play|golden
Lindsay Davenport|USA|WTA|1976|R2|Flat power|golden
`.trim().split('\n');
let added=0;
for(const l of rows){const [name,country,tour,born,hb,style,era]=l.split('|');const id=slug(name);if(P.some(p=>p.id===id)){const p=P.find(p=>p.id===id);if(!p.style)p.style=style;continue;}
 const row={id,name,country,flag:F[country]||'🏳️',tour,born:+born,slams:{ao:0,rg:0,w:0,uso:0},era,hand:hb[0],backhand:hb[1],featured:false,style};
 // Slam winners already exist; these are non-champions or will be de-duplicated above
 P.push(row);added++;}
// current/recent generation flag for sorting
for(const p of P){p.active=p.born>=1993&&!['Andy Murray'].includes(p.name);}
fs.writeFileSync(f,JSON.stringify(P,null,1));console.log('added',added,'total',P.length);
