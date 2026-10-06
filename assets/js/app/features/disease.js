import { db } from '../firebase/client.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, increment, serverTimestamp,
} from '../firebase/sdk.js';
import { H, DIGER } from '../data/hastaliklar.js';
import { zaman, rc } from '../core/utils.js';

// Hastalık detay sayfası: içerik, sorular/yorumlar, yanıtlar ve beğeniler.
window.hastalıkAc=(id, pushHistory=true)=>{
  window.aktifH=id;const h=H[id];if(!h)return;
  if(!document.getElementById('sayfa-hastalik')){
    window.location.href = 'hastalik.html#hastalik-' + id;
    return;
  }
  document.getElementById('breadcrumb-ad').textContent=h.baslik;
  document.getElementById('has-ikon').textContent=h.ikon;
  document.getElementById('has-baslik').textContent=h.baslik;
  document.getElementById('has-ozet-kisa').innerHTML = h.ozet.slice(0,180) + '... <button onclick="gitBilgi()" style="background:none;border:none;color:white;text-decoration:underline;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:14px;padding:0;margin-left:4px;">okumaya devam et</button>';
  document.getElementById('bilgi-kart').innerHTML=`<div class="bk-ozet">${h.ozet}</div>${h.bolumler.map(b=>`<div class="bk-bolum"><h4>${b.b}</h4><ul>${b.m.map(m=>`<li>${m}</li>`).join('')}</ul></div>`).join('')}<div class="bk-uyari">${h.uyari}</div>`;
  document.getElementById('ilgili-list').innerHTML=DIGER.filter(d=>d.id!==id).map(d=>`<div class="ilgili-link" onclick="hastalıkAc('${d.id}')"><span class="ilgili-ico">${d.ico}</span>${d.ad}</div>`).join('');
  document.querySelectorAll('.stab').forEach((b,i)=>{b.classList.toggle('ak',i===0);});
  document.querySelectorAll('.tab-panel').forEach((p,i)=>{p.classList.toggle('ak',i===0);});
  sayfaGit('hastalik', false);window.scrollTo(0,0);
  if(pushHistory) history.pushState({sayfa:'hastalik',hastalik:id},'','#hastalik-'+id);
  soruYorumYukle('soru');soruYorumYukle('yorum');
  const kisaAd=DIGER.find(d=>d.id===id)?.ad;
  if(kisaAd) document.title=kisaAd+' — Destekçin Olalım';
};

async function soruYorumYukle(tip){
  const listeId=tip==='soru'?'sorular-liste':'yorumlar-liste';
  const liste=document.getElementById(listeId);
  liste.innerHTML='<div class="yukl">Yükleniyor...</div>';
  try{
    const q=query(collection(db,'gonderiler'),where('hastalik','==',window.aktifH),where('tip','==',tip),where('durum','==','onaylandi'),orderBy('tarih','desc'));
    const snap=await getDocs(q);
    if(snap.empty){liste.innerHTML=`<div class="bos">${tip==='soru'?'Henüz soru yok. İlk soruyu sen sor!':'Henüz yorum yok. İlk yorumu sen yaz!'}</div>`;return;}
    liste.innerHTML='';
    snap.forEach((d,i)=>{
      const r=d.data();const kart=document.createElement('div');kart.className='soru-kart';kart.id=`kart-${d.id}`;
      kart.dataset.soruMetni=r.metin||'';kart.innerHTML=`<div class="sk-ust"><div class="sk-av" style="background:${rc(i)}">${r.kullaniciFoto?`<img src="${r.kullaniciFoto}">`:(r.anonim?`<svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#e8d5de"/><circle cx="18" cy="14" r="6" fill="#9a7889"/><ellipse cx="18" cy="30" rx="11" ry="7" fill="#9a7889"/></svg>`:(r.kullaniciAdi||'?')[0])}</div><div><div class="sk-isim">${r.kullaniciAdi||'Kullanıcı'}</div><div class="sk-sure">${zaman(r.tarih)}</div></div></div><div class="sk-metin">${r.metin||''}</div><div class="sk-alt"><button class="sk-e" onclick="begeni('${d.id}',this,${r.begeni||0})">♡ ${r.begeni||0}</button><button class="sk-e" onclick="yanitToggle('${d.id}')">↩ Yanıtla</button><span style="font-size:11px;color:var(--soft);margin-left:auto">${window.kullanici&&r.kullaniciId===window.kullanici.uid?`<button class="sk-e" style="color:#d9534f;" onclick="gonderiSil('${d.id}')">✕ Sil</button>`:''} ${r.yanitSayisi||0} yanıt</span></div><div class="yanit-wrap" id="yanitlar-${d.id}"></div><div class="yanit-yaz" id="yanit-form-${d.id}"><textarea placeholder="Yanıtınızı yazın..."></textarea><div class="yanit-yaz-alt"><button class="yanit-iptal" onclick="yanitToggle('${d.id}')">İptal</button><button class="yanit-gonder" onclick="yanitGonder('${d.id}')">Yanıtla</button></div></div>`;
      liste.appendChild(kart);yanitlarYukle(d.id);
    });
  }catch(e){liste.innerHTML=`<div class="bos">Firebase bağlandıktan sonra ${tip==='soru'?'sorular':'yorumlar'} burada görünecek.</div>`;}
}

async function yanitlarYukle(anaId){
  const wrap=document.getElementById(`yanitlar-${anaId}`);
  try{const q=query(collection(db,'gonderiler'),where('tip','==','yanit'),where('anaId','==',anaId),where('durum','==','onaylandi'),orderBy('tarih','asc'));const snap=await getDocs(q);if(snap.empty){wrap.innerHTML='';return;}wrap.innerHTML=`<div class="yanit-baslik">${snap.size} Yanıt</div>`;snap.forEach((d,i)=>{const r=d.data();wrap.innerHTML+=`<div class="yanit-kart" id="yanit-kart-${d.id}" data-metin="${(r.metin||'').slice(0,80).replace(/"/g,'')}"><div class="yk-av" style="background:${rc(i+3)}">${r.kullaniciFoto?`<img src="${r.kullaniciFoto}" style="width:28px;height:28px;object-fit:cover;border-radius:50%;display:block;">`:( r.anonim?`<svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="18" fill="#e8d5de"/><circle cx="18" cy="14" r="6" fill="#9a7889"/><ellipse cx="18" cy="30" rx="11" ry="7" fill="#9a7889"/></svg>`:(r.kullaniciAdi||'?')[0])}</div><div class="yk-ic"><div class="yk-ust"><span class="yk-isim">${r.kullaniciAdi||'Kullanıcı'}</span><span class="yk-sure">${zaman(r.tarih)}</span></div><div class="yk-metin">${r.metin||''}</div><div style="margin-top:6px;"><button class="sk-e" onclick="yanitaYanitToggle('${d.id}','${anaId}')">↩ Yanıtla</button></div><div class="yanit-yaz" id="yanit-form-y-${d.id}"><textarea placeholder="Bu yanıta yanıtınızı yazın..."></textarea><div class="yanit-yaz-alt"><button class="yanit-iptal" onclick="yanitaYanitToggle('${d.id}','${anaId}')">İptal</button><button class="yanit-gonder" onclick="yanitaYanitGonder('${d.id}','${anaId}')">Yanıtla</button></div></div></div></div>`;}); }catch(e){}
}

window.yanitToggle=(id)=>{
  if(!window.kullanici){document.getElementById('auth-kutu').scrollIntoView({behavior:'smooth'});return;}
  const form=document.getElementById(`yanit-form-${id}`);
  form.classList.toggle('acik');
  if(form.classList.contains('acik')){
    const kart=document.getElementById(`kart-${id}`);
    if(kart) form.dataset.soruMetni=kart.dataset.soruMetni||'';
  }
};
window.yanitGonder=async(anaId)=>{if(!window.kullanici){document.getElementById('auth-kutu').scrollIntoView({behavior:'smooth'});return;}const ta=document.getElementById(`yanit-form-${anaId}`).querySelector('textarea');if(ta.value.trim().length<5){gosterToast('Lütfen daha uzun bir yanıt yazın.','uyari');return;}try{const soruMetni=document.getElementById(`yanit-form-${anaId}`).dataset.soruMetni||'';await addDoc(collection(db,'gonderiler'),{metin:ta.value.trim(),tip:'yanit',anaId:anaId,soruMetni:soruMetni,hastalik:window.aktifH,kullaniciAdi:window.kullanici.displayName||'Kullanıcı',kullaniciFoto:window.kullanici.photoURL||null,kullaniciId:window.kullanici.uid,durum:'beklemede',begeni:0,yanitSayisi:0,tarih:serverTimestamp()});await updateDoc(doc(db,'gonderiler',anaId),{yanitSayisi:increment(1)});await window._yanitBildirimi(anaId, window.kullanici.displayName||'Biri');ta.value='';document.getElementById(`yanit-form-${anaId}`).classList.remove('acik');gosterToast('✅ Yanıtınız alındı! Ekibimiz inceledikten sonra yayınlanacak.','basari',5000);}catch(e){gosterToast('Yanıt gönderilemedi.','hata');}};
window.begeni=async(id,btn,m)=>{
  if(!window.kullanici){gosterToast('Beğenmek için giriş yapmalısınız.','uyari');return;}
  const liked=btn.classList.contains('liked');
  if(liked){
    btn.classList.remove('liked');
    btn.innerHTML=`♡ ${Math.max(0,m-1)}`;
    try{await updateDoc(doc(db,'gonderiler',id),{begeni:increment(-1)});}catch(e){}
  } else {
    btn.classList.add('liked');
    btn.innerHTML=`♥ ${m+1}`;
    try{
      await updateDoc(doc(db,'gonderiler',id),{begeni:increment(1)});
      // Gönderi sahibine bildirim gönder (kendi gönderisini beğenirse gitmesin)
      const snap=await getDocs(query(collection(db,'gonderiler'),where('__name__','==',id)));
      snap.forEach(async d=>{
        const r=d.data();
        if(r.kullaniciId&&r.kullaniciId!==window.kullanici.uid){
          await addDoc(collection(db,'bildirimler'),{
            kullaniciId:r.kullaniciId,tip:'begeni',
            metin:'Gönderiniz beğenildi ♥',
            okundu:false,tarih:serverTimestamp()
          });
        }
      });
    }catch(e){}
  }
};
async function gonderiEkle(tip,metin,anonim){if(!window.kullanici){document.getElementById('auth-kutu').scrollIntoView({behavior:'smooth'});return false;}if(metin.length<10){gosterToast('Daha uzun yazın.','uyari');return false;}try{await addDoc(collection(db,'gonderiler'),{metin,tip,hastalik:window.aktifH,kullaniciAdi:anonim?'Anonim':window.kullanici.displayName||'Kullanıcı',kullaniciFoto:anonim?null:window.kullanici.photoURL||null,kullaniciId:window.kullanici.uid,gercekAd:window.kullanici.displayName||'',gercekMail:window.kullanici.email||'',anonim:anonim||false,durum:'beklemede',begeni:0,yanitSayisi:0,tarih:serverTimestamp()});return true;}catch(e){gosterToast('Gönderilemedi.','hata');return false;}}
window.yanitaYanitToggle=(yanitId,anaId)=>{
  if(!window.kullanici){document.getElementById('auth-kutu').scrollIntoView({behavior:'smooth'});return;}
  const form=document.getElementById(`yanit-form-y-${yanitId}`);
  form.classList.toggle('acik');
};

window.yanitaYanitGonder=async(yanitId,soruId)=>{
  if(!window.kullanici){document.getElementById('auth-kutu').scrollIntoView({behavior:'smooth'});return;}
  const form=document.getElementById(`yanit-form-y-${yanitId}`);
  const ta=form.querySelector('textarea');
  if(ta.value.trim().length<5){gosterToast('Lütfen daha uzun bir yanıt yazın.','uyari');return;}
  const yanitMetni=document.getElementById(`yanit-kart-${yanitId}`)?.dataset.metin||'';
  try{
    await addDoc(collection(db,'gonderiler'),{
      metin:ta.value.trim(),tip:'yanit',
      anaId:soruId,
      soruMetni:yanitMetni,
      ust:'yanit',
      hastalik:window.aktifH,
      kullaniciAdi:window.kullanici.displayName||'Kullanıcı',
      kullaniciFoto:window.kullanici.photoURL||null,
      kullaniciId:window.kullanici.uid,
      durum:'beklemede',begeni:0,yanitSayisi:0,
      tarih:serverTimestamp()
    });
    await updateDoc(doc(db,'gonderiler',soruId),{yanitSayisi:increment(1)});
    ta.value='';form.classList.remove('acik');
    gosterToast('✅ Yanıtınız alındı! Ekibimiz inceledikten sonra yayınlanacak.','basari',5000);
  }catch(e){gosterToast('Gönderilemedi.','hata');}
};

window.gonderiSil=async(id)=>{
  if(!confirm('Gönderinizi silmek istediğinize emin misiniz?'))return;
  try{
    await deleteDoc(doc(db,'gonderiler',id));
    document.getElementById(`kart-${id}`)?.remove();
    gosterToast('Gönderiniz silindi.','basari');
  }catch(e){gosterToast('Silinemedi.','hata');}
};

window.soruGonder=async()=>{const i=document.getElementById('soru-input');const anonim=document.getElementById('soru-anonim')?.checked||false;const ok=await gonderiEkle('soru',i.value.trim(),anonim);if(ok){i.value='';document.getElementById('soru-anonim').checked=false;gosterToast('✅ Sorunuz alındı! Ekibimiz inceledikten sonra yayınlanacak.','basari',5000);}};
window.yorumGonder=async()=>{const i=document.getElementById('yorum-input');const anonim=document.getElementById('yorum-anonim')?.checked||false;const ok=await gonderiEkle('yorum',i.value.trim(),anonim);if(ok){i.value='';document.getElementById('yorum-anonim').checked=false;gosterToast('✅ Yorumunuz alındı! Ekibimiz inceledikten sonra yayınlanacak.','basari',5000);}};
window.tabAc=(id,btn)=>{document.querySelectorAll('.stab').forEach(b=>b.classList.remove('ak'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('ak'));btn.classList.add('ak');document.getElementById(`tab-${id}`).classList.add('ak');};
