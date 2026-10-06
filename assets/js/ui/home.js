// Ana sayfa etkileşimleri: arama, filtreler, sayaç animasyonu, yukarı çık butonu.
let aktifKat='hepsi';
function aramaYap(){const q=document.getElementById('arama-inp').value.toLowerCase();document.querySelectorAll('.hkart').forEach(k=>{const txt=(k.dataset.q||'')+k.querySelector('h3').textContent.toLowerCase();const katOk=aktifKat==='hepsi'||txt.includes(aktifKat);k.classList.toggle('gizli',!(katOk&&(!q||txt.includes(q))));});}
function katFilt(kat,btn){
  if(kat==='hepsi'){
    aktifKat='hepsi';
    document.querySelectorAll('.filtre-pills .fp').forEach(b=>b.classList.remove('ak'));
    btn.classList.add('ak');
  } else if(aktifKat===kat){
    // Aynı kategoriye tekrar tıklayınca seçimi kaldır
    aktifKat='hepsi';
    document.querySelectorAll('.filtre-pills .fp').forEach(b=>b.classList.remove('ak'));
    document.querySelector('.filtre-pills .fp').classList.add('ak'); // Tümü seç
  } else {
    aktifKat=kat;
    document.querySelectorAll('.filtre-pills .fp').forEach(b=>b.classList.remove('ak'));
    btn.classList.add('ak');
  }
  aramaYap();
}
function denFilt(kat,btn){document.querySelectorAll('#den-filtreler .fp').forEach(b=>{b.style.background='rgba(255,255,255,0.6)';b.style.color='var(--terra)';b.style.borderColor='rgba(139,58,31,0.3)';});btn.style.background='var(--terra)';btn.style.color='white';btn.style.borderColor='var(--terra)';document.querySelectorAll('.dkart').forEach(k=>{k.style.display=(kat==='hepsi'||k.dataset.kat===kat)?'':'none';});}

// === SCROLL TO TOP ===
window.addEventListener('scroll', function(){
  const btn = document.getElementById('stob');
  if(btn) btn.classList.toggle('gorun', window.scrollY > 400);
});

// === SAYAÇ ANİMASYONU ===
function sayacAnimasyon(el, hedef, sure=1200){
  const baslangic = performance.now();
  const baslangicDeger = 0;
  function adim(simdi){
    const gecen = simdi - baslangic;
    const ilerleme = Math.min(gecen / sure, 1);
    const deger = Math.round(baslangicDeger + (hedef - baslangicDeger) * (1 - Math.pow(1 - ilerleme, 3)));
    el.textContent = deger;
    if(ilerleme < 1) requestAnimationFrame(adim);
    else el.textContent = hedef;
  }
  requestAnimationFrame(adim);
}

const sayacGozlemci = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting && !e.target.dataset.sayacCalisti){
      e.target.dataset.sayacCalisti = '1';
      const hedef = parseInt(e.target.dataset.hedef);
      if(!isNaN(hedef)) sayacAnimasyon(e.target, hedef);
    }
  });
}, {threshold: 0.5});

document.querySelectorAll('[data-hedef]').forEach(el => sayacGozlemci.observe(el));

// === ENTER TUŞU ARA ===
document.getElementById('arama-inp').addEventListener('keydown', function(e){
  if(e.key==='Enter') aramaYap();
});
