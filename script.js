// common.js - UNIQUE SOURCE DE VÉRITÉ - Utilisé par toutes les pages
function getData(key, def) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null? def : v;
  } catch (e) {
    return def;
  }
}
function saveAll() {
  localStorage.setItem('produits_digi_v2', JSON.stringify(window.produits));
  localStorage.setItem('users_digi_v2', JSON.stringify(window.users));
  localStorage.setItem('current_digi_v2', JSON.stringify(window.currentUser));
  localStorage.setItem('commandes_digi', JSON.stringify(window.commandes));
  localStorage.setItem('paiements_digi', JSON.stringify(window.paiements));
  localStorage.setItem('dc_final', JSON.stringify(window.panier));
}

// Données globales - TOUJOURS TABLEAUX, JAMAIS undefined
window.produits = getData('produits_digi_v2', [
  {id:1, nom:"Gari 1kg", prix:800, cat:"Cereales", desc:"Gari croustillant", img:"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", owner:"admin", status:"publie"}
]);
window.users = getData('users_digi_v2', []);
window.currentUser = getData('current_digi_v2', {tel:'guest', role:'acheteur', name:'Invité', code:'GUEST'});
window.commandes = getData('commandes_digi', []);
window.paiements = getData('paiements_digi', []);
window.panier = getData('dc_final', []);

window.save = saveAll;
window.getFinMois = function(moisSupp=0){
  let d=new Date(); d.setMonth(d.getMonth()+moisSupp);
  let fin=new Date(d.getFullYear(), d.getMonth()+1, 0);
  fin.setHours(23,59,59,999);
  return fin;
}
window.formatDate = function(d){ return new Date(d).toLocaleDateString('fr-TG'); }

// Sécurité - évite TypeError filter/find
if(!Array.isArray(window.produits)) window.produits = [];
if(!Array.isArray(window.users)) window.users = [];
if(!Array.isArray(window.commandes)) window.commandes = [];
if(!Array.isArray(window.paiements)) window.paiements = [];

//Localisation
function getMyPos(){
 if(!navigator.geolocation){alert('GPS non supporté');return;}
 navigator.geolocation.getCurrentPosition(p=>{
   let u=(window.users||[]).find(x=>x&&x.tel===window.currentUser.tel);
   if(u){u.lat=p.coords.latitude; u.lng=p.coords.longitude; window.currentUser=u; window.save(); document.getElementById('myPosTxt').innerText=`📍 Position enregistrée: ${u.lat.toFixed(5)}, ${u.lng.toFixed(5)}`; alert('Position vendeur enregistrée');}
 },()=>alert('Active GPS'));
}
const QUARTIERS_LOME={"Agoè":[6.222,1.208],"Adidogomé":[6.195,1.167],"Bè":[6.131,1.221],"Tokoin":[6.172,1.214],"Hedzranawoé":[6.185,1.235],"Baguida":[6.165,1.338],"Agbalépédogan":[6.211,1.186],"Lomé Centre":[6.131,1.213],"Kégué":[6.165,1.285],"Aflao":[6.124,1.168]};
function askGPS(){
 const el = document.getElementById('gpsText') || document.getElementById('gpsTxt') || document.getElementById('gpsStatus');
 if(el) el.innerText='📍 Tentative GPS...';

 function saveQuartier(key){
   window.currentUser.lat=QUARTIERS_LOME[key][0]; window.currentUser.lng=QUARTIERS_LOME[key][1]; window.currentUser.quartier=key; window.save();
   if(el) el.innerText=`✅ Position: ${key} (${QUARTIERS_LOME[key][0].toFixed(3)}, ${QUARTIERS_LOME[key][1].toFixed(3)}) - Livraison calculée`;
   if(typeof render==='function') render();
 }

 if(location.protocol==='file:'){
   let q=prompt("⚠️ Tu es en file:// - GPS bloqué.\nChoisis ton quartier pour livraison (obligatoire):\n"+Object.keys(QUARTIERS_LOME).join(" | "));
   let k=Object.keys(QUARTIERS_LOME).find(x=>q&&q.toLowerCase().includes(x.toLowerCase()))||"Lomé Centre"; saveQuartier(k); return;
 }
 if(!navigator.geolocation){ let q=prompt("Choisis quartier: "+Object.keys(QUARTIERS_LOME).join(", ")); saveQuartier(Object.keys(QUARTIERS_LOME).find(x=>q&&q.toLowerCase().includes(x.toLowerCase()))||"Lomé Centre"); return; }

 navigator.geolocation.getCurrentPosition(
   p=>{ window.currentUser.lat=p.coords.latitude; window.currentUser.lng=p.coords.longitude; window.currentUser.quartier="GPS exact"; window.save(); if(el) el.innerText=`✅ GPS exact: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} (±${p.coords.accuracy.toFixed(0)}m)`; if(typeof render==='function') render(); },
   err=>{
     let msg = err.code===1?"Permission refusée - Autorise localisation":err.code===2?"Position indisponible - Mets HTTPS (Netlify)":err.code===3?"Timeout - Réessaie dehors":err.message;
     if(el) el.innerText="❌ "+msg;
     let q=prompt(`GPS échoué: ${msg}\nChoisis ton quartier (livraison calculée quand même):\n${Object.keys(QUARTIERS_LOME).join(" | ")}`);
     saveQuartier(Object.keys(QUARTIERS_LOME).find(x=>q&&q.toLowerCase().includes(x.toLowerCase()))||"Lomé Centre");
   },
   {enableHighAccuracy:true,timeout:12000,maximumAge:0}
 );
}
window.haversine=(lat1,lon1,lat2,lon2)=>{if(!lat1||!lon1||!lat2||!lon2)return null; const R=6371; const dLat=(lat2-lat1)*Math.PI/180; const dLon=(lon2-lon1)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));};
window.calcLivraison=(poids,dist,cat)=>Math.round(500+Math.max(0.5,dist)*150+(parseFloat(poids)||1)*100+(cat==='Huiles'?200:0));