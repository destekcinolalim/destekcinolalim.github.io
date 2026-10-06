import { auth, db, gp } from '../firebase/client.js';
import {
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile, sendPasswordResetEmail, doc, setDoc, getDoc, serverTimestamp,
} from '../firebase/sdk.js';

// Oturum durumu, giriş/kayıt ve koşul onayı.
onAuthStateChanged(auth,user=>{
  window.kullanici=user;
  if(user){
    setDoc(doc(db,'kullanicilar',user.uid),{ad:user.displayName||'',mail:user.email||'',foto:user.photoURL||'',sonGiris:serverTimestamp()},{merge:true}).then(async()=>{
      const kulSnap = await getDoc(doc(db,'kullanicilar',user.uid));
      if(kulSnap.exists()&&!kulSnap.data().kosulKabul){
        document.getElementById('kosul-modal').style.display='flex';
      }
    }).catch(()=>{});
    document.getElementById('auth-giris').style.display='none';
    document.getElementById('auth-profil').style.display='block';
    // Giriş sayfasındaysa geri git
    if(document.getElementById('sayfa-giris').classList.contains('aktif')){
      history.back();
    }
    // Nav bar güncelle
    document.getElementById('nav-giris-btn').style.display='none';
    const navProfil = document.getElementById('nav-profil');
    navProfil.style.display='flex';
    const navAv = document.getElementById('nav-av');
    if(user.photoURL) navAv.innerHTML=`<img src="${user.photoURL}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;">`;
    else navAv.textContent=(user.displayName||user.email||'?')[0].toUpperCase();
    // Deneyim formu giriş kontrolü
    const denGirisUyari=document.getElementById('den-giris-uyari');
    if(denGirisUyari) denGirisUyari.style.display='none';
    // Admin kontrolü - admin ise nav'da yönetici butonu göster
    if(ADMIN_MAILLER.includes(user.email)){
      const adminBtn=document.getElementById('nav-admin-btn');
      if(adminBtn) adminBtn.style.display='block';
    }
    const av=document.getElementById('profil-av');av.onclick=()=>{ profilYukle();sayfaGit('profil'); };
    av.innerHTML=user.photoURL?`<img src="${user.photoURL}" alt="">`:(user.displayName||user.email||'?')[0].toUpperCase();
    document.getElementById('profil-isim').textContent=user.displayName||'Kullanıcı';
    document.getElementById('profil-mail').textContent=user.email||'';
    // Nav avatar güncelle
    const navAv2=document.getElementById('nav-av');
    if(navAv){
      if(user.photoURL) navAv.innerHTML=`<img src="${user.photoURL}" style="width:32px;height:32px;object-fit:cover;border-radius:50%;">`;
      else navAv.textContent=(user.displayName||user.email||'?')[0].toUpperCase();
    }
    document.getElementById('soru-giris-uyari').style.display='none';
    document.getElementById('soru-yaz-form').style.display='block';
    document.getElementById('yorum-giris-uyari').style.display='none';
    document.getElementById('yorum-yaz-form').style.display='block';
    // Bildirimleri dinlemeye başla
    window._bildirimBaslat(user.uid);
    // Deneyim formu profil göster
    const denAv = document.getElementById('den-profil-av');
    const denIsim = document.getElementById('den-profil-isim');
    if(denAv && denIsim){
      denAv.textContent = (user.displayName||user.email||'?')[0].toUpperCase();
      denIsim.textContent = user.displayName || user.email || 'Kullanıcı';
    }
    document.getElementById('den-giris-form') && (document.getElementById('den-giris-form').style.display='block');
    document.getElementById('den-giris-uyari') && (document.getElementById('den-giris-uyari').style.display='none');
  }else{
    document.getElementById('auth-giris').style.display='block';
    document.getElementById('auth-profil').style.display='none';
    document.getElementById('soru-giris-uyari').style.display='block';
    document.getElementById('soru-yaz-form').style.display='none';
    document.getElementById('yorum-giris-uyari').style.display='block';
    document.getElementById('yorum-yaz-form').style.display='none';
    const denGirisUyari2=document.getElementById('den-giris-uyari');
    if(denGirisUyari2) denGirisUyari2.style.display='block';
    const adminBtn2=document.getElementById('nav-admin-btn');
    if(adminBtn2) adminBtn2.style.display='none';
    document.getElementById('nav-giris-btn').style.display='';
    document.getElementById('nav-profil').style.display='none';
    const bilBtn=document.getElementById('bil-btn');
    if(bilBtn) bilBtn.style.display='none';
    document.getElementById('den-giris-form') && (document.getElementById('den-giris-form').style.display='none');
    document.getElementById('den-giris-uyari') && (document.getElementById('den-giris-uyari').style.display='block');
  }
});

window.googleGiris=async()=>{try{await signInWithPopup(auth,gp);}catch(e){if(e.code!=='auth/popup-closed-by-user')hataGoster('Giriş başarısız.');}};

window.kosulKabul=async function(){
  if(!document.getElementById('kosul-onay').checked){
    document.getElementById('kosul-hata').style.display='block';return;
  }
  document.getElementById('kosul-modal').style.display='none';
  if(window.kullanici){
    await setDoc(doc(db,'kullanicilar',window.kullanici.uid),{kosulKabul:true,kosulKabulTarih:serverTimestamp()},{merge:true}).catch(()=>{});
  }
};
window.mailGiris=async()=>{try{await signInWithEmailAndPassword(auth,document.getElementById('a-mail').value,document.getElementById('a-sifre').value);}catch(e){hataGoster('E-posta veya şifre hatalı.');}};
window.kayitOl=async()=>{
  if(!document.getElementById('a-kosul')?.checked){hataGoster('Kullanım koşullarını kabul etmelisiniz.');return;}
  const ad=document.getElementById('a-ad').value.trim();if(!ad){hataGoster('İsim girin.');return;}try{const c=await createUserWithEmailAndPassword(auth,document.getElementById('a-mail2').value,document.getElementById('a-sifre2').value);await updateProfile(c.user,{displayName:ad});}catch(e){hataGoster('Kayıt başarısız. Şifre en az 6 karakter olmalı.');}
};
window.cikisYap=()=>{
  signOut(auth).then(()=>{
    document.getElementById('nav-giris-btn').style.display='block';
    document.getElementById('nav-profil').style.display='none';
    const adminBtn=document.getElementById('nav-admin-btn');
    if(adminBtn) adminBtn.style.display='none';
    admGirisYapildi=false;
    sayfaGit('ana');
  });
};
window.formToggle=()=>{const l=document.getElementById('auth-form-login'),k=document.getElementById('auth-form-kayit');l.style.display=l.style.display==='none'?'block':'none';k.style.display=k.style.display==='none'?'block':'none';};
function hataGoster(m){const e=document.getElementById('auth-hata');e.textContent=m;e.style.display='block';setTimeout(()=>e.style.display='none',4000);}

// GİRİŞ SAYFASI FONKSİYONLARI
window.toggleSifre=(id,btn)=>{
  const input=document.getElementById(id);
  if(input.type==='password'){input.type='text';btn.textContent='🙈';}
  else{input.type='password';btn.textContent='👁';}
};

window.girisYapSayfasi=async()=>{
  const mail=document.getElementById('g-mail').value;
  const sifre=document.getElementById('g-sifre').value;
  try{
    await signInWithEmailAndPassword(auth,mail,sifre);
    history.back();
  }catch(e){
    const el=document.getElementById('giris-hata');
    el.textContent='E-posta veya şifre hatalı.';
    el.style.color='#d9534f';
    el.style.display='block';
  }
};

window.kayitOlSayfasi=async()=>{
  if(!document.getElementById('g-kosul')?.checked){
    const el=document.getElementById('giris-hata');
    el.textContent='Kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz.';
    el.style.color='#d9534f';el.style.display='block';return;
  }
  const ad=document.getElementById('g-ad').value.trim();
  const mail=document.getElementById('g-mail2').value;
  const sifre=document.getElementById('g-sifre2').value;
  if(!ad){
    const el=document.getElementById('giris-hata');
    el.textContent='Lütfen isim girin.';
    el.style.color='#d9534f';
    el.style.display='block';
    return;
  }
  try{
    const c=await createUserWithEmailAndPassword(auth,mail,sifre);
    await updateProfile(c.user,{displayName:ad});
    history.back();
  }catch(e){
    const el=document.getElementById('giris-hata');
    el.textContent='Kayıt başarısız. Şifre en az 6 karakter olmalı.';
    el.style.color='#d9534f';
    el.style.display='block';
  }
};

window.sifreSifirla=async()=>{
  const mail=document.getElementById('g-mail').value.trim();
  if(!mail){
    const el=document.getElementById('giris-hata');
    el.textContent='Lütfen önce e-posta adresinizi girin.';
    el.style.display='block';
    return;
  }
  try{
    await sendPasswordResetEmail(auth,mail);
    const el=document.getElementById('giris-hata');
    el.textContent='Şifre sıfırlama maili gönderildi! Gelen kutunuzu kontrol edin.';
    el.style.color='#2d7a2d';
    el.style.display='block';
  }catch(e){
    const el=document.getElementById('giris-hata');
    el.textContent='Bu e-posta ile kayıtlı hesap bulunamadı.';
    el.style.color='#d9534f';
    el.style.display='block';
  }
};

window.girisFormToggle=()=>{
  const l=document.getElementById('giris-form-login');
  const k=document.getElementById('giris-form-kayit');
  l.style.display=l.style.display==='none'?'block':'none';
  k.style.display=k.style.display==='none'?'block':'none';
};

window.girisMailGiris=async()=>{
  const mail=document.getElementById('g-mail').value;
  const sifre=document.getElementById('g-sifre').value;
  try{
    await signInWithEmailAndPassword(auth,mail,sifre);
    history.back();
  }catch(e){
    const el=document.getElementById('giris-hata');
    el.textContent='E-posta veya şifre hatalı.';
    el.style.display='block';
  }
};

window.girisKayitOl=async()=>{
  const ad=document.getElementById('g-ad').value.trim();
  const mail=document.getElementById('g-mail2').value;
  const sifre=document.getElementById('g-sifre2').value;
  if(!ad){
    const el=document.getElementById('giris-hata');
    el.textContent='Lütfen isim girin.';
    el.style.display='block';
    return;
  }
  try{
    const c=await createUserWithEmailAndPassword(auth,mail,sifre);
    await updateProfile(c.user,{displayName:ad});
    history.back();
  }catch(e){
    const el=document.getElementById('giris-hata');
    el.textContent='Kayıt başarısız. Şifre en az 6 karakter olmalı.';
    el.style.display='block';
  }
};
