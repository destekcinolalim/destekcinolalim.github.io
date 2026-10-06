import { db } from '../firebase/client.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp,
} from '../firebase/sdk.js';

// YÖNETİCİ (Firebase erişimi gerektiği için module bloğunda)
let tumGonderiler = [];
let admFiltreAktif = 'beklemede';
// İkinci script'ten erişim için window'a bağla
Object.defineProperty(window,'tumGonderiler',{get:()=>tumGonderiler,set:v=>{tumGonderiler=v;}});
Object.defineProperty(window,'admFiltreAktif',{get:()=>admFiltreAktif,set:v=>{admFiltreAktif=v;}});

// Admin onaylayınca/reddedince bildirim yaz
window._bildirimGonder = async function(gonderiId, tip, aciklama=''){
  try{
    const gonderiDoc = tumGonderiler.find(r=>r.id===gonderiId);
    if(!gonderiDoc || !gonderiDoc.kullaniciId) return;
    if(gonderiDoc.kullaniciId === window.kullanici?.uid) return;
    const tipMetin = gonderiDoc.tip==='soru'?'Sorunuz':gonderiDoc.tip==='yorum'?'Yorumunuz':'Yanıtınız';
    let metin = tip==='onaylandi'
      ? `${tipMetin} yayınlandı! ✅`
      : `${tipMetin} yayınlanamadı.${aciklama?' Sebep: '+aciklama:''}`;
    await addDoc(collection(db,'bildirimler'),{
      kullaniciId: gonderiDoc.kullaniciId,
      tip: tip,
      metin: metin,
      gonderiMetni: (gonderiDoc.metin||'').slice(0,80),
      hastalik: gonderiDoc.hastalik||'',
      sayfaId: gonderiDoc.hastalik||'',
      okundu: false,
      tarih: serverTimestamp()
    });
  }catch(e){ console.warn('Bildirim gönderilemedi:',e); }
};


window.admYukle = async function admYukle(){
  const liste=document.getElementById('adm-liste');
  liste.innerHTML='<div class="yukl">Yükleniyor...</div>';
  try{
    let tumSnap=[];
    try{
      const q=query(collection(db,'gonderiler'),orderBy('tarih','desc'));
      const snap=await getDocs(q);
      snap.forEach(d=>tumSnap.push({id:d.id,...d.data()}));
    }catch(indexErr){
      console.warn('orderBy başarısız, sırasız yükleniyor:',indexErr.message);
      const snap=await getDocs(collection(db,'gonderiler'));
      snap.forEach(d=>tumSnap.push({id:d.id,...d.data()}));
      tumSnap.sort((a,b)=>{
        const ta=a.tarih?.toMillis?.()||a.tarih?.seconds*1000||0;
        const tb=b.tarih?.toMillis?.()||b.tarih?.seconds*1000||0;
        return tb-ta;
      });
    }
    tumGonderiler=tumSnap;
    admIstatistik();admListele();
    // Üye ve deneyim sayıları
    getDocs(collection(db,'kullanicilar')).then(s=>{
      const el=document.getElementById('adm-uye-sayi');
      if(el) el.textContent=s.size;
    }).catch(()=>{});
    getDocs(query(collection(db,'deneyimler'),where('durum','==','onaylandi'))).then(s=>{
      const el=document.getElementById('adm-den-onay');
      if(el) el.textContent=s.size;
    }).catch(()=>{});
  }catch(e){liste.innerHTML='<div class="bos">Yüklenemedi: '+e.message+'</div>';}
};

window.admIstatistik = function admIstatistik(){
  document.getElementById('adm-beklemede').textContent=tumGonderiler.filter(r=>r.durum==='beklemede').length;
  document.getElementById('adm-onaylandi').textContent=tumGonderiler.filter(r=>r.durum==='onaylandi').length;
  document.getElementById('adm-reddedildi').textContent=tumGonderiler.filter(r=>r.durum==='reddedildi').length;
}

window.admListele = function admListele(){
  const liste=document.getElementById('adm-liste');
  const kayitlar=(admFiltreAktif==='hepsi'?tumGonderiler:tumGonderiler.filter(r=>r.durum===admFiltreAktif))
    .filter(r=>!admHastalikFiltre||r.hastalik===admHastalikFiltre);
  if(!kayitlar.length){liste.innerHTML='<div class="bos">Bu kategoride kayıt yok.</div>';return;}
  liste.innerHTML=kayitlar.map(r=>{
    const anaSoru = r.tip==='yanit' && r.anaId ? tumGonderiler.find(g=>g.id===r.anaId) : null;
    const durumRenk=r.durum==='onaylandi'?'#2d7a2d':r.durum==='reddedildi'?'#a32d2d':'#7a5800';
    const durumBg=r.durum==='onaylandi'?'#f0faf0':r.durum==='reddedildi'?'#faf0f0':'#fff8e6';
    const durumAd=r.durum==='onaylandi'?'Onaylandı':r.durum==='reddedildi'?'Reddedildi':'Beklemede';const tipAd=r.tip==='soru'?'Soru':r.tip==='yorum'?'Yorum':'Yanıt';
    let tarihStr='—';
    try{tarihStr=r.tarih?new Date(r.tarih.toMillis?r.tarih.toMillis():r.tarih.seconds*1000).toLocaleString('tr-TR'):'—';}catch(e){}
    return `<div class="adm-kart" data-metin="${(r.metin||'').toLowerCase()}" data-kullanici="${(r.kullaniciAdi||'').toLowerCase()}" style="background:var(--warm);border:1px solid var(--border);border-left:3px solid ${durumRenk};border-radius:14px;padding:1.25rem;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:500;">${r.kullaniciAdi||'Anonim'}</span><span style="font-size:11px;background:#fff3cd;color:#856404;padding:2px 8px;border-radius:100px;margin-left:6px;">${r.anonim?'Anonim — ':''}${r.gercekAd||''} (${r.gercekMail||''})</span>
        <span style="font-size:11px;background:var(--terra-pale);color:var(--terra);padding:3px 10px;border-radius:100px;">${r.hastalik||''}</span>
        <span style="font-size:11px;background:var(--terra-pale);color:var(--mid);padding:3px 10px;border-radius:100px;">${r.tip==='soru'?'Soru':'Yorum'}</span>
        <span style="font-size:11px;background:${durumBg};color:${durumRenk};padding:3px 10px;border-radius:100px;font-weight:500;margin-left:auto;">${durumAd}</span>
      </div>
      ${r.tip==='yanit' ? `<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:500;color:var(--soft);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Yanıt verilen soru:</div><div style="font-size:13px;color:var(--mid);padding:8px 12px;background:#f0ebe6;border-radius:8px;border-left:3px solid var(--terra-mid);font-style:italic;">${anaSoru ? anaSoru.metin : (r.soruMetni||'Soru bulunamadı')}</div></div>` : ''}
      <div style="font-size:14px;color:var(--mid);line-height:1.7;font-weight:300;padding:10px 14px;background:var(--cream);border-radius:8px;margin-bottom:10px;">${r.metin||''}</div>
      <div style="font-size:11px;color:var(--soft);margin-bottom:10px;">${tarihStr}</div>
      <div style="display:flex;gap:8px;">
        <button onclick="admDurum('${r.id}','onaylandi')" ${r.durum==='onaylandi'?'disabled':''} style="background:#f0faf0;color:#2d7a2d;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;">✓ Onayla</button>
        <button onclick="admReddetAc('${r.id}')" ${r.durum==='reddedildi'?'disabled':''} style="background:#faf0f0;color:#a32d2d;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;">✕ Reddet</button>
        <div id="red-form-${r.id}" style="display:none;margin-top:10px;width:100%;">
          <textarea id="red-aciklama-${r.id}" placeholder="Reddetme sebebi yazın (opsiyonel)..." rows="2" style="width:100%;padding:8px 12px;border:1px solid #f5c6c6;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;background:#fff8f8;color:var(--dark);resize:none;"></textarea>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <button onclick="admReddetOnayla('${r.id}')" style="background:#a32d2d;color:white;border:none;padding:6px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">Reddet</button>
            <button onclick="document.getElementById('red-form-${r.id}').style.display='none'" style="background:none;border:1px solid var(--border);color:var(--mid);padding:6px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">İptal</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.admBilTip = function(tip, btn){
  document.querySelectorAll('[id^="admbil-"]').forEach(b=>{ if(b.tagName==='BUTTON'){b.style.background='var(--warm)';b.style.color='var(--mid)';b.style.border='1px solid var(--border)';} });
  btn.style.background='var(--terra)';btn.style.color='white';btn.style.border='none';
  document.getElementById('admbil-tek-alan').style.display=tip==='tek'?'block':'none';
};

window.admBilGonder = async function(){
  const metin = document.getElementById('admbil-metin').value.trim();
  const sonuc = document.getElementById('admbil-sonuc');
  const tekAlan = document.getElementById('admbil-tek-alan');
  if(!metin){ sonuc.textContent='❌ Mesaj boş olamaz.'; sonuc.style.color='#a32d2d'; return; }
  sonuc.textContent='Gönderiliyor...'; sonuc.style.color='var(--soft)';
  try{
    const hepsiMi = tekAlan.style.display==='none';
    if(hepsiMi){
      const snap = await getDocs(collection(db,'kullanicilar'));
      const uidler = [];
      snap.forEach(d=>uidler.push(d.id));
      const islemler = uidler.map(uid=>addDoc(collection(db,'bildirimler'),{
        kullaniciId:uid, tip:'duyuru', metin, okundu:false, tarih:serverTimestamp()
      }));
      await Promise.all(islemler);
      sonuc.textContent=`✅ ${uidler.length} kullanıcıya gönderildi.`; sonuc.style.color='#2d7a2d';
    } else {
      const eposta = document.getElementById('admbil-uid').value.trim().toLowerCase();
      if(!eposta){ sonuc.textContent='❌ E-posta boş olamaz.'; sonuc.style.color='#a32d2d'; return; }
      const kSnap = await getDocs(query(collection(db,'kullanicilar'),where('mail','==',eposta)));
      if(kSnap.empty){ sonuc.textContent='❌ Bu e-posta ile kayıtlı kullanıcı bulunamadı.'; sonuc.style.color='#a32d2d'; return; }
      const uid = kSnap.docs[0].id;
      await addDoc(collection(db,'bildirimler'),{kullaniciId:uid,tip:'duyuru',metin,okundu:false,tarih:serverTimestamp()});
      sonuc.textContent='✅ Gönderildi.'; sonuc.style.color='#2d7a2d';
    }
    document.getElementById('admbil-metin').value='';
  }catch(e){ sonuc.textContent='❌ Hata: '+e.message; sonuc.style.color='#a32d2d'; }
};

window.admReddetAc = function(id){
  document.getElementById('red-form-'+id).style.display='block';
};

window.admReddetOnayla = async function(id){
  const aciklama = document.getElementById('red-aciklama-'+id).value.trim();
  await window.admDurum(id, 'reddedildi', aciklama);
};

window.admSekme = function(sekme, btn){
  document.getElementById('adm-sekme-gonderiler').style.cssText='background:var(--warm);border:1px solid var(--border);color:var(--mid);padding:7px 16px;border-radius:100px;font-size:13px;cursor:pointer;font-family:"DM Sans",sans-serif;';
  document.getElementById('adm-sekme-deneyimler').style.cssText='background:var(--warm);border:1px solid var(--border);color:var(--mid);padding:7px 16px;border-radius:100px;font-size:13px;cursor:pointer;font-family:"DM Sans",sans-serif;';
  btn.style.cssText='background:var(--terra);color:white;border:none;padding:7px 16px;border-radius:100px;font-size:13px;cursor:pointer;font-family:"DM Sans",sans-serif;';
  const gPanel = document.getElementById('adm-gonderiler-panel');
  const dPanel = document.getElementById('adm-deneyimler-panel');
  const gListe = document.getElementById('adm-liste');
  const dListe = document.getElementById('adm-den-liste');
  const arama = document.getElementById('adm-arama');
  if(sekme==='gonderiler'){
    gPanel.style.display=''; dPanel.style.display='none';
    gListe.style.display=''; dListe.style.display='none';
    arama.style.display='';
  } else {
    gPanel.style.display='none'; dPanel.style.display='';
    gListe.style.display='none'; dListe.style.display='';
    arama.style.display='none';
    window.admDenYukle();
  }
};

let tumDeneyimler = [];
let admDenFiltreAktif = 'beklemede';

window.admDenYukle = async function(){
  const liste = document.getElementById('adm-den-liste');
  liste.innerHTML='<div class="yukl">Yükleniyor...</div>';
  try{
    const snap = await getDocs(collection(db,'deneyimler'));
    tumDeneyimler = [];
    snap.forEach(d=>tumDeneyimler.push({id:d.id,...d.data()}));
    tumDeneyimler.sort((a,b)=>(b.tarih?.toMillis?.()||b.tarih?.seconds*1000||0)-(a.tarih?.toMillis?.()||a.tarih?.seconds*1000||0));
    admDenListele();
  }catch(e){liste.innerHTML='<div class="bos">Yüklenemedi: '+e.message+'</div>';}
};

function admDenListele(){
  const liste = document.getElementById('adm-den-liste');
  const kayitlar = admDenFiltreAktif==='hepsi' ? tumDeneyimler : tumDeneyimler.filter(r=>r.durum===admDenFiltreAktif);
  if(!kayitlar.length){liste.innerHTML='<div class="bos">Bu kategoride deneyim yok.</div>';return;}
  liste.innerHTML = kayitlar.map(r=>{
    const durumRenk=r.durum==='onaylandi'?'#2d7a2d':r.durum==='reddedildi'?'#a32d2d':'#7a5800';
    const durumAd=r.durum==='onaylandi'?'Onaylandı':r.durum==='reddedildi'?'Reddedildi':'Beklemede';
    let tarihStr='';
    try{tarihStr=r.tarih?new Date(r.tarih.toMillis?r.tarih.toMillis():r.tarih.seconds*1000).toLocaleString('tr-TR'):'';}catch(e){}
    return `<div style="background:var(--warm);border:1px solid var(--border);border-left:3px solid ${durumRenk};border-radius:14px;padding:1.25rem;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:500;">${r.anonim?'Anonim':r.kullaniciAdi||'?'}</span>
        <span style="font-size:11px;background:#fff3cd;color:#856404;padding:2px 8px;border-radius:100px;">${r.anonim?'Anonim — ':''}${r.gercekAd||r.kullaniciAdi||''} (${r.gercekMail||''})</span>
        <span style="font-size:11px;background:var(--terra-pale);color:var(--terra);padding:3px 10px;border-radius:100px;">${r.kategori||'Diğer'}</span>
        <span style="font-size:11px;color:${durumRenk};font-weight:500;margin-left:auto;">${durumAd}</span>
      </div>
      <div style="font-size:14px;color:var(--mid);line-height:1.7;padding:10px;background:var(--cream);border-radius:8px;margin-bottom:10px;">${r.metin||''}</div>
      <div style="font-size:11px;color:var(--soft);margin-bottom:10px;">${tarihStr}</div>
      <div style="display:flex;gap:8px;">
        <button onclick="admDenDurum('${r.id}','onaylandi')" ${r.durum==='onaylandi'?'disabled':''} style="background:#f0faf0;color:#2d7a2d;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">✓ Onayla</button>
        <button onclick="admDenReddetAc('${r.id}')" ${r.durum==='reddedildi'?'disabled':''} style="background:#faf0f0;color:#a32d2d;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">✕ Reddet</button>
        <div id="den-red-form-${r.id}" style="display:none;margin-top:10px;width:100%;">
          <textarea id="den-red-aciklama-${r.id}" placeholder="Reddetme sebebi yazın (opsiyonel)..." rows="2" style="width:100%;padding:8px 12px;border:1px solid #f5c6c6;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;background:#fff8f8;color:var(--dark);resize:none;"></textarea>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <button onclick="admDenReddetOnayla('${r.id}')" style="background:#a32d2d;color:white;border:none;padding:6px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">Reddet</button>
            <button onclick="document.getElementById('den-red-form-${r.id}').style.display='none'" style="background:none;border:1px solid var(--border);color:var(--mid);padding:6px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">İptal</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.admDenFilt = function(d, btn){
  admDenFiltreAktif = d;
  document.querySelectorAll('#adm-deneyimler-panel button').forEach(b=>{b.style.background='var(--warm)';b.style.color='var(--mid)';b.style.border='1px solid var(--border)';});
  btn.style.background='var(--terra)';btn.style.color='white';btn.style.border='none';
  admDenListele();
};

window.admDenReddetAc = function(id){
  document.getElementById('den-red-form-'+id).style.display='block';
};

window.admDenReddetOnayla = async function(id){
  const aciklama = document.getElementById('den-red-aciklama-'+id).value.trim();
  await window.admDenDurum(id, 'reddedildi', aciklama);
};

window.admDenDurum = async function(id, yeniDurum, aciklama=''){
  try{
    await updateDoc(doc(db,'deneyimler',id),{durum:yeniDurum});
    const kayit = tumDeneyimler.find(r=>r.id===id);
    if(kayit){
      kayit.durum = yeniDurum;
      if(kayit.kullaniciId && kayit.kullaniciId!==window.kullanici?.uid){
        const metin = yeniDurum==='onaylandi'
          ? 'Deneyiminiz yayınlandı! ✅'
          : `Deneyiminiz incelendi ancak yayınlanamadı.${aciklama?' Sebep: '+aciklama:''}`;
        await addDoc(collection(db,'bildirimler'),{
          kullaniciId:kayit.kullaniciId,tip:yeniDurum,
          metin,okundu:false,tarih:serverTimestamp()
        });
      }
    }
    admDenListele();
    if(yeniDurum==='onaylandi'&&window.yukle)window.yukle();
  }catch(e){alert('Güncelleme başarısız.');}
};

window.admDurum = async function admDurum(id, yeniDurum, aciklama=''){
  try{
    await updateDoc(doc(db,'gonderiler',id),{durum:yeniDurum});
    const kayit=tumGonderiler.find(r=>r.id===id);
    if(kayit)kayit.durum=yeniDurum;
    // Bildirim gönder
    await window._bildirimGonder(id, yeniDurum, aciklama);
    admIstatistik();admListele();
  }catch(e){alert('Güncelleme başarısız.');}
};
