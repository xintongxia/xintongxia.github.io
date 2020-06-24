export default `#version 300 es

#define SHADER_NAME particles-vs

precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

in vec4 positions;
in vec2 instancePositions;
in vec4 instanceColors;

out vec4 vColor;
out vec2 vTexCoords;

void main() {
  vColor = instanceColors;
  vTexCoords = positions.zw;
  
  vec4 pos = uModelMatrix * vec4(positions.xy, 0.0, 1.0);
  pos.xy = pos.xy + instancePositions.xy;

  gl_Position = uProjectionMatrix * pos;
}
`;
