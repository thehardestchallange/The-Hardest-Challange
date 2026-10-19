const SKINS = {
  classic: { name: 'Klasik', color: [255,200,0],  speed: 320, jump: 900,  size: 40 },
  neon:    { name: 'Neon',   color: [0,255,200],  speed: 420, jump: 850,  size: 34 },
  purple:  { name: 'Mor',    color: [180,80,255], speed: 280, jump: 1000, size: 44 },
  blood:   { name: 'Kan',    color: [255,60,80],  speed: 350, jump: 950,  size: 48 }
};

let currentSkin = localStorage.getItem('thc_skin') || 'classic';

// Kostüm butonlarını bas
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
  };
  skinsEl.appendChild(b);
});

kaboom({
  canvas: document.getElementById('game'),
  width: 800,
  height: 450,
  background: [10, 10, 15],
  letterbox: true,
  touchToMouse: true,
  global: true
});

scene('game', () => {
  const skin = SKINS[currentSkin];

  add([rect(width(), 20), pos(0, height()-20), color(60,60,80), area(), 'ground']);

  const player = add([
    rect(skin.size, skin.size),
    pos(120, height()-20-skin.size),
    color(...skin.color),
    area(),
    body({ jumpForce: skin.jump }),
    rotate(0),
    'player'
  ]);

  function jump() { if (player.isGrounded()) player.jump(); }
  onKeyPress('space', jump);
  onMousePress(jump);
  onTouchStart(jump);

  let score = 0;
  const scoreLabel = add([text('0', { size: 24 }), pos(20, 20), color(255)]);

  let sinceSpawn = 0;
  let spawnGap = 1.4;

  onUpdate(() => {
    if (!player.isGrounded()) player.angle += 400 * dt();

    score += dt() * 10;
    scoreLabel.text = Math.floor(score);

    sinceSpawn += dt();
    if (sinceSpawn > spawnGap) {
      sinceSpawn = 0;
      spawnGap = Math.max(0.7, 1.4 - score / 300);

      const h = rand(30, 70);
      const ob = add([
        rect(30, h),
        pos(width(), height()-20-h),
        color(255, 80, 80),
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
  onClick(() => go('game'));
  onKeyPress('space', () => go('game'));
  onTouchStart(() => go('game'));
});

document.getElementById('start').onclick = () => {
  document.getElementById('menu').style.display = 'none';
  go('game');
};
