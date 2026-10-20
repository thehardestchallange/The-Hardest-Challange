const SKINS = {
  classic: { name: 'Klasik', color: [255,200,0],  speed: 320, jump: 900,  size: 40 },
  neon:    { name: 'Neon',   color: [0,255,200],  speed: 420, jump: 850,  size: 34 },
  purple:  { name: 'Mor',    color: [180,80,255], speed: 280, jump: 1000, size: 44 },
  blood:   { name: 'Kan',    color: [255,60,80],  speed: 350, jump: 950,  size: 48 }
};

let currentSkin = localStorage.getItem('thc_skin') || 'classic';
let menuOpen = true;
let doJump = () => {}; // Global zıplama fonksiyonu

// 🚀 TIKLAMA VE DOKUNMAYI GARANTİYE ALAN GLOBAL DİNLEYİCİLER (Canvas'a odaklanma sorununu çözer)
window.addEventListener('mousedown', (e) => {
  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') doJump();
});
window.addEventListener('touchstart', (e) => {
  if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') doJump();
}, { passive: true });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') doJump();
});

// Kostüm butonları
const skinsEl = document.getElementById('skins');
Object.entries(SKINS).forEach(([key, s]) => {
  const b = document.createElement('button');
  b.textContent = s.name;
  b.style.background = `rgb(${s.color.join(',')})`;
  if (key === currentSkin) b.classList.add('active');
  b.onclick = () => {
    currentSkin = key;
    localStorage.setItem('thc_skin', key);
    document.querySelectorAll('#skins button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    if (menuOpen) go('demo');
  };
  skinsEl.appendChild(b);
});

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

function addBackground() {
  add([sprite('bgImg', { width: width(), height: height() }), pos(0, 0), fixed(), z(-1)]);
  // Zemin alanı
  add([rect(width(), 20), pos(0, height() - 20), color(60, 60, 80), area(), 'ground']);
}

// 🎬 DEMO sahnesi (Menü arkası)
scene('demo', () => {
  const skin = SKINS[currentSkin];
  addBackground();
  
  // Manuel Fizik Değişkenleri (Kaboom body() kullanmıyoruz, hataları önlüyoruz)
  let playerY = height() - 20 - skin.size;
  const player = add([
    sprite('playerImg', { width: skin.size, height: skin.size }),
    pos(120, playerY),
    area(),
    'player'
  ]);

  let velY = 0;
  const gravity = 2000;
  let grounded = true;
  let jumpTimer = 0.4;
  let spawnTimer = 0;

  onUpdate(() => {
    // 1. Yerçekimi ve Fizik
    velY += gravity * dt();
    playerY += velY * dt();
    
    const groundY = height() - 20 - skin.size;
    if (playerY >= groundY) {
      playerY = groundY;
      velY = 0;
      grounded = true;
    } else {
      grounded = false;
    }
    player.pos.y = playerY;

    // 2. Rastgele Zıplama (Demo için)
    jumpTimer -= dt();
    if (jumpTimer <= 0 && grounded) {
      velY = -skin.jump;
      grounded = false;
      jumpTimer = rand(0.4, 1.3);
    }

    // 3. Engel Çıkarma
    spawnTimer += dt();
    if (spawnTimer > 1.2) {
      spawnTimer = 0;
      const h = rand(30, 70);
      const ob = add([
        sprite('spikeImg', { width: 30, height: h }),
        pos(width(), height() - 20 - h),
        area(),
        'obstacle'
      ]);
      ob.onUpdate(() => {
        ob.pos.x -= skin.speed * dt();
        if (ob.pos.x < -50) destroy(ob);
      });
    }
  });
});

// 🎮 OYUN sahnesi
scene('game', () => {
  const skin = SKINS[currentSkin];
  addBackground();
  
  let playerY = height() - 20 - skin.size;
  const player = add([
    sprite('playerImg', { width: skin.size, height: skin.size }),
    pos(120, playerY),
    area(),
    'player'
  ]);

  let velY = 0;
  const gravity = 2000;
  let grounded = true;

  // Ekrana tıklanınca çalışacak zıplama fonksiyonu
  doJump = () => {
    if (grounded) {
      velY = -skin.jump;
      grounded = false;
    }
  };

  let score = 0;
  const scoreLabel = add([text('0', { size: 24 }), pos(20, 20), color(255)]);

  let sinceSpawn = 0;
  let spawnGap = 1.4;

  onUpdate(() => {
    // 1. Yerçekimi ve Fizik
    velY += gravity * dt();
    playerY += velY * dt();
    
    const groundY = height() - 20 - skin.size;
    if (playerY >= groundY) {
      playerY = groundY;
      velY = 0;
      grounded = true;
    } else {
      grounded = false;
    }
    player.pos.y = playerY;

    // 2. Skor
    score += dt() * 10;
    scoreLabel.text = Math.floor(score);

    // 3. Engel Çıkarma
    sinceSpawn += dt();
    if (sinceSpawn > spawnGap) {
      sinceSpawn = 0;
      spawnGap = Math.max(0.7, 1.4 - score / 300);

      const h = rand(30, 70);
      const ob = add([
        sprite('spikeImg', { width: 30, height: h }),
        pos(width(), height() - 20 - h),
        area(),
        'obstacle'
      ]);
      ob.onUpdate(() => {
        ob.pos.x -= skin.speed * dt();
        if (ob.pos.x < -50) destroy(ob);
      });
    }
  });

  player.onCollide('obstacle', () => {
    shake(12);
    go('gameover', Math.floor(score));
  });
});

scene('gameover', (s) => {
  add([text('GAME OVER', { size: 56 }), pos(center().x, center().y - 40), anchor('center'), color(255, 60, 80)]);
  add([text('Skor: ' + s, { size: 32 }), pos(center().x, center().y + 20), anchor('center'), color(255)]);
  add([text('Tekrar için dokun', { size: 20 }), pos(center().x, center().y + 80), anchor('center'), color(180)]);
  
  // Oyun bittiğinde tıklayınca yeniden başlat
  doJump = () => {
    go('game');
  };
});

document.getElementById('start').onclick = () => {
  menuOpen = false;
  document.getElementById('menu').style.display = 'none';
  go('game');
};

// Başlangıçta demo çalışsın
go('demo');
