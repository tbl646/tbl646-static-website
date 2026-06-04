const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 650;

const gravity = 0.4;
const jumpForce = -10;

let score = 0;

const player = {
  x: 250,
  y: 500,
  width: 35,
  height: 35,
  dx: 0,
  dy: 2
};

let platforms = [];
let bullets = [];
let enemies = [];

// ---------------- CREATE START ----------------
function createPlatforms() {
  platforms = [];

  platforms.push({
    x: 200,
    y: 600,
    width: 140,
    height: 12
  });

  let lastX = 200;
  let y = 600;

  for (let i = 0; i < 8; i++) {
    y -= 85;

    let newX = getReachableX(lastX, 120);
    platforms.push({
      x: newX,
      y: y,
      width: 70,
      height: 12
    });

    lastX = newX;
  }
}

// ✅ CORE FIX: always reachable X
function getReachableX(prevX, maxJump) {
  let newX = prevX + (Math.random() * maxJump - maxJump / 2);
  return Math.max(0, Math.min(canvas.width - 70, newX));
}

function spawnEnemy(y, speed) {
  enemies.push({
    x: Math.random() * (canvas.width - 30),
    y: y,
    width: 30,
    height: 30,
    dx: speed * (Math.random() < 0.5 ? 1 : -1)
  });
}

// ---------------- CONTROLS ----------------
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") player.dx = -6;
  if (e.key === "ArrowRight") player.dx = 6;

  if (e.key === " ") {
    bullets.push({
      x: player.x + 15,
      y: player.y,
      dy: -9
    });
  }
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.dx = 0;
  }
});

// ---------------- UPDATE ----------------
function update() {
  player.dy += gravity;
  player.y += player.dy;
  player.x += player.dx;

  // Wrap
  if (player.x > canvas.width) player.x = 0;
  if (player.x < 0) player.x = canvas.width;

  // Platform collision
  platforms.forEach(p => {
    if (
      player.dy > 0 &&
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + player.dy
    ) {
      player.dy = jumpForce;
    }
  });

  // Scroll
  if (player.y < 300) {
    let diff = 300 - player.y;
    player.y = 300;

    platforms.forEach(p => p.y += diff);
    enemies.forEach(e => e.y += diff);
    bullets.forEach(b => b.y += diff);

    score += Math.floor(diff);
  }

  // Remove old
  platforms = platforms.filter(p => p.y < canvas.height);

  // ✅ Difficulty scaling (SAFE)
  let difficulty = Math.min(score / 3000, 1);

  let gap = 80 + difficulty * 40;
  let width = 70 - difficulty * 20;

  // ✅ CRITICAL FIX: limit horizontal distance
  let maxJump = 120 + difficulty * 30; // capped, safe growth

  let enemyChance = 0.15 + difficulty * 0.4;
  let enemySpeed = 1 + difficulty * 2;

  // Generate new platforms
  let highest = platforms.reduce((min, p) => Math.min(min, p.y), canvas.height);

  while (highest > -100) {
    let last = platforms[platforms.length - 1];

    let newX = getReachableX(last.x, maxJump);

    let newY = highest - gap;

    platforms.push({
      x: newX,
      y: newY,
      width: width,
      height: 12
    });

    if (Math.random() < enemyChance) {
      spawnEnemy(newY - 40, enemySpeed);
    }

    highest = newY;
  }

  // Bullets
  bullets.forEach(b => b.y += b.dy);
  bullets = bullets.filter(b => b.y > -20);

  // Enemies
  enemies.forEach(e => {
    e.x += e.dx;
    if (e.x <= 0 || e.x + e.width >= canvas.width) {
      e.dx *= -1;
    }
  });

  // Bullet collision
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x > e.x &&
        b.x < e.x + e.width &&
        b.y > e.y &&
        b.y < e.y + e.height
      ) {
        bullets.splice(bi, 1);
        enemies.splice(ei, 1);
        score += 50;
      }
    });
  });

  // Player collision
  enemies.forEach(e => {
    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      gameOver();
    }
  });

  if (player.y > canvas.height) {
    gameOver();
  }
}

function gameOver() {
  alert("Game Over! Score: " + score);
  reset();
}

// ---------------- DRAW ----------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Platforms
  platforms.forEach(p => {
    ctx.fillStyle = "#654321";
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(p.x, p.y, p.width, 4);
  });

  // Bullets
  bullets.forEach(b => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = "#8e44ad";
    ctx.beginPath();
    ctx.arc(e.x + 15, e.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
  });

  // Score
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText("Score: " + score, 10, 25);
}

// ---------------- RESET ----------------
function reset() {
  score = 0;

  player.x = canvas.width / 2;
  player.y = 500;
  player.dy = 2;

  bullets = [];
  enemies = [];

  createPlatforms();
}

// ---------------- LOOP ----------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();