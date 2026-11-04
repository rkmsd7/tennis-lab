// Merges 3D joint-angle keyframes (pose3d) and world-space ball positions (ball3d) into data/shots.json.
// Conventions: player faces -z (net), +x is the player's right. Angles in degrees. sx = shoulder forward, sz = out to side,
// sy = across the body, elbow/knee = bend, wrist = racket head down (-) / up (+). spine.turn + = right shoulder back (forehand turn).
const fs=require('fs');const f=__dirname+'/../data/shots.json';const S=JSON.parse(fs.readFileSync(f));
const fhKnees={legR:{hx:-5,hz:28,knee:40},legL:{hx:5,hz:22,knee:30}};
const K={
forehand:[
 [{},[1.5,1.1,-7]],
 [{spine:{turn:65,pitch:8},pelvis:{yaw:30,y:-.05},head:{yaw:-65},armR:{sx:-35,sz:45,elbow:80,wrist:30},armL:{sx:55,sy:-25,sz:5,elbow:15},...fhKnees},[1.6,1.0,-4]],
 [{spine:{turn:75,pitch:6,roll:8},pelvis:{yaw:40,y:-.12},head:{yaw:-75},armR:{sx:-50,sz:20,elbow:40,wrist:-60},armL:{sx:35,sy:-20,elbow:30},legR:{hx:-8,hz:30,knee:60},legL:{hx:5,hz:24,knee:45}},[1.3,.9,-1.8]],
 [{spine:{turn:-15,pitch:5},pelvis:{yaw:-15},head:{yaw:10},armR:{sx:75,sy:-15,sz:35,elbow:25},armL:{sx:-5,sz:10,elbow:90},legR:{hx:-15,hz:22,knee:15},legL:{hx:12,hz:18,knee:20}},[.95,.95,-.9]],
 [{spine:{turn:-50,pitch:10},pelvis:{yaw:-30},head:{yaw:30},armR:{sx:110,sy:-70,sz:10,elbow:120,wrist:20},armL:{sx:-25,sz:15,elbow:70},legR:{hx:-10,hz:15,knee:20},legL:{hx:10,hz:15,knee:25}},[-1.5,1.6,-7]]],
backhand_2h:[
 [{},[-1.5,1.1,-7]],
 [{spine:{turn:-70,pitch:8},pelvis:{yaw:-35,y:-.05},head:{yaw:70},armR:{sx:-10,sy:40,sz:10,elbow:70,wrist:25},hands:'two',legR:{hx:8,hz:20,knee:35},legL:{hx:-5,hz:25,knee:40}},[-1.5,1,-4]],
 [{spine:{turn:-80,pitch:6},pelvis:{yaw:-40,y:-.12},head:{yaw:80},armR:{sx:-30,sy:35,sz:-10,elbow:45,wrist:-50},hands:'two',legR:{hx:8,hz:22,knee:55},legL:{hx:-6,hz:26,knee:50}},[-1.3,.9,-1.8]],
 [{spine:{turn:10,pitch:5},pelvis:{yaw:10},head:{yaw:-10},armR:{sx:70,sy:35,sz:-20,elbow:15},hands:'two',legR:{hx:12,hz:18,knee:20},legL:{hx:-12,hz:20,knee:18}},[-.75,1,-.85]],
 [{spine:{turn:45,pitch:8},pelvis:{yaw:25},head:{yaw:-25},armR:{sx:110,sy:50,sz:-15,elbow:100,wrist:10},hands:'two',legR:{hx:10,hz:16,knee:22},legL:{hx:-8,hz:18,knee:20}},[1.5,1.6,-7]]],
backhand_1h:[
 [{},[-1.5,1.1,-7]],
 [{spine:{turn:-80,pitch:6},pelvis:{yaw:-40,y:-.05},head:{yaw:80},armR:{sx:-15,sy:45,sz:0,elbow:70,wrist:-15},hands:'throat',legR:{hx:12,hz:18,knee:35},legL:{hx:-6,hz:22,knee:40}},[-1.5,1,-4]],
 [{spine:{turn:-85,pitch:5},pelvis:{yaw:-45,y:-.1},head:{yaw:85},armR:{sx:-25,sy:40,sz:-5,elbow:50,wrist:-55},hands:'throat',legR:{hx:14,hz:18,knee:55},legL:{hx:-8,hz:22,knee:50}},[-1.3,.9,-1.8]],
 [{spine:{turn:-35,pitch:4},pelvis:{yaw:-10},head:{yaw:35},armR:{sx:70,sy:30,sz:-10,elbow:5},armL:{sx:-45,sz:40,elbow:10},legR:{hx:14,hz:16,knee:18},legL:{hx:-12,hz:20,knee:15}},[-.8,1,-.9]],
 [{spine:{turn:-30,pitch:2},pelvis:{yaw:-8},head:{yaw:30},armR:{sx:120,sy:-10,sz:30,elbow:10},armL:{sx:-60,sz:45,elbow:10},legR:{hx:12,hz:16,knee:20},legL:{hx:-10,hz:20,knee:15}},[1.2,1.5,-7]]],
slice:[
 [{},[-1.5,1.1,-7]],
 [{spine:{turn:-75,pitch:8},pelvis:{yaw:-35,y:-.03},head:{yaw:75},armR:{sx:-10,sy:45,sz:10,elbow:80,wrist:-30},hands:'throat',legR:{hx:12,hz:18,knee:35},legL:{hx:-6,hz:22,knee:40}},[-1.5,1.1,-4]],
 [{spine:{turn:-85,pitch:10},pelvis:{yaw:-45,y:-.08},head:{yaw:85},armR:{sx:0,sy:40,sz:20,elbow:75,wrist:-40},hands:'throat',legR:{hx:20,hz:14,knee:35},legL:{hx:-8,hz:20,knee:40}},[-1.2,.9,-1.8]],
 [{spine:{turn:-35,pitch:8},pelvis:{yaw:-12},head:{yaw:35},armR:{sx:60,sy:30,sz:-5,elbow:10,wrist:15},armL:{sx:-40,sz:35,elbow:15},legR:{hx:16,hz:14,knee:20},legL:{hx:-12,hz:18,knee:15}},[-.75,.85,-.9]],
 [{spine:{turn:-30,pitch:6},pelvis:{yaw:-10},head:{yaw:30},armR:{sx:70,sy:-10,sz:25,elbow:5,wrist:10},armL:{sx:-60,sz:50,elbow:10},legR:{hx:14,hz:14,knee:20},legL:{hx:-10,hz:18,knee:15}},[1.0,.9,-7]]],
serve:[
 [{pelvis:{yaw:60},spine:{turn:20,pitch:5},head:{yaw:-70},armR:{sx:20,sz:10,elbow:60},armL:{sx:25,sz:10,elbow:50},legR:{hx:-12,hz:14,knee:10},legL:{hx:14,hz:10,knee:12}},[-.3,.9,-.3]],
 [{pelvis:{yaw:60,pitch:-8,y:-.1},spine:{turn:35,pitch:-12},head:{yaw:-80,pitch:-30},armL:{sx:150,sz:20,elbow:5},armR:{sx:-30,sz:95,elbow:100,wrist:-20},legR:{hx:-10,hz:14,knee:40},legL:{hx:12,hz:10,knee:45}},[-.3,2.9,-.4]],
 [{pelvis:{yaw:60,pitch:-10,y:-.18},spine:{turn:40,pitch:-18},head:{yaw:-80,pitch:-35},armL:{sx:140,sz:15,elbow:10},armR:{sx:-40,sz:110,elbow:150,wrist:-20},legR:{hx:-10,hz:16,knee:60},legL:{hx:14,hz:12,knee:60}},[-.3,2.95,-.45]],
 [{pelvis:{yaw:20,y:.12},spine:{turn:-10,pitch:5},head:{yaw:-10,pitch:-25},armR:{sx:170,sz:20,elbow:5,wrist:10},armL:{sx:-20,sz:0,elbow:100},legR:{hx:-20,hz:12,knee:10},legL:{hx:10,hz:10,knee:5}},[.15,2.7,-.45]],
 [{pelvis:{yaw:0},spine:{turn:-20,pitch:20},head:{yaw:0,pitch:-5},armR:{sx:60,sy:-50,sz:0,elbow:80,wrist:10},armL:{sx:-20,elbow:90},legL:{hx:30,hz:10,knee:30},legR:{hx:-40,hz:14,knee:60}},[0,1.2,-9]]],
return:[
 [{spine:{pitch:15},legR:{hz:22,knee:35},legL:{hz:22,knee:35}},[.5,1,-10]],
 [{pelvis:{y:.08},spine:{pitch:12},legR:{hz:22,knee:15},legL:{hz:22,knee:15}},[.8,1,-7]],
 [{spine:{turn:50,pitch:8},pelvis:{yaw:20},head:{yaw:-50},armR:{sx:-20,sz:35,elbow:80,wrist:-20},armL:{sx:45,sy:-20,elbow:20},legR:{hx:-5,hz:26,knee:35},legL:{hx:5,hz:22,knee:30}},[1.2,1.05,-3]],
 [{spine:{turn:-5,pitch:8},pelvis:{yaw:-5},head:{yaw:5},armR:{sx:65,sy:-10,sz:30,elbow:35},armL:{sx:0,elbow:90},legR:{hx:-8,hz:22,knee:20},legL:{hx:8,hz:20,knee:20}},[.9,1.0,-.8]],
 [{spine:{turn:-30,pitch:8},pelvis:{yaw:-15},head:{yaw:15},armR:{sx:95,sy:-45,sz:15,elbow:90,wrist:10},armL:{sx:-15,elbow:70},legR:{hx:-6,hz:20,knee:22},legL:{hx:6,hz:20,knee:22}},[-.8,1.3,-7]]],
volley:[
 [{spine:{pitch:15},armR:{sx:45,sz:20,elbow:80,wrist:30},armL:{sx:45,sz:15,elbow:80},legR:{hz:16,knee:30},legL:{hz:16,knee:30}},[1,1.2,-6]],
 [{pelvis:{y:.07},spine:{pitch:12},armR:{sx:45,sz:20,elbow:80,wrist:30},armL:{sx:45,sz:15,elbow:80},legR:{hz:16,knee:15},legL:{hz:16,knee:15}},[1,1.2,-4]],
 [{spine:{turn:40,pitch:12},pelvis:{yaw:15},head:{yaw:-40},armR:{sx:10,sz:40,elbow:80,wrist:40},armL:{sx:30,sy:-20,elbow:40},legR:{hx:-5,hz:22,knee:30},legL:{hx:5,hz:18,knee:30}},[1.2,1.2,-2]],
 [{spine:{turn:20,pitch:14},pelvis:{yaw:10},head:{yaw:-20},armR:{sx:60,sz:30,elbow:40,wrist:35},armL:{sx:-10,elbow:70},legL:{hx:35,hz:12,knee:30},legR:{hx:-15,hz:18,knee:20}},[.85,1.15,-.7]],
 [{spine:{turn:10,pitch:12},pelvis:{yaw:5},head:{yaw:-10},armR:{sx:75,sz:25,elbow:30,wrist:30},armL:{sx:-10,elbow:70},legL:{hx:30,hz:12,knee:25},legR:{hx:-12,hz:18,knee:20}},[-.5,1.0,-6]]],
dropshot:[
 [{},[1.5,1.1,-7]],
 [{spine:{turn:65,pitch:8},pelvis:{yaw:30,y:-.05},head:{yaw:-65},armR:{sx:-35,sz:45,elbow:80,wrist:-20},armL:{sx:55,sy:-25,sz:5,elbow:15},...fhKnees},[1.6,1.0,-4]],
 [{spine:{turn:60,pitch:8},pelvis:{yaw:30,y:-.05},head:{yaw:-60},armR:{sx:10,sz:35,elbow:70,wrist:30},armL:{sx:35,sy:-20,elbow:30},...fhKnees},[1.2,1,-1.8]],
 [{spine:{turn:10,pitch:8},pelvis:{yaw:0},head:{yaw:-10},armR:{sx:60,sz:30,elbow:40,wrist:25},armL:{sx:-5,elbow:90},legR:{hx:-8,hz:20,knee:25},legL:{hx:8,hz:18,knee:25}},[.85,1.0,-.7]],
 [{spine:{turn:-10,pitch:14},pelvis:{yaw:-5},head:{yaw:5},armR:{sx:70,sz:25,elbow:35,wrist:20},armL:{sx:-10,elbow:80},legL:{hx:30,hz:14,knee:25},legR:{hx:-15,hz:16,knee:15}},[-.3,1.2,-8]]],
overhead:[
 [{pelvis:{yaw:55},spine:{turn:25,pitch:-5},head:{yaw:-80,pitch:-40},armL:{sx:140,sz:20,elbow:5},armR:{sx:-30,sz:95,elbow:110,wrist:-20},legR:{hx:-10,hz:14,knee:20},legL:{hx:10,hz:10,knee:20}},[.3,4.5,-2.5]],
 [{pelvis:{yaw:55},spine:{turn:25,pitch:-8},head:{yaw:-80,pitch:-40},armL:{sx:140,sz:20,elbow:5},armR:{sx:-30,sz:95,elbow:110,wrist:-20},legR:{hx:-25,hz:16,knee:30},legL:{hx:5,hz:10,knee:30}},[.2,3.8,-1.2]],
 [{pelvis:{yaw:55,y:-.12},spine:{turn:35,pitch:-15},head:{yaw:-80,pitch:-40},armL:{sx:130,sz:15,elbow:10},armR:{sx:-40,sz:110,elbow:150,wrist:-20},legR:{hx:-15,hz:16,knee:50},legL:{hx:10,hz:12,knee:50}},[.15,3.2,-.5]],
 [{pelvis:{yaw:15,y:.12},spine:{turn:-10,pitch:5},head:{yaw:-10,pitch:-25},armR:{sx:165,sz:20,elbow:5,wrist:15},armL:{sx:-20,elbow:100},legR:{hx:-20,hz:12,knee:5},legL:{hx:10,hz:10,knee:5}},[.15,2.7,-.45]],
 [{pelvis:{yaw:0},spine:{turn:-20,pitch:20},head:{yaw:0,pitch:0},armR:{sx:60,sy:-50,sz:0,elbow:80},armL:{sx:-20,elbow:90},legL:{hx:25,hz:10,knee:30},legR:{hx:-30,hz:14,knee:50}},[-.5,.8,-9]]],
tweener:[
 [{spine:{pitch:25},pelvis:{y:.05},armR:{sx:40,sz:15,elbow:30,wrist:-20},armL:{sx:-40,elbow:60},legR:{hx:50,hz:10,knee:40},legL:{hx:-35,hz:10,knee:60}},[0,3.5,-2]],
 [{spine:{pitch:20},armR:{sx:30,sz:15,elbow:20,wrist:-30},armL:{sx:40,elbow:50},legR:{hx:-30,hz:10,knee:50},legL:{hx:45,hz:10,knee:35}},[.1,.1,1.2]],
 [{spine:{pitch:15},armR:{sx:-20,sz:20,elbow:10,wrist:-60},armL:{sx:-20,sz:30,elbow:40},legR:{hx:15,hz:30,knee:20},legL:{hx:15,hz:30,knee:20}},[0,.5,.15]],
 [{spine:{pitch:10},armR:{sx:-35,sz:15,elbow:5,wrist:-90},armL:{sx:-20,sz:30,elbow:40},legR:{hx:15,hz:30,knee:20},legL:{hx:15,hz:30,knee:20}},[0,.55,-.2]],
 [{pelvis:{yaw:120},spine:{turn:40,pitch:5},head:{yaw:30},armR:{sx:30,sz:20,elbow:60},armL:{sx:0,sz:20,elbow:60},legR:{hx:10,hz:20,knee:25},legL:{hx:-5,hz:20,knee:25}},[-.5,1.8,-6]]]
};
for(const k in K){K[k].forEach(([pose,ball],i)=>{S[k].phases[i].pose3d=pose;S[k].phases[i].ball3d=ball;});}
fs.writeFileSync(f,JSON.stringify(S,null,1));console.log('merged',Object.keys(K).length);
