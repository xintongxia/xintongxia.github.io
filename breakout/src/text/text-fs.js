export default `#version 300 es

#define SHADER_NAME text-fs

precision highp float;

uniform sampler2D uTexture;
uniform vec3 uColor;

in vec2 vTexCoords;

out vec4 fragColor;

void main() {
  vec4 color = texture2D(uTexture, vTexCoords);
  
  if (color.a < 0.1) {
    discard;
  }
  
  color = vec4(uColor, color.a);
  fragColor = color;
}
`;
