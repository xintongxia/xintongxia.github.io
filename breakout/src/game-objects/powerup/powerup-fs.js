export default `#version 300 es

#define SHADER_NAME powerup-fs

precision highp float;

uniform sampler2D uSpeedTexture;
uniform sampler2D uStickyTexture;
uniform sampler2D uPassthroughTexture;
uniform sampler2D uIncreaseTexture;
uniform sampler2D uConfuseTexture;
uniform sampler2D uChaosTexture;

in float vTexIndex;
in vec2 vTexCoords;
in vec4 vColor;

out vec4 fragColor;

void main() {
  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);;
  
  if (vTexIndex == 1.0) {
    color = texture2D(uSpeedTexture, vTexCoords);
  }
  if (vTexIndex == 2.0) {
    color = texture2D(uStickyTexture, vTexCoords);
  }
  if (vTexIndex == 3.0) {
    color = texture2D(uPassthroughTexture, vTexCoords);
  }
  if (vTexIndex == 4.0) {
    color = texture2D(uIncreaseTexture, vTexCoords);
  }
  if (vTexIndex == 5.0) {
    color = texture2D(uConfuseTexture, vTexCoords);
  }
  if (vTexIndex == 6.0) {
    color = texture2D(uChaosTexture, vTexCoords);
  }

  color *= vColor;
  
  if (color.a < 0.1) {
    discard;
  }
  
  fragColor = color;
}
`;
