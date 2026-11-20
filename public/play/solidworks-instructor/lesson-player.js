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
const chapters = blocks.map(block => {
  const start = L.steps.findIndex(step => step.block === block.id);
  const length = L.steps.filter(step => step.block === block.id).length;
  return {start, end:start + length};
});
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
                set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const progressKey = lessonId + ".progress." + (L.revision || 1);
const numberInRange = (v, max) => Number.isInteger(v) && v >= 0 && v <= max ? v : 0;
const blankRun = () => ({confirmed:0, cursor:0, errors:0, hints:0});
const runs = {};
for (const mode of ["guide", "test"]) {
  const prior = store.get(progressKey + "." + mode, {});
  const confirmed = numberInRange(prior.confirmed, N);
  runs[mode] = {confirmed, cursor:Math.min(numberInRange(prior.cursor, N-1), confirmed),
               errors:numberInRange(prior.errors, Number.MAX_SAFE_INTEGER), hints:numberInRange(prior.hints, Number.MAX_SAFE_INTEGER)};
}

const S = { idx: store.get(lessonId + ".idx", 0), mode: store.get(lessonId + ".mode", "guide"), misses: 0, revealed: false,
            err: 0, hints: 0, t0: Date.now(), done: false, zoom: store.get(lessonId + ".zoom", innerWidth < 900),
            playing: true, timer: null, advanceTimer: null, frameReady: !staged, imageToken: 0 };
if (!["guide", "watch", "test"].includes(S.mode)) S.mode = "guide";
if (staged && S.mode !== "watch") S.idx = runs[S.mode].cursor;
if (S.idx >= N) S.idx = 0;

function persist() {
  if (staged && S.mode !== "watch") {
    const run = runs[S.mode];
    run.cursor = S.idx;
    store.set(progressKey + "." + S.mode, run);
  } else store.set(lessonId + ".idx", S.idx);
}

function updateStats() {
  if (!staged) return;
  const demo = S.mode === "watch";
  const run = runs[S.mode];
  const stats = $("s-err").closest(".stats");
  stats.hidden = demo;
  if (demo) {
    $("restart").hidden = true;
    return;
  }
  $("s-time").textContent = String(run.confirmed);
  $("s-err").textContent = String(run.errors);
  $("s-hint").textContent = String(run.hints);
  $("restart").hidden = run.confirmed + run.errors + run.hints === 0 || S.done;
}

function confirmCurrent() {
  if (!staged || S.mode === "watch") return;
  if (runs[S.mode].confirmed === S.idx) runs[S.mode].confirmed++;
  persist();
  updateStats();
}

/* ---------- маршрут ---------- */
blocks.forEach((b, i) => {
  const btn = document.createElement("button");
  btn.innerHTML = `<i class="fill"></i><span>${i + 1} · ${b.title}</span>`;
  btn.title = b.title;
  btn.onclick = () => go(chapters[i].start);
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

function fitDesktopFrame() {
  if (!staged || innerWidth < 981) return;
  const wrap = $("frame").closest(".stagewrap");
  const top = wrap.getBoundingClientRect().top + scrollY;
  const available = Math.max(265, innerHeight - top - wrap.querySelector(".stagebar").offsetHeight - 32);
  $("frame").style.setProperty("--frame-max-width", `${available * W / H}px`);
  if (S.frameReady && !S.done) applyZoom();
}
if (staged) {
  window.addEventListener("resize", fitDesktopFrame);
  document.fonts?.ready.then(fitDesktopFrame);
}

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
    const size = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    };
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
  if (staged && st.selection && !S.done) {
    const [x1,y1,x2,y2] = st.selection;
    s += `<line class="selection-mark" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }
  if (staged && st.kind === "input" && !S.done) {
    const [x,y,r,b] = st.rect;
    s += `<rect class="answer-mask" x="${x+3}" y="${y+3}" width="${r-x-6}" height="${b-y-6}" rx="2" />`;
  }
  if (st && st.menu && !S.done) s += menuSVG(st.menu);
  if (st && st.ghost && !S.done) {
    const g = st.ghost, p0 = [g.c[0] + (g.p[0] - g.c[0]) * 0.55, g.c[1] + (g.p[1] - g.c[1]) * 0.55];
    s += ghostSVG(g, ghostP || (S.mode === "watch" ? g.c : p0));
  }
  $("ov").innerHTML = s;
}
$("frame").addEventListener("pointermove", (e) => {
  const st = L.steps[S.idx];
  if (!st || !S.frameReady || S.mode === "watch" || S.done || S.advanceTimer !== null) return;
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
  const model = S.frameReady ? completed?.model : null;
  $("model-card").hidden = !model;
  $("model-title").textContent = S.mode === "watch" ? "Геометрия на этом этапе" : "Подтверждённая геометрия";
  show3D(model, model ? "Поверните деталь мышью" : "");
}

function loadFrame(url, alt, ready) {
  const img = $("shot");
  if (!staged) { img.src = url; img.alt = alt; ready(); return; }
  const token = ++S.imageToken;
  const frame = $("frame");
  const retry = $("frame-retry");
  S.frameReady = false;
  frame.dataset.ready = "false";
  frame.setAttribute("aria-busy", "true");
  $("frame-status").hidden = false;
  $("frame-status-text").textContent = "Загружается кадр";
  retry.hidden = true;
  $("skip").disabled = true;
  $("hint").disabled = true;
  $("hot").hidden = true;
  $("pop").hidden = true;
  $("layer").querySelectorAll(".ripple").forEach(el => el.remove());
  img.src = url;
  img.alt = alt;
  img.decode().then(() => {
    if (token !== S.imageToken) return;
    S.frameReady = true;
    frame.dataset.ready = "true";
    frame.setAttribute("aria-busy", "false");
    $("frame-status").hidden = true;
    $("skip").disabled = false;
    $("hint").disabled = false;
    ready();
  }).catch(() => {
    if (token !== S.imageToken) return;
    frame.setAttribute("aria-busy", "false");
    $("frame-status-text").textContent = "Кадр не загрузился";
    retry.hidden = false;
    retry.onclick = () => {
      const fresh = new URL(url, location);
      fresh.searchParams.set("retry", String(Date.now()));
      loadFrame(fresh.href, alt, ready);
    };
  });
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
      loadFrame(view.shot, `${st.title}. ${view.name}.`, updateViewer);
      for (const peer of host.children) peer.setAttribute("aria-pressed", String(peer === button));
    };
    host.append(button);
  }
}

function render() {
  const st = L.steps[S.idx], bi = bIndex[st.block], b = blocks[bi];
  const result = st.kind === "result";
  const alt = result ? st.title : "Кадр окна SOLIDWORKS для текущего шага";
  $("frame").classList.toggle("result", result);
  configureViews(st);
  const nx = L.steps[S.idx + 1]; if (nx) new Image().src = nx.shot;
  $("stepcount").textContent = `шаг ${S.idx + 1} / ${N}`;
  $("blockname").textContent = `${bi + 1}. ${b.title}`;
  $("kind").textContent = KIND[st.kind] || st.kind;
  $("title").textContent = st.title;
  $("text").textContent = S.mode === "test" && st.testText ? st.testText : st.text;
  if (staged) {
    if ($("viewer").dataset.model !== outcomes[S.idx]?.model) $("model-card").hidden = true;
    $("context").textContent = st.context || "";
    $("context").hidden = !st.context;
    $("preview").textContent = st.preview || "";
    $("preview").hidden = !st.preview;
    $("mode-help").textContent = S.mode === "watch"
      ? "Демонстрация. Откройте любой этап и остановитесь на его результате."
      : S.mode === "test" ? "Выполняйте действия самостоятельно. При необходимости откройте подсказку."
      : "Выполняйте команды по подсветке. Откройте «Покажи», чтобы посмотреть любой этап.";
  }
  const showVal = !staged && st.value != null && S.mode !== "test";
  $("val").hidden = !showVal; if (showVal) $("val").textContent = "Значение: " + fmtVal(st.value);
  $("msg").textContent = ""; $("msg").className = "msg";
  S.misses = 0; S.revealed = false; ghostP = null; drawOverlay();
  if (st.rect) place($("hot"), st.rect);
  $("hot").hidden = true;
  $("cursor").toggleAttribute("hidden", result || S.mode !== "watch");
  $("pop").hidden = true;
  // маршрут
  [...$("route").children].forEach((el, i) => {
    const {start, end} = chapters[i];
    const run = runs[S.mode];
    const confirmed = staged ? (run?.confirmed || 0) : S.idx;
    const doneN = Math.max(0, Math.min(end - start, confirmed - start));
    el.querySelector(".fill").style.width = (doneN / (end - start) * 100) + "%";
    el.classList.toggle("done", doneN === end - start); el.classList.toggle("cur", i === bi);
    el.disabled = staged && S.mode !== "watch" && start > confirmed;
    if (i === bi) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  });
  $("back").disabled = S.idx === 0;
  $("hint").hidden = result || S.mode === "watch";
  $("skip").textContent = result ? (S.idx === N - 1 ? "Завершить →" : "Продолжить →") : S.mode === "watch" ? "Дальше →" : "Пропустить →";
  $("skip").hidden = staged && !result && S.mode !== "watch";
  $("hint-line").textContent = result ? "Осмотрите результат перед следующим этапом." : S.mode === "watch" ? "Смотрите: курсор показывает каждое действие." :
    S.mode === "test" ? "Подсветки нет. Ошиблись дважды — появится подсказка." : "Кликайте по подсвеченной области — как в SOLIDWORKS.";
  $("play").hidden = result || S.mode !== "watch";
  $("zoom").hidden = result;
  updateStats();
  persist();
  fitDesktopFrame();
  loadFrame(st.shot, alt, () => {
    $("hot").hidden = result || S.mode !== "guide";
    if (!staged && S.mode === "watch") $("hot").hidden = false;
    if (st.kind === "input" && S.mode !== "watch") {
      const input = $("popin");
      $("pop").hidden = false; input.value = "";
      input.placeholder = st.unit || (typeof st.value === "number" ? "число" : "текст");
      input.inputMode = typeof st.value === "number" ? "decimal" : "text";
      const p = pct(st.rect);
      $("pop").style.left = Math.min(p.left, 72) + "%";
      $("pop").style.top = Math.min(p.top + p.h + 1.2, 88) + "%";
      input.focus({preventScroll:true});
    }
    applyZoom();
    updateViewer();
    if (!result && S.mode === "watch") demo();
  });
}
const fmtVal = (v) => typeof v === "number" ? String(+v.toFixed(3)).replace(".", ",") : `«${v}»`;

/* ---------- проверка действий ---------- */
function ripple(x, y, ok) {
  const r = document.createElement("div"); r.className = "ripple " + (ok ? "ok" : "bad");
  r.style.left = x / W * 100 + "%"; r.style.top = y / H * 100 + "%";
  $("layer").append(r); setTimeout(() => r.remove(), 600);
}
function success(text) {
  confirmCurrent();
  $("msg").textContent = text || "Верно"; $("msg").className = "msg ok";
  $("hot").hidden = true; $("pop").hidden = true;
  S.advanceTimer = setTimeout(next, 420);
}
function miss(text) {
  S.misses++;
  const run = runs[S.mode];
  if (staged) run.errors++;
  else { S.err++; $("s-err").textContent = S.err; }
  $("msg").textContent = text; $("msg").className = "msg bad";
  if (S.mode === "test" && S.misses >= 2 && !S.revealed) {
    S.revealed = true; $("hot").hidden = false;
    if (staged) run.hints++;
    else { S.hints++; $("s-hint").textContent = S.hints; }
  }
  if (staged) { persist(); updateStats(); }
}
$("frame").addEventListener("click", (e) => {
  if (!S.frameReady || S.mode === "watch" || S.done || S.advanceTimer !== null) return;
  if (e.target.closest(".pop")) return;
  const st = L.steps[S.idx], [x, y] = toImg(e);
  if (!st.rect) return;
  if (st.kind === "input") {
    if (hit(st.rect, x, y, 14)) { $("popin").focus(); return; }
    ripple(x, y, false); miss("Здесь нужно ввести значение — поле под подсветкой."); return;
  }
  if (hit(st.rect, x, y)) {
    if (staged && st.modifier && !e.getModifierState(st.modifier)) {
      const key = st.modifier === "Control" ? "Ctrl" : st.modifier;
      ripple(x, y, false); miss(`Удерживайте ${key} при щелчке.`);
      return;
    }
    ripple(x, y, true); success();
  } else {
    ripple(x, y, false);
    miss(S.mode === "guide" ? "Выберите область в оранжевой рамке." : "Сверьтесь с заданием справа или откройте подсказку.");
  }
});
$("pop").addEventListener("submit", (e) => {
  e.preventDefault();
  const st = L.steps[S.idx], raw = $("popin").value.trim();
  if (!S.frameReady || S.mode === "watch" || !raw || st.kind !== "input" || S.advanceTimer !== null) return;
  let ok;
  if (typeof st.value === "number") {
    const typed = staged && st.unit && raw.toLowerCase().endsWith(st.unit)
      ? raw.slice(0, -st.unit.length).trim() : raw;
    const normalized = typed.replace(",", ".");
    const number = staged ? Number(normalized) : parseFloat(normalized);
    ok = (!staged || /^[-+]?\d+(?:[.,]\d+)?$/.test(typed)) && Math.abs(number - st.value) < 1e-3;
  }
  else { const a = raw.toLowerCase(), b = String(st.value).toLowerCase(); ok = a.length >= 4 && (b.startsWith(a) || a.startsWith(b)); }
  if (ok) success("Верно: " + fmtVal(st.value));
  else miss(typeof st.value === "number" ? `Значение не совпадает с моделью. Проверьте размер.` : "Команда так не называется — попробуйте ещё раз.");
});

/* ---------- режим «Покажи» ---------- */
function demo() {
  clearTimeout(S.timer);
  const st = L.steps[S.idx], c = $("cursor");
  if (!S.frameReady || S.done || !st.rect) return;
  const token = S.imageToken;
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
        const type = () => { if (!S.playing || S.mode !== "watch" || S.imageToken !== token) return; $("popin").value = txt.slice(0, ++i);
          S.timer = setTimeout(i < txt.length ? type : () => { pop.hidden = true; next(); }, i < txt.length ? 70 : 900); };
        type();
      } else if (st.ghost) {
        const t0 = performance.now(), [gx, gy] = st.ghost.c;
        const grow = (t) => { if (!S.playing || S.mode !== "watch" || S.imageToken !== token) return;
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
  if (staged && S.mode !== "watch" && i > runs[S.mode].confirmed) return;
  clearTimeout(S.timer);
  clearTimeout(S.advanceTimer); S.advanceTimer = null;
  if (i >= N) return finish();
  S.done = false; S.idx = Math.max(0, i); render();
}
function next() { go(S.idx + 1); }
function finish() {
  if (staged) S.idx = N - 1;
  S.done = true; clearTimeout(S.timer); $("cursor").setAttribute("hidden", ""); $("pop").hidden = true; $("hot").hidden = true;
  $("layer").style.transform = ""; $("ov").innerHTML = "";
  if (staged) configureViews(L.steps[N - 1]);
  const demonstrated = staged && S.mode === "watch";
  [...$("route").children].forEach((el) => {
    el.classList.toggle("done", !demonstrated); el.classList.remove("cur");
    el.querySelector(".fill").style.width = demonstrated ? "0%" : "100%";
    el.removeAttribute("aria-current");
  });
  $("blockname").textContent = "Готово"; $("kind").textContent = "Итог";
  $("title").textContent = demonstrated ? "Итог демонстрации" : L.final.title || "Кронштейн построен";
  const run = runs[S.mode];
  $("text").textContent = staged
    ? demonstrated ? "Вы открыли итоговую геометрию. Выберите «Повторяй», чтобы выполнить действия по подсветке."
      : `Подтверждены ${N} шагов в ${blocks.length} этапах. Промахи — ${run.errors}. Подсказки — ${run.hints}.`
    : `Вы прошли ${N} шагов. Промахов: ${S.err}, подсказок: ${S.hints}. Попробуйте режим «Проверка» — без подсветки.`;
  $("val").hidden = true;
  if (staged) {
    $("context").hidden = true;
    $("preview").hidden = true;
    $("model-card").hidden = false;
    $("back").disabled = false;
    $("hint").hidden = true;
    $("play").hidden = true;
    $("zoom").hidden = true;
    $("mode-help").textContent = demonstrated ? "Демонстрация" : "Сохранённый результат";
    $("hint-line").textContent = "Осмотрите деталь или начните новое прохождение.";
    const backLink = document.createElement("a");
    backLink.href = $("home").href;
    backLink.textContent = "Вернуться к странице урока";
    $("msg").replaceChildren(backLink);
  } else {
    $("msg").innerHTML = '<div class="finish-links"><a href="/ru/products/solidworks-instructor/">Тот же урок внутри SOLIDWORKS</a><a href="mailto:peter@kolosei.com?subject=%D0%A3%D1%80%D0%BE%D0%BA%20%C2%AB%D0%9A%D1%80%D0%BE%D0%BD%D1%88%D1%82%D0%B5%D0%B9%D0%BD%C2%BB">Написать отзыв</a></div>';
  }
  $("stepcount").textContent = `${N} / ${N}`;
  if (staged) {
    $("skip").hidden = false;
    $("skip").textContent = "Начать заново";
    updateStats();
    persist();
  } else store.set(lessonId + ".idx", 0);
  $("frame").classList.add("result");
  loadFrame(L.final.shot, L.final.title || "Готовая деталь", updateViewer);
}

function restart() {
  if (staged && S.mode !== "watch") runs[S.mode] = blankRun();
  go(0);
}
if (staged) $("restart").onclick = restart;
$("back").onclick = () => go(S.done && staged ? S.idx : S.idx - 1);
$("skip").onclick = () => {
  if (!S.frameReady) return;
  if (S.done) { restart(); return; }
  if (staged && S.mode !== "watch") {
    if (L.steps[S.idx].kind !== "result") return;
    confirmCurrent();
  }
  next();
};
$("hint").onclick = () => {
  if (!S.frameReady) return;
  if (staged) { runs[S.mode].hints++; persist(); updateStats(); }
  else { S.hints++; $("s-hint").textContent = S.hints; }
  S.revealed = true; $("hot").hidden = false;
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
  if (staged) {
    const run = runs[S.mode];
    S.done = false;
    if (run) S.idx = run.cursor;
    if (run?.confirmed === N) { finish(); return; }
    render();
  } else if (S.done) go(0); else render();
});
document.querySelectorAll(".modes button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.mode === S.mode));
$("cursor").toggleAttribute("hidden", S.mode !== "watch");
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (!S.frameReady) return;
  if (e.key === "ArrowRight" && (!staged || S.mode === "watch" || S.idx < runs[S.mode].confirmed)) next();
  if (e.key === "ArrowLeft") go(S.idx - 1);
});
if (!staged) setInterval(() => { if (S.done) return; const s = Math.floor((Date.now() - S.t0) / 1000); $("s-time").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000);
if (staged && runs[S.mode]?.confirmed === N) finish();
else render();
