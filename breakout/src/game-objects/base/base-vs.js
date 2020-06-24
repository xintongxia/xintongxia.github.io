export default `#version 300 es

#define SHADER_NAME base-vs

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;

in vec4 positionColors;

out vec4 vColor;

void main() {
  vColor = vec4(positionColors.zw, 0.0, 1.0);
  vec4 pos = vec4(positionColors.xy, 0.0, 1.0);
  gl_Position = uProjectionMatrix * uModelMatrix * pos;
}
`;
