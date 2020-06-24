export default `#version 300 es

#define SHADER_NAME particles-fs

precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoords;
in vec4 vColor;

out vec4 fragColor;

void main() {
  vec4 color = texture2D(uTexture, vec2(vTexCoords.xy));
  color *= vColor; 
  
  if (color.a < 0.1) {
    discard;
  }
  
  fragColor = color;
}
`;
