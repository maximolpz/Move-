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
if ($("installMenuBtn")) {
  $("installMenuBtn").onclick = () => { $("installView").hidden = false; };
}
if ($("installClose")) {
  $("installClose").onclick = () => { $("installView").hidden = true; };
}

let deferred = null;
window.addEventListener("beforeinstallprompt", e => { 
  e.preventDefault(); 
  deferred = e; 
});

window.addEventListener("appinstalled", () => { 
  deferred = null; 
});

const androidBtn = $("installAndroidBtn");
if (androidBtn) {
  androidBtn.onclick = async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch(err){}
      deferred = null;
    } else {
      alert("Si ya tienes la app instalada o tu navegador no permite la instalación automática, recuerda que puedes usar la opción 'Agregar a pantalla de inicio' desde el menú del navegador.");
    }
  };
}

// ==========================================
// 5. MIS EJERCICIOS & COMPARTIR POR LINK
// ==========================================
const pool = () => EXERCISES.concat(custom);

function renderCustom(){
  const ul = $("cList"); if(!ul) return;
  ul.textContent = "";
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

// Restricción Horaria
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
  selectOpt(["15","30","60","custom"].includes(d.sel) ? d.sel : "15");
}

function lockOptions(v){
  document.querySelectorAll(".opts button,#custom").forEach(b => b.disabled = v);
}

// ==========================================
// 7. SINTESIS DE AUDIO EN SEGUNDO PLANO
// ==========================================
const B64 = {
  gong:"//NAxAARSxlUABJFoCuxyKjf/b7O7HT2Y6KjOznJnIphhByL/+7Mv7vzUOkQ6JxOgXq6juYf+7ORU2Z2cioV3If//////////1QphAJ1EzBrAiogaHxdA4KLqA4Hfzk3oRuIgOCGkyj/80LEFRa7VbShRTgBYYz44Qox6ccZRHB+T/nug4D8uw+44QVHz3Y5kEQHDGGnox/oOMg0fqNzzjHzJ5/oYZRv///+eyGUb+6N//5iv/jhD44IL/7mKRr/vNhb9SCMl5BTwqLQi43QwcD/80DEFhkL2hgBiTgAdBXyDHqSCERAW/PkxxigyEQvCX+QPcmhhgQjAlDYkOv/7qfmWGpQdHjxspYa//z3fb+YXOdj2//////+qsk5XUw1H///7pZX//5zmqaPKhDCBCLAEs7b/JgbfP/zQsQMEqIB8Y/GOADM+ccBJa2+tQLBo7+ztQ47oIpb+7TCXQVmbKax3O/ZyVKP1arelvzXX82cXGnfs6iGysa7w0SrOlj2wr/goZpA8B5Jv3VmAAxYeb+6ySmHktv6d0CUPzfj+HInf//zQMQdF9NptKRaS0T3OIgSFTV57y1ULJYmjVIjoZUdKGdql+VDgCQpWN1Lt6Gv6GV/0Eg6AIAh1jf//6es1ClLQ2X6Gf//zf//EgCAIOlqVpWa+JWQypVM2rpSqYkSLUh8qBTkCNlU//NCxBgWSXCtkHpYlBEoTS6yahKsKj5LK6uPIUIIqJsTXUJsBsWsvSn1ovBqJK09qmwBQfMhyLToejtYcsJy8PJCIRBIAnj6zCJILHAn1Tc+c7oBi31O5AMDFuQIAEoWcCAAigAgnc////NAxBoXst2AC0IYAXdz/93d//d38nAAAqHA3f/rhwN4Biz/c93////iFUQv/0ROhwMDO6ITgYGbwIAABOHFiE3Du7um4cDAwN93P4m4AIKOPfwgWyX6YWRV+IGInfhwJQ/YeTXh2JD/80LEFhlCshgBhkABIHUW/w4JEcO4Yav/lB4QaH9DGZf/8Q2DwYaLk8xbO///5woUOFyR4o0/dxUJ//9/5guaeQcKHjj0PFGu5r/////9P/c14HmJRy3/5tXJpr+BhKEhjQNRr9egCYz/80DEDRcRPnQBnZAAz6YgAQiuYDAOYVCvzyybQyAFDBACHw+cWWQcBmwveJVyIE4aCxjYP+V05o5Ol01/oIIGyzKj/W96Fj4LA38CaHTLxF+npzqAps//L/ZvQtUJZu3bffUcQUI2YP/zQsQLFtEqyb/YGAL+tOT8MAytaW0Oz9JUys/eu65vmPKu+inEUd0Ok8oLd2aJudI0Bu/NCc5/vVCJB0yFBeadYWGvBsAQgPFRUH3qpfTWzbs/1//+GB4ILfFThtUFyXba7AAUq91isP/zQMQLFAkixR7CRm9FDWGkX0+nohp7L0VnSKY49LjJMU1mG0NEcWZlu7YmBR6TgidQYWjnG/PL6Le5PW5q33a+ydpPng1PIAL1Zt3br/33Fv6qAGc3233wAEEZKaXBMxviQJnG0GRL//NCxBUUUTrVvnpMPjcGNQMdPV12DxGiuhIWG3EB1iCSDbe/tT2/93bM3d6767ni06uchQNGUNxOJweNBUKNaLDQfB8/zu2/WupBdy3f//gAdKmM1j3GccPkDR7xxouPGgODDDJMCeM8//NAxB8TUXLdvnpGTzBjwMKpFZxvZgOTPUQej4ZEuGhrecBhQpHEPspFwVjBihN//suCwi/359JsX7cqBctstokE0QIQc5ZDOPZMuS7lYTKKUSBAtQOaUQ2BIaKFVB2B6BkBHlG0gXb/80LELBQJerx+ywZOMjhm4Nw52R5Mla/03czz/Ld9q4dqVsjaa1cu/WTRf//3f//0VQXJJJZKB4qMLEOQOQjyYiGYI+8LhyE2YMZqoBQ+Ns/WBlT01QAHCwVx+UdGCYllxxINQhVetBj/80DENxQYwrx+ykaGIq0xSPKAxU6gALS5tjumtqav/kTA7uFtgspIEuX////8Sj7Dl5ZiXEYOhfWYf9BvQu0J3GNJHrow935hidf19NfNhzSvvKNFiykDEoQoPLJ0UmpMlij07bETav/zQsRBFGDW3b56TEo3LtDqXszTO39UStu3UvkO6gV2pdv/9wBtO+MVmejTlCmv0M5Al3CSswmZIvxfcxneSHc2eRw31zsav76a6sqjQrMuaNBU6ambHoHUNMOqJZQ8lZFBtFYS2/1/UP/zQMRLFBku2b7CRsqrHGc4knUEGW27bYAW0GUSmcovj9meL+ksad394JWnj4UitnpfVe28XDwqIko8gzpcXiSzOZWFFfpTy/drIc/dqJp7Jr6DEOmq79suMRdbRsXUu4nLKgQXttt9//NCxFUTyZbJHsMKjrgVk9HHlTGys7kRS6scucJ1A8FHx8DT1ElipWCO/GBYalQ0Dpg6KtDi2DKlbizanbGNpASo9hB7GHPds/Z1P8HP+xlQmgU7bbbcBQDrCARv0nRtY/hmr6nUM+di//NAxGEScJrVHsLMRuDBKaEASnSMOpqJ+8VaaMftH8uGTsvFHSbRKraxq5xyZdrO1NLF2Nb/fH8o52uNTxA7UNUEVPIC9QC7bbdbRitZIGcUVKbRVPiUvK+Vyb9FegDqLN7ULX0+vBD/80LEchPYlsR+y9IqRLQWf6iazS1OYUIXWjbTlb6LjxlbB1K7akPDkciKAgGBxQeKe747sUyhd39XQoUXN////xMjr2u42UoxSC6ZC6fXANMwOCM1cf016w/4QFA/Bi//KQw2E5GIHer/80DEfhPotsR+wkqK504bGEaVJOk0g3C4cDQTeSc8qWO1qSkB9wSEb6m6z4F2OrF3xXQC9vuRL9heANxt/4OgqZJKKaJigLCSABKOlxJMXQ6MARMMAA3MQhPMeAFFg8HQBEgwNSgpCP/zQsSJFrEe2R7CRjok54AomZSxuDF+lptkQEFzYeDVYhfYm6BdpYIExBANZ/nyYobusf7u98NZHrrxEOQXZujra97lww43Li41T72CZkCrQe5wWYppZbdYuy7UpTUElKIMPma3aNLyRf/zQMSKIvlGfFzuVoxO1b+BIEGSzfG0YXmKQjGH5jH75tHM7BzcSYKKnJV5xRQKDCTpkt8djMkyEZISHLh5oIIZ4LgYsDgwRfAL3DMahClSt/0rQU1ewwkuerqHXHtf///1s7WqXdyu//NCxFkhqNJwCu7wMGzIdgMk1I1YPDGuiwOSw4xKGjUtoeBErKtirDIo0uwrs1N6mkw5luOf81hUt0IAC3a7bUEAIFfIxYeMDAzFEAn9zFCE0sMGQUZTQGqwMpbqdKTwBYEMWEUIkUzn//NAxC4eQRqQft5QVDV0OgSSTqf7KI5DL8LCAsD0y69Imy0G04/H1aQP8ZJl1+jHqHIcIXB1WssdawarjyJcnEoQe9MiodcI5bRJk5lgwVd6yDtd52V17QXdttttheZMq2bWwGbSNln/80LEEBf41sh+wl5yEF2zGrLs8PmCSvg4GUmMgGnGyAGxYDoYENvO5rDyKhzA/hQcQdR5AjFiEMKalwMk5lcVbeG7xb1EBHbORzKorSqvodqANQA9dKNm8BrY2tUwBXbf/7ATIyViNxj/80DEDBZhJtEewwR2Ui0oDIZIvu7S6hv8dKfu5d97OihU3s4OILjNYGb+6HDyAZqSSIxZrvuvuZBJAi4iOAgfEQmsSw2Ku7zgVjjoSQecGiwdg2RZt0f/k76VRnJUu///4FURJSCpGP/zQsQNFElC2b7DCjLC3hQsHgHQOOyKxkRyA4hlF/hQEpmLcIBR2Dh7GNtZnMYjmdh7OHGkSSijNkLqIT4yg2K1qGqv0j1buO9tlH/c39H3i6oEBvbbfbgZJoL/2nYTGAGQYCuv2qUfOP/zQMQXFBi60R7DDC7k2LWU9X0INRujh0dkd//2AJYTSNEoo4yQAsnii4gC5Q3ACKoarecOAKaO/pUn+34sUuZVyw4ANJW1CALlt2twEcIYHgdMlINEVHJT9lqUNxHi8lhTCQUKRRww//NCxCEWuarBHsmKkoOQTIRyKhO89Kn1qgdU2E8g2jTUVDak9HZKq211o65nQoqzN0iAmOov9N9Tvos1q2PEsJguHH86/CoED7bbKAKIt8RYhwVcPKBRFnPirat+kusyRLf661ZgcXrW//NAxCIUsPK4/sGE5lw3/kt6mp3XJgllLaUT5mspkLdvhBAJzgXDD40FaXLrcTiPSugcOf/9VjFSBk+praIAYhS777jcQQO6EtxAC6QX7Cj59yNx+XIeSUdRd1WGJ7saYjomCCh7FeH/80LEKhWBEtW+ewqushMSJqJEl+gjDTGI4hBZWmi0TicWEciUpTxwoiPeAzFKjzv//bZ9v0p4tesEAu7b7YAVRQrfW1UHdU2mMqK/eyuKemZ2KhQTjGCDK/3v7YKYGS5Ma4mCAR8lnnX/80DEMBVxas0ewsS2ST2pmjVnszhlOx+U7M3Sqyt2s4VQILNiH2I1Ptse61x16tSHCy4EAqbb/7AWCACjZSfKclglMgnHykKeKFRU5qaJFX3tXKyEfjkv4s1oj/Bmqzr/yNMn7Ms8k//zQsQ1FIli0R56RlrezuDwwPhAABJjTKU3PaBYGFkEr1InNutXdb/2dFVEqbbbYAVCWDeYNzTQWj6wISpXYvoVy6bIY+oiYAKcpOmtoeVDw/Shz2+d9JmbqEKOxnJBgkBkjnSKBa1++f/zQMQ+FDj6zH7DBD4GCqN0Srfeq5WqNm1qWzSwHHYuA+W20ACWiwgxjABg8BkC1TZ4bM01zMjlWIDM7OI7Vhmjj1I5dMM+c++0OHIZasVbi3RXB6xqM4I5osBjwdDTyUSWCMm0uzXs//NCxEgUSKa4XsZeBs8IlPyJVVUXCFUIAH9/vsAIIHcuNiNgtTMNZwSzlD0vi1zG3F45BCyt4bmdx0MoJCRntv67K9WKyGPCj3EnAiGgGeBgG0Kun6XsjzwVUFgQFfqtcrbclfo2qgAp//NAxFITyPbVnnpEkm22gAUIWqmcz0ZqUoMR1a3THgwaeCcgkJSwHCZ7m6uY5jdxiFzRjhkLmllXBhyeLWqTF6FkS7TgutwQWHA+shSGTLqIAkieAzBQL+Ab1voBO7f//gWGAbdA1yH/80LEXRQg2rx+w9BSBdVRljl3tsEqwtiRtuR49DZq4vkigSMaka91wr0nFtBJ9TKnLHiQIni63k4CpS8q9LHHWiVFKHRbNWpCCThx/syau9bOVNIqABkttoAEEDNiXLpEOJEQ1lmMGJr/80DEaBTQtth+ekSSFJVpCUIBhqJOmOcZrqaGJmS9sbdyU16JCz+UvpJ16AEO1HoY6nPXBqBQCIxEsuciaUMRZ1N7mMn1PDBQpqIKpkUiUrf//+BMV4PzgkVStEss1o+mNmFzySxnTf/zQsRvFPDauH7LzI7IEEBxg9/BaAqEkfmXjvilK0Ga5DvzVbItCM5jtCui6t6iDOt8o4VrOEjymCXF499rMTFD6HrzdOpdHWnQmgAZNttsBKSF7KaEkupFrzk6cKLz+ckRRdIbo0Pucf/zQMR3FiFq2b56RK4NK1y1CrDQnoGtu0g1NC7GM+qckYwtEYaAgEzVojCxlL4JAux7xMZy4FQUDRrql1qXdatSJ2e7GtPqsLvbAOW20ACyDG0znpIdUzUUChuGUoGvzlR9yapoBhZB//NCxHkWuQrIfsMKinKjrQLBowYBmhc3hYIKH8udvftCV7WIMV/UsER3IpCzM7sR0vqfSyTyIzxB2KPShxG+tE254ooEAqX7//YYGAPJsBJnaoFXtpcLZXI6KGnM5hskQUstpW8TZ2Ob//NAxHoVQZa4XssGkuc+a7LrI9ZGWYHVgaKEGQOVg8GgmeVcGQfJOGnidNqlZdWxhpRJgDKYfTS5TWb/0egAGXffbAVCU0Zl5UWruAmhTTkXqLOow3CBJN9THiJOz2P1k/z96f+8z8//80LEgBWBGtUeeYSuhCFHICLL8ODw67uUM4cIaSDL6RZ1L0nHgRwAMSa2No+pF9lwF3Cou35p+hUB7tttqLzBlIR8qxUusMserCQ5XslRLmnnR5HESgSdNDrVZZgoW2Z+5efs34yJk0v/80DEhhVRQsx+wkaSb9oMHoDLA6ksFA8CpnnGl1vRQNkbkxHW+8ypHu3cvdAkQVu0mDmtdvqVCIKu3///FRO22gUFLVMVcKZylcshI0ORJnLHjnZOx76RSIaW+QyU/xC+M01joz9ic//zQsSLFlD2yF7CTIpf4h4JAuqJTRA0qNfqDTpU+6xZXkiHe7ZYLRX3i/epQ76VdjVwqoAC7f//9hwUG89RR133mq0BKltJT6KQOTdAMGMm1mVTw+nBWe2jHP/HzYG87C/CRCy3cutGhf/zQMSNFaki2R55hH4RsHR9kkZPIYeMv3Z+O72S+botV7pRDv3f/6IAuX///gYL4Sac2THAV3kbqdA5hZ5V1LmbbVXLY3lVoby24qfopchnkURj7YGhlKSNkFnW+o3ycacF/r0zJ4n3//NCxJEUMUbZHsJGXvIGA9Q2gXZbUSUoOsaJJxfuiou4WKQ3NI83CIKu////Egd0FvUqOAhuzDE9GgTomcSizOKKVCK957OFrth/8uHHcXuUYcjNAeeCs8FQiVEJtw5UwWRWfUlm33XE//NAxJwWebrYfnsGPtJWxlGj31K0++r/GsjlAe3bbUDQtwgDg3hNjTUTGT1L1rjk2YrQuijkZEK3aQsHN04qlHWnXBHvx8s+sdCC4fFFvS3WeXFhzp4qS6BiGRVG8ut5VQ1BxK/Ffbr/80DEnRPg/t0eekY+jX/9CgCctlAAfULypqpvUwGeDB4y3Vn0Qu0NGNC4p6VmvscZvSKVKOVJqQAgxI2zwlOiC7xGNK7XCje57cpjMZVheXRlFmQSW0AOPPqq35Km3aCrz6lrLRAP3//zQsSoFBjWyF57Ek7//wMkxVd2BFC1Y2JN2pTi/CHhTi/VrM79ldFBWQFkYlP0Y5zJuUjKV3i5ugGhdQbANLkHyFTB56VdWBRTouYjQ+76qN73ilXoBACl22/wFB8FiqXQ3CfkMXJOYP/zQMSzFPkutF7JhubugmghCTnon6QFotUu9ynPmECSQQpwqr90UgAefrBLEHKRjSDQopL6VIe/re0VfehyEKEZeLQKucqiDb6fW7SqAKl3///GA1rvSZHeOplqjc+SATWIy8DpOswO//NCxLoTAQ7c/nsKNtTgECTFYG4LGyCL6qeY0NSz+SOIIi8ZQJQoAGwSPEXtdxNtiDIKiEAifK6jQS8+qMJtTWiHUFPrfvFTm5gyABl2/2AFDSIY3D2wHIfa+9VlsMQP96BUIayLy2Ls//NAxMoUiP7RHnsGVoFMDbf2tDYhjONmQ0/+U3vHGgRDVAo0kDikR4mUOeRNhseKmhJDqyqdmKf2N82w8yhCIAq7///gPQZaw+XBOCaz0HA5OamAcVBaRLUsQDlY3GQdBQBTcig3qAP/80LE0hYxAth+ekaKDf/CeCImBWTEYehBxAYJ2mm5gKWIyIDbMrVnAwG9w9Aoln5tEoy1Y//vABtu22wFUYOw9607CLgaZauRKa0hmAEdZDAiK7UZ8rx55womCwYiSy7IO9QYiRCLw4H/80DE1RPA/tB+ewaO88UUN0usuuZa5trrQbbgGEDhwmcWP5yPGBsIigdoHKMEmweuo9nohYsTrLpqdJBQAIoA5bbQALhcxAdByCIBQqvWg/j/NtDepWTjpcgUo95Xb0wBGG9SoxxHF//zQsThFQDm3b56Rm40sJTvsfbCZ/EAtskiZLurr6ei9zxpMTAQZEiBW2lShdyJaQ7ax0NKLufoBAJv232+EgD9HakkQxZOmyGwqWO0BwcU4/ox02vqNvo4uTIo9AlnpcSGzmklIeqJHv/zQMTpGOEuxH7D0DYFBnhCRxQJzNpXzFFm1MO9hNhKMBx5CWh5q7v3JX/+tTniNJJ7jLlHTvV91YAArv///xEIUHmkEpG5g0o5N5bBDYCvBhtmMiibV3SWYkxdxP5ro+hC0z9ThW1x//NCxOAVAQq8XsvQikFmeGfJVqDKJCEsW4VMBJBcdcBltVS+iYTWW7TDbzHqZdnLvn+zlSp/SiQApd/9/xBCXoxjPcFqHEOm7yJmj8EUqzRSizDmh0PqyemrubWLr6akwrelJpyiLHUY//NAxOgXGTrRHnmE7vnG+Sdf+q1OggBkf/y6J088+sxe8qvVXqNLGl6aZzdDkWTDh4Opkpc6Djod0H28hUccq4cDdtUAGXb/bAZCEmXBMMCjAPOGp8RsQQrGExZO2nCYRdHtsxurMdn/80LE5hYpQtkeekSW/8f8WswVcDu+1VCC5Hj/OlGPFqfWIh4aPCpAUEr4SPuMh+6m++cfZoGsQn7/1re2hQuSSQAWgIMGFKKFg08AEJKa00yp9mnWFtDrMqe+LpoT7rw2qEvjQUDmecT/80DE6RoJxtEeelCuEQ+jSh2ZxyKNx4qp8ZaSfm5CgaAigQPKFgGxlutkK3JboPs/HOu9Rt36lUHm22twuFhUa9VMiK3edwazB8rqS8Idbhhz17sVadDBRD5ppmYW4rsm/TijVD1sef/zQsTbFSE60H56RpKquTOIn6QogVSUG6p0SJConOHmFWj0B84BNofWgX3VhZy3DtSpH/Whv6Kv0iZTmkhqACl222GGjKIavjRPEsZ0Nhrvo2HoTHHIuFLN9WFnFKOkw6wwuyHlOPhudP/zQMTiFVD2sD7LBuYhRYVbf8HWo/uUAXQcEkaf3NpnRTWpW7Sm9f9zUv///TmV1QArf9/thBBloywS8rSxjViLH7+QA7kowDQuRMGZt32gv1orN7bqamLPSsZMF/4MCgo756CjcgeJ//NCxOcYKTLEXsMEztnLgwzqRW+eRf050801Le14e10wYlGHlGjo1sqDNkw1r98Vep8U7H0bb1sfQqAA7f///xsUGvekUdbw9EXTNh6dD6xggHaz60QJrr/9I9GBgtpCeexgolLQ5e5d//NAxOITSQLMfnsEkudvyg51ZGPEx3dOP+WW5tAYCBQgkkQS1R4DCrjWl6XD6/Y4azyPITfriq3NI23RUXnqgACl22/4EgQAeUIU0bRW7ayUfjVEnEQ6MrMrFwb37k77EUKOTtm12Fn/80LE7xkp0sx+ewZePd2uvZFbSdkOhoCOcsKLrR/0V4p0FVmxzTjS4sIRdS9/wrQG5CxpaoUqABk2/34EgO5XJMaaGNhWhnp/e9B19CdhMnmSkTOvlAsrjsinSRmgkOf0xWX+x5A0Hwz/80DE5hghRtUewww2SGoVWTxRJ2CoKnEKFhCAioXPghS2vt0viRwbWNiyAsbZixefbUIFCyhaAuW7bYCIOINFZBIn8Vwdq+Lxe5RMxqtWcPQvE0NZSRQp8l6j63lT2Tc9u80hfNAJ5v/zQsTgFMDO0R560kZuFYclmn/ofIhbTsrkM2lryOrdZS1ZO0OiBky8RqIMWW1pWXcjcUXsRlBA9BY2igCQP2///AqQNkbjZWlbijRfwlIJSpfUs7lYHO732+yYN/VtLKWr3vghhzDAGf/zQMTpFvEKzH57BjbuggRIlZskKjovuHKFBDLC4wFSa60VJRRHCx1tu7Umkgfiuwkj1H4Azbb/bYcRUsdxTTbO9xhGdnLoSXCHhUXntkRNm0frXHrJhhAvHkfMllrFwECf7l8gvd5i//NCxOgX4eLAXnsEXlLGVDMhufPMolrknjDAVXEoXFibhKGDpEpXYxi6DKrnLG116qqqv7/HeqoAKS266gQgKhFL4PUsYmzgwJJlgsjeKtWNZQDp1YoJ5O1KoKcVJ4hqCbYnoplOr5am//NAxOQU8NbZnnmErrv+rwBA/Q45MWRcCECDSy0JsrafF2PPioAHCYwUZ1v9MkcOc0XZtC2v7fpqEpASl////GBpMFS6uI/Itmiuo5UmFEgcXivrjPZcqzcEQpF5W279YYXdXVGkN9b/80LE6xeRDsx+exBeFtMMCY6AjYMyQRKpfF6zVYKXsqRvUrLb4hK8DVHeRQx3QMFU6C/0NgC5d/v9hw/AxghI4ekapOPslks0SL1l7UOyjv7BA5sBAGVntU3nUWOCvdBhGR/094e6W7b/80DE6BcQ8sB+ewSWHkSs58IUDFggHguFWI1X0WMHgsocZUGlhYZLlFE0A5kdNteO2e5upz4YAm7///gVGmso2AjDd7Bt7OsFvExu1Ly84NNrHZZW4ch/v773k0nTDxbrVj5u5pe0UP/zQsTmFbEO2b56RJJJQFtIESyCZMFgZFy4uLgBtBV5M6MpedZijVPa54eOgQ2zVQO6F6jKxF0lKgC5LtrtRcEZG2rWAVrIf+jTYq+OEEINhktcVMFMK5qkPFj/m4hiTuBJHAujq3bljv/zQMTrFzFWzH5hRyL7gLLSONxhKy73rCo1axYm8IuhhMdaJ0ipoHeyrup1ia+h8X6ztan70DGR6f66CAUt3+2wGByIW8XCgL6yNzVF3gkCE1VrJBzNmdQfTQnrK2U1D9DqYLl8YosS//NCxOkXUQLVHnsMGguyHS93EwjRFL8YeTpq883gCzDFgzskA0pgAoZMKJGIrwGOimhwq21VxTO+bTI2fQtlmOM1BubbbYDAOI/NkYLaZaafN7z9ePO6qSgEk9BgfinPsyD6WuSS9vOD//NAxOcXYPbAfnsGeuXzMvIrHYE6S5OXz5cY59uPDy11FIyB5l459gSSwfb9dND3L9z4AiPTbWxahEALl///4EUigQOyMLkPIaJk9zAW5kW2ndEg2L41vNKBO8SNf4spbz/jXmN93lP/80LE5BhZas0eekciJgW+u87jxrHaUvG2aZl7cKaQXyRoa5MgOLEqC76gJSfIDUH6r3MC/FlbQSiHWmoEAK3f/YAVBxo2OHc2GJS7Rf/RW0WLjL3yQna8KldsKEniq/+pS0gORzDmhE7/80DE3hSpWsxeeYauX6qVY/P0aQT9r3BlBHyCnPiJwCQHgKhJ5LQub6h5C+8ptKo5XRUAqXbbbYZBGRfRAdxCEPMeCcd7QcEvsTE1zkW6yisa1symTjdIAo1xYUmlCHgUNfuDMmRffv/zQsTmF1Fe1b56TD5xCTpOjzDJh5M+BCRppM8PNAdRUNB4KZSdArm0UJE8guHQ6tF8O21P6h3ikmqffLuSuokqALt3//GFiQI+AUSAPNa2YdfKlrJh4ajKjCHpTjGUHjYZIHeNBZharf/zQMTkFJlyzR56RpYJAEu1h4iKCepYFC7RaWBNCg0KMEoCB06wYZjhk4IRcUN3AVCXuK3G3exP///XTQgAApdttgBIB2LhDE4CIKcyoohdGKoEsgryMyS4CZNz7SUk8ZVuHOxy3bDe//NCxOwaCQrAfnpMwiyB1Ui1dgzhUUeHkzZAkscRNY8urKsylwNuEg8qLtWlljTykoS79SqgA5bbbQISPHGmzZIQrgoJSQU3KHbFWZULLwoNAVZJXhIFNDpw81TBZQfPveq/KzW/Nmdf//NAxN8VqMrQfnpKVjZ6B4WOODosVGAcOSiRzgQQYS91B8kONrHzarHpCp9uOU3XvFDqSO7FSjEV1SAApd9t8BUHeoYxRDVCQPE5Z7f4wceGELIqkO65lm5zDfCOV1buFxLyG7bLN/P/80LE4xTI+sm+ekRahYHccWGwRUBj7gsBUVhy2tYvk1bnKYy69tSsuoqaOqLKIo/O121DFQkCE7v///hyYnFRJEMJYnWFLuVMwGXKkqFskskQ8rMLBzQjzA4jKN25pqUvFElQrJk65MP/80DE6xgI8rj+wwyKUYOx1sbAiSobq3ku0XNE86Tnl74O7f78z987DxccAx3PS1RI8KEFpVNrB0COWlhtlVAmCUATu////EBgP+YAYBcf4chGYeN9llrvJf62iJWaQpGCT52jsBsXyP/zQsTlFVD2zR57DCp5QFAsGcKgukqYDwbQG1gNSzpcQbtc4AVXILuUmjG3ff0elo36e7JK5BUwAq3b//YQA+lA3yBYtJ9thszPLmPyOjwgfs10sy00NKT3JUg26IF/YKpqvqq5m7eLGP/zQMTrGcIO0b55hrLKnTL2t81//LZ0juTnlfFCaPaWQ8usTlI9SB2gEywqiceiqcPoQ2XW2zs9H2VKhFAKluu2GFkeGREqWkWXyi0cSPYdGQcUNJImGIHhntGyhRNUgY7LRr3CXYV8//NCxN8UUNLZvlpMKt/yVpky1JQUcsUvFgmT1+PkBWNn7WFHgYuhcZaIlvxZ3C5Wv//7U7l1IAKl222AGJVO7MqwKEpltMgx/db3NurWZC+Q3EeiHQt1VJIbUbJAbxMEt/NfHANzFgkc//NAxOkX2Y7NHnpGetrCKEA9Kh9HJ8FDvMDP+QMe9VE07+7mWoIfT9ObnPveEENbV7Kw0//7UuqgAy7//4cZC0jqy1mqo0DCF7vrj8w0ZyTNGFfzyvSm0RCS+KDKiCFuJ5EFwKQXYsD/80LE5BVY2sm+wkxSVEzaqRLkfl32jP8IuF/gg+l4mceDdgldSomNOFC7wlH1f///45ggGkiyGwHttttorCAyXboowCkDwhtS8u2a7GJokWVRsSmW9HWWLyv6es9QuHFInYSmY/wp/5P/80DE6hdZLsEewkav4atGqlZWkpl5FY0DgMFl3XHy9cZcwq8/tUncjYVnm2ZUvahRq2v+ptlRf8wqAJl2+12EAHEhHM8pESqEz20pB54gDIhzXzg17nrfDbFo552yvRR9Q7UQnOjC0//zQsTnFrmC0R56Rlo3trKZQ+1TQWj0FTaiGOyGuhD6VGUf/2otTQl9p/ZTZkK6gAATl2222EZFjjWJB7iUH8ecGBqfwiKkIxMhPosXF5qwTQsNaQEhFAQoZQMf+Ma6abeNpJ/0vBeRAv/zQMToF0j6uF7D0hox4AWPIIISihQVeUhcuzAazKOtaq2AslbpF1HbGk5mlTUpbpfahF6SkpTVAOW222iUkNWG0aiok0oC9Qz9e7vEAlKJxWGdHewoBNLqh1QSKco/EXmDvCiJGzI7//NCxOUT4ULIfnsEOllVzlOjvrUiLdmL91djkWPYIAAUpPIGuIkuVVRYdNnUoNjmr9LzSHLEGBdYuLfDKR2LoZCFbv//8BkYJ5VXatVnYmbrUhTSp5G3CCrflk4LxZYCbMCcGrutx5Hq//NAxPEZCPrFvsPSDq+lNoaOOwBOrFJkZSWeeOHjjjbywbCaRGsmscTxWFw/Q9SUKldrVIW+//1qkIUu23/4DUCMDO0k46btkbP264ZWSGqxGevPMbTWVtI6JhKhUAINzFxf2ltlTnj/80LE5xixcrRew8o2jqB2zqz7KyVvR+3sm1qJW/Pzhq+1RGI4rIildecRoHNEPzmRuZA3L+ZV/8BvR4UOll+uBu7bXUCQHEgdl1wEg2Q171fKYHOebIT8eGp3Px0gayCH0dnI/tqYNyr/80DE4BUY/tUeekY+8fx4XGKBE04gVBsw6be1jFiORuDSDhdnx1fSVmmDX7G3I9d1AKl2uttExjiMbI2oCkPqKdFNfZKYrkV6v80Y21x6zPqP8eLGtdLW39/YmNqFJjyD7E9wUl1GO//zQMTmGHGqzR57BF+LST9398QqkxVlm6e6fe5gENAQkaDagudBMMdyBMY0U2VaeJ6NrX//XxyXKmAAA9t9tthKSGK8YfdFsDZ6+UZ3hlXaFohEyszWEi6VR+fvUR2RHLguDUNTTZtY//NCxN8TKO7EXnsEPhChUDIbQ3fYdw2zZCtEaKWPkZC8fQOoLlbiA8letaNgNqcy4c6zOG6TinV+raJXL7EcdYACptvhgBBAqkm6wyCo3gMnbToeaZ8XNnV6alfBUNYg0QGTIf8GYw4Y//NAxO4Yiaq4fnmHKnBBAw5s5QyvXzSD5spGfQediFkDhN5taziOq5n/0IPpQXWsulAQBKb/7bYWHIa0BcJtlhMSBWpbNS/2RoBkHQMBYAvtJrL4Iqk1Sym7+WgSUkUKiv1udta23iH/80LE5hhpRsW+wkaWLKSIoVUbPDlR6sEOYC4ggR7i6WKytohUOWBRCqLZhq5B0+ueQ1lXeqL7nrXHaXIqECvb/fbCFEUZnA6QwkE35+GtIHF4Zq7X/tM7m8siiQyv/YGOGE1vYCQsoRr/80DE4BN5asUeewYah5uBkEi7arkvFLNHA0gFBM1htzPyv62WqUUvLju+UvvmagIQCrttvthFS5NI5ZHEwxJC7IpVd4RDxDkewsTYUQww/1koMLkKyZUz+BW7hk6z5slVtXjBad9kXf/zQsTtGVFmxR55hr4glyDUuI+plVY//7l3iHt5FXQ4UyzJJxMCEke/eolfgcFEN+mepur/Fztf5Ls3subFc36n5DNcdvl56gHtttsApSU8luJuNeHQiNktFNxOAH86DK7CJ8xLUENPy//zQMTjE1DOzP5qRB53wgynF9BSTbEZHVWKrrst2SVHPNazJH+xTR6xrjRtO2Ad1NJAWtjEPaigDsuFf02AAubbbbYQQtJx0LLRAS2Kpb1wNUH1hvZQJnVjO+7KYjchUbnoFmlJyHjm//NCxPAc0jbBvnpGt2OyNIWzoh7N2dWOUonOrsSw3TitiHuNLrnavT7Pqz17OTihJf6HT5teAhvb//fYQBPBjRAolsNUIGTNZhv9yoGmzwkbdZK/+aiiEmMh4hdNQ37FmYqHHbTNqD19//NAxNgUKUq4XsMKOkq2CLipw99vsfOdK6IQ+lMfLrCY0Va06QSeyG6LWTAINe5+xyoWordoLfrppm0oBL777bYYKJ7KbHkR8p/auiO7MjW5I1Xg1OEufxE3bT96NuREBoRwRNyHOcv/80LE4hTBTskeeko+q0MY5nKfz27o2pFBxKEjqexqXJX9b3OoLvmfZ0ol+zX6K+sjqbkU/v///xVHkkkM7MVRXJjr+VOpUaV3VhyoV9PQuw9vPTJxH0Aw+OhimJKUn9jPJAgc+kibEjv/80DE6xhxis2+ekaWvjbvmHnCZP/9SxnNnRinkEmyhMTEmCBNYFM4GeueIGnRUSqQYax86W6HSzCcsnLqJcIRUv////FSNywiyVJcFRkd7DL2P9LI/NTM+ZDT3KB2wpdFlgppTKByJP/zQsTkFHFizR56RF6dIGFi4q4YPLixoSuf1TR8vV2sPsa5ptje4ubbpSohRSq5/n65v9RZ2KhGmlITu//++EECqLXKHcYo1CGWO5Z/wmgShMJKejBvddofZ4yBx/Mj6EivreQ9pMFeSv/zQMTuGZmKzR57Bl7ZV9eT1J6AEkqKsW8DFMUSeFe4JB5ly8/SLKBMevvVW14o/YdOJHY9B3Jm4+hJQFO////4ckBxdMMhfzU8z21sG6dHzvJg3lXt5MKSQaVayb93zdvK0cfrb0NK//NCxOIVcO7aXnmGdorkaiWuab6fKtrXebns6o9q7qzXTJci7bo1Wr2goDKMw01JRbVIOrD5D/d6KgiC7v9tsBQjUXR3ISRugPq4y0tl1EHK9noFszsDVbsNHt2CqpnAJ3cZESECFW3z//NAxOgXgSLNvnpQZlFIxMAISc0KhIIGC58UMpWtihc+w0jaieQYWvVRPP3vgRmEFak3lUsQT8nVFADu222uHGwssJhNKj8A+XvW1NAkLQRe6aO5e728FjCRIHVB84C6pCmZnKoFjGP/80LE5RaSUtG+eYR+OxC9zUuGWOSIuA5s+5pJRVvHLWHhwsT2BUyokt9g6PtOccSBm9qv+P6WEmjS5CsYAu7bba4VKPM0g4hNUGzDF2F8wsGZsJDWbll7weR/ZDdxbUxRr4PB4iIAOaP/80DE5haJMsUeewY+jFMOXFAKCqTAw9TUu9DUEEQLGuY1DCNkSKeaHrc7sIEFN/T/K5TMqtfCXN////xKQoVNfHJkj9/qJRiOSySu00LA47kR3jDDgVZMUF74DsctwSKg/iDrgZof1v/zQsTmF4EqwR5hhrK9I1gRdkJL8LIgReIGTsi8s8e2x88hK49aT55N6h+88E3n6tb7tAw2i6kfchSA7Z0CC7//9thCAqEugSC0hGYMI0Nn4Zj0iFWySHb3ueeQ3ktl2hTdCoKmKJNxLP/zQMTkFQjGxR56TAqFiIkSD4baOCAtQGpgeGJtIjYws+ZnrH2/s05P5a79lVVv9yEwAmW3a20QAcU0OMZA3R4QziiPfIL2zARIHzEobXbyKu2faGfDH2ILEAhdkG3RTSn01zJcl15c//NCxOoYaU7RvsGGltO7/eaeIMnOMyDpHQha7C+GgIAKGGH2rtZccLvOI11OxYafNd86s4vpmGJVgALl2u1tEU2xQ3gqwxvQz/9RQIRwHzGQNKfMSUnaRcTwmt2tAyoVyOX7A/wxcfDl//NAxOQUMQrNvnmKWj/XBJH8GEMHgSEqtU5AyyqgsHhNBs0MD6S5xKaz4pT89YhlHVxT+9ifUgZSXdv/9thIvZkUsII/k+2bjtoXVr+eeJ5blX6SHTEKl7A/MxXZf7cXW4QC47fBkQX/80LE7hiRzrUeekZyI1D6amQzt+9EF2Myg2hAkLBtZMqEwlrRYj+SXdeRfR66L6IvluvTTZAE7tttthBD9NOZJo0ybgSMT/E+iI2pJ1NnKzSpUomkMCp6yF1TGC/KjGd+mnARYTEokyD/80DE5xZpQr0eekZaXPlBIde4kprazQpMiwbjSw4isYfUw/wiSJFASVYztPUhBqe+V02pDMXqKOmFAeW2ySCQFgQaAMkki7IdGXdYOl2Z20qTYE4o3SAOLDyCgKjKQGIoCXxvGe99MP/zQsToFimKzb5bBF7e0SobqWhMC2gaFSMvm0CzDjYItNCQeLKE4Tpqa+rS5yytqv6Wu+zx+lVmElO7/bfASB9RV2HeoMaVDRhT8IxDRMFW4tB9alH01w4gSqgyLc+Uq6Ggsww+jIuHH//zQMTrGCDawR56Vj4QL/z+bvx0xCnySET9pDYvNDf9/Fj+78brxVndcNbF9EJCQG2dxA4s/+0//m773SoAO222WUREuUspUtKBWMo3PpIXuYZMAIbrCxKoir3KGLBgRWZYm2GJF25I//NCxOUV0S6oXnsGpuUjZhGDMmEAKUMHxV0LDRU6EmBk7Y5BdDoDUj/vVXrCuLonyKEIL1r/d9U6o0VprlJT2////FQobJCM9Lrs4VKHK1nFOkNFZdER3nIbck8D5v/52G4xzTTJ6D4g//NAxOkYSU7FvnpGNzhcsJ1BmIXw2OipJS4uValwpAvKm0kaGDzbqGskyKYzQSbikh2XsSARUVmKCemAAu26620UD9H/pIn2zTWWL/4PHmTJ2KWLGfP+eTRDOauTXnOt1jWVd0YUchT/80LE4haA3rB+ekaWiyKdTd0OqBjgAuZ8n1/sRmvBBRINpOCxZjRRjDQ+Mt7q3ovS61PfSpO5LVJ313jaAKltlsgGh8IV44m5Af9PSktC+50+JF2cLBsyXfPdA0gCB+xW9i9Zc18RIA//80DE5BbA3tG+eYZeggkwLESp8yAyBuSBNaK2CByMcaOECTEUD3KmliMipoT//cqiigJCVLv9tthgopLsVnkSQi0ks6HoxPiIk6EJEkczxmGijR5wEPOnEuxWPKTEPpjvNNCZqB243f/zQsTkFyGiuR56RJZNcAbbER0hkO/7EIrtyamr1stNtB//xr6ku8S9HV7ey//4xqJUcI24mCHe7P+8M55xZbIr58teABKS6220WXnXrNQYzcKDj7zAFgduhLltDbrmwv5+zhfE1XNJVv/zQMTjFCDGsH57DBr8Qod3O9St++lWbQrKIQNjnA2B0i1RnaTxyaWzUzmLAPA4t2LarUapb0pYT3XivzmtIABs2/+wE6VLtgiSqgZIU+ZhMZydZYgm10T1ZL6opYafNCQ7NYXlC0Q8//NCxO0a+Uq9vnpMG+Bt9S3mUXAgofgnPiVz1vkYTGhOWlpRb2lJAxWoksDTkuZWF6Pib7b3LWa2Kl+CU7ttttRYmJY1aehThdrKvGIupsGwe0ko6ErBAdloQhWCTAvsR/5l/mL/qWB6//NAxN0VsSa5vsJEWieHZ2MQK4BYOZLhKIKbe0r/JOXsO6/Pt+Gf5GLaTxqsfjz///+1RQDeOwZ5ywTkD/e8GdX/v/+yz/8qi0ATl1uttFgREWtyCoHaE/MRTDi2XNxXgCT3yDwJsyr/80LE4RWIupkew8w0Zw2gx6rjNKJvSUxmcYrd3qcYt6MjSTmp2fYm3W5iu4iLAiBqjlDqoWxV1n3Mov7RipG+ruIXrSgC3JJAwJgdI6FZKaLEhHAUk1+0jwCMRxBKN050NLC/UWnhAjH/80DE5hpQ9r2+ekxjp42lZ6bU3rbmKqvxiJwkLYqITpaIaBhWYEpYhLVx5kAgAvii7GiNv//+tfdVmAClklsgDiWMUnYyEKerdSOJ0JEeg4IkpgCAmV2+8wwg0g+fkcNitL4MS5GNx//zQsTXFgGyub7Bio5RddoltSecLU37kpa00waCBoeJiLTxl8a8iBDT6OtC/d08bo6lEAI32/+2EyO1eSnJWLfGME8zEmRzNGahU4LNgMKZQsIhRccN1bRPaTRjru3/ONp2u5OsT14LHP/zQMTbFAjyoF7DEDaVeMW5rVgrF6hFPkBqoqtKhGdBaze2giswslyISWtWA0R5GtootlLuTw4OqEDmUDABJbbaKBz9POYjCOBA4mGJ7aSOa4tmLayauG+/5pgWRQJnVDZ6GOxTNgip//NCxOUUoOqtHnmEXuEBRZ8GiAFDS0qA7t7Sa3wCAlOaElNqcapoW9pH//e3pCrXwks4BS222yQYJg7gEaO5En0xs8J/q5Dp4OjGfTZiJbe2gwzA2LOJs65NbaBI7sSTe9xImaBMRiEL//NAxO4ZeNKVHsPSNIDGOLhkDiqigVQJIfCxA4Jy6SbhOIpYmDIuSaUORxxbuNR00JZp6Xu//ikEgvWy2SUYDGQy40i4JZkqrM/1Qi6kfnEsXagAFy+3/ukh4kwRnPFgg+EXjcfuag//80LE4xRA3rEeekQ+ygdvXkHAssGkqaYRPFASWJnnDwWJvW5K9y8zR5AVozv3i5C/u1Cy0KO3DT1ZhLCw5bACpbbbJA4nGIzcjB4lAoYCFaXoulEXD7M+KzHaxe4Iw3iOoYr9p0SxGSL/80DE7hh44q0eekySkdZau2knPaF3UMOY4PQiLC7DT0igQADiQQFnx0UnAsZKpsqZgP6eK/fRpvUAKSSSNwUpCeEWiwCKsE5bC1zhMDUh4eCuweJBX075s4dhAIhaIjC5vJTzRqWNBv/zQsTnGCDyqR55lsqF0hYETLgsHBZhtmKnkn40XYGY4caFC8yMGh8usEDbBQzIq7vGWQn71Gsj0NcsME4kDqoAKa7a0QIgOQY2Amg4Feo4x4VveAR2AOiB5LTAPjFWE87TB9cjGtA78P/zQMTiFaFGrR56RlL8LiYRAxIOSkoJkNEoFllHlBIWHtSPegu0XYNuq2aO3e9SBfGFv///ogCrbZJJBIHwceiqQKtjXNXGVAXNIcL0o2NF5Ntc7isFQlvQ/4Db/0cX3gvwoIidHGGk//NCxOYYSNKcfsJQUjPRqtsDijQIe4gOLSCSS0sNomJweAZAdaksh/zByqoNjjlajynHHrL1uEzJkzSNphgC7bLJIBQZRyQ1waqJk0veSy7NLuMwatghWxj188RgTXRP8pGS/3tRoZKo//NAxOAUcIqQfoPSDHshCjYpT/pxOZfv2G47g0JVBbMJuRQldqUJ6ff8paL6TyNIxLvVADn121tF5YdH2HFsFZC3joeZZaulaBwijebxOGZVXIUcsjua8K1453HC5Uh2rYhflpBJmx7/80LE6RhxUqB+ekZeDWUBuSEqP5+zGfnk3k8hg40ah7ySwwdEcccF7BzKZXEoz8f3baxELDcvW7TpTWoQG5JJIIODjQL5IDxRDsAshQ2UD9Dho6CJw2tzza10mMtkbfEdHJJRQvY0bYD/80DE4xR5XqkeekaW8goSF2lwkVFkzEVSWUBFnLRI1IWFK1OXfCTbnqlDXKLb//019hdKAC3+/33GQWIT1UQCpcFexI1xxnI8oZ/pZW1zlBI2HLoqaQUJGeG3tBm6br5qJqDS4UjSMf/zQsTsGQFujH7DxjyYqzVQzvcy5t3QF3Q7Ot9XqXdi0yXq30Iio9/qottT6XDrhNY/oTAsiTQxy3zxPIGaBeSR/5CCWKtU2BlgJ2HftpklF2EopIgJE0SudRKLeucBZYidL7EIlaIiXv/zQMTkFOiqoP56TC79Cne1CIviUWTQp5hqF3NcaiqBjpzttFKxVg2ea2p1bHDVsOEK9dv0O8WecesAz//aW0TA6JiCsaSImDehw7fMhqaGhLIrMgvCsj5o1Ga0chDXUw/WClNA+UQ4//NAxOsZIj6QfnmE6ELVmwIgoLmHKQbPAEotalB0NoiyHAd9P+3vd+1Oz/jfdQVqACt9ussDiDbCdRQPUeAqjGSJ3yPfAZkQuXAgKnY8mQo8PelBebuIW7p0ugREd5kHIkywaAleHVH/80LE4RYBaphcekYeblqWh02wyWHwOHVuUXBEOHUofCgFPFg88YSS1xJVDkDc+Z8eqs407N0yKVsjydumGJKkltskEop6tumUaJvYqZhJQdmTaqPtLA6lSzDgnM8WMkvBorHQx93ZWdH/80DE5RQQvpR+wxAUX1oyt9qsjlcPcpUeYrqGcnqhnBf751IVcE8lWwFVhBbk6Z2L10N6vEaasg2zqFoAKbXbXUaHyGkrSpTTYTSGjZJLOE5UgE6xqcgWJ1KM3Obm1wT0KZWMfD9RRf/zQsTvGfEOiH56RuTLg5QKgc5KOCGbUfrUajpGxrR16EtG2LaKSkxb/xSc+9IqrbcnSmsRlFO6222wUFBboQzYoNic3IkK40dCYUaJING9+6jd+j17LfhWMQcDM4gK4jj7TpfDXIursv/zQMTjFrHypR56RDb0ohZvKaMQfb0LjIXv/zh5+7ObJPc7n8NgUeaCYR50Fg4PJllBtq1gFKx458cErrq6KhwU5bbbZBQHjz0M2JYwxv3DQTYzW4MaztsKqUAvTV/PEI8rvg50X670//NCxOMUwMqQfnpGcLSHzU3b1UQaGckSZQslaROpZ5mjlgxrwGs/OLIuYcWXkgeOhMvzhNYCPer/o3bK3pBduuttoCtCRip6RQRcN2EOuXoWZqoaptTnPp22mVQ1AoW3sk9+DQ32gGRb//NAxOwZkjqtvmGGPsiKMJxAnAbzpA+CQhEo4lC6Q8VSXR9NYAnbdVhCIhUxOL7hNU84VnUsNw24DhdVMASkkj/x6FGpaJEtw6U++OGvlCfoh2bu20rOG9C3jhUEST7k+OxYUz6eV1P/80LE4BXhxq0eYYY++slUqx51KRNTVibNW+IWtchIjA+voFiNupau95qGqaiFKIp/a7dKWO6FBuNt/5sSUWqilMYw3kJhml9Ti5AuxnwWNWofhL4mNiUTUJS/nGrWhzj8XyLrMeloUUr/80DE5Bbo6rG+ewY+Xfztvw/eo7F/zt2hriyU2hv091v/PF+Hs33vC2rdRl5PkduTf8+N//n4jV7+ogA5HHJGhsQUJlSF2h7YXaARTm5vacklDqMcBzEhWTi2GkrXUe0Mgo2bMsOlxP/zQsTjFWGCmRx6RloDCBhiTj6UKMhQ+4YHgRCVysfSPeR2LAr/cQMk2DWNQIheHbUa5VqU7C/91zU1AgAt//2+1EwG5AN7AI2EDCQtBTqEdKkx1DVADfuIiQzyraIzG/qi9dPHgqsCEv/zQMTpF+jWkFx6TI8HlDYqZCo0G8WApJD1rNqeNJygkede/tEcewm71LALy635rIvLlBaP3V2an0oASySP/Ja26XGoCEnJAxWgJdrywQkIpngLq1NS2izbwUtcBc+yaPtSpQsHVMJI//NCxOQWmJqAfsPSLGFky5FxvEg47ILcUHw/dnRg3622i7kcnsSxpNyQ8iTuSzu9ecMNKwDLrbbIxeHWrR0zxGKlc+ni2O86RoLYnCLg6rQPTULtd0upRlB5xY9Rs7TixFIIkDDw2RWV//NAxOUWqMKVvnpMMBOGQCOPwgAECAgq5oTDqSowOl0mIcg4xCCAaOLDld9bS996+ti6Zvjv7EqBAFS/bW64UCpGNQzC9pJanld0tcvcq4ihMyWB4o03MnaFoIue0/kdKGng25FHjDr/80LE5RU4qoR8wxBQeYUS06YPz5g3AQPiERiyeSoV0KIpN0m6C1WFDgGBLp/YzWqtKR1rgrH1BE3tsttDgDIK64nA106eS7adWwmS6YgFzj5WFieEX/KnSbROgalsVSyMRFX1DuuI2Mf/80DE7Bfo3oR+wkSQDzRVZFYOlnDENScWlkeje1Auqs4+xCC2aQ94tJ5+H6UiiZBgcrW7IdeHaQkABFj//77CIMpKwyqNc54ja8n/wXnExxW7xJn/ZIZtkQ9tD/4n+UBZayA+KXaspP/zQsTnFljukb56BqxZsLuWHM5B5Z8CiaB1pF2NyoUUMaBg+bjbK8tKO3BgjKlyr7uqolsU/snUoQIAApHG/4hlOtLi0SkL9sioSerNfXQXdmd8eyxNCAMdc8x445koTGt9RtU68UE4CP/zQMTpF0DuiH56RpBglHjYiIPWhJYEGHajMeAGsArRd+uvIH115wVokU3HqTlFhajhfYkAOrZx7K0BWyWP/IdKjW4yRKRX5wLeLCq9oQLQmKgaHXqmEVwPdq4yCwkDPURPuCmNNjyT//NCxOcW8SqV3nmGlAEg67KC4dNA8dmHNZxy3mx8JXpRWnru7Jyb/ur/ubF326NKEBU1ltssEUR1HQR7KZPTTo3vv4KeVGorRc8brat7j0d4EMGLt+3NefXwZXO21XiO3msvnnWpdG6W//NAxOcXMKZ9vMPSMBDlyFs5gR2MY++Kb/4rN9nW/UId4vd/827DvG/W59FDiQueT4H979/pN5d3OWoqAyAAX3ttlrFB2GNMVUQGgEOIjaPwDusOKwrDFe99+URkftU3jDYJEhjp0oz/80LE5RQoooB8wxIsYPHIi0jLuiPMvM1AZZ9ShZZ1U1dfot713tUXY8owijaB8mO3kes+72dFBADn/1JArwksMJcUpC1tPLEN/RtFwiQjZO8f2CsfZZc3oseWvxtvuBEMuLHjYGPkUgD/80DE8BnRYoUeewZ5oeJxXKCFwUJgJBAMhABOfdAhsFnqTNiPQRxK5M7COtptP2mjbsbWSIJ67NpklLJI42wdIH8CUaGiIboXK2/mhNgfKJzHLhMVXo7cG0kC4RmH9qeM/cPCot05Kf/zQsTjFWjijl56RjymgOYER4SmGHwusSAUyESNAFLpYxtLaFkRGMiYLiJznLN5rK7rLJLpcMGfeh79KhAXlZhHZJctFkqdzEGWwJAEATnasqJjnRmqqj94Jx8qXl9YxhAYcnFxUFK5m//zQMTpF0CWeRST2AyJqmtjkpgjTVnBo1KHihIXn0MU3CQZeXDg3hBwu/jcpeQuTu/TV9N/tcsCAAvWyWRwRRgoOCpjgTKxeHDj9vXuGQFPHMTxkrZfS41VU0Mn0zz2A06gjUi+utQv//NCxOcXmN6dvnsQGiNCdLzM94xTVTyhTpfSvlh2oRiI0gZBLiZsY9Kw86XTSu96J16hxYxLdNbG0nu5u5PfpNyySSSQPAtApUEhY2hUEzldsStwxWzyLM6Eb9YHneMzbNmVGQYKFgAK//NAxOQVwO5w9MMGiMGxw/GOYtm0aETZthMwxw4pfAAuTNjJ7t+/rmitQrar0NJVzTaTu9pWpQAwC/qqH4IUOizOguCGJtjcG+mGJBKtSIuR48yEwhoprKag4VD71vZuB2sSpG/WiVT/80LE6Bh51oG+eYaUlab5FrEHE3Q4M4SNplxiIBItLS4hYtQxKxIvJIeExOw0zc1g2wOnFs5M6mHI3ueTLoGBpVHbiTWLKjH433LghCZ0XdX4oibJgOJJ0SoNi3ULMIOPwvMB1NKNa5//80DE4hUgsqm+ekwO0usfcZn/ybHeKFugYKnc1hw6BywqIa0WtilNbW8XvFn52y2o1LTXLTP2Y6ElAqaWgipKmS1XrjLQmpRNJGzygzIlHhGZqINK+2tS2OnFaXZtfQYTqd4hMfhmzf/zQsToGSEqcZTD0BT65wvnThEfTUNcct+KUocAT1cLJe1MmmV17HtGWehgoEUUnCp8+7NFEvC3osSqMCq3laME85CNoSsPiGtiivo39PQp1VsllZHBPB9QwgbvDctzmf7IF4X65I+ZEf/zQMTfFSFSeFx6RjRypDTI+90NbZ3yub9dSBkVxUax6rU2720RZ3cMYlym1lf++tt6dNUFvcGhwUEjlKkOqeAdi4nameBDb2Dbg0Ga/iMQaba9YGlvo5ael3QFMv8+UzxyS1tEm6hj//NCxOUWyXpwVMJGWPCGyggEAuce4mOJqFg04ZLyBMgIlvdSwoH1EiYwo9eBp9NA+9NiaQuAtlYo6XpPpfPKdJoCQoxVVXiwEugt5ZpUcYiOki0rJfbOm3YHCbyajc9CTyypKx/Tu2IL//NAxOUVCapw0nsGNA0gwIhQqiphsDhNpNQhPFkHgCEXuF3PVW2uIRSKsthdzWKdUfSrLW1uJZNKl0h9zqo9EeG6AIPABkqawlMjRPUlx4ybBeQedxVTA82sF8xtyls884m37DLOwwr/80LE6xno9mjqw8Y80xLcRhtRhDN5kLVFEoYwssHhZpKexRGYFQu5Q5h2vJIiCwRqQl1PE6jFFTRrkIa9h6pVAN0uWkulktDo19hTfTbKRJz9j+ThGrVHNAUal53t25mpCqbWhtkUVaX/80DE3xcgvnW0ekw0IkIqUb0EL749/Eigoiu5BvQ6GjoDApYbZlkPqxYdGvCpqkWTN7TxJgtvUtKlHqmaAtBmhRjVCSkHbgoZxjFGkh9ppoXMVLQSWRxlu7kLzsO2EVYMADvAYJ8ETP/zQsTdFijiaXJ6Rli6PoU0BHC/MtdEPyyF4jSISY9yNzCzSLOdMzyiIa8zQdr0xOm11tVtZ4290uhVdusDkDc+SguhCmsgKjA23ZsKCdJNhY7IRGGoChR8RWLDgFMIsFEg6peuqV8rQf/zQMTgFyE+il5hhuSUIYBAAtFGrzD0HTKQKmwDIAx1UTDC5uYdMkBdiQEy0swlNmnjcgzrWz2zjaz3xyoExhnpq5h0UWZT5UYWgUbRppuNqmG5YSrQRH+H0tNZGLLu+VHhSG0I1Lr+//NCxN4VwUJgoHsGNHM/TTzUum2f9CiMq8qdSPmduSjA4DJ+LxR6ErcVMIqY1tTfX2f/KxgkEaqDEQO42SxF9Rrm5pCLWgtF6GhTLOQAyX+XIT1g9c5IUV97PO9DeWR1Lov+Cz+GJJnq//NAxOMWyPppinpGMLigMGb5jCzJEYdSCrbQXAoFUETaTJtgoTPNLLwCCL7FA4hMAsCnBp5stGuow2GnMh0koNbC6km7I5bZJJJA4byUXr1/GrlQXGiiYPCLkW+8lGU5UBxRKBX/Rkr/80LE4hR5XnY0eYY8SnGcotMSCzkyjibAQWMErjixUJk7D7kNeESrHvGHl7vo/u3J3L+2x6fVEdKMsNA5TrlgFqjjffm0tBnZxGJ/5VW/7OCmaRKpJXpxpmRjCyyOsm1BYP4gdwlPicX/80DE7BqZQlziewaQgMCoIvWZm0ip8DA3ccepp0mJTIsC5oVIZdneUPCN9icAVl6FqVtT7GtG1rVWonWmqQ0BQSongiNG97NpnRrC7yrWzDG7OFFuHptsEGCCOW6SnmTHkxU4umBeNf/zQsTcE7jSpl5LzGKmvkKDNZ4PqaJAODalLAIBMpeeJjYy5ig/YhzjkXS1wxZG1ib2n1H6FGrL0iYme3XiwUVn0IvT5H5mhemEriwkgHOZcOLPl5YsiPRUbOvYGIRMDe7OUp1gZ97BA//zQMTpF2ESZNR7BjSWUUhVgGSBVgwoudo3Ppc6TOSYpE5wlahbLvEGlqHrKNUGxU6Ubcsa+xcgujPlG02nJJAy8daCjTD42V1OQdm2yk37US1RJVEpQjmQz1ohSeyw0OqmtvFcvl2h//NCxOYWuTZtlGJGNILFGqWCMGWLcdFw4KOhcWUH4kKHGlJ5QkLuctNLQ9X0rAA9zFPF1P1SVD316gtKeVauEAV0ucLluOLEKG9DzmKFSOWjyLYU7+YMHnQRx+14olk4czNeG9qVLhcU//NAxOcW4PJpjHmGkD4ecH1DkB2JJAqQSQMCE864DKlkmeK33T1M0lq2MUTgg5ADTKWDXqrer9MCVwBSwahaTzILBoaYxGUVRoCuHnnKzHvRImzHcVUoRnWjlYxRGO5UE4ybP3aGfDX/80LE5hcBJnW+SMTwSLVpfGh/LsXCOKZETKZKpZxh3bF/qFL/0LgJ+tVyfde7r2rKp8Yw6jSkBPFVlaVWCgEg/IQdFE8HyVjUFPKPy/MVOHFlbVVDwgOlGTJSO5RZ4qadm1YnJUcSUM3/80DE5hZ5DmmUYYbMSp50LW7mee1p/sEGjiq7YlNlhsdvOpEwuIiS3ELBwg3DGrGWC221noEWh6Fn30CZWCgfOj0kVQdU7a6YYOUWKu969PrCN2FAdFMkZC2iwziygzJoEBgHKnBJFf/zQsTnFyIWXXRiRhgFzsNmTY55kRvDZU4KLaJhKCIgXUYGiUZq0pHOTnw09IU1cYh3d/1qIMCcTbF5aZUSL3js88PSRcoIYLDMoXMCkgpcex6YsmQ2olqGf1dc2AtBPPSGT0ElGh3ZtP/zQMTmF7FqWORhhuhyB1DXM6syO5MqG9io39XuzQv//5oUNYsYyqupXv+v/kwkFjQWDAGid4NvYH39RroqIp6qbgGngjgyKCtnfuB1XhpFJ1pyt88XBR5B0xskn+dVLlQwtiatN4IF//NCxOIUmNZUAHpGNIsEhEixjCoVqIkS60MOSqRoYpLzxGzfcZDcqgYAzYsLCyFKba3u49KaIygMDIrJwowIQrzdUY+6kpGN67J4lbETR0b+eqmLyJbVPKnlCvZIwG2b1CNwZnVY4a91//NAxOsZErJMAmGGjtsFiO+3DvdHSEcqP3T6+jSKGMEct+yjAl5n+7fu82/IH//aAag4yToxA0G2CSlHw54xAOQuC0+Zh5/qDGyOE4ESnnKOhdUG/Cc/tdpXJadtkp2JR2MlSqubZwb/80DE4RShAlz0MEdAGFgRBwIeDS4Pg4gsBRCFjFDYprJkDDTp7XaZRw7YfUXKiwrv7VJqGXwsHmrBAxBI0nr5CSNMgtjoyUpNrUkaJjdilM4tK3a877ob7m4xC3SjjDNk+axu0mNLMv/zQsTpFWFOSAxIRuWOeWM8PTpwNhBRUoECS0MMMeBRYgoTqdWFdz5NPavWxLb/R30YCo6hLEoxOXKto1zJHh9BREAvRW9GJfVDNeF0drbUHIoyJvvgn2oRFSNt9rzdnI0UmJATS6UnM//zQMTvF5GqRBJJhlCc6fJmPAiPLsJjHOCgaC8JLH44MCq0JXAChi2+1KkPRX+lObwRaZWOQNrlaWRqEBDS4ohSttdaeJFk128JEaitRtH08jdbNmk3XHQ3UFiMuHTUYDTlgNE6Oznl//NCxOsV6ZpIEkmGHCqehsZ3M2rNGdLbvo6HARiDvkLWXtZ3Ue/P+X3Xp3/q8+b/6xz5f0oICTE9E+iXlx3U0Z0ZLvOnZyVz2R8XD42uDGdVKiSFdJrDDOX8Na237amjrzizZj4dLAsy//NAxO8WcdpAAFpGEPoEQMIA+NLDYeOiEa8QpMncOjViudlbNQNDuerq5WsrKFFp7hAJABiaayrhVVaiYYo5inN+Kv27muYvbXla9ogWola/ZtnX+vUY8/wqxe3rNNxdcFkkcQASydb/80LE8BgZNkgqSEdB1r9ctO81a1yKHHKyIeaxz9Ufm/p6Ob/qhx7f+d/+Q96sEQDhuA0HI1dvY4kbwwEwZulKFEqXzZvZrM5zX+cPDZnHSLf1N0c5yg2JelHHQeiSRRn9Dh4amkR4bgP/80DE6xYBojwAYMz4RbN+rDwjCKNRqRbb9+axz1NbnP8eJHP/NIjoPRJb/tNN/zW/joDQcjU2Ov848RRsF7sYRCQSExR2f////0Vf///qiqh2/8mWWkyssBwEDQ/YKGBB0cuWSyxyAv/zQsTuGPtmFCBDD8ABChHI9QwMHLLLLf+WWkdhlL///////9/8mssqqV1FYhLB8PkCNh+SVpVMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQMTmF7tl4AAYDuSqqqqqqqqqqqqqqqqqqqqqNCZITEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NCxOIVQ2FAAijTsaqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NAxKcAwAQAAOgAAKqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80LEowAAAAAAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80DEpAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQsSjAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQMSkAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NCxKMAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NAxKQAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80LEowAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80DEpAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQsSjAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQMSkAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NCxKMAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NAxKQAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80LEowAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80DEpAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQsSjAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/zQMSkAAADSAAAAACqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NCxKMAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NAxKQAAANIAAAAAKqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80LEowAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqqqqqqpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/80DEpAAAA0gAAAAAqqqqqqqqqqqqqqqqqqqqqjdtMhRkxTKIkn4vYXqOwUaZE7m0CNKOSVWZNuJ6hqics3JzyQp+Qiozsc//Z/3Z2//vRUGiQqDjgQXFBMYNMKjx4oLs5I4XFxQ4gv/zQsSjAAAAAAAAAAChXFCHJ2Rmdvt///////5mZzWlqpUpVOrjEnDAB5LgCCwGPMAARIOGGSMBrBAAEFgAILAYXQIAMBAAgeAybEEKIBCiYDTYgmxAhh5PYJpsQQcmnzz4IDQ+Jz4If//zQMSnALAEAADgAADrggsPid4IF3iccGC5wHygYEg0HyhwEIfKO97v//8E4YE76gUJQAQVoKAVGgEiUAgpwUA6CgFE4BJFgpKwUJwkFLNASRoKRYkSs4lppFFiSTHEtNRAQcEQVBUs//NCxP8Zw2j8AklZXBoRPO/+WhosdBoeGhC4GioaBUYHRKdDRYGhK8FYdEzyWIv//8tlTtVCQGGRATmD7JMFRkkNM7jRCIjjcJwfGtq6njSFY6uw0qhlL/8pM1JlJv/zWGtz8mWR5Ya5//NAxPQX0QIEADJMQMuZGrA6hq1I/uZNZah///0mWOKChBYkUAgwkWglNNNCWVUUGRFslxl/S5IwA6kMUx0hgTQgbmkKHJWCAqYgWdE4hyO0YvaMiJjqhC4CESKIXEHVTbOEEZ4LgGT/80LE7xfI8hAAMYwAFvjSZAjh5nGp6PZmwuiopuWVWatJezOVyqHEB50CmvsD0jIRRIVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DE6xVSUZQoSM05VVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsTwF6DUiCjGskRVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAAAAAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
  sil:"//NAxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEWwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="
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
// 9. INICIALIZACIÓN DIRECTA
// ==========================================
if("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

load();
checkImport();
if(window.addEventListener) window.addEventListener("hashchange", checkImport);

// Asignación directa sin esperar DOMContentLoaded (porque el script está al final)
$("go").onclick = () => begin();
$("stop").onclick = stopAll;
