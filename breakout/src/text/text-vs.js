export default `#version 300 es

#define SHADER_NAME text-vs

precision highp float;

uniform mat4 uProjectionMatrix;
uniform vec2 uIconsTextureDim;
uniform float uHeightScale;

in vec4 positions;
in vec2 instancePositions;
in vec4 instanceIconFrames;
in float instanceSizes;

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
  ) / uIconsTextureDim;
  
  vec2 halfSize = vec2(instanceSizes, instanceSizes * uHeightScale) / 2.0; 
  vec4 pos = vec4(halfSize * positions.xy, 0.0, 1.0);
  pos.xy += instancePositions.xy;

  gl_Position = uProjectionMatrix * pos;
}
`;
