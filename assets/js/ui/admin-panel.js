// YÖNETİCİ (Firebase gerektirmeyen fonksiyonlar)
let admGirisYapildi = false;

function adminAc(){
  if(!window.kullanici || !ADMIN_MAILLER.includes(window.kullanici.email)){
    gosterToast('Bu sayfaya erişim yetkiniz yok.','hata');
    sayfaGit('ana');
    return;
  }
  if(!document.getElementById('sayfa-yonetici')){
    window.location.href = 'yonetici.html';
    return;
  }
  sayfaGit('yonetici');
  document.getElementById('admin-panel').style.display='block';
  admYukle();
  window.scrollTo(0,0);
}
function adminCikis(){admGirisYapildi=false;document.getElementById('admin-giris-ekrani').style.display='flex';document.getElementById('admin-panel').style.display='none';document.getElementById('admin-sifre').value='';sayfaGit('ana');}


let admHastalikFiltre = '';

function admHastalikFilt(hastalik, btn){
  admHastalikFiltre = hastalik;
  document.querySelectorAll('#adm-hastalik-filtreler button').forEach(b=>{b.style.background='var(--warm)';b.style.color='var(--mid)';b.style.border='1px solid var(--border)';});
  btn.style.background='var(--terra)';btn.style.color='white';btn.style.border='none';
  admListele();
}

function admFilt(d,btn){
  admFiltreAktif=d;
  document.querySelectorAll('#adm-gonderiler-panel button').forEach(b=>{b.style.background='var(--warm)';b.style.color='var(--mid)';b.style.border='1px solid var(--border)';});
  btn.style.background='var(--terra)';btn.style.color='white';btn.style.border='none';
  admListele();
}

function admArama(){
  const q = document.getElementById('adm-arama').value.toLowerCase();
  document.querySelectorAll('.adm-kart').forEach(k => {
    const metin = k.dataset.metin||'';
    const kullanici = k.dataset.kullanici||'';
    k.style.display = (!q || metin.includes(q) || kullanici.includes(q)) ? '' : 'none';
  });
}
