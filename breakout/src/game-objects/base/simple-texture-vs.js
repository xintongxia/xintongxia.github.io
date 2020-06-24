export default `#version 300 es

#define SHADER_NAME simple-texture-vs

in vec4 positions;
in vec3 colors;

uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uOffset;

out vec2 vTexCoords;
out vec4 vColor;

void main() {
  vTexCoords = positions.zw;
  vColor = vec4(colors, 1.0);

  vec4 pos = vec4(positions.xy, 0.0, 1.0);
  pos = uModelMatrix * pos;
  pos.xy += uOffset;
  gl_Position = uProjectionMatrix * pos;
}
`;
