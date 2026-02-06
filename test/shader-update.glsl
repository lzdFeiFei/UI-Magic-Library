#version 300 es
precision highp float;

out vec4 outColor;

uniform sampler2D u_position;
uniform sampler2D u_velocity;
uniform vec2 u_mouse;        // 鼠标位置（-1~1）
uniform float u_dissipation;

void main() {
    vec2 uv = gl_FragCoord.xy / 256.0;

    vec3 pos = texture(u_position, uv).xyz;
    vec3 vel = texture(u_velocity, uv).xyz;

    // 鼠标力场
    float dist = distance(pos.xy, u_mouse);
    float force = 0.003 / (dist + 0.02);

    vec2 dir = normalize(pos.xy - u_mouse);
    vel.xy += dir * force;

    // 速度衰减
    vel *= u_dissipation;

    // 输出新速度
    outColor = vec4(vel, 1.0);
}