export default `#version 300 es

#define SHADER_NAME bricks-vs

precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

in vec4 positions;
in vec2 instancePositions;
in vec4 instanceColors;
in float instanceStates;

out vec4 vColor;
out float vTextureIndex;
out vec2 vTexCoords;

void main() {
  vColor; 
  
  if (instanceStates < 0.0) {
    vColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else{
    vColor = vec4(instanceColors.rgb, 1.0);
  }
  vTexCoords = positions.zw;
  vTextureIndex = instanceColors.a;
  
  vec4 pos = uModelMatrix * vec4(positions.xy, 0.0, 1.0);
  pos.xy += instancePositions.xy;

  gl_Position = uProjectionMatrix * pos;
}
`;
