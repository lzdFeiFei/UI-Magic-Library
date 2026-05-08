# Base Pay Pattern 效果技术详解

## 目录

1. [概述](#概述)
2. [核心技术栈](#核心技术栈)
3. [技术详解](#技术详解)
4. [代码实现分析](#代码实现分析)
5. [关键算法解析](#关键算法解析)
6. [性能优化技巧](#性能优化技巧)

---

## 概述

Base Pay Pattern 是一个交互式的点阵图案效果，灵感来自 [base.org/pay](https://www.base.org/pay) 网站。它将图片转换为动态的点阵效果，并结合流体模拟实现鼠标交互。

### 效果特点

- **双层点阵系统**：灰色基础层 + 彩色交互层
- **流体模拟**：基于 Navier-Stokes 方程的物理模拟
- **实时交互**：鼠标移动触发流体效果
- **高性能渲染**：使用 WebGL 2.0 GPU 加速

---

## 核心技术栈

### 1. WebGL 2.0

WebGL（Web Graphics Library）是在浏览器中渲染 2D 和 3D 图形的 JavaScript API，基于 OpenGL ES 3.0。

**为什么使用 WebGL？**
- GPU 加速：利用显卡并行计算能力
- 高性能：每帧处理数百万像素
- 实时渲染：60fps 流畅动画

**WebGL 2.0 vs WebGL 1.0：**
```glsl
// WebGL 1.0 (GLSL ES 1.0)
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}

// WebGL 2.0 (GLSL ES 3.0)
#version 300 es
in vec2 aPosition;        // attribute → in
out vec2 vUv;             // varying → out
void main() {
  vUv = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

### 2. GLSL ES 3.0

GLSL（OpenGL Shading Language）是用于编写着色器的语言，运行在 GPU 上。

**着色器类型：**

#### 顶点着色器（Vertex Shader）
处理每个顶点的位置和属性。

```glsl
#version 300 es
in vec2 aPosition;  // 输入：顶点位置 [-1, 1]
out vec2 vUv;       // 输出：纹理坐标 [0, 1]

void main() {
  // 将 [-1, 1] 转换为 [0, 1]
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

#### 片段着色器（Fragment Shader）
处理每个像素的颜色。

```glsl
#version 300 es
precision highp float;

in vec2 vUv;              // 输入：从顶点着色器传来的 UV
out vec4 fragColor;       // 输出：像素颜色

uniform sampler2D uImage; // 纹理采样器

void main() {
  vec3 color = texture(uImage, vUv).rgb;
  fragColor = vec4(color, 1.0);
}
```

### 3. 流体模拟（Navier-Stokes 方程）

流体模拟基于 Navier-Stokes 方程，描述流体运动的物理规律。

**核心概念：**

- **速度场（Velocity Field）**：每个点的流体速度
- **密度场（Density Field）**：每个点的染料浓度
- **压力场（Pressure Field）**：保持流体不可压缩性
- **涡度（Vorticity）**：流体旋转强度

**模拟步骤：**

1. **Advection（平流）**：沿速度场移动粒子
2. **Diffusion（扩散）**：粒子向周围扩散
3. **Pressure Projection（压力投影）**：保持不可压缩性
4. **Vorticity Confinement（涡度约束）**：增强旋涡效果


### 4. 纹理图集（Texture Atlas）

纹理图集是将多个小纹理合并到一张大纹理中的技术。

**优势：**
- 减少纹理切换开销
- 提高渲染性能
- 节省显存

**本项目中的应用：**

```
pat3.png (256x64, 4列)
┌────────┬────────┬────────┬────────┐
│ 图案0  │ 图案1  │ 图案2  │ 图案3  │
│ (64x64)│ (64x64)│ (64x64)│ (64x64)│
└────────┴────────┴────────┴────────┘

pat7-colored.png (512x64, 6列)
┌────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │
└────┴────┴────┴────┴────┴────┘
```

**采样代码：**
```glsl
vec4 samplePatternAtlas(int patternIndex, vec2 uv) {
  float colIndex = float(patternIndex);
  // 计算在图集中的偏移
  vec2 atlasOffset = vec2(colIndex / float(uPatternAtlasColumns), 0.0);
  // 缩放 UV 并加上偏移
  vec2 atlasUV = (uv / vec2(float(uPatternAtlasColumns), 1.0)) + atlasOffset;
  return texture(uPatternAtlas, atlasUV);
}
```

### 5. 点阵/半色调渲染

点阵渲染是一种将连续色调图像转换为点状图案的技术，类似于报纸印刷的半色调效果。

**核心思想：**
- 将图像分割成小方块（tile）
- 根据每个方块的亮度选择不同密度的点阵图案
- 亮度越高，点越密集

**实现步骤：**

1. **分块（Tiling）**
```glsl
// 计算当前像素所在的 tile
vec2 tilePos = floor(pix / uBaseTileSize) * uBaseTileSize;
// 计算 tile 中心点
vec2 tileCenterUV = (tilePos + uBaseTileSize * 0.5) / uResolution;
```

2. **采样原图**
```glsl
// 在 tile 中心采样原图颜色
vec3 originalCol = texture(uImage, adjustedTileCenter).rgb;
// 计算亮度
float lum = calculateLuminance(originalCol);
```

3. **选择图案**
```glsl
// 根据亮度选择图案索引（0-5）
float scaledIntensity = lum * 5.0;
int patternIndex;
if (scaledIntensity < 0.5) patternIndex = 0;      // 最暗
else if (scaledIntensity < 3.5) patternIndex = int(floor(scaledIntensity * 0.8)) + 1;
else if (scaledIntensity < 5.0) patternIndex = 4;
else patternIndex = 5;                             // 最亮
```

4. **采样图案**
```glsl
// 计算像素在 tile 内的位置
vec2 pixelInTile = mod(pix, uBaseTileSize);
vec2 patternUV = pixelInTile / uBaseTileSize;
// 从图集中采样
vec4 patternColor = samplePatternAtlas(patternIndex, patternUV);
```

### 6. 帧缓冲对象（FBO）

FBO（Framebuffer Object）允许渲染到纹理而不是屏幕，实现离屏渲染。

**用途：**
- 多通道渲染（Multi-pass Rendering）
- 后处理效果（Post-processing）
- 渲染到纹理（Render to Texture）

**创建 FBO：**
```typescript
private createSingleFBO(
  width: number,
  height: number,
  internalFormat: number,  // gl.RGBA16F
  format: number,          // gl.RGBA
  type: number,            // gl.HALF_FLOAT
  filter: number           // gl.LINEAR
): SingleFBO {
  const gl = this.gl;
  
  // 创建纹理
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
  
  // 创建帧缓冲
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  
  return { texture, fbo, width, height };
}
```

### 7. 双缓冲技术（Double Buffering）

双缓冲使用两个缓冲区交替读写，避免读写冲突。

**为什么需要双缓冲？**
- 在 GPU 中，不能同时读写同一个纹理
- 需要从上一帧的结果读取，写入到新的缓冲区

**实现：**
```typescript
interface DoubleFBO {
  read: { texture: WebGLTexture; fbo: WebGLFramebuffer };
  write: { texture: WebGLTexture; fbo: WebGLFramebuffer };
  swap: () => void;  // 交换读写缓冲
}

// 使用示例
gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);  // 读取上一帧
this.blit(velocity.write);                             // 写入新帧
velocity.swap();                                       // 交换缓冲
```


---

## 技术详解

### WebGL 渲染管线

```
JavaScript 代码
    ↓
顶点数据 → 顶点着色器 → 图元装配 → 光栅化 → 片段着色器 → 帧缓冲
    ↓           ↓                              ↓           ↓
  VBO      处理顶点位置                    处理像素颜色    屏幕显示
```

**关键步骤：**

1. **准备顶点数据**
```typescript
// 创建全屏四边形（两个三角形）
const vertices = new Float32Array([
  -1, -1,  // 左下
   1, -1,  // 右下
  -1,  1,  // 左上
   1,  1   // 右上
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
```

2. **编译着色器**
```typescript
const shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(shader, vertexShaderSource);
gl.compileShader(shader);

// 检查编译错误
if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
  console.error(gl.getShaderInfoLog(shader));
}
```

3. **链接程序**
```typescript
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```

4. **设置 Uniform**
```typescript
const location = gl.getUniformLocation(program, 'uTime');
gl.uniform1f(location, time);
```

5. **绘制**
```typescript
gl.useProgram(program);
gl.bindVertexArray(vao);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
```

### 流体模拟详解

#### 1. Advection（平流）

平流是沿着速度场移动粒子的过程。

**物理原理：**
```
新位置 = 旧位置 - 速度 × 时间步长
```

**着色器实现：**
```glsl
void main() {
  // 沿速度场反向追踪
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  // 在新位置采样
  fragColor = dissipation * texture(uSource, coord);
}
```

**为什么反向追踪？**
- 正向追踪：从旧位置找新位置（可能有空洞）
- 反向追踪：从新位置找旧位置（保证每个像素都有值）

#### 2. Divergence（散度）

散度衡量流体的"膨胀"或"收缩"。

**数学定义：**
```
div(v) = ∂vx/∂x + ∂vy/∂y
```

**着色器实现：**
```glsl
void main() {
  float L = texture(uVelocity, vL).x;  // 左边的 x 速度
  float R = texture(uVelocity, vR).x;  // 右边的 x 速度
  float T = texture(uVelocity, vT).y;  // 上边的 y 速度
  float B = texture(uVelocity, vB).y;  // 下边的 y 速度
  
  // 边界处理
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  
  // 计算散度（中心差分）
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

#### 3. Pressure Projection（压力投影）

通过求解泊松方程消除散度，保持流体不可压缩性。

**泊松方程：**
```
∇²p = ∇·v
```

**迭代求解（Jacobi 迭代）：**
```glsl
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  
  // Jacobi 迭代公式
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
```

**为什么迭代 20 次？**
- 每次迭代逐步逼近真实解
- 20 次是性能和精度的平衡点

#### 4. Gradient Subtraction（梯度减法）

从速度场中减去压力梯度，得到无散度的速度场。

**公式：**
```
v_new = v_old - ∇p
```

**着色器实现：**
```glsl
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  
  vec2 velocity = texture(uVelocity, vUv).xy;
  // 减去压力梯度
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}
```

#### 5. Vorticity Confinement（涡度约束）

增强流体的旋涡效果，防止数值耗散。

**步骤 1：计算涡度**
```glsl
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  
  // 涡度 = ∂vy/∂x - ∂vx/∂y
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

**步骤 2：应用涡度力**
```glsl
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  
  // 计算涡度梯度方向
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;  // 归一化
  force *= curl * C;                // 乘以涡度强度
  force.y *= -1.0;
  
  vec2 vel = texture(uVelocity, vUv).xy;
  fragColor = vec4(vel + force * dt, 0.0, 1.0);
}
```


### 点阵渲染详解

#### 1. 坐标系统

```
屏幕坐标（像素）          纹理坐标（归一化）
┌─────────────┐          ┌─────────────┐
│ (0,0)       │          │ (0,1)       │
│             │          │             │
│             │    →     │             │
│             │          │             │
│       (w,h) │          │       (1,0) │
└─────────────┘          └─────────────┘
```

**坐标转换：**
```glsl
// 像素坐标 → 纹理坐标
vec2 uv = gl_FragCoord.xy / uResolution;

// 纹理坐标 → 像素坐标
vec2 pix = vUv * uResolution;
```

#### 2. Tile 分块

将屏幕分割成 8x8 像素的小方块。

```
屏幕（1920x1080）
┌──┬──┬──┬──┬──┬──┐
│  │  │  │  │  │  │  每个方块 8x8 像素
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │  共 240 x 135 个方块
├──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │
└──┴──┴──┴──┴──┴──┘
```

**计算 Tile 位置：**
```glsl
vec2 pix = gl_FragCoord.xy;
// 当前像素所在的 tile 左上角
vec2 tilePos = floor(pix / uBaseTileSize) * uBaseTileSize;
// tile 中心点
vec2 tileCenterUV = (tilePos + uBaseTileSize * 0.5) / uResolution;
```

#### 3. 图案采样

**关键问题：如何保证垂直对齐？**

错误做法：
```glsl
// ❌ 错误：使用全局坐标采样
vec2 patternUV = mod(pix / uBaseTileSize, 1.0);
// 问题：相邻 tile 的图案不连续
```

正确做法：
```glsl
// ✅ 正确：使用 tile 内坐标
vec2 pixelInTile = mod(pix, uBaseTileSize);
vec2 patternUV = pixelInTile / uBaseTileSize;
// 结果：所有 tile 的图案完美对齐
```

**为什么这样做？**
```
Tile A (0-8)      Tile B (8-16)
┌────────┐        ┌────────┐
│ ●   ●  │        │ ●   ●  │
│   ●    │        │   ●    │
│ ●   ●  │        │ ●   ●  │
└────────┘        └────────┘
  相同图案          相同图案
  完美对齐          完美对齐
```

#### 4. 亮度映射

将连续的亮度值映射到离散的图案索引。

```
亮度 [0, 1] → 图案索引 [0, 5]

0.0 ────────→ 0 (最密集的点)
0.2 ────────→ 1
0.4 ────────→ 2
0.6 ────────→ 3
0.8 ────────→ 4
1.0 ────────→ 5 (最稀疏的点)
```

**代码实现：**
```glsl
// 反转亮度（暗 → 密集，亮 → 稀疏）
lum = 0.85 - lum;

// 缩放到 [0, 5]
float scaledIntensity = lum * 5.0;

// 映射到图案索引
int patternIndex;
if (scaledIntensity < 0.5) patternIndex = 0;
else if (scaledIntensity < 3.5) patternIndex = int(floor(scaledIntensity * 0.8)) + 1;
else if (scaledIntensity < 5.0) patternIndex = 4;
else patternIndex = 5;
```

#### 5. 时间动画

添加基于时间的波动效果。

```glsl
const float TIME_SPEED = 0.5;      // 动画速度
const float SPATIAL_FREQ = 0.008;  // 空间频率
const float TIME_AMPLITUDE = 0.1;  // 振幅

// 计算 tile 索引
vec2 tileIndex = floor(pix / uBaseTileSize);

// 添加时间偏移
float timeOffset = sin(uTime * TIME_SPEED + tileIndex.x * SPATIAL_FREQ) * TIME_AMPLITUDE;

// 应用到亮度
lum = clamp(lum + timeOffset, 0.0, 1.0);
```

**效果：**
- 每列 tile 的动画相位不同
- 形成从左到右的波浪效果
- 振幅控制变化强度

#### 6. 双层混合

根据流体强度在两层图案之间过渡。

```glsl
// 计算流体强度
float paintStrength = (deformColor.r + deformColor.g + deformColor.b) / 3.0;

// 计算过渡因子
float transitionFactor = smoothstep(uFadeThreshold, uFadeThreshold + uFadeWidth, paintStrength);

// 混合两层
vec3 regularColor = getColorForIntensity(patternIndex, regularPatternColor.a, false, ...);
vec3 altColor = getColorForIntensity(altPatternIndex, altPatternColor.a, true, ...);
vec3 finalColor = mix(regularColor, altColor, transitionFactor);
```

**smoothstep 函数：**
```
smoothstep(edge0, edge1, x)

1.0 ┤         ╭────
    │       ╱
0.5 ┤     ╱
    │   ╱
0.0 ┤──╯
    └───┴───┴───┴───
      edge0  edge1
```

---

## 代码实现分析

### 整体架构

```
BasePayPatternDemo.tsx (React 组件)
    ↓
    ├─ FluidSimulation (流体模拟)
    │   ├─ velocity (速度场)
    │   ├─ density (密度场)
    │   ├─ pressure (压力场)
    │   └─ step() (模拟步进)
    │
    └─ PatternRenderer (图案渲染)
        ├─ imageTexture (原图)
        ├─ patternTexture (灰色图案)
        ├─ altPatternTexture (彩色图案)
        └─ render() (渲染)
```


### 着色器代码分布

项目中的 GLSL 着色器代码根据功能分散在两个类中，遵循**单一职责原则**。

#### 文件结构

```
app/demos/components/base-pay-pattern/
├── BasePayPatternDemo.tsx (200 行)
│   └── React 组件，负责：
│       - Canvas 管理
│       - 鼠标事件处理
│       - 动画循环
│       - 生命周期管理
│
├── PatternRenderer.ts (511 行)
│   └── 点阵渲染，包含：
│       - 2 个 GLSL 着色器
│       - 纹理管理
│       - Uniform 参数设置
│       - 渲染逻辑
│
└── useFluidSimulation.ts (553 行)
    └── 流体模拟，包含：
        - 9 个 GLSL 着色器
        - FBO 管理
        - 物理模拟步骤
        - 鼠标喷溅效果
```

#### PatternRenderer.ts 中的着色器（2 个）

**1. 顶点着色器**
```glsl
#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

**功能：**
- 将顶点位置从 [-1, 1] 转换为屏幕坐标
- 计算纹理坐标 vUv [0, 1]

**2. 片段着色器（核心渲染逻辑，约 200 行）**

**功能：**
- 将图片转换为点阵效果
- 采样纹理图集
- 计算亮度和图案索引
- 双层图案混合
- 时间动画效果

**关键 Uniform：**
```glsl
uniform sampler2D uImage;           // 原始图片
uniform sampler2D uDeformTexture;   // 流体密度场
uniform sampler2D uPatternAtlas;    // 灰色图案图集
uniform sampler2D uAltPatternAtlas; // 彩色图案图集
uniform vec2 uResolution;           // 屏幕分辨率
uniform float uTime;                // 时间
uniform float uBaseTileSize;        // Tile 大小（8px）
uniform int uPatternAtlasColumns;   // 图案列数（4 或 6）
```

#### useFluidSimulation.ts 中的着色器（9 个）

**1. 基础顶点着色器**
```glsl
#version 300 es
in vec2 aPosition;
out vec2 vUv;
out vec2 vL, vR, vT, vB;  // 左右上下邻居的 UV
uniform vec2 texelSize;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

**功能：**
- 预计算邻居像素的 UV 坐标
- 用于有限差分计算（梯度、散度等）

**2. 清除着色器（Clear Shader）**
```glsl
uniform sampler2D uTexture;
uniform float value;

void main() {
  fragColor = value * texture(uTexture, vUv);
}
```

**功能：**
- 将纹理值乘以系数
- 用于清除压力场

**3. 喷溅着色器（Splat Shader）**
```glsl
uniform sampler2D uTarget;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main() {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}
```

**功能：**
- 在指定位置添加高斯分布的"喷溅"
- 用于鼠标交互

**4. 平流着色器（Advection Shader）**
```glsl
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform float dt;
uniform float dissipation;

void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  fragColor = dissipation * texture(uSource, coord);
}
```

**功能：**
- 沿速度场移动粒子（反向追踪）
- 应用消散系数

**5. 散度着色器（Divergence Shader）**
```glsl
uniform sampler2D uVelocity;

void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  
  // 边界处理
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
```

**功能：**
- 计算速度场的散度
- 用于压力求解

**6. 涡度着色器（Curl Shader）**
```glsl
uniform sampler2D uVelocity;

void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
```

**功能：**
- 计算速度场的涡度（旋转强度）

**7. 涡度力着色器（Vorticity Shader）**
```glsl
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;

void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  
  vec2 vel = texture(uVelocity, vUv).xy;
  fragColor = vec4(vel + force * dt, 0.0, 1.0);
}
```

**功能：**
- 应用涡度约束力
- 增强旋涡效果

**8. 压力着色器（Pressure Shader）**
```glsl
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
```

**功能：**
- Jacobi 迭代求解泊松方程
- 计算压力场

**9. 梯度减法着色器（Gradient Subtract Shader）**
```glsl
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}
```

**功能：**
- 从速度场中减去压力梯度
- 得到无散度的速度场

#### 着色器调用流程

**每帧渲染流程：**

```
1. 流体模拟（FluidSimulation.step）
   ├─ Curl Shader          → 计算涡度
   ├─ Vorticity Shader     → 应用涡度力
   ├─ Divergence Shader    → 计算散度
   ├─ Clear Shader         → 清除压力
   ├─ Pressure Shader ×20  → 迭代求解压力
   ├─ Gradient Shader      → 减去压力梯度
   ├─ Advection Shader     → 平流速度
   └─ Advection Shader     → 平流密度

2. 图案渲染（PatternRenderer.render）
   └─ Fragment Shader      → 渲染点阵效果

3. 鼠标交互（FluidSimulation.splat）
   ├─ Splat Shader         → 添加速度
   └─ Splat Shader         → 添加颜色
```

**数据流：**
```
鼠标移动
    ↓
Splat Shader → 速度场/密度场
    ↓
流体模拟（8 个着色器）
    ↓
密度场纹理
    ↓
图案渲染着色器
    ↓
屏幕显示
```

#### 为什么这样设计？

**1. 职责分离**
- **PatternRenderer**：负责视觉呈现（如何显示）
- **FluidSimulation**：负责物理模拟（如何运动）

**2. 模块化**
- 每个着色器只做一件事
- 易于理解和维护
- 可以独立优化

**3. 可复用性**
- FluidSimulation 可以用于其他项目
- PatternRenderer 可以替换为其他渲染方式

**4. 性能优化**
- 流体模拟使用低分辨率（128×128）
- 图案渲染使用全分辨率（1920×1080）
- 各自独立优化

### FluidSimulation 类

**初始化：**
```typescript
constructor(gl: WebGL2RenderingContext, config: FluidConfig = {}) {
  this.gl = gl;
  this.config = {
    simRes: 128,              // 模拟分辨率
    dyeRes: 512,              // 染料分辨率
    densityDissipation: 0.95, // 密度消散
    velocityDissipation: 0.9, // 速度消散
    pressureIterations: 20,   // 压力迭代次数
    curl: 30,                 // 涡度强度
    splatRadius: 0.003,       // 喷溅半径
  };
  
  this.init();
}
```

**关键参数说明：**

- `simRes: 128`：速度场分辨率 128x128
  - 更高 = 更精确，但更慢
  - 128 是性能和质量的平衡点

- `dyeRes: 512`：染料分辨率 512x512
  - 比速度场高，保证视觉细节
  - 染料不需要物理精度

- `densityDissipation: 0.95`：每帧保留 95% 的密度
  - 0.95 = 快速消散
  - 1.0 = 永不消散

- `velocityDissipation: 0.9`：每帧保留 90% 的速度
  - 0.9 = 快速停止
  - 1.0 = 永不停止

- `splatRadius: 0.003`：鼠标影响半径
  - 0.003 = 小范围影响
  - 0.01 = 大范围影响


**模拟步骤：**
```typescript
step(dt: number) {
  // 1. 计算涡度
  this.computeCurl();
  
  // 2. 应用涡度力
  this.applyVorticity(dt);
  
  // 3. 计算散度
  this.computeDivergence();
  
  // 4. 清除压力
  this.clearPressure();
  
  // 5. 求解压力（迭代 20 次）
  for (let i = 0; i < 20; i++) {
    this.solvePressure();
  }
  
  // 6. 减去压力梯度
  this.subtractGradient();
  
  // 7. 平流速度
  this.advectVelocity(dt);
  
  // 8. 平流密度
  this.advectDensity(dt);
}
```

**鼠标交互：**
```typescript
splat(x: number, y: number, dx: number, dy: number) {
  // 在速度场中添加速度
  gl.uniform3f(prog.uniforms.color, dx, dy, 0);
  this.blit(this.velocity.write);
  this.velocity.swap();
  
  // 在密度场中添加颜色
  const r = Math.abs(dx) * 0.1 + 0.2;
  const g = Math.abs(dy) * 0.1 + 0.3;
  const b = Math.abs(dx + dy) * 0.05 + 0.5;
  gl.uniform3f(prog.uniforms.color, r, g, b);
  this.blit(this.density.write);
  this.density.swap();
}
```

### PatternRenderer 类

**初始化：**
```typescript
constructor(gl: WebGL2RenderingContext, config: PatternConfig = {}) {
  this.gl = gl;
  this.config = {
    baseTileSize: 8,           // tile 大小
    patternColumns: 4,         // 灰色图案列数
    altPatternColumns: 6,      // 彩色图案列数
    deformStrength: 0.05,      // 变形强度
    fadeThreshold: 0.1,        // 过渡阈值
    fadeWidth: 0.05,           // 过渡宽度
    darkMode: false,           // 暗色模式
  };
  
  this.init();
}
```

**渲染流程：**
```typescript
render(deformTexture: WebGLTexture, time: number) {
  // 1. 绑定帧缓冲（渲染到屏幕）
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  // 2. 激活纹理
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);      // 原图
  
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, deformTexture);          // 流体密度
  
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);    // 灰色图案
  
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, this.altPatternTexture); // 彩色图案
  
  // 3. 设置 Uniform
  gl.uniform2f(this.uniforms.uResolution, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(this.uniforms.uTime, time);
  gl.uniform1f(this.uniforms.uBaseTileSize, 8);
  // ... 其他 uniform
  
  // 4. 绘制
  gl.bindVertexArray(this.vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
```

### React 组件集成

**生命周期管理：**
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // 初始化 WebGL
  const gl = canvas.getContext('webgl2');
  
  // 创建模拟器和渲染器
  const fluid = new FluidSimulation(gl, fluidConfig);
  const renderer = new PatternRenderer(gl, rendererConfig);
  
  // 加载图片
  const img = new Image();
  img.onload = () => {
    renderer.setImage(img);
  };
  img.src = '/path/to/image.webp';
  
  // 动画循环
  let animationId: number;
  const animate = (time: number) => {
    fluid.step(0.016);  // 60fps
    renderer.render(fluid.getDensityTexture(), time * 0.001);
    animationId = requestAnimationFrame(animate);
  };
  animate(0);
  
  // 清理
  return () => {
    cancelAnimationFrame(animationId);
  };
}, []);
```

**鼠标事件处理：**
```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect = canvasRef.current!.getBoundingClientRect();
  
  // 归一化坐标 [0, 1]
  const x = (e.clientX - rect.left) / rect.width;
  const y = 1.0 - (e.clientY - rect.top) / rect.height;
  
  // 计算速度
  const dx = (x - lastPos.x) * 10;
  const dy = (y - lastPos.y) * 10;
  
  // 添加喷溅
  fluidRef.current?.splat(x, y, dx, dy);
  
  lastPos = { x, y };
};
```

---

## 关键算法解析

### 1. 亮度计算

使用感知亮度公式（ITU-R BT.601）：

```glsl
float calculateLuminance(vec3 color) {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}
```

**为什么这些系数？**
- 人眼对绿色最敏感（0.587）
- 对蓝色最不敏感（0.114）
- 红色居中（0.299）

### 2. 图像覆盖（Object-fit: Cover）

在 WebGL 中实现 CSS 的 `object-fit: cover` 效果。

```glsl
vec2 getCoveredUV(vec2 uv, vec2 containerSize, vec2 imageSize) {
  // 归一化宽高比
  vec2 containerAspect = containerSize / max(containerSize.x, containerSize.y);
  vec2 imageAspect = imageSize / max(imageSize.x, imageSize.y);
  
  // 计算缩放比例
  vec2 scale = containerAspect / imageAspect;
  float scaleToFit = min(scale.x, scale.y) * uImageScale;
  
  // 缩放后的尺寸
  vec2 scaledSize = imageAspect * scaleToFit;
  
  // 居中偏移
  vec2 offset = (containerAspect - scaledSize) * 0.5;
  
  // 计算最终 UV
  return (uv * containerAspect - offset) / scaledSize;
}
```

**示例：**
```
容器: 1920x1080 (16:9)
图片: 1000x1000 (1:1)

1. 归一化
   containerAspect = (1.0, 0.5625)
   imageAspect = (1.0, 1.0)

2. 缩放
   scale = (1.0, 0.5625)
   scaleToFit = 0.5625  // min(1.0, 0.5625)
   scaledSize = (0.5625, 0.5625)

3. 居中
   offset = ((1.0 - 0.5625) * 0.5, 0) = (0.21875, 0)

4. UV 映射
   左边缘: (0 - 0.21875) / 0.5625 = -0.389 (裁剪)
   右边缘: (1 - 0.21875) / 0.5625 = 1.389 (裁剪)
```

### 3. Smoothstep 函数

平滑插值函数，产生 S 形曲线。

```glsl
float smoothstep(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
```

**对比线性插值：**
```
线性插值 (mix)        Smoothstep
1.0 ┤    ╱            1.0 ┤      ╭──
    │   ╱                 │    ╱
0.5 ┤  ╱              0.5 ┤  ╱
    │ ╱                   │╱
0.0 ┤╱                0.0 ┤──
    └──────            └──────
    0    1             0    1
```

**优势：**
- 起点和终点速度为 0（平滑过渡）
- 中间加速（自然感）
- 避免突变

### 4. 边界处理

在流体模拟中正确处理边界条件。

```glsl
// 散度计算中的边界处理
vec2 C = texture(uVelocity, vUv).xy;
if (vL.x < 0.0) L = -C.x;  // 左边界：镜像速度
if (vR.x > 1.0) R = -C.x;  // 右边界：镜像速度
if (vT.y > 1.0) T = -C.y;  // 上边界：镜像速度
if (vB.y < 0.0) B = -C.y;  // 下边界：镜像速度
```

**为什么镜像？**
- 保证边界处无流入/流出
- 满足不可压缩条件
- 防止数值不稳定


---

## 性能优化技巧

### 1. 分辨率优化

**策略：**
- 速度场：低分辨率（128x128）
- 密度场：中分辨率（512x512）
- 最终渲染：全分辨率（1920x1080）

**原因：**
```
速度场计算量：
  128x128 = 16,384 像素
  每帧 8 个 pass（curl, vorticity, divergence, pressure×20, gradient, advection×2）
  总计：16,384 × 8 = 131,072 次着色器调用

如果用全分辨率：
  1920x1080 = 2,073,600 像素
  2,073,600 × 8 = 16,588,800 次着色器调用（慢 127 倍！）
```

### 2. 纹理格式优化

**选择合适的精度：**

```typescript
// 速度场：RG16F（2 通道，16 位浮点）
this.velocity = this.createDoubleFBO(
  simRes, simRes,
  gl.RG16F,      // 内部格式
  gl.RG,         // 格式
  gl.HALF_FLOAT, // 类型
  gl.LINEAR      // 过滤
);

// 密度场：RGBA16F（4 通道，16 位浮点）
this.density = this.createDoubleFBO(
  dyeRes, dyeRes,
  gl.RGBA16F,
  gl.RGBA,
  gl.HALF_FLOAT,
  gl.LINEAR
);

// 压力场：R16F（1 通道，16 位浮点）
this.pressure = this.createDoubleFBO(
  simRes, simRes,
  gl.R16F,
  gl.RED,
  gl.HALF_FLOAT,
  gl.NEAREST     // 压力不需要插值
);
```

**内存占用对比：**
```
RGBA32F: 4 × 4 bytes = 16 bytes/pixel
RGBA16F: 4 × 2 bytes = 8 bytes/pixel  (节省 50%)
RG16F:   2 × 2 bytes = 4 bytes/pixel  (节省 75%)
R16F:    1 × 2 bytes = 2 bytes/pixel  (节省 87.5%)
```

### 3. 着色器优化

**避免分支：**
```glsl
// ❌ 慢：动态分支
if (lum < 0.2) {
  color = vec3(1.0);
} else if (lum < 0.4) {
  color = vec3(0.8);
} else {
  color = vec3(0.6);
}

// ✅ 快：使用 step 和 mix
float t1 = step(0.2, lum);
float t2 = step(0.4, lum);
color = mix(vec3(1.0), vec3(0.8), t1);
color = mix(color, vec3(0.6), t2);
```

**向量化操作：**
```glsl
// ❌ 慢：标量操作
float r = color.r * 0.299;
float g = color.g * 0.587;
float b = color.b * 0.114;
float lum = r + g + b;

// ✅ 快：向量操作
float lum = dot(color, vec3(0.299, 0.587, 0.114));
```

**预计算常量：**
```glsl
// ❌ 慢：每帧计算
uniform float time;
float freq = 0.008;
float offset = sin(time * 0.5 + tileIndex.x * freq) * 0.1;

// ✅ 快：CPU 预计算
uniform float time;  // 已经乘以 0.5
const float SPATIAL_FREQ = 0.008;
const float TIME_AMPLITUDE = 0.1;
float offset = sin(time + tileIndex.x * SPATIAL_FREQ) * TIME_AMPLITUDE;
```

### 4. 纹理采样优化

**使用合适的过滤模式：**
```typescript
// 图案纹理：使用 NEAREST（像素艺术）
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

// 流体纹理：使用 LINEAR（平滑插值）
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
```

**纹理压缩：**
```typescript
// 使用 WebP 格式（比 PNG 小 30-50%）
const img = new Image();
img.src = 'image.webp';  // 而不是 'image.png'
```

### 5. 批处理优化

**减少状态切换：**
```typescript
// ❌ 慢：频繁切换程序
gl.useProgram(program1);
gl.drawArrays(...);
gl.useProgram(program2);
gl.drawArrays(...);
gl.useProgram(program1);
gl.drawArrays(...);

// ✅ 快：批量处理
gl.useProgram(program1);
gl.drawArrays(...);
gl.drawArrays(...);
gl.useProgram(program2);
gl.drawArrays(...);
```

**合并 Uniform 更新：**
```typescript
// ❌ 慢：逐个设置
gl.uniform1f(loc1, value1);
gl.uniform1f(loc2, value2);
gl.uniform1f(loc3, value3);

// ✅ 快：使用 UBO（Uniform Buffer Object）
const buffer = new Float32Array([value1, value2, value3]);
gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
gl.bufferSubData(gl.UNIFORM_BUFFER, 0, buffer);
```

### 6. 内存管理

**及时释放资源：**
```typescript
// 删除不再使用的纹理
gl.deleteTexture(oldTexture);

// 删除不再使用的帧缓冲
gl.deleteFramebuffer(oldFBO);

// 删除不再使用的程序
gl.deleteProgram(oldProgram);
```

**避免内存泄漏：**
```typescript
useEffect(() => {
  // 创建资源
  const fluid = new FluidSimulation(gl);
  const renderer = new PatternRenderer(gl);
  
  // 清理函数
  return () => {
    // 取消动画循环
    cancelAnimationFrame(animationId);
    
    // 释放 WebGL 资源
    fluid.destroy();
    renderer.destroy();
    
    // 释放 WebGL 上下文
    const ext = gl.getExtension('WEBGL_lose_context');
    ext?.loseContext();
  };
}, []);
```

### 7. 性能监控

**使用 Performance API：**
```typescript
const startTime = performance.now();

// 渲染代码
fluid.step(dt);
renderer.render(fluid.getDensityTexture(), time);

const endTime = performance.now();
const frameTime = endTime - startTime;

// 计算 FPS
const fps = 1000 / frameTime;
console.log(`FPS: ${fps.toFixed(1)}`);
```

**使用 WebGL 查询对象：**
```typescript
// 创建查询对象
const query = gl.createQuery();

// 开始查询
gl.beginQuery(gl.TIME_ELAPSED_EXT, query);

// GPU 操作
gl.drawArrays(...);

// 结束查询
gl.endQuery(gl.TIME_ELAPSED_EXT);

// 读取结果（异步）
const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
if (available) {
  const timeElapsed = gl.getQueryParameter(query, gl.QUERY_RESULT);
  console.log(`GPU time: ${timeElapsed / 1000000}ms`);
}
```

---

## 常见问题

### Q1: 为什么点阵会出现垂直错位？

**原因：**
使用了错误的 UV 计算方式。

```glsl
// ❌ 错误
vec2 patternUV = mod(pix / uBaseTileSize, 1.0);

// ✅ 正确
vec2 pixelInTile = mod(pix, uBaseTileSize);
vec2 patternUV = pixelInTile / uBaseTileSize;
```

### Q2: 为什么流体效果范围太大？

**原因：**
`splatRadius` 参数过大。

```typescript
// ❌ 范围太大
splatRadius: 0.01

// ✅ 合适的范围
splatRadius: 0.003
```

### Q3: 为什么彩色层变化太慢？

**原因：**
时间动画参数过小。

```glsl
// ❌ 变化太慢
const float TIME_SPEED = 0.15;
const float SPATIAL_FREQ = 0.003;

// ✅ 合适的速度
const float TIME_SPEED = 0.5;
const float SPATIAL_FREQ = 0.008;
```

### Q4: 如何调整流体消散速度？

**方法：**
调整 `dissipation` 参数。

```typescript
// 快速消散（轻盈感）
densityDissipation: 0.95
velocityDissipation: 0.9

// 慢速消散（粘稠感）
densityDissipation: 0.99
velocityDissipation: 0.98
```

### Q5: 如何优化移动端性能？

**策略：**
1. 降低分辨率
```typescript
simRes: 64,   // 从 128 降到 64
dyeRes: 256,  // 从 512 降到 256
```

2. 减少迭代次数
```typescript
pressureIterations: 10,  // 从 20 降到 10
```

3. 使用更低精度
```typescript
// 使用 R11F_G11F_B10F 代替 RGBA16F
gl.R11F_G11F_B10F
```

---

## 扩展阅读

### 学习资源

1. **WebGL 基础**
   - [WebGL Fundamentals](https://webglfundamentals.org/)
   - [The Book of Shaders](https://thebookofshaders.com/)

2. **流体模拟**
   - [Real-Time Fluid Dynamics for Games](https://www.dgp.toronto.edu/public_user/stam/reality/Research/pdf/GDC03.pdf) - Jos Stam
   - [GPU Gems Chapter 38: Fast Fluid Dynamics Simulation on the GPU](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)

3. **着色器编程**
   - [Shadertoy](https://www.shadertoy.com/) - 在线着色器编辑器
   - [GLSL Sandbox](http://glslsandbox.com/)

### 相关项目

1. **WebGL Fluid Simulation**
   - [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)

2. **Three.js Examples**
   - [Three.js Fluid Simulation](https://threejs.org/examples/#webgl_gpgpu_water)

3. **Halftone Effects**
   - [Halftone Shader Tutorial](https://www.shadertoy.com/view/4sBBDK)

---

## 总结

Base Pay Pattern 效果综合运用了多种先进的图形技术：

1. **WebGL 2.0** - GPU 加速渲染
2. **流体模拟** - 基于物理的交互效果
3. **点阵渲染** - 独特的视觉风格
4. **纹理图集** - 高效的资源管理
5. **双缓冲** - 避免读写冲突
6. **FBO** - 多通道渲染

通过理解这些技术的原理和实现细节，你可以：
- 创建类似的交互式视觉效果
- 优化 WebGL 应用的性能
- 深入理解 GPU 编程

**关键要点：**
- 合理选择分辨率和精度
- 使用双缓冲避免冲突
- 优化着色器代码
- 正确处理边界条件
- 及时释放资源

希望这份教程能帮助你掌握这些技术！

