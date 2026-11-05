// ===== محرك قوانين العالم =====
class GameEngineCore {
  constructor() {
    this.sovereignKing = { name: "الملك المطلق", power: 10000, isAlive: true };
    this.nobleGuardian = { name: "رايدن - الخادم النبيل", power: 5000, isAlive: true, isPure: true };
    this.vanguardGuardians = [
      { name: "فالكون", role: "الاستراتيجي", isAlive: true, stone: true },
      { name: "سيلين", role: "الطبيبة", isAlive: true, stone: true },
      { name: "غورم", role: "البربري", isAlive: true, stone: true },
      { name: "كاين", role: "سفاح الفراغ", isAlive: true, stone: true },
      { name: "مورغانا", role: "ساحرة الفناء", isAlive: true, stone: true },
      { name: "درك", role: "قناص الأبعاد", isAlive: true, stone: true }
    ];
    this.stones = { king: 1, vanguard: 6 };
    this.isSecretExposed = false;
    this.log = ["بدأت الأرض المنسية بالتنفس..."];
  }

  // سقوط القلعة: موت الملك أو النبيل
  checkCastleSurvival() {
    return this.sovereignKing.isAlive && this.nobleGuardian.isAlive;
  }

  // استخدام سحر أسود: إعدام فوري وامتصاص الطاقة
  onVanguardUseBlackMagic(index) {
    const v = this.vanguardGuardians[index];
    if (!v || !v.isAlive) return;
    v.isAlive = false;
    this.nobleGuardian.power += 500;
    this.log.push(`⚠️ ${v.name} استخدم سحراً أسود. أعدمه النبيل!`);
  }

  // موت النبيل = خسارة نصف قوة الملك ثم سقوط القلعة
  killNoble() {
    this.nobleGuardian.isAlive = false;
    this.sovereignKing.power = Math.floor(this.sovereignKing.power / 2);
    this.log.push("💀 سقط الخادم النبيل! سقطت القلعة.");
  }
}

// ===== العرض =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const game = new GameEngineCore();

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
}
addEventListener("resize", resize);
resize();

function draw() {
  const w = canvas.width, h = canvas.height, s = devicePixelRatio;
  ctx.fillStyle = "#07060b";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.fillStyle = "#b02a3a";
  ctx.font = `bold ${28 * s}px sans-serif`;
  ctx.fillText("أطياف الجحيم", w / 2, 60 * s);
  ctx.fillStyle = "#8a8296";
  ctx.font = `${16 * s}px sans-serif`;
  ctx.fillText("كسر الوجود", w / 2, 88 * s);

  const alive = game.checkCastleSurvival();
  ctx.fillStyle = alive ? "#6fd3a0" : "#e5484d";
  ctx.fillText(alive ? "القلعة صامدة" : "القلعة ساقطة", w / 2, 130 * s);

  ctx.fillStyle = "#d8d3e2";
  ctx.fillText(`الملك: ${game.sovereignKing.power}  |  النبيل: ${game.nobleGuardian.power}`, w / 2, 165 * s);

  game.vanguardGuardians.forEach((v, i) => {
    ctx.fillStyle = v.isAlive ? "#d8d3e2" : "#5a5466";
    ctx.fillText(`${v.name} - ${v.role}`, w / 2, (210 + i * 30) * s);
  });

  ctx.fillStyle = "#8a8296";
  ctx.font = `${13 * s}px sans-serif`;
  game.log.slice(-3).forEach((l, i) => ctx.fillText(l, w / 2, h - (70 - i * 22) * s));

  requestAnimationFrame(draw);
}
draw();

// اختبار سريع: المس الشاشة لتجرب عقوبة السحر الأسود
canvas.addEventListener("pointerdown", () => {
  const i = game.vanguardGuardians.findIndex(v => v.isAlive);
  if (i >= 0) game.onVanguardUseBlackMagic(i);
});
