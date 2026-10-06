import { db } from '../firebase/client.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, increment, serverTimestamp,
} from '../firebase/sdk.js';
import { zaman as zamanAt } from '../core/utils.js';

// Deneyimler - Firebase
const RK=['#7B1E4A','#A8336F','#C4703A','#3D6B5C','#2D5C7A','#6B3D7A'];
function ini(n){if(!n||n.toLowerCase()==='anonim')return'A';return n.split(' ').map(k=>k[0]).join('').toUpperCase().slice(0,2);}
let tumDeneyimlerData = [];
async function yukle(){
  const L=document.getElementById('den-liste');
  try{
    let docs=[];
    try{
      const q=query(collection(db,'deneyimler'),where('durum','==','onaylandi'),orderBy('tarih','desc'));
      const snap=await getDocs(q);
      snap.forEach(d=>docs.push(d));
    }catch(e){
      const snap=await getDocs(query(collection(db,'deneyimler'),where('durum','==','onaylandi')));
      snap.forEach(d=>docs.push(d));
      docs.sort((a,b)=>(b.data().tarih?.toMillis?.()||b.data().tarih?.seconds*1000||0)-(a.data().tarih?.toMillis?.()||a.data().tarih?.seconds*1000||0));
    }
    tumDeneyimlerData = docs;
    document.getElementById('s-paylasim').textContent=docs.length;
    if(!docs.length){L.innerHTML='<div class="yukl">Henüz onaylı paylaşım yok!</div>';return;}
    deneyimlerRender(docs.slice(0,5), L);
    // Tümünü gör butonu
    const tumuBtn = document.getElementById('den-tumunu-gor');
    if(docs.length > 5){
      tumuBtn.style.display='flex';
      tumuBtn.onclick = ()=>sayfaGit('deneyimler-tumu');
    } else {
      tumuBtn.style.display='none';
    }
  }catch(e){L.innerHTML='<div class="yukl">Yüklenemedi: '+e.message+'</div>';}
}

function deneyimlerRender(docs, L){
  L.innerHTML='';
  docs.forEach((d,i)=>{
    const r=d.data();
    const isim=r.anonim?'Anonim':r.kullaniciAdi||'Anonim';
    L.innerHTML+=`<div class="dkart" data-kat="${r.kategori||''}"><div class="dk-ust"><div class="dk-av" style="background:${RK[i%6]}">${r.anonim?`<svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#e8d5de"/><circle cx="18" cy="14" r="6" fill="#9a7889"/><ellipse cx="18" cy="30" rx="11" ry="7" fill="#9a7889"/></svg>`:(r.kullaniciFoto&&!r.anonim?`<img src="${r.kullaniciFoto}" style="width:36px;height:36px;object-fit:cover;border-radius:50%;">`:`${ini(isim)}`)}</div><div><div class="dk-isim">${isim}</div><div class="dk-sure">${zamanAt(r.tarih)}</div></div><span class="dk-etiket">${r.kategori||'Diğer'}</span></div><div class="dk-metin">${r.metin||''}</div><div class="dk-alt"><button class="dk-e ${r.begeni||0}" onclick="destekleFb(this,'${d.id}',${r.begeni||0})">♡ ${r.begeni||0} destek</button></div></div>`;
  });
}
window.destekleFb=async(btn,id,m)=>{
  if(!window.kullanici){gosterToast('Beğenmek için giriş yapmalısınız.','uyari');return;}
  const liked=btn.classList.contains('liked');
  if(liked){
    btn.classList.remove('liked');
    btn.innerHTML=`♡ ${Math.max(0,m-1)} destek`;
    try{await updateDoc(doc(db,'deneyimler',id),{begeni:increment(-1)});}catch(e){}
  } else {
    btn.classList.add('liked');
    btn.innerHTML=`♥ ${m+1} destek`;
    try{
      await updateDoc(doc(db,'deneyimler',id),{begeni:increment(1)});
      // Deneyim sahibine bildirim gönder
      const snap=await getDocs(collection(db,'deneyimler'));
      snap.forEach(async d=>{
        if(d.id===id){
          const r=d.data();
          if(r.kullaniciId&&r.kullaniciId!==window.kullanici.uid){
            await addDoc(collection(db,'bildirimler'),{
              kullaniciId:r.kullaniciId,tip:'begeni',
              metin:'Deneyiminiz beğenildi ♥',
              okundu:false,tarih:serverTimestamp()
            });
          }
        }
      });
    }catch(e){}
  }
};
window.gonder=async()=>{
  if(!window.kullanici){sayfaGit('giris');return;}
  const anonim=document.getElementById('f-anonim')?.checked||false;
  const kat=document.getElementById('f-kat').value;
  const metin=document.getElementById('f-metin').value.trim();
  if(!kat){gosterToast('Lütfen kategori seçin.','uyari');return;}
  if(metin.length<20){gosterToast('En az 20 karakter yazın.','uyari');return;}
  const submitBtn=document.getElementById('submit-btn');
  submitBtn.textContent='Gönderiliyor...';submitBtn.disabled=true;
  try{
    await addDoc(collection(db,'deneyimler'),{
      metin,kategori:kat,
      kullaniciAdi:anonim?'Anonim':(window.kullanici.displayName||'Kullanıcı'),
      kullaniciFoto:anonim?null:window.kullanici.photoURL||null,
      kullaniciId:window.kullanici.uid,
      gercekAd:window.kullanici.displayName||'',
      gercekMail:window.kullanici.email||'',
      anonim:anonim,
      durum:'beklemede',
      begeni:0,
      tarih:serverTimestamp()
    });
    document.getElementById('f-kat').value='';
    document.getElementById('f-metin').value='';
    submitBtn.style.display='none';
    document.getElementById('basari').style.display='block';
  }catch(e){
    gosterToast('Gönderilemedi. Tekrar deneyin.','hata');
    submitBtn.textContent='Paylaşımı Gönder →';
    submitBtn.disabled=false;
  }
};
window.yukle = yukle;
// Klasik navigation.js scripti "Tüm Deneyimler" sayfasını doldurmak için bunlara erişir.
window.deneyimlerRender = deneyimlerRender;
Object.defineProperty(window,'tumDeneyimlerData',{get:()=>tumDeneyimlerData});
yukle();
