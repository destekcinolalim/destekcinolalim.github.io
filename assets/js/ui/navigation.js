// Sayfa geçişleri, geçmiş (history) yönetimi, menüler ve bildirim paneli aç/kapa.
const PAGE_FILES = {
  ana: 'index.html',
  hastalik: 'hastalik.html',
  giris: 'giris.html',
  profil: 'profil.html',
  yonetici: 'yonetici.html',
  gizlilik: 'gizlilik-politikasi.html',
  kullanim: 'kullanim-kosullari.html',
  'deneyimler-tumu': 'tum-deneyimler.html'
};

function sayfaGit(id, pushHistory=true){
  const targetEl = document.getElementById('sayfa-' + id);
  if(!targetEl){
    const file = PAGE_FILES[id];
    if(file){
      window.location.href = file;
      return;
    }
  }
  document.querySelectorAll('.sayfa').forEach(s=>s.classList.remove('aktif'));
  if(targetEl) targetEl.classList.add('aktif');
  window.scrollTo(0,0);
  if(id==='deneyimler-tumu'){
    const L2=document.getElementById('den-liste-tumu');
    if(tumDeneyimlerData&&tumDeneyimlerData.length){
      deneyimlerRender(tumDeneyimlerData,L2);
    } else if(window.yukle){
      window.yukle();
      setTimeout(()=>{ if(tumDeneyimlerData&&tumDeneyimlerData.length) deneyimlerRender(tumDeneyimlerData,L2); },1500);
    }
  }
  if(pushHistory){
    const hash = id==='ana' ? '#ana' : '#'+id;
    history.pushState({sayfa:id, hastalik:window.aktifH||null}, '', hash);
  }
}
function git(id){const el=document.getElementById(id);if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth'}),100);if(id==='deneyimler'&&window.yukle)window.yukle();}
function menuToggle(){document.getElementById('hbtn').classList.toggle('acik');document.getElementById('mobil-menu').classList.toggle('acik');document.body.style.overflow=document.getElementById('mobil-menu').classList.contains('acik')?'hidden':'';}
// Geri/ileri tuşu desteği
window.addEventListener('popstate', function(e){
  if(e.state){
    const {sayfa, hastalik} = e.state;
    if(sayfa === 'hastalik' && hastalik){
      window.hastalıkAc(hastalik, false);
    } else {
      sayfaGit(sayfa || 'ana', false);
    }
  } else {
    sayfaGit('ana', false);
  }
});

// Sayfa ilk yüklendiğinde hash kontrolü + ana sayfayı history'e ekle
window.addEventListener('load', function(){
  const hash = window.location.hash;
  if(hash.startsWith('#hastalik-')){
    const id = hash.replace('#hastalik-','');
    // Önce ana sayfayı history'e ekle, sonra hastalık sayfasını
    history.replaceState({sayfa:'ana', hastalik:null}, '', '#ana');
    if(id) window.hastalıkAc(id);
  } else if(hash === '#yonetici'){
    history.replaceState({sayfa:'ana', hastalik:null}, '', '#ana');
    // Sadece admin ise aç
    if(window.kullanici && ADMIN_MAILLER.includes(window.kullanici.email)){
      adminAc();
    }
  } else {
    history.replaceState({sayfa:'ana', hastalik:null}, '', '#ana');
  }
});

function mmToggle(id){
  const el=document.getElementById(id);
  const ok=document.getElementById(id+'-ok');
  el.classList.toggle('acik');
  if(ok) ok.textContent=el.classList.contains('acik')?'∨':'›';
}
function menuKapat(){document.getElementById('hbtn').classList.remove('acik');document.getElementById('mobil-menu').classList.remove('acik');document.body.style.overflow='';}
function bildirimPanelToggle(){const p=document.getElementById('bil-panel');p.classList.toggle('acik');if(p.classList.contains('acik'))window.tumunuOku();}
function bildirimPanelKapat(){document.getElementById('bil-panel').classList.remove('acik');}
document.addEventListener('click',e=>{const panel=document.getElementById('bil-panel');const btn=document.getElementById('bil-btn');if(panel&&btn&&!panel.contains(e.target)&&!btn.contains(e.target))bildirimPanelKapat();});

// === DİNAMİK SAYFA BAŞLIĞI ===
const _sayfaGitOrj = sayfaGit;
sayfaGit = function(id, pushHistory=true){
  _sayfaGitOrj(id, pushHistory);
  const basliklar = {ana:'Destekçin Olalım — Kadın Sağlığında Güvenilir Destek', profil:'Profilim — Destekçin Olalım', giris:'Giriş Yap — Destekçin Olalım', yonetici:'Yönetici Paneli — Destekçin Olalım', gizlilik:'Gizlilik Politikası — Destekçin Olalım', kullanim:'Kullanım Koşulları — Destekçin Olalım', 'deneyimler-tumu':'Tüm Deneyimler — Destekçin Olalım'};
  document.title = basliklar[id] || 'Destekçin Olalım';
};
