"""Render the owner guide. Run from any directory; requires Python-Markdown."""
from pathlib import Path
import hashlib
import html
import json
import re
import markdown

ROOT = Path(__file__).resolve().parent
STEM = 'SEO_START_AND_GROWTH_GUIDE_2026_09_08'
source = (ROOT / (STEM + '.md')).read_text(encoding='utf-8')
md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'], extension_configs={'toc': {'toc_depth': '2-2'}})
body = md.convert(source)
check_count = 0

def checklist(match):
    global check_count
    check_count += 1
    label = match.group(1)
    key = hashlib.sha256(label.encode()).hexdigest()[:12]
    return f'<li class="task"><label><input type="checkbox" data-task="{key}"><span>{label}</span></label></li>'

body = re.sub(r'<li>\[ \] (.*?)</li>', checklist, body, flags=re.S)
table_count = 0

def table_wrap(match):
    global table_count
    table_count += 1
    return f'<div class="table-scroll" role="region" aria-label="Таблица {table_count}; при необходимости прокрутите по горизонтали" tabindex="0">{match.group(0)}</div>'

body = re.sub(r'<table>.*?</table>', table_wrap, body, flags=re.S)
flow = '''<figure class="journey" aria-label="Четыре последовательных уровня продвижения">
<ol><li><span>Сайт исправен</span><small>Техническая основа</small></li><li><span>Сайт найден</span><small>Индексация</small></li><li><span>Человек пришёл</span><small>Целевой визит</small></li><li><span>Начал заниматься</span><small>Полезное действие</small></li></ol>
<figcaption>Измеряем каждый переход отдельно: хорошая скорость помогает, а результат подтверждается действиями людей.</figcaption></figure>'''
body = body.replace('<h2 ', flow + '<h2 ', 1)
css = '''
:root{--paper:#f7faff;--ink:#1d3354;--muted:#52647d;--teal:#136b68;--line:#cedbeb;--soft:#eaf3f5;--gold:#d2a74c;--type:18px;color-scheme:light}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--paper);color:var(--ink);font:var(--type)/1.72 'Segoe UI',Calibri,Arial,sans-serif}a{color:var(--teal);text-underline-offset:3px;text-decoration-thickness:1px;overflow-wrap:anywhere}a:hover{text-decoration-thickness:2px}a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid #996318;outline-offset:4px}button{font:inherit;cursor:pointer}button:hover{background:#e8f0f8}button:disabled{cursor:default}::selection{background:#cbe6e4}input[type=checkbox]{accent-color:var(--teal);width:21px;height:21px;flex:0 0 21px;margin:5px 0 0;cursor:pointer}.skip{position:absolute;left:16px;top:-90px;padding:10px 18px;background:white;z-index:10}.skip:focus{top:12px}
.masthead{max-width:1300px;margin:0 auto;padding:28px 42px 24px;display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:1px solid var(--line)}.brand{font-size:24px;font-weight:700;letter-spacing:-1px}.brand span{font-weight:400;font-size:15px;letter-spacing:0;display:block;color:var(--muted)}.edition{font-size:14px;color:var(--muted);text-align:right}.layout{max-width:1300px;margin:auto;padding:34px 42px 80px;display:grid;grid-template-columns:244px minmax(0,1fr);gap:64px}.sidebar{min-width:0}.nav-inner{position:sticky;top:24px;max-height:calc(100vh - 48px);overflow:auto;padding:0 14px 15px 0;scrollbar-width:thin}.nav-title{font-size:17px;font-weight:700;display:block;margin-bottom:12px}.toc ul{list-style:none;padding:0;margin:0}.toc a{display:block;text-decoration:none;color:var(--muted);font-size:14px;line-height:1.45;padding:7px 0}.toc a:hover{color:var(--teal)}.toc a[aria-current=true]{color:var(--teal);font-weight:700}.nav-tools{border-top:1px solid var(--line);margin-top:20px;padding-top:18px}.nav-tools a{font-size:14px}.nav-tools p{font-size:13px;color:var(--muted)}.mobile-toc{display:none}.article{min-width:0;max-width:880px}h1{font-size:clamp(36px,4.1vw,56px);line-height:1.08;letter-spacing:-1.7px;font-weight:700;margin:7px 0 20px;max-width:17ch}h1+p{color:var(--muted);font-size:16px;margin-bottom:30px}h2{font-size:30px;line-height:1.23;letter-spacing:-.55px;margin:68px 0 24px;padding-top:27px;border-top:2px solid var(--line);scroll-margin-top:24px}h3{font-size:22px;line-height:1.35;margin:34px 0 15px;scroll-margin-top:24px}p{margin:0 0 20px}li{padding-left:4px;margin:8px 0}ul,ol{padding-left:26px}strong{font-weight:650}code{font:0.86em/1.6 Consolas,'Cascadia Code',monospace;background:#edf2f8;border-radius:3px;padding:1px 5px;overflow-wrap:anywhere}pre{background:#eaf0f8;border-left:4px solid #8ca5c7;border-radius:0 8px 8px 0;padding:20px 24px;margin:22px 0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}pre code{background:none;padding:0;white-space:pre-wrap}blockquote{margin:24px 0;padding:20px 24px;border-left:4px solid var(--teal);background:var(--soft)}.task{list-style:none;padding:0;margin:14px 0}.task label{display:flex;gap:13px;cursor:pointer}.task label span{flex:1}.task input:checked+span{color:var(--muted)}ul:has(>.task){padding-left:0;background:white;border:1px solid var(--line);padding:10px 22px;border-radius:10px}.table-scroll{max-width:100%;overflow-x:auto;margin:24px 0 30px;scrollbar-width:thin;border-radius:8px;border:1px solid var(--line)}table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.55;table-layout:auto;background:white}th,td{padding:13px 15px;text-align:left;vertical-align:top;min-width:115px;overflow-wrap:anywhere}th{background:#eaf1f9;font-weight:650;border-bottom:1px solid var(--line)}td{border-bottom:1px solid #e4ebf3}tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:#f8fbfe}td code{font-size:.92em}td:first-child{font-weight:500}.journey{margin:34px 0 46px;background:#eaf3f5;border-radius:12px 12px 38px 12px;padding:22px 24px 26px;border:1px solid #c8dfe0}.journey ol{list-style:none;display:grid;grid-template-columns:repeat(4,1fr);padding:0;margin:0;gap:14px}.journey li{padding:0;margin:0;border-top:3px solid #70a4a3;padding-top:12px;line-height:1.35}.journey li:last-child{border-color:var(--gold)}.journey span{font-size:16px;font-weight:650;display:block}.journey small{font-size:12px;color:var(--muted);display:block;margin-top:8px}.journey figcaption{font-size:14px;color:var(--muted);line-height:1.5;margin-top:22px;max-width:62ch}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:32px}.toolbar button{border:1px solid var(--line);border-radius:6px;padding:8px 12px;font-size:14px;color:var(--ink);background:white;min-height:42px}.toolbar .primary{background:var(--teal);color:white;border-color:var(--teal)}.toolbar .primary:hover{background:#105b59}.toolbar .status{font-size:13px;color:var(--muted);flex-basis:100%;min-height:22px;margin:0}.progress-label{font-size:14px;color:var(--muted);margin:12px 0 5px}.progress-track{height:6px;background:#e0e9f3;border-radius:3px;overflow:hidden}.progress-track span{display:block;height:100%;width:0;background:var(--teal);transition:width .15s}.storage-note{font-size:12px!important;line-height:1.5}.endnote{margin:45px 0 0;border-top:1px solid var(--line);padding-top:24px;font-size:14px;color:var(--muted)}.print-only{display:none}.mobile-toc summary{cursor:pointer;font-weight:650}.print-cover-title{font-size:18px;font-weight:700}.footer{max-width:1300px;margin:auto;padding:24px 42px 32px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;font-size:14px;color:var(--muted)}
@media(min-width:1440px){.layout{gap:78px}}@media(max-width:1000px){.layout{grid-template-columns:205px minmax(0,1fr);gap:30px;padding-left:25px;padding-right:25px}.masthead{padding-left:25px;padding-right:25px}h1{font-size:44px}.journey ol{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){body{font-size:17px;line-height:1.68}.masthead{padding:21px 20px;align-items:flex-start}.edition{font-size:12px;max-width:125px}.brand{font-size:23px}.brand span{font-size:12px}.layout{display:block;padding:24px 20px 50px}.sidebar{display:none}.mobile-toc{display:block;margin:0 0 24px;border:1px solid var(--line);background:white;padding:14px 16px;border-radius:7px}.mobile-toc .toc{max-height:55vh;overflow:auto;margin-top:12px}.toolbar{margin-bottom:26px;gap:8px}.toolbar button{font-size:13px;padding:8px 10px;min-height:42px}h1{font-size:38px;letter-spacing:-1px;max-width:20ch}h1+p{font-size:14px}h2{font-size:27px;margin-top:48px;padding-top:24px}h3{font-size:21px}table{font-size:14px;min-width:560px}th,td{padding:12px}.journey{padding:20px;margin:28px 0 32px}.journey ol{gap:20px}.journey span{font-size:15px}.journey small{font-size:12px}.journey figcaption{font-size:13px}pre{padding:16px;font-size:14px}.footer{padding:22px 20px;display:block}.footer a{display:inline-block;margin-top:12px}ul:has(>.task){padding:9px 15px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.progress-track span{transition:none}}
@media print{@page{size:A4;margin:17mm 15mm 18mm}html{scroll-behavior:auto}body{background:white;color:#16243b;font:10pt/1.48 'Segoe UI',Arial,sans-serif}.masthead{padding:0 0 10px;margin:0;max-width:none}.brand{font-size:18pt}.edition{font-size:9pt}.layout{display:block;padding:0;max-width:none}.sidebar,.mobile-toc,.toolbar,.skip,.footer,.endnote,.progress-label,.progress-track{display:none!important}.article{max-width:none}h1{font-size:30pt;line-height:1.1;margin-top:20px}h1+p{font-size:10pt}h2{font-size:17pt;margin:28px 0 13px;padding-top:15px;break-after:avoid}h3{font-size:13pt;margin:20px 0 10px;break-after:avoid}p,li{orphans:3;widows:3}p{margin:0 0 10px}li{margin:5px 0}a{color:#155756;text-decoration:underline}.table-scroll{overflow:visible;border-radius:0;margin:12px 0 18px}table{font-size:8.4pt;min-width:0;table-layout:fixed;width:100%}th,td{min-width:0;padding:7px;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}pre{font-size:8.4pt;line-height:1.45;padding:12px;white-space:pre-wrap;break-inside:auto}.journey{break-inside:avoid;margin:18px 0;padding:15px}.journey ol{grid-template-columns:repeat(4,1fr)}.journey span{font-size:10pt}.journey small,.journey figcaption{font-size:8.5pt}.print-only{display:block;font-size:9pt;color:#52647d}code{font-size:.9em}input[type=checkbox]{width:13px;height:13px;flex-basis:13px;margin-top:3px}ul:has(>.task){break-inside:avoid}}
'''
js = '''
const status = document.getElementById('status');
const tasks = [...document.querySelectorAll('input[data-task]')];
const storageKey = 'kolosei-seo-guide-2026-09-08-v1';
let canStore = true, saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (!saved || typeof saved !== 'object') saved = {}; } catch { canStore = false; }
tasks.forEach(input => { input.checked = saved[input.dataset.task] === true; });
function progress() {
  const complete = tasks.filter(input => input.checked).length;
  document.querySelectorAll('[data-progress-label]').forEach(label => label.textContent = `Первый запуск: ${complete} из ${tasks.length} шагов`);
  document.querySelectorAll('[data-progress-bar]').forEach(bar => bar.style.width = `${100 * complete / tasks.length}%`);
}
tasks.forEach(input => input.addEventListener('change', () => {
  saved = Object.fromEntries(tasks.map(task => [task.dataset.task, task.checked]));
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); canStore = true; } catch { canStore = false; }
  status.textContent = canStore ? 'Отметки сохранены только в этом браузере. Внешние сервисы не изменены.' : 'Отметки действуют в открытой вкладке; браузер не разрешил локальное сохранение.';
  progress();
}));
progress();
document.getElementById('print').addEventListener('click', () => window.print());
document.getElementById('copy').addEventListener('click', async () => {
  const sitemap = 'https://kolosei.com/sitemap-index.xml';
  try { await navigator.clipboard.writeText(sitemap); status.textContent = 'Адрес sitemap скопирован. Вставьте его в нужное поле кабинета.'; }
  catch { status.textContent = 'Выделите и скопируйте адрес вручную: ' + sitemap; }
});
let large = false;
document.getElementById('font').addEventListener('click', (event) => {
  large = !large;
  document.querySelector('.article').style.fontSize = large ? '20px' : '';
  event.currentTarget.setAttribute('aria-pressed', String(large));
  event.currentTarget.textContent = large ? 'Обычный текст' : 'Увеличить текст';
});
const sectionLinks = [...document.querySelectorAll('.sidebar .toc a')];
const headings = [...document.querySelectorAll('h2[id]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) sectionLinks.forEach(link => { if (link.hash.slice(1) === entry.target.id) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '0px 0px -70% 0px' });
  headings.forEach(heading => observer.observe(heading));
}
'''
progress = f'<p class="progress-label" data-progress-label>Первый запуск: 0 из {check_count} шагов</p><div class="progress-track" aria-hidden="true"><span data-progress-bar></span></div>'
output = f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Продвижение LinguistPro — пошаговое руководство владельца</title><meta name="description" content="Search Console, Bing, sitemap, Lighthouse, измерение переходов и ИИ-цитирования. План на 90 дней для владельца kolosei.com."><style>{css}</style></head>
<body><a href="#guide" class="skip">К руководству</a>
<header class="masthead"><div class="brand">Kolosei<span>Рабочее руководство владельца</span></div><div class="edition">Продвижение LinguistPro<br>Редакция 8 сентября 2026</div></header>
<div class="layout"><aside class="sidebar" aria-label="Оглавление и ход первого запуска"><div class="nav-inner"><span class="nav-title">Ваш маршрут</span><nav class="toc" aria-label="Разделы руководства">{md.toc}</nav><div class="nav-tools">{progress}<p class="storage-note">Отметки хранятся в этом браузере. Они помогают пройти инструкцию, но не подтверждают настройку сервисов.</p><a href="{STEM}.md">Исходный Markdown</a><p>Найти слово: Ctrl + F</p></div></div></aside>
<main id="guide" class="article" tabindex="-1"><details class="mobile-toc"><summary>Оглавление: 20 разделов</summary><nav aria-label="Разделы на узком экране">{md.toc}</nav>{progress}</details>
<div class="toolbar"><button type="button" id="copy" class="primary">Скопировать sitemap</button><button type="button" id="print">Печать / PDF</button><button type="button" id="font" aria-pressed="false">Увеличить текст</button><p class="status" id="status" role="status">Можно читать без интернета. Внешние ссылки открывают соответствующие сервисы.</p></div>
<p class="print-only">Личная копия руководства. Проверяйте актуальные названия меню по официальным ссылкам.</p>{body}
<p class="endnote">HTML собран из Markdown. Данные кабинетов сюда автоматически не поступают. Для поиска используйте Ctrl + F; для сохранения печатной копии — «Печать / PDF».</p></main></div>
<footer class="footer"><span>LinguistPro by Kolosei · Сначала наблюдение, затем обоснованное действие.</span><a href="#guide">К началу руководства</a></footer>
<script>{js}</script></body></html>'''
(ROOT / (STEM + '.html')).write_text(output, encoding='utf-8')
print(json.dumps({'html': str(ROOT / (STEM + '.html')), 'sections': len(md.toc_tokens), 'checklist': check_count, 'tables': table_count, 'source_sha256': hashlib.sha256(source.encode()).hexdigest()}, ensure_ascii=False))
