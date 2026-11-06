package com.haewoldo.village;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/* 해월도 마을생활 — 게임 HTML을 앱 안에서 전체 화면으로 실행. 저장(localStorage)은 앱 데이터에 남는다. */
public class MainActivity extends Activity implements android.webkit.ValueCallback<String> {
  private WebView web;

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);
    s.setTextZoom(100);
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient());
    web.addJavascriptInterface(new Bridge(this), "Android");
    web.setBackgroundColor(0xFF2B3550);
    setContentView(web);
    hideBars();
    if (b != null) web.restoreState(b); else web.loadUrl("file:///android_asset/index.html");
  }
  private void hideBars() {
    web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
  }
  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) hideBars(); }
  @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }
  /* 앱을 내리면 게임이 스스로 저장(visibilitychange) — 웹뷰도 잠시 멈춤 */
  @Override protected void onPause() { web.evaluateJavascript("try{HW&&HW.save&&HW.save()}catch(e){}", null); web.onPause(); super.onPause(); }
  @Override protected void onResume() { super.onResume(); web.onResume(); hideBars(); }
  /* 뒤로 가기: 열린 창이 있으면 닫고, 없으면 앱을 백그라운드로 */
  @Override public void onBackPressed() {
    web.evaluateJavascript("(function(){try{var q=function(s){return document.querySelector(s)};var vis=function(s){var e=q(s);return e&&!e.classList.contains('hidden')};"
      + "if(vis('#panel')){closePanel();return 1}if(vis('#sheet')){closeSheet();return 1}if(vis('#mapView')){closeBigMap();return 1}if(vis('#rel')){closeRel();return 1}"
      + "if(vis('#questPanel')){toggleQuestPanel(false);return 1}if(vis('#zoom')){q('#zoom').classList.add('hidden');return 1}if(vis('#help')){q('#helpOk').click();return 1}"
      + "if(vis('#newgame')){q('#btnBack').click();return 1}if(typeof G!=='undefined'&&G.dev){devExit();return 1}return 0}catch(e){return 0}})()", this);
  }
  @Override public void onReceiveValue(String v) { if (!"1".equals(v)) moveTaskToBack(true);
  }
}
