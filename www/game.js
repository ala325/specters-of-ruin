"use strict";
const C = document.getElementById("game");
const ctx = C.getContext("2d");
if (!ctx.roundRect) ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };

// ================= الشاشة الأفقية =================
const DW = 960, DH = 440;
let scale = 1, ox = 0, oy = 0, dpr = 1, portrait = false;
function resize() {
  dpr = window.devicePixelRatio || 1;
  const w = innerWidth, h = innerHeight;
  C.width = Math.floor(w * dpr); C.height = Math.floor(h * dpr);
  scale = Math.min(w / DW, h / DH);
  ox = (w - DW * scale) / 2; oy = (h - DH * scale) / 2;
  portrait = h > w;
}
addEventListener("resize", resize); resize();

// ================= البيانات =================
const CASTLES = [
  { n: "ناهيك الأبدي", r: "عرش الفراغ المطلق", c: "#8a8aa0", p: "السور +30%", def: 1.3 },
  { n: "فولكار قاطع الأبعاد", r: "المقبرة المعلّقة", c: "#c0392b", p: "الهجوم +25%", atk: 1.25 },
  { n: "أوريون مهندس الواقع", r: "كاتدرائية الدم المتجمد", c: "#4aa3df", p: "الأرواح +15%", soul: 1.15 },
  { n: "أستاروث جزار الأرواح", r: "غابة الأطراف", c: "#8e44ad", p: "الغنائم +30%", loot: 1.3 },
  { n: "مورفيوس صانع الموت", r: "حفرة طاحونة الأرواح", c: "#7cb518", p: "هجوم +15% وأرواح +10%", atk: 1.15, soul: 1.1 },
  { n: "فاليريان ملك الأطياف", r: "برج المسلوخين", c: "#9fb4c7", p: "صلابة الجنود +20%", hp: 1.2 },
  { n: "إغنيس صانع الجحيم", r: "مذبح الرحم المنسي", c: "#2e86de", p: "الهجوم +20%", atk: 1.2 },
  { n: "كريون سيد الصمت", r: "صحراء الرماد", c: "#b8a07e", p: "قدرات الخدم أسرع 20%", cd: 0.8 },
  { n: "عشتار ملكة الدم", r: "المدينة المتعفنة", c: "#e84393", p: "شفاء الجيش +50%", heal: 1.5 },
  { n: "زاكست الحاكم المنسي", r: "اللب المحطّم", c: "#e67e22", p: "الأرواح +25%", soul: 1.25 }
];
const SERV = [
  { n: "فالكون", role: "حكيم الأزمنة", ab: "عين البصيرة: يرفع هجوم الجيش 30% لمدة 5 ثوانٍ", cd: 6, c: "#e5c07b" },
  { n: "سيلين", role: "طبيبة الدم", ab: "قلب المعركة: تصب الدم في عروق الجنود فتشفيهم", cd: 5, c: "#e84393" },
  { n: "غورم", role: "البربري", ab: "الهاوية الهائجة: ضربة ساحقة تحطم الدروع", cd: 4, c: "#d35400" },
  { n: "كاين", role: "سفاح الفراغ", ab: "التلاشي المطلق: اغتيال صامت بضربة واحدة", cd: 8, c: "#6c5ce7" },
  { n: "مورغانا", role: "ساحرة الفناء", ab: "ترنيمة العذاب: سم بطيء يأكل العدو", cd: 7, c: "#a29bfe" },
  { n: "درك", role: "قناص الأبعاد", ab: "عين الفراغ: رماية سريعة تخترق الأسوار", cd: 3, c: "#00cec9" }
];
const BLD = [
  { id: "soulwell", n: "بئر الأرواح", d: "ينتج الأرواح كل ثانية", cost: 60 },
  { id: "barracks", n: "الثكنة", d: "يرفع سعة الجيش", cost: 80 },
  { id: "forge", n: "المصهر الملعون", d: "يرفع هجوم الجنود 12% لكل مستوى", cost: 100 },
  { id: "wall", n: "السور الأسود", d: "يرفع الدفاع ضد الغارات", cost: 90 },
  { id: "vault", n: "خزنة الأحجار", d: "تزيد سعة الأرواح وتحمي الغنائم من النهب", cost: 120 }
];
const STORY = [
  "في أقصى غياهب الكون المظلم تقع الأرض المنسية، مزرعة عملاقة لامتصاص الأرواح يحكمها عشرة ملوك أزليين.",
  "الملك وخادمه النبيل هما قلب القلب النقي: إذا سقط أحدهما سقطت القلعة وتحولت الأرض إلى خراب. النبيل بلا حجر ولا يُغوى، ومن لمس السحر الأسود من الخدم مزّقه في لحظة.",
  "الأحجار السبعة هي سرّ القوة: حجر للملك وستة للخدم. ومن يسرقها كلها قد يكسر سرّ النبيل ويولد ملكاً مزيفاً يبتلع الوجود."
];
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 137) % 960, y: 44 + ((i * 89) % 220), r: (i % 3) * 0.5 + 0.7 }));

// ================= الحالة والحفظ =================
const KEY = "specters_save_v1";
let S = null, screen = "menu", ov = null, M = null, BT = null, selSv = 0, toasts = [], time = 0, btns = [], hasSave = false, saveTimer = 0;

function load() { try { const j = localStorage.getItem(KEY); return j ? JSON.parse(j) : null; } catch (e) { return null; } }
function save() { try { S.t = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); hasSave = true; } catch (e) {} }
hasSave = !!load();

function fresh(c, keep) {
  return {
    castle: c, souls: 200, bones: 0, soldiers: 6, noble: 5000, king: 10000, wins: 0, kills: 0, pact: false,
    lv: { soulwell: 1, barracks: 1, forge: 1, wall: 1, vault: 1 },
    sv: SERV.map(() => ({ lv: 1, alive: true, broken: false })),
    raidT: 120, spyT: 75, t: Date.now(),
    fx: keep ? keep.fx : true, vib: keep ? keep.vib : true, speed: keep ? keep.speed : 1
  };
}
function perk(k) { return CASTLES[S.castle][k] || 1; }
function cap() { return 600 + 400 * S.lv.vault; }
function rate() { return (1 + 2.5 * S.lv.soulwell) * perk("soul"); }
function maxArmy() { return 10 + 10 * S.lv.barracks; }
function atkMul() { return (1 + 0.12 * S.lv.forge) * perk("atk"); }
function stonesHeld() { return 1 + S.sv.filter(s => s.alive).length; }
function fmt(n) { return Math.floor(n).toLocaleString("en"); }
function vib() { if (S && S.vib && navigator.vibrate) navigator.vibrate(40); }
function toast(t) { toasts.push({ t, l: 5 }); if (toasts.length > 4) toasts.shift(); vib(); }

// ================= منطق اللعبة =================
function economy(dt) {
  S.souls = Math.min(cap(), S.souls + rate() * dt);
  S.raidT -= dt; S.spyT -= dt;
  if (S.raidT <= 0) { S.raidT = 110 + Math.random() * 40; raid(); }
  if (S.spyT <= 0) { S.spyT = 90 + Math.random() * 60; spy(); }
}
function raid() {
  const power = 60 + S.wins * 45;
  const def = S.soldiers * 8 * (1 + 0.15 * S.lv.wall) * perk("def") + S.lv.wall * 30;
  if (def >= power) { S.bones += 2; toast("🛡 صدّ الجيش غارة الوحوش (+2 عظام)"); }
  else {
    const loss = Math.floor(S.souls * 0.25 * (1 - Math.min(0.5, 0.1 * S.lv.vault)));
    S.souls -= loss; toast("☠ غارة مظلمة نهبت " + loss + " روح! قوّ السور والجيش");
  }
}
function spy() {
  S.kills++; S.noble += 100; S.bones += 3;
  toast("👁 شبح ملك ساقط تسلل وعرض الأحجار على النبيل... فمزّقه بضربة واحدة (+3 عظام)");
}
function applyOffline() {
  const el = Math.min((Date.now() - S.t) / 1000, 28800);
  if (el > 30) { S.souls = Math.min(cap(), S.souls + rate() * el); toast("الأرواح تراكمت أثناء غيابك"); }
}
function costB(id) { return Math.floor(BLD.find(b => b.id === id).cost * Math.pow(1.8, S.lv[id])); }
function upgrade(id) {
  const c = costB(id);
  if (S.lv[id] >= 6) { toast("وصل للحد الأقصى"); return; }
  if (S.souls < c) { toast("الأرواح لا تكفي"); return; }
  S.souls -= c; S.lv[id]++; save(); openBuilding(id);
}
function train(n) {
  n = Math.min(n, maxArmy() - S.soldiers, Math.floor(S.souls / 12));
  if (n <= 0) { toast("لا يمكن التدريب الآن"); return; }
  S.souls -= 12 * n; S.soldiers += n; save(); openArmy();
}
function upgradeSv(i) {
  const s = S.sv[i], cs = 80 * s.lv, cb = 4 * s.lv;
  if (s.lv >= 10) { toast("الحد الأقصى"); return; }
  if (S.souls < cs || S.bones < cb) { toast("الأرواح أو العظام لا تكفي"); return; }
  S.souls -= cs; S.bones -= cb; s.lv++; s.broken = false; save();
}
function reviveSv(i) {
  if (S.souls < 150) { toast("البعث يحتاج 150 روح"); return; }
  S.souls -= 150; S.sv[i].alive = true; S.sv[i].broken = true; toast(SERV[i].n + " عاد بقوة مكسورة"); save();
}
function blackMagic(i) {
  const s = S.sv[i]; if (!s.alive) return;
  s.alive = false; S.noble += 500; S.pact = true;
  toast("⚠ " + SERV[i].n + " استخدم سحراً أسود! أعدمه النبيل. الميثاق الدموي مفعّل: ضرر ×1.6 في المعركة القادمة");
  save();
}

// ================= المعركة =================
function enemiesList() { return CASTLES.filter((_, i) => i !== S.castle).slice(0, 8); }
function startBattle(i) {
  if (S.soldiers < 1) { toast("لا جنود! درّب جيشك أولاً"); return; }
  const unit = 20 * perk("hp"), hp = 350 * Math.pow(1.75, i);
  BT = { i, e: enemiesList()[i], hp, max: hp, hp0: hp, dmg: 11 * Math.pow(1.6, i), unit,
    army: S.soldiers * unit, armyMax: S.soldiers * unit, cd: S.sv.map(() => 2),
    buff: 0, dot: 0, dotv: 0, t: 0, done: false, res: "", noble: false, nobleT: 0, floats: [] };
  ov = null; M = null; screen = "battle";
}
function fire(i, s) {
  const b = BT, m = (1 + 0.2 * (s.lv - 1)) * (s.broken ? 0.4 : 1), pm = S.pact ? 1.6 : 1;
  const fl = (t) => b.floats.push({ x: 660 + Math.random() * 150, y: 230 + Math.random() * 50, t, c: SERV[i].c, l: 1.2 });
  if (i === 0) { b.buff = 5; fl("هجوم +30%"); }
  else if (i === 1) { const h = 45 * m * perk("heal"); b.army = Math.min(b.armyMax, b.army + h); fl("+" + Math.floor(h) + " شفاء"); }
  else if (i === 2) { const d = 70 * m * pm; b.hp -= d; fl("-" + Math.floor(d)); }
  else if (i === 3) { const d = 160 * m * pm; b.hp -= d; fl("اغتيال -" + Math.floor(d)); }
  else if (i === 4) { b.dot = 4; b.dotv = 22 * m * pm; fl("سم"); }
  else { const d = 40 * m * pm; b.hp -= d; fl("-" + Math.floor(d)); }
}
function updateBattle(dt) {
  const b = BT; if (!b || b.done) return;
  b.floats.forEach(f => { f.y -= 25 * dt; f.l -= dt; });
  b.floats = b.floats.filter(f => f.l > 0);
  if (b.noble) {
    b.nobleT += dt; b.hp = Math.max(0, b.hp0 * (1 - b.nobleT / 2.5));
    if (b.nobleT >= 2.5) finishBattle(true);
    return;
  }
  b.t += dt;
  const sold = Math.ceil(b.army / b.unit), pm = S.pact ? 1.6 : 1;
  b.hp -= sold * 1.6 * atkMul() * (b.buff > 0 ? 1.3 : 1) * pm * dt;
  if (b.dot > 0) b.hp -= b.dotv * dt;
  b.dot -= dt; b.buff -= dt; b.army -= b.dmg * dt;
  S.sv.forEach((s, i) => {
    if (!s.alive) return;
    b.cd[i] -= dt;
    if (b.cd[i] <= 0) { b.cd[i] = SERV[i].cd * perk("cd"); fire(i, s); }
  });
  if (b.hp <= 0) finishBattle(false);
  else if (b.army <= 0) { b.noble = true; b.nobleT = 0; b.hp0 = b.hp; S.sv.forEach(s => s.alive = false); vib(); }
}
function finishBattle(noble) {
  const b = BT; b.done = true; b.noble = noble; b.hp = 0;
  const f = noble ? 0.5 : 1;
  const souls = Math.floor(120 * Math.pow(1.6, b.i) * perk("loot") * f * (1 + 0.1 * S.lv.vault));
  const bones = Math.floor((3 + 2 * b.i) * f);
  S.souls += souls; S.bones += bones;
  S.soldiers = noble ? 0 : Math.max(0, Math.ceil(b.army / b.unit));
  if (b.i === S.wins) S.wins++;
  S.noble += 50; S.pact = false;
  b.res = (noble
    ? "سقط الجيش والخدم الستة. تدخّل رايدن كجيش فردي وسحق العدو.\nيمكنك بعث الخدم بقوة مكسورة."
    : "نصر! بقي " + S.soldiers + " جندي.") + "\nالغنائم: " + fmt(souls) + " روح و " + bones + " عظام";
  save();
}

// ================= النوافذ =================
function closeM() { M = null; }
function openBuilding(id) {
  const b = BLD.find(x => x.id === id), c = costB(id), lv = S.lv[id];
  const eff = { soulwell: "الإنتاج: " + rate().toFixed(1) + " روح/ثانية", barracks: "سعة الجيش: " + maxArmy(),
    forge: "مضاعف الهجوم: ×" + atkMul().toFixed(2), wall: "قوة الدفاع: " + Math.floor(S.soldiers * 8 * (1 + 0.15 * S.lv.wall) * perk("def") + S.lv.wall * 30),
    vault: "سعة الأرواح: " + fmt(cap()) }[id];
  M = { title: b.n + "  (المستوى " + lv + " / 6)", lines: [b.d, eff],
    buttons: [{ l: lv >= 6 ? "أقصى مستوى" : "ترقية: " + c + " روح", fn: () => upgrade(id), ok: lv < 6 && S.souls >= c }] };
}
function openThrone() {
  const c = CASTLES[S.castle];
  M = { title: "عرش " + c.n, lines: [c.r, "ميزة القلعة: " + c.p, "قوة الملك: " + fmt(S.king) + "  |  الأحجار: " + stonesHeld() + " / 7",
    "الملك والنبيل هما قلب القلب النقي: سقوط أحدهما يعني سقوط القلعة."], buttons: [] };
}
function openTower() {
  M = { title: "برج رايدن - الخادم النبيل", lines: ["القوة: " + fmt(S.noble) + " (ويمتص طاقة كل خائن)",
    "لا يملك حجراً ولا يُغوى. أي سحر أسود بين الخدم يعدمه فوراً.",
    "الجواسيس الذين مزّقهم: " + S.kills,
    "إن سقط الجيش والخدم يقاتل وحده كجيش فردي، ولا يُهزم إلا بطقس الأحجار السبعة."], buttons: [] };
}
function openArmy() {
  M = { title: "الجيش", lines: ["الجنود: " + S.soldiers + " / " + maxArmy(), "تكلفة الجندي: 12 روح",
    "كل غزو يكلّفك جنوداً، والنبيل ينقذك إذا أُبيد الجيش."],
    buttons: [{ l: "تدريب 1", fn: () => train(1) }, { l: "تدريب 5", fn: () => train(5) }, { l: "تدريب الأقصى", fn: () => train(999) }] };
}
function openSettings() {
  M = { title: "الإعدادات", lines: ["اللعبة تحفظ تلقائياً كل 10 ثوانٍ."],
    buttons: [
      { l: "المؤثرات: " + (S.fx ? "تشغيل" : "إيقاف"), fn: () => { S.fx = !S.fx; save(); openSettings(); } },
      { l: "الاهتزاز: " + (S.vib ? "تشغيل" : "إيقاف"), fn: () => { S.vib = !S.vib; save(); openSettings(); } },
      { l: "السرعة: ×" + S.speed, fn: () => { S.speed = S.speed % 3 + 1; save(); openSettings(); } },
      { l: "حذف الحفظ", fn: () => { try { localStorage.removeItem(KEY); } catch (e) {} hasSave = false; S = null; M = null; ov = null; screen = "menu"; } }
    ] };
}
function openStory() { M = { title: "الأرض المنسية", lines: STORY, buttons: [] }; }

// ================= الرسم: أدوات =================
function T(s, x, y, size, color, align) { ctx.font = size + "px sans-serif"; ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.fillText(s, x, y); }
function wrap(s, maxW, size) {
  ctx.font = size + "px sans-serif";
  const out = []; let line = "";
  for (const w of s.split(" ")) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function box(x, y, w, h, fill, stroke, lw) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke();
}
function btn(x, y, w, h, l, fn, o) {
  o = o || {}; const ok = o.ok !== false;
  box(x, y, w, h, ok ? (o.bg || "#2a1620") : "#15121d", ok ? (o.bd || "#b02a3a") : "#3a3347");
  T(l, x + w / 2, y + h / 2 + 5, o.fs || 15, ok ? "#e8e3f0" : "#6b647a");
  if (ok) btns.push({ x, y, w, h, fn });
}
function hot(x, y, w, h, fn) { btns.push({ x, y, w, h, fn }); }

// ================= الرسم: القلعة =================
function drawBld(b, x, y, w, h, lv) {
  const cc = CASTLES[S.castle].c, cx = x + w / 2, p = 0.5 + 0.5 * Math.sin(time * 3 + x);
  ctx.lineWidth = 1.5; ctx.strokeStyle = cc;
  if (b.id === "soulwell") {
    ctx.fillStyle = "#10241c"; ctx.beginPath(); ctx.ellipse(cx, y + 58, 46, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(92,255,176," + (0.35 + 0.3 * p) + ")"; ctx.beginPath(); ctx.ellipse(cx, y + 55, 34, 10, 0, 0, 7); ctx.fill();
    for (let k = 0; k < 3; k++) ctx.fillRect(cx - 14 + k * 14, y + 50 - ((time * 20 + k * 20) % 50), 3, 3);
  } else if (b.id === "barracks") {
    box(x + 8, y + 22, w - 16, h - 22, "#241a2e", cc);
    ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(cx, y + 2); ctx.lineTo(x + w, y + 24); ctx.fill();
    ctx.fillStyle = "#000"; ctx.fillRect(cx - 8, y + 44, 16, 28);
    ctx.fillStyle = "#e5484d"; ctx.fillRect(x + w - 14, y - 8, 14, 9); ctx.fillRect(x + w - 15, y - 8, 1, 30);
  } else if (b.id === "forge") {
    box(x + 6, y + 26, w - 12, h - 26, "#2a1a14", cc);
    ctx.fillStyle = "#2a1a14"; ctx.fillRect(x + w - 30, y, 14, 30);
    ctx.fillStyle = "rgba(255," + (120 + 60 * p) + ",30,.9)"; ctx.beginPath(); ctx.arc(cx, y + 56, 12 + 3 * p, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(120,120,120,.4)"; ctx.beginPath(); ctx.arc(x + w - 23, y - 6 - (time * 10 % 14), 7, 0, 7); ctx.fill();
  } else if (b.id === "wall") {
    box(x, y + 24, w, h - 24, "#1d1a26", cc);
    ctx.fillStyle = "#1d1a26"; for (let k = 0; k < 5; k++) ctx.fillRect(x + 4 + k * 20, y + 12, 12, 14);
    ctx.fillStyle = "#000"; ctx.fillRect(cx - 9, y + 46, 18, 26);
  } else {
    ctx.fillStyle = "#17233a"; ctx.beginPath(); ctx.arc(cx, y + 50, 40, Math.PI, 0); ctx.lineTo(x + w, y + 72); ctx.lineTo(x, y + 72); ctx.fill(); ctx.stroke();
    T("◆", cx, y + 62, 24, "rgba(74,163,223," + (0.6 + 0.4 * p) + ")");
  }
  T("م" + lv, cx, y - 14, 13, "#e5c07b");
  T(b.n, cx, y + h + 22, 13, "#d8d3e2");
}
function drawCastle() {
  const cc = CASTLES[S.castle].c;
  const g = ctx.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, "#04030a"); g.addColorStop(1, "#16112a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, DW, DH);
  STARS.forEach(s => { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + s.x); ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y, s.r, s.r); });
  ctx.globalAlpha = 0.18; ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(880, 100, 62, 0, 7); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = "#d9d4e6"; ctx.beginPath(); ctx.arc(880, 100, 28, 0, 7); ctx.fill();
  // الجبال
  ctx.fillStyle = "#0d0a16"; ctx.beginPath(); ctx.moveTo(0, 335);
  [[100, 250], [220, 300], [340, 230], [470, 300], [600, 240], [720, 300], [850, 235], [960, 290]].forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(960, 335); ctx.fill();
  // السور الخلفي ويختلف شكله حسب القلعة
  const step = 16 + (S.castle % 3) * 6;
  ctx.fillStyle = "#0f0c18"; ctx.fillRect(0, 215, DW, 120);
  for (let x = 0; x < DW; x += step * 2) ctx.fillRect(x, 203, step, 13);
  [150, 330, 800].forEach((x, i) => {
    const h = 40 + ((S.castle * 7 + i * 13) % 40);
    ctx.fillStyle = "#0f0c18"; ctx.fillRect(x - 12, 215 - h, 24, h);
    ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(x - 16, 215 - h); ctx.lineTo(x, 215 - h - 26 - (S.castle % 4) * 6); ctx.lineTo(x + 16, 215 - h); ctx.fill();
  });
  ctx.fillStyle = "#0a0810"; ctx.fillRect(0, 335, DW, 105);
  ctx.strokeStyle = cc; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(0, 335); ctx.lineTo(DW, 335); ctx.stroke(); ctx.globalAlpha = 1;
  // العرش
  box(440, 105, 120, 110, "#1a1426", cc, 2);
  ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(430, 105); ctx.lineTo(500, 48); ctx.lineTo(570, 105); ctx.fill();
  T("♛", 500, 170, 38, "#e5c07b"); T("العرش", 500, 238, 13, "#d8d3e2");
  hot(430, 48, 140, 170, openThrone);
  // برج النبيل
  box(640, 60, 70, 155, "#c9d1e4", "#ffffff", 2);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(632, 60); ctx.lineTo(675, 22); ctx.lineTo(718, 60); ctx.fill();
  ctx.fillStyle = "rgba(125,249,198," + (0.6 + 0.4 * Math.sin(time * 3)) + ")"; ctx.beginPath(); ctx.arc(675, 40, 8, 0, 7); ctx.fill();
  T("برج النبيل", 675, 238, 13, "#d8d3e2");
  hot(632, 22, 86, 195, openTower);
  // المباني
  BLD.forEach((b, i) => { const x = 170 + i * 140; drawBld(b, x, 270, 100, 72, S.lv[b.id]); hot(x - 10, 250, 120, 110, () => openBuilding(b.id)); });
  // الضباب
  if (S.fx) for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.05; ctx.fillStyle = "#cfd6e6"; ctx.beginPath(); ctx.ellipse((time * 14 + i * 190) % 1100 - 70, 372 + (i % 3) * 14, 110, 20, 0, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  // الشريط العلوي
  ctx.fillStyle = "#0b0914"; ctx.fillRect(0, 0, DW, 40); ctx.fillStyle = "#3a3347"; ctx.fillRect(0, 40, DW, 1);
  T("☠ " + fmt(S.souls) + " / " + fmt(cap()), 200, 26, 15, "#6fd3a0");
  T("🦴 " + S.bones, 360, 26, 15, "#d8d3e2");
  T("💎 " + stonesHeld() + " / 7", 480, 26, 15, "#4aa3df");
  T("⚔ " + S.soldiers + " / " + maxArmy(), 610, 26, 15, "#e5c07b");
  T(CASTLES[S.castle].n, 830, 26, 15, cc);
  // القائمة اليسرى
  ctx.fillStyle = "#0b0914"; ctx.fillRect(0, 41, 110, 399);
  [["الخدم", () => { ov = "servants"; }], ["الجيش", openArmy], ["غزو", () => { ov = "attack"; }],
   ["إعدادات", openSettings], ["القائمة", () => { save(); screen = "menu"; }]]
    .forEach((m, i) => btn(8, 54 + i * 66, 94, 54, m[0], m[1]));
}

// ================= الرسم: النوافذ =================
function drawServants() {
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, DW, DH);
  box(130, 50, 810, 380, "#0e0b16", "#3a3347");
  T("الخدم الستة", 535, 84, 22, "#e5c07b");
  btn(140, 58, 44, 30, "×", () => { ov = null; }, { fs: 20 });
  S.sv.forEach((s, i) => {
    const x = 150 + (i % 3) * 265, y = 100 + Math.floor(i / 3) * 95;
    box(x, y, 250, 84, s.alive ? "#15121d" : "#0b0910", i === selSv ? "#e5c07b" : (s.alive ? SERV[i].c : "#3a3347"), 2);
    T(SERV[i].n + " - " + SERV[i].role, x + 125, y + 30, 15, s.alive ? "#e8e3f0" : "#6b647a");
    T(s.alive ? "المستوى " + s.lv + (s.broken ? " (مكسور)" : "") : "أُعدم / سقط", x + 125, y + 58, 13, s.alive ? "#8a8296" : "#e5484d");
    hot(x, y, 250, 84, () => { selSv = i; });
  });
  const s = S.sv[selSv], d = SERV[selSv];
  T(d.ab, 535, 318, 14, "#d8d3e2");
  T("القوة: " + Math.floor(100 * (1 + 0.2 * (s.lv - 1)) * (s.broken ? 0.4 : 1)) + "   |   ترقية: " + 80 * s.lv + " روح + " + 4 * s.lv + " عظام", 535, 344, 13, "#8a8296");
  if (s.alive) {
    btn(160, 366, 240, 44, "ترقية / تدريب", () => upgradeSv(selSv), { ok: s.lv < 10 && S.souls >= 80 * s.lv && S.bones >= 4 * s.lv });
    btn(420, 366, 240, 44, "سحر أسود (إعدام +ميثاق)", () => blackMagic(selSv), { bg: "#3b1219" });
  } else btn(160, 366, 240, 44, "بعث مكسور (150 روح)", () => reviveSv(selSv), { ok: S.souls >= 150 });
  if (S.pact) T("الميثاق الدموي مفعّل", 800, 392, 13, "#e5484d");
}
function drawAttack() {
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, DW, DH);
  box(130, 50, 810, 380, "#0e0b16", "#3a3347");
  T("غزو عروش الملوك", 535, 84, 22, "#e5c07b");
  btn(140, 58, 44, 30, "×", () => { ov = null; }, { fs: 20 });
  enemiesList().forEach((e, i) => {
    const x = 148 + (i % 4) * 196, y = 104 + Math.floor(i / 4) * 150, lock = i > S.wins;
    box(x, y, 186, 138, lock ? "#0b0910" : "#15121d", lock ? "#3a3347" : e.c, 2);
    T(e.n, x + 93, y + 28, 14, lock ? "#6b647a" : "#e8e3f0");
    T(e.r, x + 93, y + 50, 11, "#8a8296");
    T(lock ? "🔒 مغلق" : "القوة " + fmt(350 * Math.pow(1.75, i)), x + 93, y + 76, 13, lock ? "#6b647a" : "#e5484d");
    T(lock ? "" : "غنائم ~" + fmt(120 * Math.pow(1.6, i) * perk("loot")), x + 93, y + 98, 12, "#6fd3a0");
    if (!lock) hot(x, y, 186, 138, () => startBattle(i));
  });
  T("جنودك: " + S.soldiers + (S.pact ? "   |   الميثاق الدموي ×1.6" : ""), 535, 412, 14, "#d8d3e2");
}
function drawModal() {
  ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(0, 0, DW, DH);
  const x = 190, y = 40, w = 580, h = 360;
  box(x, y, w, h, "#0e0b16", "#b02a3a", 2);
  T(M.title, x + w / 2, y + 38, 22, "#e5c07b");
  let ly = y + 74;
  M.lines.forEach(l => { wrap(l, w - 70, 15).forEach(s => { T(s, x + w / 2, ly, 15, "#d8d3e2"); ly += 22; }); ly += 6; });
  const bs = M.buttons.concat([{ l: "إغلاق", fn: closeM }]), rows = Math.ceil(bs.length / 3);
  bs.forEach((b, k) => {
    const r = Math.floor(k / 3), inRow = Math.min(3, bs.length - r * 3), c = k % 3;
    const bx = x + w / 2 - (inRow * 180) / 2 + c * 180 + 5, by = y + h - 20 - (rows - r) * 52 + 6;
    btn(bx, by, 170, 42, b.l, b.fn, { ok: b.ok });
  });
}
function drawToasts() {
  toasts.forEach(t => { t.l -= 1 / 60; });
  toasts = toasts.filter(t => t.l > 0);
  toasts.forEach((t, i) => {
    const w = Math.min(780, 40 + t.t.length * 9), y = 50 + i * 34;
    ctx.globalAlpha = Math.min(1, t.l); box(DW / 2 - w / 2, y, w, 28, "#1a0e14", "#b02a3a");
    T(t.t, DW / 2, y + 19, 13, "#e8e3f0"); ctx.globalAlpha = 1;
  });
}

// ================= الرسم: المعركة =================
function drawBattle() {
  const b = BT, cc = b.e.c;
  const g = ctx.createLinearGradient(0, 0, 0, DH); g.addColorStop(0, "#05030a"); g.addColorStop(1, "#1a1020");
  ctx.fillStyle = g; ctx.fillRect(0, 0, DW, DH);
  ctx.globalAlpha = 0.18; ctx.fillStyle = cc; ctx.fillRect(0, 0, DW, DH); ctx.globalAlpha = 1;
  ctx.fillStyle = "#0a0810"; ctx.fillRect(0, 330, DW, 110);
  const shake = S.fx && !b.done ? Math.sin(time * 40) * 2 : 0;
  // الجيش
  const sold = Math.ceil(Math.max(0, b.army) / b.unit);
  const adv = b.noble ? 0 : Math.min(60, b.t * 14);
  for (let k = 0; k < Math.min(sold, 30); k++) {
    const x = 90 + (k % 6) * 24 + adv + Math.sin(time * 6 + k) * 3, y = 250 + Math.floor(k / 6) * 24;
    ctx.fillStyle = CASTLES[S.castle].c; ctx.fillRect(x, y, 12, 16);
    ctx.fillStyle = "#e8e3f0"; ctx.fillRect(x + 3, y - 5, 6, 6);
  }
  // العدو
  const es = b.noble ? Math.max(0.2, b.hp / b.hp0) : 1;
  ctx.save(); ctx.translate(760 + shake, 280); ctx.scale(es, es);
  ctx.fillStyle = cc; ctx.beginPath(); ctx.ellipse(0, 0, 85, 95, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#0a0810"; ctx.beginPath(); ctx.moveTo(-60, -70); ctx.lineTo(-80, -130); ctx.lineTo(-30, -85); ctx.moveTo(60, -70); ctx.lineTo(80, -130); ctx.lineTo(30, -85); ctx.fill();
  ctx.fillStyle = "#ff2a2a"; ctx.beginPath(); ctx.arc(-28, -25, 10, 0, 7); ctx.arc(28, -25, 10, 0, 7); ctx.fill();
  ctx.restore();
  if (b.noble) {
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time * 12); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, DW, DH); ctx.globalAlpha = 1;
    T("رايدن يتدخل: جيش فردي!", DW / 2, 170, 30, "#7df9c6");
  }
  // أشرطة الصحة
  ctx.fillStyle = "#1a1620"; ctx.fillRect(30, 52, 380, 14); ctx.fillRect(550, 52, 380, 14);
  ctx.fillStyle = "#6fd3a0"; ctx.fillRect(30, 52, 380 * Math.max(0, b.army / b.armyMax), 14);
  ctx.fillStyle = "#e5484d"; ctx.fillRect(550, 52, 380 * Math.max(0, b.hp / b.max), 14);
  T("جيشك: " + sold, 220, 46, 13, "#d8d3e2"); T(b.e.n, 740, 46, 13, "#d8d3e2");
  if (S.pact) T("الميثاق الدموي ×1.6", 480, 90, 13, "#e5484d");
  // الخدم
  S.sv.forEach((s, i) => {
    const x = 150 + i * 110, y = 392;
    ctx.strokeStyle = s.alive ? SERV[i].c : "#3a3347"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + (s.alive ? 6.28 * (1 - Math.max(0, b.cd[i]) / (SERV[i].cd * perk("cd"))) : 6.28)); ctx.stroke();
    T(SERV[i].n, x, y + 5, 12, s.alive ? "#e8e3f0" : "#6b647a");
  });
  b.floats.forEach(f => { ctx.globalAlpha = Math.min(1, f.l); T(f.t, f.x, f.y, 16, f.c); ctx.globalAlpha = 1; });
  // أزرار
  btn(850, 6, 100, 30, "×" + S.speed + " سرعة", () => { S.speed = S.speed % 3 + 1; }, { fs: 13 });
  if (!b.done) btn(10, 6, 110, 30, "انسحاب", () => {
    S.soldiers = Math.max(0, Math.ceil(b.army / b.unit)); S.pact = false; BT = null; screen = "castle"; save();
  }, { fs: 13 });
  if (b.done) {
    box(250, 100, 460, 200, "#0e0b16", "#6fd3a0", 2);
    T("النصر", 480, 140, 26, "#6fd3a0");
    b.res.split("\n").forEach((l, k) => T(l, 480, 180 + k * 26, 14, "#d8d3e2"));
    btn(400, 250, 160, 40, "العودة للقلعة", () => { BT = null; screen = "castle"; });
  }
}

// ================= الرسم: القائمة والاختيار =================
function drawMenu() {
  ctx.fillStyle = "#05030a"; ctx.fillRect(0, 0, DW, DH);
  STARS.forEach(s => { ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 2 + s.x); ctx.fillStyle = "#fff"; ctx.fillRect(s.x, s.y - 30, s.r, s.r); });
  ctx.globalAlpha = 1;
  T("أطياف الجحيم", DW / 2, 120, 56, "#b02a3a");
  T("كسر الوجود  -  Specters of Ruin", DW / 2, 160, 18, "#8a8296");
  btn(380, 200, 200, 48, "لعبة جديدة", () => { screen = "select"; });
  btn(380, 262, 200, 48, "متابعة", () => { const s = load(); if (s) { S = s; applyOffline(); screen = "castle"; } }, { ok: hasSave });
  btn(380, 324, 200, 48, "القصة", openStory);
}
function drawSelect() {
  ctx.fillStyle = "#05030a"; ctx.fillRect(0, 0, DW, DH);
  T("اختر قلعتك وعرشك", DW / 2, 40, 24, "#e5c07b");
  btn(10, 10, 90, 32, "رجوع", () => { screen = "menu"; }, { fs: 13 });
  CASTLES.forEach((c, i) => {
    const x = 30 + (i % 5) * 183, y = 70 + Math.floor(i / 5) * 180;
    box(x, y, 172, 165, "#12101a", c.c, 2);
    ctx.fillStyle = c.c; ctx.fillRect(x + 12, y + 12, 148, 8);
    T(c.n, x + 86, y + 52, 14, "#e8e3f0"); T(c.r, x + 86, y + 76, 11, "#8a8296");
    T(c.p, x + 86, y + 108, 12, "#6fd3a0");
    hot(x, y, 172, 165, () => { S = fresh(i, S); screen = "castle"; toast("مرحباً في " + c.r); save(); });
  });
}

// ================= الحلقة الرئيسية =================
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, C.width, C.height);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, DW, DH); ctx.clip();
  btns = [];
  if (screen === "menu") drawMenu();
  else if (screen === "select") drawSelect();
  else if (screen === "castle") drawCastle();
  else if (BT) drawBattle();
  if (ov && screen === "castle") { btns = []; if (ov === "servants") drawServants(); else drawAttack(); }
  if (M) { btns = []; drawModal(); }
  if (S) drawToasts();
  ctx.restore();
  if (portrait) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "rgba(0,0,0,.92)"; ctx.fillRect(0, 0, C.width, C.height);
    ctx.font = (22 * dpr) + "px sans-serif"; ctx.fillStyle = "#e5c07b"; ctx.textAlign = "center";
    ctx.fillText("أدر الهاتف أفقياً لتلعب", C.width / 2, C.height / 2);
  }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  time += dt;
  if (S && screen === "castle") economy(dt * S.speed);
  if (S && screen === "battle" && BT) updateBattle(dt * S.speed);
  if (S && screen !== "menu" && screen !== "select") { saveTimer += dt; if (saveTimer > 10) { saveTimer = 0; save(); } }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

C.addEventListener("pointerdown", e => {
  if (portrait) return;
  const x = (e.clientX - ox) / scale, y = (e.clientY - oy) / scale;
  for (let i = btns.length - 1; i >= 0; i--) {
    const b = btns[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); break; }
  }
});
addEventListener("visibilitychange", () => { if (document.hidden && S) save(); });
