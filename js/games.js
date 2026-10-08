import { supabase } from './supabase-client.js';
import { enforceAuth } from './auth-guard.js';

let profile = null;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let gameOver = false;
let player = { x: 50, y: 300, w: 30, h: 30, dy: 0, jumpForce: -11, grounded: false };
let obstacles = [];
let frame = 0;

async function init() {
  profile = await enforceAuth();
  if (!profile) return;

  loadLeaderboard();
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.grounded && !gameOver) {
      player.dy = player.jumpForce;
      player.grounded = false;
    } else if (e.code === 'Space' && gameOver) {
      resetGame();
    }
  });

  gameLoop();
}

function resetGame() {
  score = 0;
  obstacles = [];
  player.y = 300;
  player.dy = 0;
  gameOver = false;
  gameLoop();
}

function spawnObstacle() {
  obstacles.push({ x: canvas.width, y: 310, w: 20, h: 20 });
}

function gameLoop() {
  if (gameOver) return;
  frame++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Simple gravity
  player.dy += 0.55;
  player.y += player.dy;
  if (player.y >= 300) {
    player.y = 300;
    player.dy = 0;
    player.grounded = true;
  }

  // Draw Ground
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, 330, canvas.width, 50);

  // Draw Player
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Spawn and Move Obstacles
  if (frame % 90 === 0) spawnObstacle();

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].x -= 5;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].w, obstacles[i].h);

    // Collision check
    if (
      player.x < obstacles[i].x + obstacles[i].w &&
      player.x + player.w > obstacles[i].x &&
      player.y < obstacles[i].y + obstacles[i].h &&
      player.y + player.h > obstacles[i].y
    ) {
      handleGameOver();
      return;
    }
  }

  // Increment score
  score++;
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 30);

  requestAnimationFrame(gameLoop);
}

async function handleGameOver() {
  gameOver = true;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over! Press SPACE to Restart', canvas.width / 2, canvas.height / 2);
  ctx.textAlign = 'start';

  // Persist score linked to member
  await supabase.from('game_scores').insert([{ member_id: profile.id, score }]);
  loadLeaderboard();
}

async function loadLeaderboard() {
  const { data } = await supabase
    .from('game_scores')
    .select('score, profiles(nickname)')
    .order('score', { ascending: false })
    .limit(10);

  const container = document.getElementById('leaderboard-list');
  container.innerHTML = (data || []).map((row, i) => `
    <div class="leaderboard-row">
      <span><strong>#${i + 1}</strong> ${row.profiles ? row.profiles.nickname : 'Player'}</span>
      <strong>${row.score} pts</strong>
    </div>
  `).join('');
}

init();
