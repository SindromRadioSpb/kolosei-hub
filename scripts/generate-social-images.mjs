import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Code-native typography, rendered locally. No external fonts, image service or network.
await mkdir('public/og', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const lang of ['en', 'ru']) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;background:#fbfdff;color:#18334d;font-family:'Segoe UI',sans-serif;padding:65px;display:grid;grid-template-columns:1.25fr 1fr;gap:35px;height:630px;align-items:center}
      .brand{font-size:26px;color:#176b66;font-weight:650}h1{font-size:58px;letter-spacing:-2px;line-height:1.13;font-weight:650;margin:32px 0}p{font-size:23px;line-height:1.5;color:#53697c}.sample{height:430px;padding:65px 25px 30px;background:#e9effa;border-radius:48% 48% 16px 16px / 18% 18% 16px 16px;text-align:center}.he{font-family:Georgia,serif;font-size:58px;line-height:1.6;color:#243f63;margin:25px 0}.small{font-size:18px}footer{position:absolute;left:65px;bottom:32px;font-size:18px;color:#53697c}
      </style><body><div><div class="brand">LinguistPro <span class="small">by Kolosei</span></div><h1>${lang === 'ru' ? 'Иврит, который<br>хочется читать.' : 'Hebrew you want<br>to keep reading.'}</h1><p>${lang === 'ru' ? 'Читайте. Понимайте. Запоминайте.' : 'Read. Understand. Remember.'}</p></div><div class="sample"><div class="he" lang="he" dir="rtl">כָּל יוֹם אֲנִי קוֹרֵא<br>מַשֶּׁהוּ חָדָשׁ.</div><p class="small">${lang === 'ru' ? 'Каждый день я читаю что-то новое.' : 'Every day I read something new.'}</p></div><footer>kolosei.com</footer></body></html>`);
    await page.screenshot({ path: `public/og/linguistpro-${lang}.png` });
    await page.close();
  }
} finally { await browser.close(); }
