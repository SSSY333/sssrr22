package kr.pernox.game;

import android.app.Activity;
import android.webkit.ValueCallback;

// 뒤로 가기 결과: 닫을 창이 없었으면("0") 앱 종료
public class BackCallback implements ValueCallback<String> {
    private final Activity act;
    public BackCallback(Activity a) { act = a; }
    @Override public void onReceiveValue(String v) { if ("0".equals(v)) act.finish(); }
}
