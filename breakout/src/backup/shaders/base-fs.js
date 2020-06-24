export default `#version 300 es

#define SHADER_NAME base-fs

precision highp float;

uniform sampler2D uBlockSolidTexture;
uniform sampler2D uBlockTexture;

in vec4 vColor;
out vec4 fragColor;

void main() {
  if (vColor.a < 0.1) {
    discard;
  }
  
  fragColor = vColor;
}
`;
