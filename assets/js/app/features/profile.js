import { db } from '../firebase/client.js';
import { collection, getDocs, query, where } from '../firebase/sdk.js';

// PROFİL SAYFASI
window.profilTab=(tip,btn)=>{
  document.querySelectorAll('#sayfa-profil .stab').forEach(b=>b.classList.remove('ak'));
  btn.classList.add('ak');
  document.getElementById('profil-sorular-panel').style.display=tip==='sorular'?'block':'none';
  document.getElementById('profil-yorumlar-panel').style.display=tip==='yorumlar'?'block':'none';
  document.getElementById('profil-yanitlar-panel').style.display=tip==='yanitlar'?'block':'none';
};

window.profilYukle=async function(){
  if(!window.kullanici) return;
  const u=window.kullanici;
  const av=document.getElementById('profil-buyuk-av');
  if(u.photoURL) av.innerHTML=`<img src="${u.photoURL}" style="width:64px;height:64px;object-fit:cover;border-radius:50%;">`;
  else av.textContent=(u.displayName||u.email||'?')[0].toUpperCase();
  document.getElementById('profil-buyuk-isim').textContent=u.displayName||'Kullanıcı';
  document.getElementById('profil-buyuk-mail').textContent=u.email||'';
  await window.profilListeYukle('soru','profil-sorular-liste');
  await window.profilListeYukle('yorum','profil-yorumlar-liste');
  await window.profilListeYukle('yanit','profil-yanitlar-liste');
}

window.profilListeYukle=async function(tip, listeId){
  const liste=document.getElementById(listeId);
  liste.innerHTML='<div class="yukl">Yükleniyor...</div>';
  try{
    const snap=await getDocs(query(collection(db,'gonderiler'),where('kullaniciId','==',window.kullanici.uid)));
    let docs=[];
    snap.forEach(d=>{ if(d.data().tip===tip) docs.push(d); });
    docs.sort((a,b)=>(b.data().tarih?.toMillis?.()||b.data().tarih?.seconds*1000||0)-(a.data().tarih?.toMillis?.()||a.data().tarih?.seconds*1000||0));
    const bosMetin=tip==='soru'?'Henüz soru sormadınız.':tip==='yorum'?'Henüz yorum yazmadınız.':'Henüz yanıt vermediniz.';
    if(!docs.length){liste.innerHTML=`<div class="bos">${bosMetin}</div>`;return;}
    liste.innerHTML='';
    docs.forEach(d=>{
      const r=d.data();
      const durumRenk=r.durum==='onaylandi'?'#2d7a2d':r.durum==='reddedildi'?'#a32d2d':'#7a5800';
      const durumAd=r.durum==='onaylandi'?'Onaylandı':r.durum==='reddedildi'?'Reddedildi':'İnceleniyor';
      let tarihStr='';
      try{tarihStr=r.tarih?new Date(r.tarih.toMillis?r.tarih.toMillis():r.tarih.seconds*1000).toLocaleDateString('tr-TR'):'';}catch(e){}
      const anonBadge=r.anonim?'<span style="font-size:11px;background:#fff3cd;color:#856404;padding:2px 8px;border-radius:100px;margin-left:6px;">Anonim</span>':'';
      const altBilgi=tip==='yanit'&&r.soruMetni?`<div style="font-size:12px;color:var(--soft);margin-bottom:8px;padding:6px 10px;background:#f0ebe6;border-radius:8px;border-left:3px solid var(--terra-mid);font-style:italic;">${r.soruMetni}</div>`:'';
      liste.innerHTML+=`<div style="background:var(--warm);border:1px solid var(--border);border-radius:14px;padding:1.25rem;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-size:11px;background:var(--terra-pale);color:var(--terra);padding:3px 10px;border-radius:100px;">${r.hastalik||''}</span>
          <span style="font-size:11px;color:${durumRenk};font-weight:500;">${durumAd}</span>
          ${anonBadge}
          <span style="font-size:11px;color:var(--soft);margin-left:auto;">${tarihStr}</span>
        </div>
        ${altBilgi}
        <div style="font-size:14px;color:var(--mid);line-height:1.7;font-weight:300;margin-bottom:10px;">${r.metin||''}</div>
        <button onclick="gonderiSil('${d.id}')" style="font-size:12px;color:#d9534f;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;">✕ Sil</button>
      </div>`;
    });
  }catch(e){liste.innerHTML=`<div class="bos">Yüklenemedi: ${e.message}</div>`;}
}
