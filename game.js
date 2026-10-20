// --- AYARLAR ---
const PLAYER_SIZE = 80; // Karelerin boyutu büyütüldü
const GRAVITY = 2500;
const JUMP_FORCE = 1100;
const GROUND_HEIGHT = 40;
const LEVEL_COUNT = 10;

let doJump = () => {}; 
let currentLevel = 1;
let isEditing = false;
let editorSpikes = []; // Editördeki dikenlerin konumları {x, y}

// --- HTML ELEMANLARI ---
const menuUI = document.getElementById('menu');
const levelSelectUI = document.getElementById('level-select');
const editorScreenUI = document.getElementById('editor-screen');
const levelContainer = document.getElementById('level-container');

// --- KABOOM BAŞLATMA ---
kaboom({
  canvas: document.getElementById('game'),
  width: 800,
  height: 450,
  background: [10, 10, 15],
  letterbox: true,
  global: true
});

loadSprite('playerImg', 'https://i.ibb.co/fzX3W444/MG-5369.png');
loadSprite('spikeImg',  'https://i.ibb.co/W44DN3mg/MG-5979.png');
loadSprite('bgImg',     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQ39THOeHz9McHv4CAOneT9IubrH38ExTVK0nCJofOPg&s=10');

// --- GLOBAL TIKLAMA DİNLEYİCİLERİ (Zıplama için) ---
window.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && !isEditing && levelSelectUI.style.display === 'none') doJump();
});
window.addEventListener('touchstart', (e) => {
  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && !isEditing && levelSelectUI.style.display === 'none') doJump();
}, { passive: true });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') doJump();
});

// --- UI GEÇİŞLERİ ---
function showMenu() {
  menuUI.style.display = 'flex';
  levelSelectUI.style.display = 'none';
  editorScreenUI.style.display = 'none';
  isEditing = false;
  go('demo');
}

function showLevelSelect() {
  menuUI.style.display = 'none';
  levelSelectUI.style.display = 'flex';
  editorScreenUI.style.display = 'none';
  
  levelContainer.innerHTML = '';
  for (let i = 1; i <= LEVEL_COUNT; i++) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.textContent = i;
    btn.onclick = () => {
      currentLevel = i;
      levelSelectUI.style.display = 'none';
      go('game', i);
    };
    levelContainer.appendChild(btn);
  }
}

// Buton atamaları
if (document.getElementById('btn-play')) document.getElementById('btn-play').onclick = showLevelSelect;
if (document.getElementById('btn-back-menu')) document.getElementById('btn-back-menu').onclick = showMenu;

if (document.getElementById('btn-open-editor')) {
  document.getElementById('btn-open-editor').onclick = () => {
    menuUI.style.display = 'none';
    editorScreenUI.style.display = 'flex';
    editorSpikes = [];
    isEditing = true;
    go('editor');
  };
}

if (document.getElementById('btn-exit-editor')) {
  document.getElementById('btn-exit-editor').onclick = () => {
    isEditing = false;
    showMenu();
  };
}

// Editör Kaydetme ve Temizleme
if (document.getElementById('btn-save')) {
  document.getElementById('btn-save').onclick = () => {
    const levelData = { level: currentLevel, spikes: editorSpikes };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(levelData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "harita.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
}

if (document.getElementById('btn-clear')) {
  document.getElementById('btn-clear').onclick = () => {
    editorSpikes = [];
    go('editor'); 
  };
}

// --- ARKA PLAN ÇİZİMİ ---
function addBackground() {
  add([sprite('bgImg', { width: width(), height: height() }), pos(0, 0), fixed(), z(-1)]);
  add([rect(width(), GROUND_HEIGHT), pos(0, height() - GROUND_HEIGHT), color(60, 60, 80), area(), 'ground']);
}

// --- DEMO (MENÜ ARKASI) ---
scene('demo', () => {
  addBackground();
  let playerY = height() - GROUND_HEIGHT - PLAYER_SIZE;
  const player = add([
    sprite('playerImg', { width: PLAYER_SIZE, height: PLAYER_SIZE }),
    pos(120, playerY), area(), 'player'
  ]);

  let velY = 0; let jumpTimer = 0.4; let spawnTimer = 0;

  onUpdate(() => {
    velY += GRAVITY * dt(); playerY += velY * dt();
    const groundY = height() - GROUND_HEIGHT - PLAYER_SIZE;
    if (playerY >= groundY) { playerY = groundY; velY = 0; }
    player.pos.y = playerY;

    jumpTimer -= dt();
    if (jumpTimer <= 0 && playerY >= groundY) {
      velY = -JUMP_FORCE; jumpTimer = rand(0.4, 1.3);
    }

    spawnTimer += dt();
    if (spawnTimer > 1.2) {
      spawnTimer = 0;
      const h = rand(40, 80);
      const ob = add([sprite('spikeImg', { width: 40, height: h }), pos(width(), height() - GROUND_HEIGHT - h), area(), 'obstacle']);
      ob.onUpdate(() => { ob.pos.x -= 350 * dt(); if (ob.pos.x < -50) destroy(ob); });
    }
  });
});

// --- ASIL OYUN (SEÇİLEN BÖLÜM) ---
scene('game', (levelNum) => {
  addBackground();
  let playerY = height() - GROUND_HEIGHT - PLAYER_SIZE;
  const player = add([
    sprite('playerImg', { width: PLAYER_SIZE, height: PLAYER_SIZE }),
    pos(120, playerY), area(), 'player'
  ]);

  let velY = 0; let grounded = true;

  // Zıplama mantığı
  doJump = () => { if (grounded) { velY = -JUMP_FORCE; grounded = false; } };

  let score = 0;
  const scoreLabel = add([text('Bölüm ' + levelNum + ' | Skor: 0', { size: 24 }), pos(20, 20), color(255)]);

  let sinceSpawn = 0;
  // Bölüm numarasına göre zorluk artışı
  let spawnGap = Math.max(0.6, 1.4 - (levelNum * 0.08));
  let speed = 350 + (levelNum * 20);

  onUpdate(() => {
    velY += GRAVITY * dt(); playerY += velY * dt();
    const groundY = height() - GROUND_HEIGHT - PLAYER_SIZE;
    if (playerY >= groundY) { playerY = groundY; velY = 0; grounded = true; }
    else { grounded = false; }
    player.pos.y = playerY;

    score += dt() * 10;
    scoreLabel.text = 'Bölüm ' + levelNum + ' | Skor: ' + Math.floor(score);

    sinceSpawn += dt();
    if (sinceSpawn > spawnGap) {
      sinceSpawn = 0;
      const h = rand(40, 80);
      const ob = add([sprite('spikeImg', { width: 40, height: h }), pos(width(), height() - GROUND_HEIGHT - h), area(), 'obstacle']);
      ob.onUpdate(() => { ob.pos.x -= speed * dt(); if (ob.pos.x < -50) destroy(ob); });
    }
  });

  player.onCollide('obstacle', () => { shake(12); go('gameover', Math.floor(score)); });
});

// --- HARİTA EDİTÖRÜ SAHNESİ ---
scene('editor', () => {
  addBackground();
  
  onClick(() => {
    const mouse = mousePos();
    const gridSize = 40;
    const snappedX = Math.floor(mouse.x / gridSize) * gridSize;
    const snappedY = Math.floor(mouse.y / gridSize) * gridSize;
    
    // Zemine çok yakınsa yerleştirme
    if (snappedY > height() - GROUND_HEIGHT - gridSize) return;

    // Zaten var mı kontrol et
    const exists = editorSpikes.find(s => s.x === snappedX && s.y === snappedY);
    if (!exists) {
      editorSpikes.push({ x: snappedX, y: snappedY });
      add([sprite('spikeImg', { width: gridSize, height: gridSize }), pos(snappedX, snappedY), 'editor-obstacle']);
    }
  });

  // Mevcut dikenleri ekrana çiz
  editorSpikes.forEach(s => {
    add([sprite('spikeImg', { width: 40, height: 40 }), pos(s.x, s.y)]);
  });
});

// --- OYUN SONU ---
scene('gameover', (s) => {
  add([text('GAME OVER', { size: 56 }), pos(center().x, center().y - 40), anchor('center'), color(255, 60, 80)]);
  add([text('Skor: ' + s, { size: 32 }), pos(center().x, center().y + 20), anchor('center'), color(255)]);
  add([text('Tekrar için dokun', { size: 20 }), pos(center().x, center().y + 80), anchor('center'), color(180)]);
  
  // Tıklayınca aynı bölümü yeniden başlat
  doJump = () => { go('game', currentLevel); };
});

// Oyun açıldığında menüyü ve arkadaki demoyu başlat
showMenu();
