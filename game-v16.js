// ---------------- AUTH ----------------

const CLIENT_ID = "5ug4st6af18cbr90lnu00rcjfo";

const LOGIN_URL =
  "https://auth-90b9b090-5eeb-11f1-92c9-06b8cd3a8a53.auth.ap-southeast-2.amazoncognito.com/login" +
  "?client_id=" + CLIENT_ID +
  "&response_type=token" +
  "&scope=openid+profile+email" +
  "&redirect_uri=https://d2b67n8m66wait.cloudfront.net";

// Get JWT token from Cognito redirect

const hash = window.location.hash;

const token =
  new URLSearchParams(
    hash.substring(1)
  ).get("id_token");

if (token) {
  localStorage.setItem("token", token);
}

// Force login

if (!localStorage.getItem("token")) {
  window.location.href = LOGIN_URL;
}

// ---------------- GAME ----------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 650;

const gravity = 0.4;
const jumpForce = -10;

const API_URL =
  "https://6uzy2f5jz8.execute-api.ap-southeast-2.amazonaws.com/score";

// ---------------- GAME STATE ----------------

let score = 0;
let gameState = "menu";

let leaderboard = [];

// ---------------- PLAYER ----------------

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

// ---------------- BUTTONS ----------------

const buttons = {
  play: {
    x: 170,
    y: 250,
    width: 160,
    height: 50
  },

  playAgain: {
    x: 150,
    y: 320,
    width: 200,
    height: 50
  },

  menu: {
    x: 150,
    y: 390,
    width: 200,
    height: 50
  }
};

// ---------------- SCORE SUBMISSION ----------------

async function sendScore(finalScore) {

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":
          "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({
        score: finalScore
      })
    });

    const data = await response.json();

    console.log("Score submitted:", data);

  } catch (err) {

    console.error("Error submitting score:", err);
  }
}

// ---------------- LOAD LEADERBOARD ----------------

async function loadLeaderboard() {

  try {

    const response = await fetch(API_URL, {
      headers: {
        "Authorization":
          "Bearer " + localStorage.getItem("token")
      }
    });

    const data = await response.json();

    console.log("Leaderboard response:", data);

    leaderboard = data
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log("Leaderboard loaded:", leaderboard);

  } catch (err) {

    console.error("Leaderboard error:", err);
  }
}

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

// ---------------- PLATFORM LOGIC ----------------

function getReachableX(prevX, maxJump) {

  let newX =
    prevX +
    (Math.random() * maxJump - maxJump / 2);

  return Math.max(
    0,
    Math.min(canvas.width - 70, newX)
  );
}

// ---------------- ENEMIES ----------------

function spawnEnemy(y, speed) {

  enemies.push({
    x: Math.random() * (canvas.width - 30),
    y: y,
    width: 30,
    height: 30,
    dx: speed * (Math.random() < 0.5 ? 1 : -1)
  });
}

// ---------------- START GAME ----------------

function startGame() {

  score = 0;

  player.x = canvas.width / 2;
  player.y = 500;

  player.dx = 0;
  player.dy = 2;

  bullets = [];
  enemies = [];

  createPlatforms();

  gameState = "playing";
}

// ---------------- CONTROLS ----------------

document.addEventListener("keydown", e => {

  if (gameState !== "playing") {
    return;
  }

  if (e.key === "ArrowLeft") {
    player.dx = -6;
  }

  if (e.key === "ArrowRight") {
    player.dx = 6;
  }

  if (e.key === " ") {

    bullets.push({
      x: player.x + 15,
      y: player.y,
      dy: -9
    });
  }
});

document.addEventListener("keyup", e => {

  if (
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight"
  ) {
    player.dx = 0;
  }
});

// ---------------- MOUSE ----------------

canvas.addEventListener("click", e => {

  const rect = canvas.getBoundingClientRect();

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (gameState === "menu") {

    if (
      mouseX > buttons.play.x &&
      mouseX < buttons.play.x + buttons.play.width &&
      mouseY > buttons.play.y &&
      mouseY < buttons.play.y + buttons.play.height
    ) {
      startGame();
    }
  }

  if (gameState === "gameover") {

    if (
      mouseX > buttons.playAgain.x &&
      mouseX < buttons.playAgain.x + buttons.playAgain.width &&
      mouseY > buttons.playAgain.y &&
      mouseY < buttons.playAgain.y + buttons.playAgain.height
    ) {
      startGame();
    }

    if (
      mouseX > buttons.menu.x &&
      mouseX < buttons.menu.x + buttons.menu.width &&
      mouseY > buttons.menu.y &&
      mouseY < buttons.menu.y + buttons.menu.height
    ) {

      loadLeaderboard();

      gameState = "menu";
    }
  }
});

// ---------------- UPDATE ----------------

function update() {

  if (gameState !== "playing") {
    return;
  }

  player.dy += gravity;

  player.y += player.dy;
  player.x += player.dx;

  if (player.x > canvas.width) {
    player.x = 0;
  }

  if (player.x < 0) {
    player.x = canvas.width;
  }

  platforms.forEach(p => {

    if (
      player.dy > 0 &&
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height <
        p.y + p.height + player.dy
    ) {
      player.dy = jumpForce;
    }
  });

  if (player.y < 300) {

    let diff = 300 - player.y;

    player.y = 300;

    platforms.forEach(p => p.y += diff);
    enemies.forEach(e => e.y += diff);
    bullets.forEach(b => b.y += diff);

    score += Math.floor(diff);
  }

  platforms = platforms.filter(
    p => p.y < canvas.height
  );

  let difficulty =
    Math.min(score / 3000, 1);

  let gap =
    80 + difficulty * 40;

  let width =
    70 - difficulty * 20;

  let maxJump =
    120 + difficulty * 30;

  let enemyChance =
    0.15 + difficulty * 0.4;

  let enemySpeed =
    1 + difficulty * 2;

  let highest = platforms.reduce(
    (min, p) => Math.min(min, p.y),
    canvas.height
  );

  while (highest > -100) {

    let last =
      platforms[platforms.length - 1];

    let newX =
      getReachableX(last.x, maxJump);

    let newY = highest - gap;

    platforms.push({
      x: newX,
      y: newY,
      width: width,
      height: 12
    });

    if (Math.random() < enemyChance) {
      spawnEnemy(
        newY - 40,
        enemySpeed
      );
    }

    highest = newY;
  }

  bullets.forEach(b => {
    b.y += b.dy;
  });

  bullets = bullets.filter(
    b => b.y > -20
  );

  enemies.forEach(e => {

    e.x += e.dx;

    if (
      e.x <= 0 ||
      e.x + e.width >= canvas.width
    ) {
      e.dx *= -1;
    }
  });

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

// ---------------- GAME OVER ----------------

async function gameOver() {

  if (gameState !== "playing") {
    return;
  }

  await sendScore(score);

  await loadLeaderboard();

  player.dx = 0;
  player.dy = 0;

  gameState = "gameover";
}

// ---------------- DRAW ----------------

function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  if (gameState === "menu") {

    ctx.fillStyle = "#ecf0f1";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle = "#2c3e50";

    ctx.font = "38px Arial";

    ctx.fillText(
      "Jump Game",
      135,
      100
    );

    ctx.fillStyle = "#3498db";

    ctx.fillRect(
      buttons.play.x,
      buttons.play.y,
      buttons.play.width,
      buttons.play.height
    );

    ctx.fillStyle = "white";

    ctx.font = "24px Arial";

    ctx.fillText(
      "Play",
      buttons.play.x + 50,
      buttons.play.y + 33
    );

    ctx.fillStyle = "#2c3e50";

    ctx.font = "24px Arial";

    ctx.fillText(
      "Leaderboard",
      140,
      380
    );

    ctx.font = "18px Arial";

    leaderboard.forEach((entry, index) => {

      ctx.fillText(
        `${index + 1}. ${entry.fullName} - ${entry.score}`,
        60,
        420 + (index * 30)
      );
    });
  }

  else if (gameState === "playing") {

    ctx.fillStyle = "#4CAF50";

    ctx.fillRect(
      player.x,
      player.y,
      player.width,
      player.height
    );

    platforms.forEach(p => {

      ctx.fillStyle = "#654321";

      ctx.fillRect(
        p.x,
        p.y,
        p.width,
        p.height
      );

      ctx.fillStyle = "#2ecc71";

      ctx.fillRect(
        p.x,
        p.y,
        p.width,
        4
      );
    });

    bullets.forEach(b => {

      ctx.fillStyle = "red";

      ctx.beginPath();

      ctx.arc(
        b.x,
        b.y,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();
    });

    enemies.forEach(e => {

      ctx.fillStyle = "#8e44ad";

      ctx.beginPath();

      ctx.arc(
        e.x + 15,
        e.y + 15,
        15,
        0,
        Math.PI * 2
      );

      ctx.fill();
    });

    ctx.fillStyle = "black";

    ctx.font = "18px Arial";

    ctx.fillText(
      "Score: " + score,
      10,
      25
    );
  }

  else if (gameState === "gameover") {

    ctx.fillStyle = "#222";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.fillStyle = "white";

    ctx.font = "40px Arial";

    ctx.fillText(
      "Game Over",
      120,
      180
    );

    ctx.font = "28px Arial";

    ctx.fillText(
      "Score: " + score,
      165,
      240
    );

    ctx.fillStyle = "#27ae60";

    ctx.fillRect(
      buttons.playAgain.x,
      buttons.playAgain.y,
      buttons.playAgain.width,
      buttons.playAgain.height
    );

    ctx.fillStyle = "white";

    ctx.font = "24px Arial";

    ctx.fillText(
      "Play Again",
      175,
      353
    );

    ctx.fillStyle = "#c0392b";

    ctx.fillRect(
      buttons.menu.x,
      buttons.menu.y,
      buttons.menu.width,
      buttons.menu.height
    );

    ctx.fillStyle = "white";

    ctx.fillText(
      "Main Menu",
      170,
      423
    );
  }
}

// ---------------- LOOP ----------------

function loop() {

  update();

  draw();

  requestAnimationFrame(loop);
}

loadLeaderboard();

loop();