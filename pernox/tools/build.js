// 빌드: 여러 파일을 HTML 한 파일로 합친다 (글꼴은 base64로 포함)
//   node tools/build.js  →  dist/pernox.html  +  android/assets/www/ (APK용 사본)
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
let html = read('index.html');
let css = read('css/style.css');
const font = fs.readFileSync(path.join(ROOT, 'fonts/Jua-sub.woff2')).toString('base64');
css = css.replace("url('../fonts/Jua-sub.woff2')", `url(data:font/woff2;base64,${font})`);
html = html.replace(/<link rel="stylesheet" href="css\/style\.css" \/>/, () => `<style>\n${css}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => `<script>\n/* ${src} */\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/pernox.html'), html);
// APK 자산: 분리된 파일 그대로 복사 (WebView에서 file:///android_asset 로 실행)
const www = path.join(ROOT, 'android/assets/www');
fs.rmSync(www, { recursive: true, force: true });
const copy = (rel) => { const s = path.join(ROOT, rel), d = path.join(www, rel); if (fs.statSync(s).isDirectory()) { for (const f of fs.readdirSync(s)) copy(path.join(rel, f)); } else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } };
['index.html', 'css', 'fonts', 'js'].forEach(copy);
console.log('dist/pernox.html', (fs.statSync(path.join(ROOT, 'dist/pernox.html')).size / 1024).toFixed(0) + ' KB');
