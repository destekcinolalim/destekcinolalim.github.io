// Bildirim balonları (toast).
window.gosterToast=(mesaj,tip='normal',sure=3000)=>{
  const wrap=document.getElementById('toast-wrap');
  const t=document.createElement('div');
  t.className='toast '+(tip==='basari'?'basari':tip==='hata'?'hata':tip==='uyari'?'uyari':'');
  t.textContent=mesaj;
  wrap.appendChild(t);
  setTimeout(()=>t.classList.add('goster'),10);
  setTimeout(()=>{t.classList.remove('goster');setTimeout(()=>t.remove(),300);},sure);
};
