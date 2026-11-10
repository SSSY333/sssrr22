package com.haewoldo.village;

import android.app.Activity;
import android.os.Build;

/* 저장이 끝난 뒤 화면을 닫고 최근 앱 목록에서도 정리 (웹뷰는 onDestroy에서 없앰 → 소리 · 게임 완전히 멈춤).
   프로세스를 바로 죽이지 않는 건 저장(localStorage)이 디스크에 다 써질 시간을 주기 위해서 */
public class Quitter implements Runnable {
  private final Activity act;
  public Quitter(Activity a) { act = a; }
  @Override public void run() {
    if (Build.VERSION.SDK_INT >= 21) act.finishAndRemoveTask(); else act.finish();
  }
}
