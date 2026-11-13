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

/* 해월도 다이어리 — 게임 HTML을 앱 안에서 전체 화면으로 실행. 저장(localStorage)은 앱 데이터에 남는다. */
public class MainActivity extends Activity implements android.webkit.ValueCallback<String> {
  private WebView web;
  /* 웹 페이지의 <input type=file> → 안드로이드 파일 고르기 창 (JSON 가져오기 등) */
  private android.webkit.ValueCallback<android.net.Uri[]> fileCb;
  private static final int REQ_FILE = 7;

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
    web.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, android.webkit.ValueCallback<android.net.Uri[]> cb, FileChooserParams p) {
        if (fileCb != null) fileCb.onReceiveValue(null);
        fileCb = cb;
        android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
        i.addCategory(android.content.Intent.CATEGORY_OPENABLE);
        i.setType("*/*");   // .json은 기기마다 형식 이름이 달라서 모든 파일을 보여 줌
        try { startActivityForResult(android.content.Intent.createChooser(i, "파일 고르기"), REQ_FILE); }
        catch (Exception e) { fileCb = null; cb.onReceiveValue(null); return false; }
        return true;
      }
    });
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
  /* 앱을 내리면: 저장 + 소리 멈춤 + 게임 타이머 정지 (배경에서 음악이 계속 나던 문제) */
  @Override protected void onPause() {
    if (web != null) { web.evaluateJavascript("try{appPause()}catch(e){try{HW.save()}catch(e2){}}", null); web.onPause(); web.pauseTimers(); }
    super.onPause();
  }
  @Override protected void onResume() { super.onResume(); if (web != null) { web.resumeTimers(); web.onResume(); web.evaluateJavascript("try{appResume()}catch(e){}", null); } hideBars(); }
  @Override protected void onActivityResult(int req, int res, android.content.Intent data) {
    super.onActivityResult(req, res, data);
    if (req == REQ_FILE && fileCb != null) {
      android.net.Uri[] r = null;
      if (res == RESULT_OK && data != null) { if (data.getData() != null) r = new android.net.Uri[] { data.getData() }; else r = WebChromeClient.FileChooserParams.parseResult(res, data); }
      fileCb.onReceiveValue(r); fileCb = null;
    }
  }
  @Override protected void onDestroy() { if (web != null) { web.stopLoading(); web.destroy(); web = null; } super.onDestroy(); }
  /* 뒤로 가기: 열린 창이 있으면 닫고, 없으면 앱을 백그라운드로 */
  @Override public void onBackPressed() {
    web.evaluateJavascript("(function(){try{var q=function(s){return document.querySelector(s)};var vis=function(s){var e=q(s);return e&&!e.classList.contains('hidden')};"
      + "if(vis('#panel')){closePanel();return 1}if(vis('#sheet')){closeSheet();return 1}if(vis('#mapView')){closeBigMap();return 1}if(vis('#rel')){closeRel();return 1}"
      + "if(vis('#questPanel')){toggleQuestPanel(false);return 1}if(vis('#zoom')){q('#zoom').classList.add('hidden');return 1}if(vis('#help')){q('#helpOk').click();return 1}"
      + "if(vis('#newgame')){q('#btnBack').click();return 1}if(typeof G!=='undefined'&&G.dev){devExit();return 1}return appBackQuit()?2:1}catch(e){return 2}})()", this);
  }
  /* 1 = 창을 닫았거나 종료 안내만 함, 2 = 저장 끝 → 앱 완전히 종료 */
  @Override public void onReceiveValue(String v) {
    if ("2".equals(v)) { if (web != null) web.postDelayed(new Quitter(this), 400); }
  }
}
