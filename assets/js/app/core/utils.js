// Ortak yardımcılar: göreli zaman metni ve avatar renkleri.
function zaman(ts){if(!ts)return'';try{const ms=ts.toMillis?ts.toMillis():ts.seconds?ts.seconds*1000:typeof ts==='number'?ts:typeof ts==='string'?new Date(ts).getTime():0;if(!ms)return'';const f=(Date.now()-ms)/1000;if(f<60)return'Az önce';if(f<3600)return`${Math.floor(f/60)} dk önce`;if(f<86400)return`${Math.floor(f/3600)} saat önce`;return`${Math.floor(f/86400)} gün önce`;}catch(e){return''}}
function rc(i){return['#8B3A1F','#C45C2E','#D4850A','#5c7a2d','#2d5c7a','#7a2d5c'][i%6];}

export { zaman, rc };
