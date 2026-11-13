package com.haewoldo.village;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/* 게임 → 앱: 사진(PNG) · 맵 편집 파일(JSON)을 휴대폰에 저장 */
public class Bridge {
  private final Activity act;
  public Bridge(Activity a) { act = a; }

  @JavascriptInterface public boolean saveImage(String b64, String name) {
    try { return write(Base64.decode(b64, Base64.DEFAULT), safe(name, ".png"), "image/png", true); } catch (Exception e) { return false; }
  }
  @JavascriptInterface public boolean saveText(String txt, String name) {
    try { return write(txt.getBytes("UTF-8"), safe(name, ".json"), "application/json", false); } catch (Exception e) { return false; }
  }
  private static String safe(String n, String ext) {
    String s = n == null ? "" : n.replaceAll("[^0-9A-Za-z가-힣._-]", "_");
    if (s.length() == 0) s = "haewoldo";
    if (!s.endsWith(ext)) s = s + ext;
    return s;
  }
  private boolean write(byte[] data, String name, String mime, boolean image) throws Exception {
    if (Build.VERSION.SDK_INT >= 29) {
      ContentResolver cr = act.getContentResolver();
      ContentValues v = new ContentValues();
      v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
      v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
      v.put(MediaStore.MediaColumns.RELATIVE_PATH, (image ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/해월도");
      Uri col = image ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI : MediaStore.Downloads.EXTERNAL_CONTENT_URI;
      Uri uri = cr.insert(col, v);
      if (uri == null) return false;
      OutputStream os = cr.openOutputStream(uri);
      if (os == null) return false;
      os.write(data); os.close();
      return true;
    }
    /* 안드로이드 9 이하: 앱 전용 사진 폴더에 저장 후 갤러리에 알림 */
    File dir = act.getExternalFilesDir(image ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS);
    if (dir == null) dir = act.getFilesDir();
    dir.mkdirs();
    File f = new File(dir, name);
    FileOutputStream fo = new FileOutputStream(f);
    fo.write(data); fo.close();
    act.sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(f)));
    return true;
  }
}
