// Hastalık sayfası sekmeleri ve soru/yorum arama.
function soruArama(tip){
  const inputId = tip==='sorular' ? 'soru-arama' : 'yorum-arama';
  const listeId = tip==='sorular' ? 'sorular-liste' : 'yorumlar-liste';
  const q = document.getElementById(inputId)?.value.toLowerCase() || '';
  const kartlar = document.getElementById(listeId)?.querySelectorAll('.soru-kart');
  if(!kartlar) return;
  kartlar.forEach(k => {
    const metin = k.querySelector('.sk-metin')?.textContent.toLowerCase() || '';
    const isim = k.querySelector('.sk-isim')?.textContent.toLowerCase() || '';
    k.style.display = (!q || metin.includes(q) || isim.includes(q)) ? '' : 'none';
  });
}

function hasTab(sekme, btn){
  document.getElementById('has-panel-bilgi').style.display = sekme==='bilgi' ? '' : 'none';
  document.getElementById('has-panel-sorular').style.display = sekme==='sorular' ? '' : 'none';
  document.getElementById('has-tab-bilgi').style.cssText='background:none;border:none;border-bottom:3px solid '+(sekme==='bilgi'?'var(--terra)':'transparent')+';color:'+(sekme==='bilgi'?'var(--terra)':'var(--soft)')+';font-weight:'+(sekme==='bilgi'?'500':'400')+';padding:10px 20px;font-size:15px;cursor:pointer;font-family:"DM Sans",sans-serif;margin-bottom:-2px;';
  document.getElementById('has-tab-sorular').style.cssText='background:none;border:none;border-bottom:3px solid '+(sekme==='sorular'?'var(--terra)':'transparent')+';color:'+(sekme==='sorular'?'var(--terra)':'var(--soft)')+';font-weight:'+(sekme==='sorular'?'500':'400')+';padding:10px 20px;font-size:15px;cursor:pointer;font-family:"DM Sans",sans-serif;margin-bottom:-2px;';
}

function hasMobilTab(sekme, btn){
  document.querySelectorAll('#has-mobil-sekmeler button').forEach(b=>{b.style.borderBottomColor='transparent';b.style.color='var(--soft)';b.style.fontWeight='400';});
  btn.style.borderBottomColor='var(--terra)';btn.style.color='var(--terra)';btn.style.fontWeight='500';
  const anaAlan=document.querySelector('.has-body > div:nth-child(2)');
  const sidebar=document.querySelector('.has-body .sidebar');
  if(sekme==='sorular'){
    if(anaAlan)anaAlan.style.display='block';
    if(sidebar)sidebar.style.display='none';
  }else{
    if(anaAlan)anaAlan.style.display='none';
    if(sidebar)sidebar.style.display='flex';
  }
}

window.gitBilgi = function() {
  const mobilSekmeler = document.getElementById('has-mobil-sekmeler');
  const isMobile = mobilSekmeler && getComputedStyle(mobilSekmeler).display !== 'none';
  
  if (isMobile) {
    const btnBilgi = document.getElementById('mobil-tab-bilgi');
    if (btnBilgi) hasMobilTab('bilgi', btnBilgi);
  }
  
  const el = document.getElementById('bilgi-kart');
  if (el) {
    const headerOffset = 80;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};
