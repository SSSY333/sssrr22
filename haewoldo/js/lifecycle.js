/* =====================================================================
   앱 생명주기 — 화면이 가려지면 저장 + 소리 멈춤, 돌아오면 다시 재생
   · 안드로이드 앱: 뒤로 가기(열린 창 없을 때) → 「한 번 더 누르면 종료」 → 저장 후 완전히 종료
   ===================================================================== */
function appPause() {
  try { if (S && G.started) save(); } catch (e) { }
  try { if (Sound.ctx && Sound.ctx.state === 'running') Sound.ctx.suspend(); } catch (e) { }
  G._appPaused = true;
}
function appResume() {
  G._appPaused = false;
  try { if (Sound.ctx && Sound.ctx.state === 'suspended' && (S ? (S.settings.music || S.settings.sfx) : true)) Sound.ctx.resume(); } catch (e) { }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) appPause(); else appResume(); });
window.addEventListener('pagehide', appPause);
window.addEventListener('freeze', appPause);
/* 뒤로 가기로 종료: 앱(MainActivity)이 부름. 1 = 종료해도 됨, 0 = 안내만 함 */
let _quitAsk = 0;
function appBackQuit() {
  const now = Date.now();
  if (now - _quitAsk < 2200) { appPause(); return 1; }
  _quitAsk = now; toast('뒤로 가기를 한 번 더 누르면 저장하고 종료해요'); return 0;
}
