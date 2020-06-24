export default `#version 300 es

#define SHADER_NAME bricks-fs

precision highp float;

uniform sampler2D uBlockSolidTexture;
uniform sampler2D uBlockTexture;

in float vTextureIndex;
in vec2 vTexCoords;
in vec4 vColor;

out vec4 fragColor;

void main() {
  vec4 color = vColor;
  
  if (vTextureIndex >= 2.0) {
    color *= texture2D(uBlockTexture, vec2(vTexCoords.xy));
  } else if (vTextureIndex >= 1.0) {
    color *= texture2D(uBlockSolidTexture, vec2(vTexCoords.xy));
  }
  
  if (color.a < 0.1) {
    discard;
  }
  
  fragColor = color;
}
`;
