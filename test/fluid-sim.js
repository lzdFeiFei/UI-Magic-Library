/**
 * 流体模拟系统 - 基于 Navier-Stokes 方程的 WebGL 实现
 * 参考 Base Pay 页面的实现
 */

class FluidSimulation {
  constructor(gl, config = {}) {
    this.gl = gl;
    this.config = {
      simRes: config.simRes || 128,        // 模拟分辨率
      dyeRes: config.dyeRes || 512,        // 染料分辨率
      densityDissipation: config.densityDissipation || 0.97,
      velocityDissipation: config.velocityDissipation || 0.98,
      pressureIterations: config.pressureIterations || 20,
      curl: config.curl || 30,
      splatRadius: config.splatRadius || 0.005,
      ...config
    };

    this.programs = {};
    this.framebuffers = {};

    this.init();
  }

  init() {
    const gl = this.gl;

    // 检查浮点纹理支持
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
      console.warn('EXT_color_buffer_float not supported, falling back');
    }

    // 创建着色器程序
    this.createPrograms();

    // 创建帧缓冲
    this.createFramebuffers();
  }

  // 顶点着色器 - 用于全屏四边形
  getBaseVertexShader() {
    return `#version 300 es
    in vec2 aPosition;
    out vec2 vUv;
    out vec2 vL;
    out vec2 vR;
    out vec2 vT;
    out vec2 vB;
    uniform vec2 texelSize;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;
  }

  // 清除着色器
  getClearShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D uTexture;
    uniform float value;

    void main() {
      fragColor = value * texture(uTexture, vUv);
    }`;
  }

  // Splat 着色器 - 添加力/染料
  getSplatShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main() {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture(uTarget, vUv).xyz;
      fragColor = vec4(base + splat, 1.0);
    }`;
  }

  // 平流着色器 - 移动速度/染料场
  getAdvectionShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 fragColor;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    void main() {
      vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
      fragColor = dissipation * texture(uSource, coord);
      fragColor.a = 1.0;
    }`;
  }

  // 散度着色器
  getDivergenceShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    in vec2 vL;
    in vec2 vR;
    in vec2 vT;
    in vec2 vB;
    out vec4 fragColor;
    uniform sampler2D uVelocity;

    void main() {
      float L = texture(uVelocity, vL).x;
      float R = texture(uVelocity, vR).x;
      float T = texture(uVelocity, vT).y;
      float B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;

      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y;
      if (vB.y < 0.0) B = -C.y;

      float div = 0.5 * (R - L + T - B);
      fragColor = vec4(div, 0.0, 0.0, 1.0);
    }`;
  }

  // 旋度着色器
  getCurlShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    in vec2 vL;
    in vec2 vR;
    in vec2 vT;
    in vec2 vB;
    out vec4 fragColor;
    uniform sampler2D uVelocity;

    void main() {
      float L = texture(uVelocity, vL).y;
      float R = texture(uVelocity, vR).y;
      float T = texture(uVelocity, vT).x;
      float B = texture(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }`;
  }

  // 涡度着色器
  getVorticityShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    in vec2 vL;
    in vec2 vR;
    in vec2 vT;
    in vec2 vB;
    out vec4 fragColor;
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
    }`;
  }

  // 压力着色器
  getPressureShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    in vec2 vL;
    in vec2 vR;
    in vec2 vT;
    in vec2 vB;
    out vec4 fragColor;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main() {
      float L = texture(uPressure, vL).x;
      float R = texture(uPressure, vR).x;
      float T = texture(uPressure, vT).x;
      float B = texture(uPressure, vB).x;
      float C = texture(uPressure, vUv).x;
      float divergence = texture(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      fragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }`;
  }

  // 梯度减法着色器
  getGradientSubtractShader() {
    return `#version 300 es
    precision highp float;
    in vec2 vUv;
    in vec2 vL;
    in vec2 vR;
    in vec2 vT;
    in vec2 vB;
    out vec4 fragColor;
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
    }`;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    // 获取所有 uniform 位置
    const uniforms = {};
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, uniforms };
  }

  createPrograms() {
    const vs = this.getBaseVertexShader();

    this.programs.clear = this.createProgram(vs, this.getClearShader());
    this.programs.splat = this.createProgram(vs, this.getSplatShader());
    this.programs.advection = this.createProgram(vs, this.getAdvectionShader());
    this.programs.divergence = this.createProgram(vs, this.getDivergenceShader());
    this.programs.curl = this.createProgram(vs, this.getCurlShader());
    this.programs.vorticity = this.createProgram(vs, this.getVorticityShader());
    this.programs.pressure = this.createProgram(vs, this.getPressureShader());
    this.programs.gradientSubtract = this.createProgram(vs, this.getGradientSubtractShader());

    // 创建全屏四边形
    this.createQuad();
  }

  createQuad() {
    const gl = this.gl;
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  createDoubleFBO(width, height, internalFormat, format, type, filter) {
    const gl = this.gl;

    const createFBO = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      return { texture, fbo, width, height };
    };

    return {
      read: createFBO(),
      write: createFBO(),
      swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      }
    };
  }

  createFramebuffers() {
    const gl = this.gl;
    const simRes = this.config.simRes;
    const dyeRes = this.config.dyeRes;

    this.velocity = this.createDoubleFBO(simRes, simRes, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
    this.density = this.createDoubleFBO(dyeRes, dyeRes, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    this.pressure = this.createDoubleFBO(simRes, simRes, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
    this.divergence = this.createSingleFBO(simRes, simRes, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
    this.curl = this.createSingleFBO(simRes, simRes, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
  }

  createSingleFBO(width, height, internalFormat, format, type, filter) {
    const gl = this.gl;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return { texture, fbo, width, height };
  }

  blit(target) {
    const gl = this.gl;
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  splat(x, y, dx, dy) {
    const gl = this.gl;
    const prog = this.programs.splat;

    gl.useProgram(prog.program);
    gl.uniform1i(prog.uniforms.uTarget, 0);
    gl.uniform1f(prog.uniforms.aspectRatio, gl.canvas.width / gl.canvas.height);
    gl.uniform2f(prog.uniforms.point, x, y);
    gl.uniform1f(prog.uniforms.radius, this.config.splatRadius);

    // 添加速度
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform3f(prog.uniforms.color, dx, dy, 0);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 添加染料
    gl.bindTexture(gl.TEXTURE_2D, this.density.read.texture);
    const r = Math.abs(dx) * 0.1 + 0.2;
    const g = Math.abs(dy) * 0.1 + 0.3;
    const b = Math.abs(dx + dy) * 0.05 + 0.5;
    gl.uniform3f(prog.uniforms.color, r, g, b);
    this.blit(this.density.write);
    this.density.swap();
  }

  step(dt) {
    const gl = this.gl;
    const simRes = this.config.simRes;
    const dyeRes = this.config.dyeRes;

    // 计算旋度
    gl.useProgram(this.programs.curl.program);
    gl.uniform2f(this.programs.curl.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(this.programs.curl.uniforms.uVelocity, 0);
    this.blit(this.curl);

    // 应用涡度
    gl.useProgram(this.programs.vorticity.program);
    gl.uniform2f(this.programs.vorticity.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(this.programs.vorticity.uniforms.uVelocity, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curl.texture);
    gl.uniform1i(this.programs.vorticity.uniforms.uCurl, 1);
    gl.uniform1f(this.programs.vorticity.uniforms.curl, this.config.curl);
    gl.uniform1f(this.programs.vorticity.uniforms.dt, dt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 计算散度
    gl.useProgram(this.programs.divergence.program);
    gl.uniform2f(this.programs.divergence.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(this.programs.divergence.uniforms.uVelocity, 0);
    this.blit(this.divergence);

    // 清除压力
    gl.useProgram(this.programs.clear.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
    gl.uniform1i(this.programs.clear.uniforms.uTexture, 0);
    gl.uniform1f(this.programs.clear.uniforms.value, 0.8);
    this.blit(this.pressure.write);
    this.pressure.swap();

    // 压力迭代
    gl.useProgram(this.programs.pressure.program);
    gl.uniform2f(this.programs.pressure.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.divergence.texture);
    gl.uniform1i(this.programs.pressure.uniforms.uDivergence, 1);

    for (let i = 0; i < this.config.pressureIterations; i++) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
      gl.uniform1i(this.programs.pressure.uniforms.uPressure, 0);
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    // 梯度减法
    gl.useProgram(this.programs.gradientSubtract.program);
    gl.uniform2f(this.programs.gradientSubtract.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
    gl.uniform1i(this.programs.gradientSubtract.uniforms.uPressure, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(this.programs.gradientSubtract.uniforms.uVelocity, 1);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 平流速度
    gl.useProgram(this.programs.advection.program);
    gl.uniform2f(this.programs.advection.uniforms.texelSize, 1.0 / simRes, 1.0 / simRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(this.programs.advection.uniforms.uVelocity, 0);
    gl.uniform1i(this.programs.advection.uniforms.uSource, 0);
    gl.uniform1f(this.programs.advection.uniforms.dt, dt);
    gl.uniform1f(this.programs.advection.uniforms.dissipation, this.config.velocityDissipation);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // 平流染料
    gl.uniform2f(this.programs.advection.uniforms.texelSize, 1.0 / dyeRes, 1.0 / dyeRes);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.density.read.texture);
    gl.uniform1i(this.programs.advection.uniforms.uSource, 1);
    gl.uniform1f(this.programs.advection.uniforms.dissipation, this.config.densityDissipation);
    this.blit(this.density.write);
    this.density.swap();
  }

  getDensityTexture() {
    return this.density.read.texture;
  }

  getVelocityTexture() {
    return this.velocity.read.texture;
  }
}
