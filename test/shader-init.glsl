#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D u_image;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    // 载入底图
    vec4 color = texture(u_image, uv);

    // 将像素亮度映射为深度（点阵立体感）
    float b = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    // Base Pay 的点阵效果：Z 根据亮度上下波动
    float z = (b - 0.5) * 0.4;

    // 输出粒子的初始“世界坐标”（-1~1）
    outColor = vec4(uv * 2.0 - 1.0, z, 1.0);
}