export default `#version 300 es

#define SHADER_NAME simple-texture-fs

precision highp float;

uniform sampler2D uTexture;
uniform vec3 uColor;

in vec2 vTexCoords;
out vec4 fragColor;

void main() {
  vec4 color = texture2D(uTexture, vec2(vTexCoords.x, vTexCoords.y));
  color.rgb = color.rgb * uColor;
  
  if (color.a < 0.1) {
    discard;
  }
  
  fragColor = color;
}
`;
