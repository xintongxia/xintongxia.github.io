export default `#version 300 es

#define SHADER_NAME powerup-vs

precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

in vec4 positions;
in vec3 instancePositions;
in vec3 instanceColors;

out vec4 vColor;
out float vTexIndex;
out vec2 vTexCoords;

void main() {
  vTexCoords = positions.zw;
  vTexIndex = 1.0;//instancePositions.z;
  
  vColor = vec4(instanceColors, 1.0);
  
  vec4 pos = uModelMatrix * vec4(positions.xy, 0.0, 1.0);
  pos.xy += instancePositions.xy;

  gl_Position = uProjectionMatrix * pos;
}
`;
