export default `#version 300 es

#define SHADER_NAME text-vs

precision highp float;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 iconsTextureDim;

in vec4 positions;
in vec2 instancePositions;

in vec4 instanceIconFrames;

out vec4 vColor;
out vec2 vTexCoords;

void main() {
  vec2 iconSize = instanceIconFrames.zw;
  vec2 iconTexCoords = instanceIconFrames.xy;
  
  vec2 pct = positions.xy;
  pct.y = -pct.y;
  vTexCoords = mix(
    iconTexCoords,
    iconTexCoords + iconSize,
    (pct.xy + 1.0) / 2.0
  ) / iconsTextureDim;
  
  vec4 pos = uModelMatrix * vec4(positions.xy, 0.0, 1.0);
  pos.xy = pos.xy + instancePositions.xy;

  gl_Position = uProjectionMatrix * pos;
}
`;
