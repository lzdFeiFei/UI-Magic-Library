/**
 * 点阵图案渲染器 - 将图片转换为点阵效果
 * 参考 Base Pay 页面的实现
 */

class PatternRenderer {
  constructor(gl, config = {}) {
    this.gl = gl;
    this.config = {
      baseTileSize: config.baseTileSize || 8,
      patternColumns: config.patternColumns || 6,
      altPatternColumns: config.altPatternColumns || 6,
      saturation: config.saturation || 1.0,
      brightness: config.brightness || 0.0,
      contrast: config.contrast || 1.0,
      exposure: config.exposure || 0.0,
      deformStrength: config.deformStrength || 1.0,
      darkMode: config.darkMode || false,
      fadeThreshold: config.fadeThreshold || 0.05,
      fadeWidth: config.fadeWidth || 0.1,
      altPatternOpacity: config.altPatternOpacity || 1.0,
      ...config
    };

    this.program = null;
    this.imageTexture = null;
    this.patternTexture = null;
    this.altPatternTexture = null;  // 添加第二层图案纹理

    this.init();
  }

  init() {
    this.createProgram();
    this.createQuad();
    this.createDefaultPattern();
  }

  getVertexShader() {
    return `#version 300 es
    in vec2 aPosition;
    out vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;
  }

  getFragmentShader() {
    return `#version 300 es
    precision highp float;

    in vec2 vUv;
    out vec4 fragColor;

    uniform sampler2D uImage;
    uniform sampler2D uDeformTexture;
    uniform sampler2D uPatternAtlas;
    uniform sampler2D uAltPatternAtlas;  // 第二层图案
    uniform vec2 uResolution;
    uniform vec2 uImageDimensions;
    uniform float uBaseTileSize;
    uniform int uPatternAtlasColumns;
    uniform int uAltPatternAtlasColumns;
    uniform float uTime;
    uniform float uDeformStrength;
    uniform float uSaturation;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uExposure;
    uniform float uDarkMode;
    uniform float uBottomFade;
    uniform float uImageScale;
    uniform float uFadeThreshold;
    uniform float uFadeWidth;
    uniform float uAltPatternOpacity;
    uniform float uEnableFadeTransition;
    uniform float uUseOriginalSvgColors;

    // 原网页的时间动画参数
    const float TIME_SPEED = 0.5;
    const float SPATIAL_FREQ = 0.008;
    const float TIME_AMPLITUDE = 0.1;

    float calculateLuminance(vec3 color) {
      return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    }

    vec3 adjustSaturation(vec3 color, float saturation) {
      float luminance = calculateLuminance(color);
      return mix(vec3(luminance), color, saturation);
    }

    vec3 adjustBrightness(vec3 color, float brightness) {
      return clamp(color + brightness, 0.0, 1.0);
    }

    vec3 adjustContrast(vec3 color, float contrast) {
      return clamp((color - 0.5) * contrast + 0.5, 0.0, 1.0);
    }

    vec3 adjustExposure(vec3 color, float exposure) {
      return clamp(color * pow(2.0, exposure), 0.0, 1.0);
    }

    vec3 processImageColor(vec3 color) {
      color = adjustExposure(color, uExposure);
      color = adjustBrightness(color, uBrightness);
      color = adjustContrast(color, uContrast);
      color = adjustSaturation(color, uSaturation);
      return color;
    }

    // 原网页的采样方式
    vec4 samplePatternAtlas(int patternIndex, vec2 uv) {
      float colIndex = float(patternIndex);
      vec2 atlasOffset = vec2(colIndex / float(uPatternAtlasColumns), 0.0);
      vec2 atlasUV = (uv / vec2(float(uPatternAtlasColumns), 1.0)) + atlasOffset;
      return texture(uPatternAtlas, atlasUV);
    }

    vec4 sampleAltPatternAtlas(int patternIndex, vec2 uv) {
      float colIndex = float(patternIndex);
      vec2 margin = vec2(0.5 / 512.0, 0.0);
      vec2 scaledUV = uv * (1.0 - 2.0 * margin.x) + margin;
      vec2 atlasOffset = vec2(colIndex / float(uAltPatternAtlasColumns), 0.0);
      vec2 atlasUV = (scaledUV / vec2(float(uAltPatternAtlasColumns), 1.0)) + atlasOffset;
      return texture(uAltPatternAtlas, atlasUV);
    }

    vec2 getCoveredUV(vec2 uv, vec2 containerSize, vec2 imageSize) {
      // 改用 contain 模式，显示完整图片，并应用缩放
      vec2 containerAspect = containerSize / max(containerSize.x, containerSize.y);
      vec2 imageAspect = imageSize / max(imageSize.x, imageSize.y);
      vec2 scale = containerAspect / imageAspect;
      float scaleToFit = min(scale.x, scale.y) * uImageScale; // 应用缩放参数
      vec2 scaledSize = imageAspect * scaleToFit;
      vec2 offset = (containerAspect - scaledSize) * 0.5;
      return (uv * containerAspect - offset) / scaledSize;
    }

    vec3 getColorForIntensity(int patternIndex, float patternAlpha, bool useOriginalColors, vec3 originalColor, vec4 patternColor) {
      vec3 backgroundColor = uDarkMode > 0.5 ? vec3(0.0) : vec3(1.0);

      if (useOriginalColors) {
        // 彩色图案 - 原网页的处理方式
        if (patternAlpha < 0.001) {
          return backgroundColor;
        }

        if (uUseOriginalSvgColors > 0.5) {
          // 使用图案纹理本身的颜色
          return mix(backgroundColor, patternColor.rgb, patternAlpha);
        } else {
          // 使用原始图片颜色混合
          vec3 blendedColor = mix(backgroundColor, originalColor, patternAlpha);
          return mix(backgroundColor, blendedColor, uAltPatternOpacity);
        }
      } else {
        // 灰色图案
        if (patternAlpha < 0.001) {
          return backgroundColor;
        }

        vec3 color1 = vec3(0.85);
        vec3 color2 = vec3(0.91);
        vec3 color2b = vec3(0.925);
        vec3 color3 = vec3(0.98);
        vec3 color4 = vec3(0.99);

        if (uDarkMode > 0.5) {
          color1 = vec3(0.33);
          color2 = vec3(0.33);
          color2b = vec3(0.33);
          color3 = vec3(0.33);
          color4 = vec3(0.33);
        }

        if (patternIndex <= 1) return color1;
        else if (patternIndex == 2) return color2;
        else if (patternIndex == 3) return color2b;
        else if (patternIndex <= 4) return color3;
        else return color4;
      }
    }

    void main() {
      vec2 pix = gl_FragCoord.xy;
      vec2 tilePos = floor(pix / uBaseTileSize) * uBaseTileSize;
      vec2 tileCenterUV = (tilePos + uBaseTileSize * 0.5) / uResolution;
      vec2 adjustedTileCenter = getCoveredUV(tileCenterUV, uResolution, uImageDimensions);

      // 边界检查
      if (adjustedTileCenter.x < 0.0 || adjustedTileCenter.x > 1.0 ||
          adjustedTileCenter.y < 0.0 || adjustedTileCenter.y > 1.0) {
        fragColor = vec4(uDarkMode > 0.5 ? vec3(0.0) : vec3(1.0), 1.0);
        return;
      }

      // 获取原始颜色
      vec3 originalCol = texture(uImage, adjustedTileCenter).rgb;
      originalCol = processImageColor(originalCol);

      // 检查是否是背景（颜色长度很小）
      float colorLength = length(originalCol);
      if (colorLength < 0.04) {
        // 背景部分直接返回纯色，不显示任何图案
        fragColor = vec4(uDarkMode > 0.5 ? vec3(0.0) : vec3(1.0), 1.0);
        return;
      }

      // 获取变形纹理（流体模拟结果）
      vec3 deformColor = texture(uDeformTexture, adjustedTileCenter).rgb;
      float paintStrength = (deformColor.r + deformColor.g + deformColor.b) / 3.0;

      // 计算亮度
      float lum = calculateLuminance(originalCol);

      // 添加时间动画 - 只使用 x 方向，保持垂直对齐
      vec2 tileIndex = floor(pix / uBaseTileSize);
      float timeOffset = sin(uTime * TIME_SPEED + tileIndex.x * SPATIAL_FREQ) * TIME_AMPLITUDE;
      lum = clamp(lum + timeOffset, 0.0, 1.0);

      // 反转亮度用于点阵效果
      lum = 0.85 - lum;

      // 根据亮度选择图案
      float scaledIntensity = lum * 5.0;
      int patternIndex;
      if (scaledIntensity < 0.5) patternIndex = 0;
      else if (scaledIntensity < 3.5) patternIndex = int(floor(scaledIntensity * 0.8)) + 1;
      else if (scaledIntensity < 5.0) patternIndex = 4;
      else patternIndex = 5;
      patternIndex = clamp(patternIndex, 0, 5);

      // 计算图案 UV - 原网页的方式
      vec2 pixelInTile = mod(pix, uBaseTileSize);
      vec2 patternUV = pixelInTile / uBaseTileSize;

      // 计算过渡因子（基于流体模拟的强度）
      float transitionFactor = 0.0;
      bool useAltPatterns = false;

      if (uEnableFadeTransition > 0.5) {
        // 使用平滑过渡
        float fadeStart = uFadeThreshold;
        float fadeEnd = uFadeThreshold + uFadeWidth;
        transitionFactor = smoothstep(fadeStart, fadeEnd, paintStrength);
        useAltPatterns = paintStrength > uFadeThreshold;
      } else {
        // 硬切换
        useAltPatterns = paintStrength > uFadeThreshold;
        transitionFactor = useAltPatterns ? 1.0 : 0.0;
      }

      // 采样两层图案
      int regularAtlasIndex = uPatternAtlasColumns - 1 - patternIndex;
      regularAtlasIndex = clamp(regularAtlasIndex, 0, uPatternAtlasColumns - 1);

      // 第二层的 patternIndex 基于亮度（原网页的阈值）
      int altPatternIndex;
      if (lum < 0.1) altPatternIndex = 0;
      else if (lum < 0.3) altPatternIndex = 1;
      else if (lum < 0.5) altPatternIndex = 2;
      else if (lum < 0.7) altPatternIndex = 3;
      else if (lum < 0.9) altPatternIndex = 4;
      else altPatternIndex = 5;
      altPatternIndex = clamp(altPatternIndex, 0, 5);
      int altAtlasIndex = min(altPatternIndex, uAltPatternAtlasColumns - 1);

      // 两层都使用 patternUV（原网页的方式）
      vec4 regularPatternColor = samplePatternAtlas(regularAtlasIndex, patternUV);
      vec4 altPatternColor = sampleAltPatternAtlas(altAtlasIndex, patternUV);

      // 获取两层的颜色 - 传入原始图片颜色用于彩色图案混合
      vec3 regularColor = getColorForIntensity(patternIndex, regularPatternColor.a, false, originalCol, regularPatternColor);
      vec3 altColor = getColorForIntensity(altPatternIndex, altPatternColor.a, true, originalCol, altPatternColor);

      // 混合两层
      vec3 finalColor = mix(regularColor, altColor, transitionFactor);

      // 应用底部渐变
      if (uBottomFade > 0.5) {
        float fadeStart = 0.3;
        float fadeStrength = smoothstep(0.0, fadeStart, vUv.y);
        fadeStrength = fadeStrength * fadeStrength * (3.0 - 2.0 * fadeStrength);
        finalColor = mix(uDarkMode > 0.5 ? vec3(0.0) : vec3(1.0), finalColor, fadeStrength);
      }

      fragColor = vec4(finalColor, 1.0);
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

  createProgram() {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, this.getVertexShader());
    const fs = this.compileShader(gl.FRAGMENT_SHADER, this.getFragmentShader());

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
      return;
    }

    // 获取 uniform 位置
    this.uniforms = {
      uImage: gl.getUniformLocation(this.program, 'uImage'),
      uDeformTexture: gl.getUniformLocation(this.program, 'uDeformTexture'),
      uPatternAtlas: gl.getUniformLocation(this.program, 'uPatternAtlas'),
      uAltPatternAtlas: gl.getUniformLocation(this.program, 'uAltPatternAtlas'),
      uResolution: gl.getUniformLocation(this.program, 'uResolution'),
      uImageDimensions: gl.getUniformLocation(this.program, 'uImageDimensions'),
      uBaseTileSize: gl.getUniformLocation(this.program, 'uBaseTileSize'),
      uPatternAtlasColumns: gl.getUniformLocation(this.program, 'uPatternAtlasColumns'),
      uAltPatternAtlasColumns: gl.getUniformLocation(this.program, 'uAltPatternAtlasColumns'),
      uTime: gl.getUniformLocation(this.program, 'uTime'),
      uDeformStrength: gl.getUniformLocation(this.program, 'uDeformStrength'),
      uSaturation: gl.getUniformLocation(this.program, 'uSaturation'),
      uBrightness: gl.getUniformLocation(this.program, 'uBrightness'),
      uContrast: gl.getUniformLocation(this.program, 'uContrast'),
      uExposure: gl.getUniformLocation(this.program, 'uExposure'),
      uDarkMode: gl.getUniformLocation(this.program, 'uDarkMode'),
      uBottomFade: gl.getUniformLocation(this.program, 'uBottomFade'),
      uImageScale: gl.getUniformLocation(this.program, 'uImageScale'),
      uFadeThreshold: gl.getUniformLocation(this.program, 'uFadeThreshold'),
      uFadeWidth: gl.getUniformLocation(this.program, 'uFadeWidth'),
      uAltPatternOpacity: gl.getUniformLocation(this.program, 'uAltPatternOpacity'),
      uEnableFadeTransition: gl.getUniformLocation(this.program, 'uEnableFadeTransition'),
      uUseOriginalSvgColors: gl.getUniformLocation(this.program, 'uUseOriginalSvgColors')
    };
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

  // 创建默认的点阵图案
  createDefaultPattern() {
    const gl = this.gl;
    const patternSize = 8;  // 每个图案是 8x8 像素，匹配 tile 大小
    const columns = this.config.patternColumns;
    const width = patternSize * columns;
    const height = patternSize;

    const data = new Uint8Array(width * height * 4);

    // 生成不同密度的点阵图案
    for (let col = 0; col < columns; col++) {
      // 根据列索引决定点的大小（密度）
      const density = col / (columns - 1);  // 0.0 到 1.0
      const dotRadius = 0.5 + density * 3.0;  // 点的半径从 0.5 到 3.5

      for (let y = 0; y < patternSize; y++) {
        for (let x = 0; x < patternSize; x++) {
          const px = col * patternSize + x;
          const idx = (y * width + px) * 4;

          // 计算到图案中心的距离
          const cx = x - patternSize / 2;
          const cy = y - patternSize / 2;
          const dist = Math.sqrt(cx * cx + cy * cy);

          // 根据距离决定是否显示点
          const alpha = dist < dotRadius ? 255 : 0;

          data[idx] = 255;     // R
          data[idx + 1] = 255; // G
          data[idx + 2] = 255; // B
          data[idx + 3] = alpha; // A
        }
      }
    }

    this.patternTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  setImage(image) {
    const gl = this.gl;

    if (this.imageTexture) {
      gl.deleteTexture(this.imageTexture);
    }

    this.imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 翻转 Y 轴以匹配 WebGL 坐标系统
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    this.imageDimensions = { width: image.width, height: image.height };
  }

  setPatternAtlas(image) {
    const gl = this.gl;

    if (this.patternTexture) {
      gl.deleteTexture(this.patternTexture);
    }

    this.patternTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  setAltPatternAtlas(image) {
    const gl = this.gl;

    if (this.altPatternTexture) {
      gl.deleteTexture(this.altPatternTexture);
    }

    this.altPatternTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.altPatternTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  render(deformTexture, time) {
    const gl = this.gl;

    if (!this.imageTexture) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(this.program);

    // 绑定纹理
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.uniform1i(this.uniforms.uImage, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, deformTexture);
    gl.uniform1i(this.uniforms.uDeformTexture, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.patternTexture);
    gl.uniform1i(this.uniforms.uPatternAtlas, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.altPatternTexture || this.patternTexture);
    gl.uniform1i(this.uniforms.uAltPatternAtlas, 3);

    // 设置 uniforms
    gl.uniform2f(this.uniforms.uResolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(this.uniforms.uImageDimensions, this.imageDimensions.width, this.imageDimensions.height);
    gl.uniform1f(this.uniforms.uBaseTileSize, this.config.baseTileSize);
    gl.uniform1i(this.uniforms.uPatternAtlasColumns, this.config.patternColumns);
    gl.uniform1i(this.uniforms.uAltPatternAtlasColumns, this.config.altPatternColumns);
    gl.uniform1f(this.uniforms.uTime, time);
    gl.uniform1f(this.uniforms.uDeformStrength, this.config.deformStrength);
    gl.uniform1f(this.uniforms.uSaturation, this.config.saturation);
    gl.uniform1f(this.uniforms.uBrightness, this.config.brightness);
    gl.uniform1f(this.uniforms.uContrast, this.config.contrast);
    gl.uniform1f(this.uniforms.uExposure, this.config.exposure);
    gl.uniform1f(this.uniforms.uDarkMode, this.config.darkMode ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.uBottomFade, 0.0);
    gl.uniform1f(this.uniforms.uImageScale, this.config.imageScale || 1.0);
    gl.uniform1f(this.uniforms.uFadeThreshold, this.config.fadeThreshold);
    gl.uniform1f(this.uniforms.uFadeWidth, this.config.fadeWidth);
    gl.uniform1f(this.uniforms.uAltPatternOpacity, this.config.altPatternOpacity);
    gl.uniform1f(this.uniforms.uEnableFadeTransition, this.config.enableFadeTransition ? 1.0 : 0.0);
    gl.uniform1f(this.uniforms.uUseOriginalSvgColors, 1.0);  // 使用图案纹理本身的颜色

    // 绘制
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
