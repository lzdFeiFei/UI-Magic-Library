/**
 * Base Pay 背景效果 - 主程序
 * 结合流体模拟和点阵图案渲染
 */

let canvas, gl;
let fluidSim, patternRenderer;
let mouse = { x: 0, y: 0, prevX: 0, prevY: 0, down: false };
let lastTime = 0;

async function main() {
  canvas = document.getElementById('canvas');
  gl = canvas.getContext('webgl2', { antialias: false, alpha: false });

  if (!gl) {
    alert('WebGL2 is not supported');
    return;
  }

  // 设置画布大小
  resize();
  window.addEventListener('resize', resize);

  // 初始化流体模拟
  fluidSim = new FluidSimulation(gl, {
    simRes: 128,
    dyeRes: 512,
    densityDissipation: 0.95,   // 降低，让颜色消散更快
    velocityDissipation: 0.9,   // 原网页的值，速度消散更快
    pressureIterations: 20,
    curl: 30,
    splatRadius: 0.003          // 缩小 splat 半径，范围更小
  });

  // 初始化图案渲染器
  patternRenderer = new PatternRenderer(gl, {
    baseTileSize: 8,
    patternColumns: 4,      // 原网页是 4 列
    altPatternColumns: 6,   // 原网页是 6 列
    deformStrength: 0.05,   // 原网页的值
    darkMode: false,
    imageScale: 1.0,
    fadeThreshold: 0.1,     // 原网页的值
    fadeWidth: 0.05,        // 原网页的值
    altPatternOpacity: 1.0,
    enableFadeTransition: true  // 启用平滑过渡
  });

  // 加载图片
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = 'default-old.webp';

  try {
    await image.decode();
    patternRenderer.setImage(image);
  } catch (e) {
    console.error('Failed to load image:', e);
    // 创建一个默认的渐变图片
    createDefaultImage();
  }

  // 尝试加载图案纹理
  try {
    // 加载灰色图案（第一层）- 原网页使用 4 列！
    const patternImage = new Image();
    patternImage.src = 'pat3.png';
    await patternImage.decode();
    patternRenderer.setPatternAtlas(patternImage);
    patternRenderer.config.patternColumns = 4;  // 原网页是 4 列
    console.log('Loaded gray pattern texture: pat3-original.png (4 columns)');
  } catch (e) {
    console.log('Using default pattern for layer 1:', e.message);
  }

  try {
    // 加载彩色图案（第二层）- 6 列
    const altPatternImage = new Image();
    altPatternImage.src = 'pat7-colored.png';
    await altPatternImage.decode();
    patternRenderer.setAltPatternAtlas(altPatternImage);
    patternRenderer.config.altPatternColumns = 6;
    console.log('Loaded colored pattern texture: pat7-original.png (6 columns)');
  } catch (e) {
    console.log('Using default pattern for layer 2:', e.message);
  }

  // 鼠标事件
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', () => mouse.down = true);
  canvas.addEventListener('mouseup', () => mouse.down = false);
  canvas.addEventListener('mouseleave', () => mouse.down = false);

  // 触摸事件
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', () => mouse.down = false);

  // 开始渲染循环
  requestAnimationFrame(loop);
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
}

function createDefaultImage() {
  // 创建一个渐变图片作为默认
  const size = 256; // 缩小尺寸
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = size;
  tempCanvas.height = size;
  const ctx = tempCanvas.getContext('2d');

  // 创建渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 添加一些圆形
  ctx.fillStyle = '#e94560';
  ctx.beginPath();
  ctx.arc(size * 0.3, size * 0.4, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#533483';
  ctx.beginPath();
  ctx.arc(size * 0.7, size * 0.6, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  patternRenderer.setImage(tempCanvas);
  patternRenderer.imageDimensions = { width: size, height: size };
}

function onMouseMove(e) {
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = e.clientX / window.innerWidth;
  mouse.y = 1.0 - e.clientY / window.innerHeight;

  // 计算速度
  const dx = (mouse.x - mouse.prevX) * 10;
  const dy = (mouse.y - mouse.prevY) * 10;

  // 添加 splat
  if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
    fluidSim.splat(mouse.x, mouse.y, dx, dy);
  }
}

function onTouchStart(e) {
  e.preventDefault();
  mouse.down = true;
  const touch = e.touches[0];
  mouse.x = touch.clientX / window.innerWidth;
  mouse.y = 1.0 - touch.clientY / window.innerHeight;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = touch.clientX / window.innerWidth;
  mouse.y = 1.0 - touch.clientY / window.innerHeight;

  const dx = (mouse.x - mouse.prevX) * 10;
  const dy = (mouse.y - mouse.prevY) * 10;

  if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
    fluidSim.splat(mouse.x, mouse.y, dx, dy);
  }
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.016);
  lastTime = time;

  // 更新流体模拟
  fluidSim.step(dt);

  // 渲染点阵效果
  patternRenderer.render(fluidSim.getDensityTexture(), time / 1000);

  requestAnimationFrame(loop);
}

// 启动
window.onload = main;
