// ==========================================
// 1. DATOS Y BASE DE EJERCICIOS
// ==========================================
const EXERCISES = [
  {n:"Sentadillas", c:10, r:"{n} repeticiones", h:"Pies al ancho de hombros, bajá como si te sentaras y subí."},
  {n:"Abdominales", c:10, r:"{n} repeticiones", h:"Acostado, rodillas dobladas, subí el pecho hacia las rodillas."},
  {n:"Flexiones de brazos", c:8, r:"{n} repeticiones", h:"Podés apoyar las rodillas. Bajá el pecho al piso y empujá."},
  {n:"Fondos de tríceps en silla", c:10, r:"{n} repeticiones", h:"Manos en el borde de la silla, bajá el cuerpo doblando los codos."},
  {n:"Curl de bíceps con botella", c:12, r:"{n} por brazo", h:"Una botella con agua en cada mano, subila doblando el codo."},
  {n:"Zancadas", c:8, r:"{n} por pierna", h:"Un paso largo adelante, bajá la rodilla de atrás y volvé."},
  {n:"Plancha", c:30, r:"{n} segundos", h:"Apoyado en antebrazos y puntas de pie, cuerpo recto como una tabla."},
  {n:"Saltos de tijera", c:20, r:"{n} saltos", h:"Saltá abriendo piernas y brazos, volvé a juntarlos."},
  {n:"Rodillas al pecho", c:20, r:"{n} en total", h:"De pie, subí una rodilla y luego la otra, a ritmo rápido."},
  {n:"Elevación de talones", c:15, r:"{n} repeticiones", h:"De pie, subí en puntas de pie y bajá despacio."},
  {n:"Giros de cintura", c:10, r:"{n} por lado", h:"Manos en la cintura, dibujá círculos amplios con la cadera."},
  {n:"Círculos de brazos", c:10, r:"{n} hacia adelante y {n} hacia atrás", h:"Brazos estirados, círculos grandes."},
  {n:"Puente de glúteos", c:12, r:"{n} repeticiones", h:"Acostado, rodillas dobladas, subí la cadera y apretá."},
  {n:"Escaladores", c:20, r:"{n} en total", h:"En posición de flexión, llevá una rodilla al pecho y alterná."},
  {n:"Sentadilla de pared", c:30, r:"{n} segundos", h:"Espalda contra la pared, muslos paralelos al piso. Aguantá."},
  {n:"Elevación de hombros", c:15, r:"{n} repeticiones", h:"Subí los hombros hacia las orejas, sostené 1 segundo y soltá."},
  {n:"Patada de burro", c:10, r:"{n} por pierna", h:"En cuatro apoyos, subí una pierna doblada hacia el techo."},
  {n:"Estiramiento de espalda", c:30, r:"{n} segundos", h:"Entrelazá las manos, estirá los brazos al frente y redondeá la espalda."}
];

// ==========================================
// 2. VARIABLES GLOBALES Y ESTADO
// ==========================================
const $ = id => document.getElementById(id);
let minutes = 15, intervalS = 900;
let running = false, timer = null, lastEx = -1, shown = false, prevPos = 0;
let audio = null, url = null, wake = null, ctx = null, t0 = 0;
let silS = 900, ringS = 3.3, pvSrc = null;
let lvl = "mid", custom = [], theme = "";
let sel = "15";
const KEY = "pausa-activa-v1";

// ==========================================
// 3. UTILIDADES Y CONFIGURACIÓN DE TEMA
// ==========================================
const fmt = ms => {
  const s = Math.max(0, Math.ceil(ms/1000));
  const h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60;
  const p = n => String(n).padStart(2,"0");
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`;
};

function save(){
  try{ 
    localStorage.setItem(KEY, JSON.stringify({
      sel, 
      custom: $("custom").value, 
      hOn: $("hOn").checked, 
      hFrom: $("hFrom").value, 
      hTo: $("hTo").value, 
      lvl, 
      theme, 
      mine: custom
    })); 
  } catch(e){}
}

const optBtns = document.querySelectorAll(".opts button");
function setCustom(){
  const v = Math.floor(+$("custom").value);
  minutes = (v >= 1 && v <= 120) ? v : 0;
  $("time").textContent = minutes ? fmt(minutes*60000) : "--:--";
}

function selectOpt(val){
  sel = val;
  optBtns.forEach(x => x.setAttribute("aria-pressed", x.dataset.min === val));
  $("customRow").hidden = val !== "custom";
  if(val === "custom") setCustom();
  else { minutes = +val; $("time").textContent = fmt(minutes*60000); }
  save();
}

optBtns.forEach(b => b.onclick = () => { selectOpt(b.dataset.min); if(b.dataset.min === "custom") $("custom").focus(); });
$("custom").oninput = () => { setCustom(); save(); };

// Dificultad
const LEVELS = {easy:0.7, mid:1, hard:1.5};
const scaleN = c => { const n = c * LEVELS[lvl]; return Math.max(1, n >= 20 ? Math.round(n/5)*5 : Math.round(n)); };
const repsText = e => e.r.replace(/\{n\}/g, scaleN(e.c));
const lvlBtns = document.querySelectorAll(".seg button");

function selectLvl(v){
  lvl = LEVELS[v] ? v : "mid";
  lvlBtns.forEach(b => b.setAttribute("aria-pressed", b.dataset.lvl === lvl));
  renderCustom(); 
  save();
}
lvlBtns.forEach(b => b.onclick = () => selectLvl(b.dataset.lvl));

// Gestión de Temas
const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
const effTheme = () => theme || (mq && mq.matches ? "light" : "dark");
function applyTheme(){
  const t = effTheme();
  if(t === "light") {
    document.documentElement.dataset.theme = "light";
    $("themeStatus").textContent = "Oscuro 🌙";
  } else {
    document.documentElement.dataset.theme = "dark";
    $("themeStatus").textContent = "Claro ☀️";
  }
  const m = document.querySelector('meta[name="theme-color"]');
  if(m) m.content = t === "dark" ? "#101820" : "#F2F5F3";
}
$("toggleThemeMenuBtn").onclick = () => {
  theme = effTheme() === "dark" ? "light" : "dark";
  applyTheme();
  save();
};
if(mq && mq.addEventListener) mq.addEventListener("change", () => { if(!theme) applyTheme(); });

// ==========================================
// 4. GESTIÓN DE INSTALACIÓN PWA
// ==========================================
let deferred = null;
const standalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;

window.addEventListener("beforeinstallprompt", e => { 
  e.preventDefault(); 
  deferred = e; 
});

window.addEventListener("appinstalled", () => { 
  deferred = null; 
});

// Listener para el nuevo botón dentro de configuración
document.addEventListener("click", async e => {
  if (e.target && e.target.id === "installAndroidBtn") {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch(err){}
      deferred = null;
    } else {
      alert("Si ya tienes la app instalada o tu navegador no permite la instalación automática, recuerda que puedes usar la opción 'Agregar a pantalla de inicio' desde el menú del navegador.");
    }
  }
});

// ==========================================
// 5. MIS EJERCICIOS & COMPARTIR POR LINK
// ==========================================
const pool = () => EXERCISES.concat(custom);

function renderCustom(){
  const ul = $("cList"); ul.textContent = "";
  custom.forEach((e, i) => {
    const li = document.createElement("li"), t = document.createElement("span"), b = document.createElement("button");
    t.textContent = e.n + " · " + repsText(e);
    b.className = "mini"; b.textContent = "Quitar"; b.setAttribute("aria-label", "Quitar " + e.n);
    b.onclick = () => { custom.splice(i, 1); renderCustom(); save(); };
    li.appendChild(t); li.appendChild(b); ul.appendChild(li);
  });
  $("cEmpty").hidden = custom.length > 0;
  $("cShare").hidden = custom.length === 0;
}

$("cAdd").onclick = () => {
  const n = $("cName").value.trim().slice(0, 40), c = Math.floor(+$("cQty").value);
  const u = ($("cUnit").value.trim() || "repeticiones").slice(0, 30).replace(/[{}]/g, "");
  const h = $("cHow").value.trim().slice(0, 120);
  if(!n || !(c >= 1 && c <= 500)){ (n ? $("cQty") : $("cName")).focus(); return; }
  if(custom.length >= 30) return;
  custom.push({n, c, r: "{n} " + u, h});
  ["cName", "cQty", "cHow"].forEach(id => $(id).value = "");
  renderCustom(); save();
};

const b64e = o => btoa(String.fromCharCode.apply(null, new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = t => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(t.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))));
function shareMsg(t){ $("shareMsg").textContent = t; $("shareMsg").hidden = false; }

$("cShare").onclick = async () => {
  if(!custom.length) return;
  const url = location.href.split("#")[0] + "#ej=" + b64e(custom.map(e => [e.n, e.c, e.r.replace(/^\{n\}\s*/, ""), e.h]));
  $("shareLink").hidden = true;
  try{ if(navigator.share){ await navigator.share({title:"Move!", text:"Mis ejercicios para Move!", url}); return; } }
  catch(e){ if(e && e.name === "AbortError") return; }
  try{ await navigator.clipboard.writeText(url); shareMsg("Link copiado."); return; }catch(e){}
  $("shareLink").hidden = false; $("shareLink").value = url; $("shareLink").select();
  shareMsg("Copiá este link y envialo.");
};

const cleanItem = x => Array.isArray(x) ? {
  n: String(x[0] || "").trim().slice(0, 40), c: Math.floor(+x[1]),
  u: (String(x[2] || "").trim() || "repeticiones").slice(0, 30).replace(/[{}]/g, ""),
  h: String(x[3] || "").trim().slice(0, 120)
} : null;

let rows = [];
function checkImport(){
  if(location.hash.indexOf("#ej=") !== 0) return;
  let list = [];
  try{ list = b64d(location.hash.slice(4)); }catch(e){}
  try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
  list = (Array.isArray(list) ? list : []).slice(0, 30).map(cleanItem).filter(x => x && x.n && x.c >= 1 && x.c <= 500);
  const box = $("impList"); box.textContent = ""; rows = [];
  $("imp").hidden = false; $("impOk").hidden = !list.length; $("impNo").textContent = "Cancelar";
  if(!list.length){ $("impTitle").textContent = "Ese link no trae ejercicios válidos."; $("impNo").textContent = "Cerrar"; return; }
  $("impTitle").textContent = "Te compartieron " + list.length + (list.length === 1 ? " ejercicio" : " ejercicios") + ".";
  list.forEach(x => {
    const lb = document.createElement("label"), cb = document.createElement("input"), sp = document.createElement("span");
    cb.type = "checkbox"; cb.checked = true; sp.textContent = x.n + " · " + x.c + " " + x.u;
    lb.appendChild(cb); lb.appendChild(sp); box.appendChild(lb); rows.push({cb, x});
  });
  if(window.scrollTo) window.scrollTo(0, 0);
}

$("impNo").onclick = () => { $("imp").hidden = true; };
$("impOk").onclick = () => {
  const known = new Set(pool().map(e => e.n.toLowerCase()));
  let added = 0;
  rows.forEach(({cb, x}) => {
    if(!cb.checked || custom.length >= 30 || known.has(x.n.toLowerCase())) return;
    custom.push({n:x.n, c:x.c, r:"{n} " + x.u, h:x.h}); known.add(x.n.toLowerCase()); added++;
  });
  renderCustom(); save();
  $("impList").textContent = ""; $("impOk").hidden = true; $("impNo").textContent = "Cerrar";
  $("impTitle").textContent = added ? "Se agregaron " + added + " ejercicios." : "No se agregó ninguno.";
};

// ==========================================
// 6. ENLACES Y NAVEGACIÓN DE PANTALLAS
// ==========================================
const MUSIC = {
  spotify: "https://open.spotify.com/playlist/0Mkx8ts6zgaIWOmQQJzndr",
  ytm: "https://music.youtube.com/search?q=workout+playlist"
};
$("mSp").href = MUSIC.spotify; $("mYt").href = MUSIC.ytm;

$("mineBtn").onclick = () => { $("mineView").hidden = false; };
$("mineClose").onclick = () => { $("mineView").hidden = true; };

$("settingsBtn").onclick = () => { $("settingsView").hidden = false; };
$("settingsClose").onclick = () => { $("settingsView").hidden = true; };

$("guideMenuBtn").onclick = () => { 
  $("settingsView").hidden = true; 
  $("guide").hidden = false; 
};
$("guideClose").onclick = () => { $("guide").hidden = true; };

// Restriction Horaria
const toMin = v => { const [h, m] = (v || "").split(":").map(Number); return (isNaN(h) || isNaN(m)) ? null : h*60 + m; };
function isActive(d){
  if(!$("hOn").checked) return true;
  const a = toMin($("hFrom").value), b = toMin($("hTo").value);
  if(a === null || b === null || a === b) return true;
  const m = d.getHours()*60 + d.getMinutes();
  return a < b ? (m >= a && m < b) : (m >= a || m < b);
}
$("hOn").onchange = () => { $("hRow").hidden = !$("hOn").checked; save(); };
$("hFrom").onchange = $("hTo").onchange = save;

function load(){
  let d = {};
  try{ d = JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){}
  if(d.custom) $("custom").value = d.custom;
  if(d.hFrom) $("hFrom").value = d.hFrom;
  if(d.hTo) $("hTo").value = d.hTo;
  $("hOn").checked = !!d.hOn; $("hRow").hidden = !d.hOn;
  theme = (d.theme === "light" || d.theme === "dark") ? d.theme : "";
  if(Array.isArray(d.mine)) custom = d.mine
    .filter(e => e && typeof e.n === "string" && Number.isFinite(e.c) && typeof e.r === "string").slice(0, 30)
    .map(e => ({n:e.n.slice(0,40), c:e.c, r:e.r.slice(0,40), h:typeof e.h === "string" ? e.h.slice(0,120) : ""}));
  applyTheme(); renderCustom(); selectLvl(d.lvl);
  selectOpt(["15","30","60","90","custom"].includes(d.sel) ? d.sel : "15");
}

function lockOptions(v){
  document.querySelectorAll(".opts button,#custom").forEach(b => b.disabled = v);
}

// ==========================================
// 7. SINTESIS DE AUDIO EN SEGUNDO PLANO
// ==========================================
const B64 = {
  gong:"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",
  sil:"//NAxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEWwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV=="
};
const FRAME_S = 576/22050, UNIT_FRAMES = 40;
const toBytes = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
const GONG = toBytes(B64.gong), SIL = toBytes(B64.sil);
const frameLen = (u, i) => 104 + ((u[i+2] >> 1) & 1);
function countFrames(u){ let i = 0, n = 0; while(i + 3 < u.length){ i += frameLen(u, i); n++; } return n; }
function framesBytes(u, n){ let i = 0; for(let k=0;k<n;k++) i += frameLen(u, i); return i; }

function buildAudio(intervalS){
  const total = Math.round(intervalS / FRAME_S);
  const full = Math.floor(total / UNIT_FRAMES), rem = total % UNIT_FRAMES;
  const parts = [];
  for(let k=0;k<full;k++) parts.push(SIL);
  if(rem) parts.push(SIL.subarray(0, framesBytes(SIL, rem)));
  parts.push(GONG);
  return {blob: new Blob(parts, {type:"audio/mpeg"}), silS: total * FRAME_S, ringS: countFrames(GONG) * FRAME_S};
}

function ensureCtx(){
  try{
    ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.state === "suspended") ctx.resume();
  }catch(e){}
  return ctx;
}
let decoded = null;
function stopPreview(){ try{ if(pvSrc){ pvSrc.stop(); pvSrc = null; } }catch(e){} }
async function playAlarm(){
  if(!ensureCtx()) return;
  try{
    if(!decoded) decoded = await ctx.decodeAudioData(GONG.slice().buffer);
    stopPreview();
    const src = ctx.createBufferSource();
    src.buffer = decoded; src.connect(ctx.destination); src.start();
    pvSrc = src; src.onended = () => { if(pvSrc === src) pvSrc = null; };
  }catch(e){}
}

async function keepAwake(){ try{ if(navigator.wakeLock) wake = await navigator.wakeLock.request("screen"); }catch(e){} }
function releaseAwake(){ try{ if(wake){ wake.release(); wake = null; } }catch(e){} }

document.addEventListener("visibilitychange", () => {
  if(!running) return;
  if(document.visibilityState === "visible"){ keepAwake(); if(audio && audio.paused) audio.play().catch(()=>{}); }
});

// ==========================================
// 8. BUCLE PRINCIPAL Y TEMPORIZADOR
// ==========================================
function showExercise(){
  const P = pool();
  let i; do{ i = Math.floor(Math.random()*P.length); }while(i===lastEx && P.length>1);
  lastEx = i;
  const e = P[i], view = {n:e.n, r:repsText(e), h:e.h || ""};
  $("reps").textContent = view.r; $("name").textContent = view.n; $("how").textContent = view.h;
  $("idle").hidden = true; $("ex").hidden = false;
  $("card").classList.add("on");
  return view;
}
$("other").onclick = () => showExercise();

function healthy(){ return !!audio && !audio.error && !audio.paused && audio.currentTime > 0; }
function position(){
  return healthy() ? audio.currentTime : ((Date.now() - t0) / 1000) % (silS + ringS);
}

async function notify(e){
  try{
    if(!document.hidden || !("Notification" in window) || Notification.permission !== "granted") return;
    const o = {body: e.r + (e.h ? " · " + e.h : ""), tag:"pausa", renotify:true, vibrate:[300,150,300], icon:"icon-192.png"};
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if(reg) reg.showNotification(e.n, o); else new Notification(e.n, o);
  }catch(_){}
}

let quiet = false;
function tick(){
  if(!running) return;
  const pos = position();
  if(pos < prevPos - 1) shown = false;
  prevPos = pos;
  const ok = healthy();
  if(pos < silS){
    const left = (silS - pos) * 1000;
    const will = isActive(new Date(Date.now() + left));
    if(audio) audio.muted = !will;
    $("time").textContent = fmt(left);
    $("fill").style.width = (pos/silS*100) + "%";
    $("card").classList.remove("ring");
    $("status").textContent = !will ? "Fuera de horario: no sonará."
      : (ok || Date.now() - t0 < 2500)
        ? "Contando… podés bloquear el celular."
        : "Aviso: el audio de fondo no arrancó.";
    document.title = fmt(left) + " · Move!";
  } else {
    if(!shown){
      shown = true; quiet = !isActive(new Date());
      if(!quiet){
        const ex = showExercise(); notify(ex);
        if(!ok) playAlarm();
        if(navigator.vibrate) navigator.vibrate([300,150,300,150,300]);
      }
    }
    $("time").textContent = "00:00"; $("fill").style.width = "100%";
    if(quiet){
      $("card").classList.remove("ring");
      $("status").textContent = "Fuera de horario.";
      document.title = "Move!";
    } else {
      $("card").classList.add("ring");
      $("status").textContent = "¡Es hora! Hacé el ejercicio.";
      document.title = "¡Movete! · Move!";
    }
  }
}

function begin(sec){
  if(!(minutes >= 1)){ $("custom").focus(); return; }
  intervalS = minutes*60;
  try{ if("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }catch(e){}
  ensureCtx();
  try{
    stopPreview();
    const built = buildAudio(intervalS);
    silS = built.silS; ringS = built.ringS;
    url = URL.createObjectURL(built.blob);
    audio = new Audio(url); audio.loop = true;
    const pr = audio.play(); if(pr && pr.catch) pr.catch(() => {});
  }catch(e){ audio = null; }
  if("mediaSession" in navigator){
    try{
      navigator.mediaSession.metadata = new MediaMetadata({title:"Move!", artist:"Alarma cada " + (minutes + " min")});
      navigator.mediaSession.setActionHandler("pause", stopAll);
      navigator.mediaSession.setActionHandler("stop", stopAll);
    }catch(e){}
  }
  running = true; shown = false; prevPos = 0; t0 = Date.now();
  keepAwake(); lockOptions(true);
  $("go").hidden = true; $("stop").hidden = false;
  clearInterval(timer); timer = setInterval(tick, 250); tick();
}

function stopAll(){
  running = false; clearInterval(timer); releaseAwake();
  if(audio){ audio.pause(); audio.removeAttribute("src"); audio.load(); audio = null; }
  if(url){ URL.revokeObjectURL(url); url = null; }
  if("mediaSession" in navigator){ try{ navigator.mediaSession.setActionHandler("pause", null); navigator.mediaSession.setActionHandler("stop", null); navigator.mediaSession.metadata = null; }catch(e){} }
  if(navigator.vibrate) navigator.vibrate(0);
  lockOptions(false);
  $("time").textContent = fmt(minutes*60000); $("fill").style.width = "0";
  $("status").textContent = "";
  $("card").classList.remove("ring","on");
  $("ex").hidden = true; $("idle").hidden = false;
  $("go").hidden = false; $("stop").hidden = true;
  document.title = "Move!";
}

// ==========================================
// 9. INICIALIZACIÓN
// ==========================================
if("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

load();
checkImport();
if(window.addEventListener) window.addEventListener("hashchange", checkImport);
$("go").onclick = () => begin();
$("stop").onclick = stopAll;
