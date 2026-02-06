#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D u_position;
uniform vec2 u_resolution;

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = frag / u_resolution;

    // 将 fragment 坐标映射回粒子纹理坐标
    vec2 puv = frag / 256.0;
    vec3 pos = texture(u_position, puv).xyz;

    // 粒子世界坐标 -1~1 → 屏幕坐标
    vec2 p = (pos.xy * 0.5 + 0.5) * u_resolution;

    float d = distance(frag, p);

    // 粒子的半径（数字越小粒子越大）
    float alpha = smoothstep(3.0, 0.0, d);

    outColor = vec4(vec3(1.0), alpha);
}