const $ = (id) => document.getElementById(id);
let L;
try { L = await (await fetch("lesson.json")).json(); }
catch (e) { $("stepcard").innerHTML = '<p class="err">Не удалось загрузить урок (lesson.json). Обновите страницу.</p>'; throw e; }

const W = L.screen.w, H = L.screen.h, N = L.steps.length;
const lessonId = L.id || "bracket";
const staged = L.steps.some(step => step.kind === "result");
const outcomes = [];
let outcome = null;
for (const step of L.steps) {
  if (step.kind === "result") outcome = step;
  outcomes.push(outcome);
}
$("frame").style.setProperty("--lesson-screen", `${W} / ${H}`);
if (L.sw_version) $("swver").textContent = L.sw_version;
if (/^https?:\/\/[^/]+\/products\//.test(document.referrer)) $("home").href = `/products/solidworks-instructor/${lessonId}/`;
const blocks = L.blocks, bIndex = Object.fromEntries(blocks.map((b, i) => [b.id, i]));
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

const S = { idx: store.get(lessonId + ".idx", 0), mode: store.get(lessonId + ".mode", "guide"), misses: 0, revealed: false,
            err: 0, hints: 0, t0: Date.now(), done: false, zoom: store.get(lessonId + ".zoom", innerWidth < 900),
            playing: true, timer: null, advanceTimer: null };
if (S.idx >= N) S.idx = 0;

/* ---------- маршрут ---------- */
blocks.forEach((b, i) => {
  const btn = document.createElement("button");
  btn.innerHTML = `<i class="fill"></i><span>${i + 1} · ${b.title}</span>`;
  btn.title = b.title;
  btn.onclick = () => go(L.steps.findIndex((s) => s.block === b.id));
  $("route").append(btn);
});

/* ---------- геометрия ---------- */
const pct = (r) => ({ left: r[0] / W * 100, top: r[1] / H * 100, w: (r[2] - r[0]) / W * 100, h: (r[3] - r[1]) / H * 100 });
const center = (r) => [(r[0] + r[2]) / 2 / W, (r[1] + r[3]) / 2 / H];
function place(el, r) { const p = pct(r); Object.assign(el.style, { left: p.left + "%", top: p.top + "%", width: p.w + "%", height: p.h + "%" }); }
function toImg(e) { const b = $("shot").getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; }
function hit(r, x, y, pad = 8) { return x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad; }

function fitInputToFrame(st, zoom, tx, ty) {
  const pop = $("pop");
  if (!staged || st.kind !== "input" || pop.hidden) return;
  const {clientWidth: width, clientHeight: height} = $("frame");
  if (!width || !height) return;
  const margin = 6;
  const p = pct(st.rect);
  const anchorX = (p.left * zoom + tx) * width / 100;
  const anchorY = (p.top * zoom + ty) * height / 100;
  const below = anchorY + p.h * zoom * height / 100 + margin;
  const topLimit = height - pop.offsetHeight - margin;
  const x = Math.max(margin, Math.min(anchorX, width - pop.offsetWidth - margin));
  const y = Math.max(margin, Math.min(below <= topLimit ? below : anchorY - pop.offsetHeight - margin, topLimit));
  pop.style.left = (x / width * 100 - tx) / zoom + "%";
  pop.style.top = (y / height * 100 - ty) / zoom + "%";
}

function applyZoom() {
  const st = L.steps[S.idx], z = S.zoom ? 2.1 : 1;
  $("zoom").setAttribute("aria-pressed", S.zoom);
  if (z === 1 || !st.rect) {
    $("layer").style.transform = ""; $("pop").style.transform = "";
    fitInputToFrame(st, 1, 0, 0);
    return;
  }
  const [cx, cy] = center(st.rect);
  const tx = Math.min(0, Math.max(1 - z, 0.5 - cx * z)) * 100, ty = Math.min(0, Math.max(1 - z, 0.5 - cy * z)) * 100;
  $("layer").style.transform = `translate(${tx}%, ${ty}%) scale(${z})`;
  $("pop").style.transform = `scale(${1 / z})`;
  fitInputToFrame(st, z, tx, ty);
}
if (staged) window.addEventListener("resize", applyZoom);

/* ---------- 3D ---------- */
let show3D = () => {};
(async () => {
  try {
    const THREE = await import("three");
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    const host = $("viewer");
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.0001, 10);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9096, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1, 1.4, 1.2); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(-1.2, -0.4, -1); scene.add(rim);
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enableDamping = true; controls.autoRotate = !staged; controls.autoRotateSpeed = 1.6;
    controls.addEventListener("start", () => (controls.autoRotate = false));
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 0.55, roughness: 0.38 });
    const loader = new GLTFLoader(); const cache = {}; let current = null, currentUrl = null, wanted = "";
    const size = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(host); size();
    // Модель хранится как glTF JSON со встроенным буфером (data: URI). Загружать data: напрямую
    // запрещает политика безопасности, поэтому собираем из неё GLB в памяти и разбираем без сети.
    const toGLB = async (url) => {
      const j = await (await fetch(url)).json();
      const uri = j.buffers[0].uri; delete j.buffers[0].uri;
      const bin = Uint8Array.from(atob(uri.slice(uri.indexOf(",") + 1)), (ch) => ch.charCodeAt(0));
      const pad = (n) => (4 - (n % 4)) % 4;
      let js = new TextEncoder().encode(JSON.stringify(j));
      const jsP = new Uint8Array(js.length + pad(js.length)).fill(0x20); jsP.set(js);
      const binP = new Uint8Array(bin.length + pad(bin.length)); binP.set(bin);
      const total = 12 + 8 + jsP.length + 8 + binP.length, out = new ArrayBuffer(total), dv = new DataView(out);
      dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
      dv.setUint32(12, jsP.length, true); dv.setUint32(16, 0x4E4F534A, true); new Uint8Array(out, 20).set(jsP);
      const o = 20 + jsP.length; dv.setUint32(o, binP.length, true); dv.setUint32(o + 4, 0x004E4942, true);
      new Uint8Array(out, o + 8).set(binP);
      return loader.parseAsync(out, "");
    };
    show3D = async (url, label) => {
      wanted = url; $("vlabel").textContent = label;
      if (currentUrl === url) return;
      if (current) scene.remove(current);
      current = null; currentUrl = null; delete host.dataset.model;
      if (!url) return;
      if (!cache[url]) cache[url] = toGLB(url);
      let g;
      try { g = await cache[url]; } catch (e) { delete cache[url]; if (wanted === url) $("vlabel").textContent = "не удалось загрузить 3D-модель"; return; }
      if (wanted !== url) return;
      if (currentUrl === url) return;
      const obj = g.scene.clone(true);
      obj.traverse((o) => { if (o.isMesh) { o.material = steel; } });
      const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
      obj.position.sub(c);
      if (current) scene.remove(current);
      scene.add(current = obj); currentUrl = url; host.dataset.model = url;
      cam.position.set(r * 2.4, r * (staged ? 2.75 : 1.6), r * 2.9); controls.target.set(0, 0, 0); controls.update();
    };
    (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, cam); })();
    updateViewer();
  } catch (e) { $("vlabel").textContent = "3D недоступно в этом браузере"; }
})();

/* ---------- оверлеи: «резиновая» фигура и схемы меню ---------- */
$("ov").setAttribute("viewBox", `0 0 ${W} ${H}`);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let ghostP = null;
function ghostSVG(g, p) {
  const [cx, cy] = g.c, dx = p[0] - cx, dy = p[1] - cy, r = Math.hypot(dx, dy);
  let shape;
  if (g.kind === "hex") {
    const a0 = Math.atan2(dy, dx);
    const pts = [...Array(6)].map((_, k) => [cx + r * Math.cos(a0 + k * Math.PI / 3), cy + r * Math.sin(a0 + k * Math.PI / 3)].join(",")).join(" ");
    shape = `<polygon points="${pts}" fill="none" stroke="#1d5fd1" stroke-width="2" stroke-dasharray="7 5"/>
             <circle cx="${cx}" cy="${cy}" r="${r * Math.cos(Math.PI / 6)}" fill="none" stroke="#1d5fd1" stroke-width="1.2" stroke-dasharray="3 4"/>`;
  } else shape = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(29,95,209,.08)" stroke="#1d5fd1" stroke-width="2" stroke-dasharray="7 5"/>`;
  return shape + `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#1d5fd1" stroke-width="1" stroke-dasharray="2 3"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#1d5fd1"/>`;
}
function menuSVG(m) {
  let s = "";
  // снимки настоящих раскрытых меню SolidWorks
  (m.images || []).forEach((im) => {
    const [l, t, r, b] = im.r;
    s += `<rect x="${l + 3}" y="${t + 3}" width="${r - l}" height="${b - t}" fill="rgba(0,0,0,.2)"/>
          <image href="${esc(im.src)}" x="${l}" y="${t}" width="${r - l}" height="${b - t}" preserveAspectRatio="none"/>`;
  });
  const pressed = m.levels && m.levels.length;
  if (m.bar) {
    const b = m.bar, x0 = b[0].r[0] - 6, x1 = b[b.length - 1].r[2] + 6, y0 = b[0].r[1], y1 = b[0].r[3];
    if (!m.real) s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#f4f5f6" stroke="#b7bcc1"/>`;
    b.forEach((it, i) => {
      if (pressed && i === m.hi) s += `<rect x="${it.r[0]}" y="${it.r[1] + 1}" width="${it.r[2] - it.r[0]}" height="${it.r[3] - it.r[1] - 2}" fill="${m.real ? "rgba(120,170,230,.35)" : "#cfe3f8"}" stroke="#7fb0e6"/>`;
      if (!m.real) s += `<text x="${(it.r[0] + it.r[2]) / 2}" y="${it.r[1] + 18}" text-anchor="middle" font-size="13" font-family="Segoe UI, Golos Text, sans-serif" fill="#1b1e21">${esc(it.t)}</text>`;
    });
  }
  (m.levels || []).forEach((lv, li) => {
    const hgt = lv.items.length * 24 + 4, last = li === m.levels.length - 1;
    s += `<rect x="${lv.x + 3}" y="${lv.y + 3}" width="${lv.w}" height="${hgt}" fill="rgba(0,0,0,.18)"/>
          <rect x="${lv.x}" y="${lv.y}" width="${lv.w}" height="${hgt}" fill="#fbfbfc" stroke="#9aa1a8"/>`;
    lv.items.forEach((t, i) => {
      const y = lv.y + 2 + i * 24;
      if (!last && i === lv.hi) s += `<rect x="${lv.x + 2}" y="${y}" width="${lv.w - 4}" height="24" fill="#cfe3f8"/>`;
      const sub = t.endsWith("▸"); const label = sub ? t.slice(0, -1).trim() : t;
      s += `<text x="${lv.x + 14}" y="${y + 17}" font-size="13" font-family="Segoe UI, Golos Text, sans-serif" fill="#1b1e21">${esc(label)}</text>`;
      if (sub) s += `<text x="${lv.x + lv.w - 16}" y="${y + 17}" font-size="11" fill="#555">▶</text>`;
    });
    if (last) s += `<text x="${lv.x}" y="${lv.y + hgt + 16}" font-size="11" font-family="JetBrains Mono, monospace" fill="#8a3b0c">схема меню · в SOLIDWORKS выглядит так же</text>`;
  });
  return s;
}
function drawOverlay() {
  const st = L.steps[S.idx]; let s = "";
  if (st && st.menu && !S.done) s += menuSVG(st.menu);
  if (st && st.ghost && !S.done) {
    const g = st.ghost, p0 = [g.c[0] + (g.p[0] - g.c[0]) * 0.55, g.c[1] + (g.p[1] - g.c[1]) * 0.55];
    s += ghostSVG(g, ghostP || (S.mode === "watch" ? g.c : p0));
  }
  $("ov").innerHTML = s;
}
$("frame").addEventListener("pointermove", (e) => {
  const st = L.steps[S.idx];
  if (!st || S.mode === "watch" || S.done || S.advanceTimer !== null) return;
  if (st.kind === "hover" && e.pointerType === "mouse") {
    const [x, y] = toImg(e);
    if (hit(st.rect, x, y)) { ripple(x, y, true); success(); }
  }
  if (st.ghost) { ghostP = toImg(e); drawOverlay(); }
});

/* ---------- отрисовка шага ---------- */
const KIND = { click: "Клик", input: "Ввод", hover: "Указатель", result: "Результат" };
function updateViewer() {
  if (S.done) { show3D(L.final.model, "готовая деталь"); return; }
  const bi = bIndex[L.steps[S.idx].block];
  if (!staged) { show3D(blocks[bi].model, `после блока ${bi + 1}`); return; }
  const completed = outcomes[S.idx];
  show3D(completed?.model, completed?.model ? "вращайте деталь" : "эскиз виден в рабочем окне");
}

function configureViews(st) {
  const host = $("result-views");
  if (!host) return;
  host.replaceChildren();
  host.hidden = !st.views?.length;
  for (const [i, view] of (st.views || []).entries()) {
    const button = document.createElement("button");
    button.className = "chip";
    button.textContent = view.name;
    button.setAttribute("aria-pressed", String(i === 0));
    button.onclick = () => {
      $("shot").src = view.shot;
      $("shot").alt = `${st.title}. ${view.name}.`;
      for (const peer of host.children) peer.setAttribute("aria-pressed", String(peer === button));
    };
    host.append(button);
  }
}

function render() {
  const st = L.steps[S.idx], bi = bIndex[st.block], b = blocks[bi];
  const result = st.kind === "result";
  $("shot").src = st.shot;
  $("shot").alt = result ? st.title : "Кадр окна SOLIDWORKS для текущего шага";
  $("frame").classList.toggle("result", result);
  $("frame").classList.toggle("numeric", staged && st.kind === "input");
  configureViews(st);
  const nx = L.steps[S.idx + 1]; if (nx) new Image().src = nx.shot;
  $("stepcount").textContent = `шаг ${S.idx + 1} / ${N}`;
  $("blockname").textContent = `${bi + 1}. ${b.title}`;
  $("kind").textContent = KIND[st.kind] || st.kind;
  $("title").textContent = st.title;
  $("text").textContent = st.text;
  const showVal = st.value != null && S.mode !== "test";
  $("val").hidden = !showVal; if (showVal) $("val").textContent = "Значение: " + fmtVal(st.value);
  $("msg").textContent = ""; $("msg").className = "msg";
  S.misses = 0; S.revealed = false; ghostP = null; drawOverlay();
  if (st.rect) place($("hot"), st.rect);
  $("hot").hidden = result || S.mode === "test";
  $("cursor").toggleAttribute("hidden", result || S.mode !== "watch");
  // поле ввода
  const pop = $("pop");
  if (st.kind === "input" && S.mode !== "watch") {
    pop.hidden = false; $("popin").value = "";
    const p = pct(st.rect); pop.style.left = Math.min(p.left, 72) + "%"; pop.style.top = Math.min(p.top + p.h + 1.2, 88) + "%";
    $("popin").placeholder = typeof st.value === "number" ? "число" : "текст";
    $("popin").inputMode = typeof st.value === "number" ? "decimal" : "text";
    setTimeout(() => $("popin").focus({ preventScroll: true }), 60);
  } else pop.hidden = true;
  // маршрут
  [...$("route").children].forEach((el, i) => {
    const steps = L.steps.filter((s) => s.block === blocks[i].id), first = L.steps.indexOf(steps[0]);
    const doneN = Math.max(0, Math.min(steps.length, S.idx - first));
    el.querySelector(".fill").style.width = (doneN / steps.length * 100) + "%";
    el.classList.toggle("done", doneN === steps.length); el.classList.toggle("cur", i === bi);
  });
  $("back").disabled = S.idx === 0;
  $("hint").hidden = result || S.mode === "watch";
  $("skip").textContent = result ? (S.idx === N - 1 ? "Завершить →" : "Продолжить →") : S.mode === "watch" ? "Дальше →" : "Пропустить →";
  $("hint-line").textContent = result ? "Осмотрите результат перед следующим этапом." : S.mode === "watch" ? "Смотрите: курсор показывает каждое действие." :
    S.mode === "test" ? "Подсветки нет. Ошиблись дважды — появится подсказка." : "Кликайте по подсвеченной области — как в SOLIDWORKS.";
  $("play").hidden = result || S.mode !== "watch";
  $("zoom").hidden = result;
  applyZoom();
  updateViewer();
  store.set(lessonId + ".idx", S.idx);
  if (!result && S.mode === "watch") demo();
}
const fmtVal = (v) => typeof v === "number" ? String(+v.toFixed(3)).replace(".", ",") : `«${v}»`;

/* ---------- проверка действий ---------- */
function ripple(x, y, ok) {
  const r = document.createElement("div"); r.className = "ripple " + (ok ? "ok" : "bad");
  r.style.left = x / W * 100 + "%"; r.style.top = y / H * 100 + "%";
  $("layer").append(r); setTimeout(() => r.remove(), 600);
}
function success(text) {
  $("msg").textContent = text || "Верно"; $("msg").className = "msg ok";
  $("hot").hidden = true; $("pop").hidden = true;
  S.advanceTimer = setTimeout(next, 420);
}
function miss(text) {
  S.misses++; S.err++; $("s-err").textContent = S.err;
  $("msg").textContent = text; $("msg").className = "msg bad";
  if (S.mode === "test" && S.misses >= 2 && !S.revealed) { S.revealed = true; S.hints++; $("s-hint").textContent = S.hints; $("hot").hidden = false; }
}
$("frame").addEventListener("click", (e) => {
  if (S.mode === "watch" || S.done || S.advanceTimer !== null) return;
  if (e.target.closest(".pop")) return;
  const st = L.steps[S.idx], [x, y] = toImg(e);
  if (!st.rect) return;
  if (st.kind === "input") {
    if (hit(st.rect, x, y, 14)) { $("popin").focus(); return; }
    ripple(x, y, false); miss("Здесь нужно ввести значение — поле под подсветкой."); return;
  }
  if (hit(st.rect, x, y)) { ripple(x, y, true); success(); }
  else { ripple(x, y, false); miss("Мимо. " + (S.mode === "guide" ? "Нужная область подсвечена оранжевым." : "Перечитайте задание слева.")); }
});
$("pop").addEventListener("submit", (e) => {
  e.preventDefault();
  const st = L.steps[S.idx], raw = $("popin").value.trim();
  if (!raw || st.kind !== "input" || S.advanceTimer !== null) return;
  let ok;
  if (typeof st.value === "number") {
    const normalized = raw.replace(",", ".");
    const number = staged ? Number(normalized) : parseFloat(normalized);
    ok = (!staged || /^[-+]?\d+(?:[.,]\d+)?$/.test(raw)) && Math.abs(number - st.value) < 1e-3;
  }
  else { const a = raw.toLowerCase(), b = String(st.value).toLowerCase(); ok = a.length >= 4 && (b.startsWith(a) || a.startsWith(b)); }
  if (ok) success("Верно: " + fmtVal(st.value));
  else miss(typeof st.value === "number" ? `Значение не совпадает с моделью. Проверьте размер.` : "Команда так не называется — попробуйте ещё раз.");
});

/* ---------- режим «Покажи» ---------- */
function demo() {
  clearTimeout(S.timer);
  const st = L.steps[S.idx], c = $("cursor");
  c.removeAttribute("hidden");
  if (!S.playing) return;
  const [cx, cy] = center(st.rect);
  if (st.ghost) { c.style.left = st.ghost.c[0] / W * 100 + "%"; c.style.top = st.ghost.c[1] / H * 100 + "%"; }
  S.timer = setTimeout(() => {
    c.style.left = cx * 100 + "%"; c.style.top = cy * 100 + "%";
    S.timer = setTimeout(() => {
      ripple(cx * W, cy * H, true);
      if (st.kind === "input") {
        const pop = $("pop"), p = pct(st.rect); pop.hidden = false; $("popin").value = "";
        pop.style.left = Math.min(p.left, 72) + "%"; pop.style.top = Math.min(p.top + p.h + 1.2, 88) + "%";
        if (staged) applyZoom();
        const txt = typeof st.value === "number" ? String(+st.value.toFixed(3)) : String(st.value);
        let i = 0;
        const type = () => { if (!S.playing || S.mode !== "watch") return; $("popin").value = txt.slice(0, ++i);
          S.timer = setTimeout(i < txt.length ? type : () => { pop.hidden = true; next(); }, i < txt.length ? 70 : 900); };
        type();
      } else if (st.ghost) {
        const t0 = performance.now(), [gx, gy] = st.ghost.c;
        const grow = (t) => { if (!S.playing || S.mode !== "watch") return;
          const k = Math.min(1, (t - t0) / 900); ghostP = [gx + (cx * W - gx) * k, gy + (cy * H - gy) * k]; drawOverlay();
          if (k < 1) requestAnimationFrame(grow); else S.timer = setTimeout(next, 700); };
        requestAnimationFrame(grow);
      } else S.timer = setTimeout(next, 1100);
    }, 800);
  }, 500);
}
$("play").onclick = () => { S.playing = !S.playing; $("play").textContent = S.playing ? "Пауза" : "Продолжить"; if (S.playing) demo(); else clearTimeout(S.timer); };

/* ---------- навигация ---------- */
function go(i) {
  clearTimeout(S.timer);
  clearTimeout(S.advanceTimer); S.advanceTimer = null;
  if (i >= N) return finish();
  S.done = false; S.idx = Math.max(0, i); render();
}
function next() { go(S.idx + 1); }
function finish() {
  S.done = true; clearTimeout(S.timer); $("cursor").setAttribute("hidden", ""); $("pop").hidden = true; $("hot").hidden = true;
  $("shot").src = L.final.shot; $("layer").style.transform = ""; $("ov").innerHTML = "";
  $("shot").alt = L.final.title || "Готовый кронштейн";
  if (staged) configureViews(L.steps[N - 1]);
  [...$("route").children].forEach((el) => { el.classList.add("done"); el.classList.remove("cur"); el.querySelector(".fill").style.width = "100%"; });
  $("blockname").textContent = "Готово"; $("kind").textContent = "Итог";
  $("title").textContent = L.final.title || "Кронштейн построен";
  $("text").textContent = `Вы прошли ${N} шагов. Промахов: ${S.err}, подсказок: ${S.hints}. Попробуйте режим «Проверка» — без подсветки.`;
  $("val").hidden = true;
  if (staged) {
    const backLink = document.createElement("a");
    backLink.href = $("home").href;
    backLink.textContent = "Вернуться к странице урока";
    $("msg").replaceChildren(backLink);
  } else {
    $("msg").innerHTML = '<div class="finish-links"><a href="/ru/products/solidworks-instructor/">Тот же урок внутри SOLIDWORKS</a><a href="mailto:peter@kolosei.com?subject=%D0%A3%D1%80%D0%BE%D0%BA%20%C2%AB%D0%9A%D1%80%D0%BE%D0%BD%D1%88%D1%82%D0%B5%D0%B9%D0%BD%C2%BB">Написать отзыв</a></div>';
  }
  $("stepcount").textContent = `${N} / ${N}`;
  if (staged) $("skip").textContent = "Начать заново";
  updateViewer();
  store.set(lessonId + ".idx", 0);
}
$("back").onclick = () => go(S.idx - 1);
$("skip").onclick = () => (S.done ? go(0) : next());
$("hint").onclick = () => {
  S.hints++; $("s-hint").textContent = S.hints; S.revealed = true; $("hot").hidden = false;
  const st = L.steps[S.idx]; $("msg").className = "msg";
  $("msg").textContent = st.value != null ? "Нужное значение: " + fmtVal(st.value) : "Нужная область подсвечена.";
};
$("zoom").onclick = () => { S.zoom = !S.zoom; store.set(lessonId + ".zoom", S.zoom); applyZoom(); };
document.querySelectorAll(".modes button").forEach((b) => b.onclick = () => {
  clearTimeout(S.timer);
  clearTimeout(S.advanceTimer); S.advanceTimer = null;
  S.mode = b.dataset.mode; store.set(lessonId + ".mode", S.mode);
  document.querySelectorAll(".modes button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  S.playing = true; $("play").textContent = "Пауза";
  if (S.done) go(0); else render();
});
document.querySelectorAll(".modes button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.mode === S.mode));
$("cursor").toggleAttribute("hidden", S.mode !== "watch");
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") go(S.idx - 1);
});
setInterval(() => { if (S.done) return; const s = Math.floor((Date.now() - S.t0) / 1000); $("s-time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000);
render();
