import { db } from '../firebase/client.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp } from '../firebase/sdk.js';
import { zaman } from '../core/utils.js';

// ===== BİLDİRİM SİSTEMİ =====
let bildirimUnsub = null;

// Giriş yapınca bildirimleri dinle
window._bildirimBaslat = function(uid){
  if(bildirimUnsub) bildirimUnsub();
  const bilBtn = document.getElementById('bil-btn');
  if(bilBtn) bilBtn.style.display='flex';
  
  const _guncelle = (liste) => {
    const okunmamis = liste.filter(b=>!b.okundu).length;
    const badge = document.getElementById('bil-badge');
    if(badge){ badge.style.display=okunmamis>0?'flex':'none'; badge.textContent=okunmamis>9?'9+':okunmamis; }
    _bildirimListeGuncelle(liste);
  };
  
  const _cek = async()=>{
    try{
      const snap=await getDocs(query(collection(db,'bildirimler'),where('kullaniciId','==',uid)));
      const liste=[];snap.forEach(d=>liste.push({id:d.id,...d.data()}));
      liste.sort((a,b)=>(b.tarih?.toMillis?.()||b.tarih?.seconds*1000||0)-(a.tarih?.toMillis?.()||a.tarih?.seconds*1000||0));
      _guncelle(liste.slice(0,30));
    }catch(e){console.warn('Bildirim çekilemedi:',e.message);}
  };
  
  // İlk yükleme
  _cek();
  // Her 30 saniyede yeni bildirim kontrolü
  const interval = setInterval(_cek, 30000);
  bildirimUnsub = ()=>clearInterval(interval);
};

function _bildirimListeGuncelle(bildirimler){
  const liste = document.getElementById('bil-liste');
  if(!liste) return;
  if(!bildirimler.length){
    liste.innerHTML = '<div class="bil-bos">Henüz bildirim yok.</div>';
    return;
  }
  liste.innerHTML = bildirimler.map(b => {
    const ikon = b.tip==='onaylandi'?'✅':b.tip==='reddedildi'?'❌':b.tip==='yanit_geldi'?'💬':b.tip==='duyuru'?'📣':b.tip==='begeni'?'♥':'🔔';
    const bg = b.tip==='onaylandi'?'#f0faf0':b.tip==='reddedildi'?'#fdf0f0':b.tip==='yanit_geldi'?'#f0f4ff':b.tip==='duyuru'?'#fff8e6':b.tip==='begeni'?'#fff0f5':'#f9f5f2';
    let ms = 0;
    try{ ms = b.tarih?.toMillis?.()||b.tarih?.seconds*1000||0; }catch(e){}
    const sure = ms ? zaman({toMillis:()=>ms}) : '';
    return `<div class="bil-item${b.okundu?'':' okunmadi'}" onclick="bildirimTikla('${b.id}','${b.sayfaId||''}','${b.hastalik||''}')">
      <div class="bil-ikon" style="background:${bg}">${ikon}</div>
      <div class="bil-ic">
        <div class="bil-ic-metin">${(b.metin||'').replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener" style="color:var(--terra);text-decoration:underline;">$1</a>')}</div>
        <div class="bil-ic-sure">${sure}</div>
      </div>
    </div>`;
  }).join('');
}

window.bildirimTikla = async function(bildirimId, sayfaId, hastalik){
  // Okundu işaretle
  try{ await updateDoc(doc(db,'bildirimler',bildirimId),{okundu:true}); }catch(e){}
  // İlgili sayfaya git
  bildirimPanelKapat();
  if(hastalik) window.hastalıkAc(hastalik);
};

window.tumunuOku = async function(){
  if(!window.kullanici) return;
  // Anında badge'i kaldır
  const badge = document.getElementById('bil-badge');
  if(badge) badge.style.display='none';
  // Listedeki okunmadı stillerini kaldır
  document.querySelectorAll('.bil-item.okunmadi').forEach(el=>el.classList.remove('okunmadi'));
  // Firebase'de güncelle
  try{
    const snap = await getDocs(query(collection(db,'bildirimler'),where('kullaniciId','==',window.kullanici.uid)));
    const islemler = snap.docs.filter(d=>!d.data().okundu).map(d=>updateDoc(doc(db,'bildirimler',d.id),{okundu:true}));
    await Promise.all(islemler);
  }catch(e){}
};

// Yanıt gelince soru/yorum sahibine bildirim yaz
window._yanitBildirimi = async function(anaId, yanitYazanAdi){
  try{
    // Not: Firestore'da __name__ ile tekil sorgu yerine koleksiyon taranıyor (orijinal davranış).
    const snap = await getDocs(collection(db,'gonderiler'));
    let anaSahibi = null;
    snap.forEach(d=>{ if(d.id===anaId) anaSahibi=d.data(); });
    if(!anaSahibi || !anaSahibi.kullaniciId) return;
    if(anaSahibi.kullaniciId === window.kullanici?.uid) return;
    await addDoc(collection(db,'bildirimler'),{
      kullaniciId: anaSahibi.kullaniciId,
      tip: 'yanit_geldi',
      metin: `${yanitYazanAdi||'Biri'} sorunuzu yanıtladı 💬`,
      gonderiMetni: (anaSahibi.metin||'').slice(0,80),
      hastalik: anaSahibi.hastalik||'',
      sayfaId: anaSahibi.hastalik||'',
      okundu: false,
      tarih: serverTimestamp()
    });
  }catch(e){ console.warn('Yanıt bildirimi gönderilemedi:',e); }
};
