export default `#version 300 es

#define SHADER_NAME scene-vs

in vec4 positions;

out vec2 vTexCoords;

uniform sampler2D uTexture; 

uniform bool chaos;
uniform bool confuse;
uniform bool shake;
uniform float time;

void main() {
  gl_Position = vec4(positions.x, positions.y, 0.0, 1.0); 
  vec2 texCoords = positions.zw;
  if (chaos) {
    float strength = 0.3;
    vec2 pos = vec2(texCoords.x + sin(time) * strength, texCoords.y + cos(time) * strength);        
    texCoords = pos;
  } else if (confuse) {
    texCoords = vec2(1.0 - texCoords.x, 1.0 - texCoords.y);
  } 

  vTexCoords = texCoords;
  
  if (shake) {
    float strength = 0.01;
    gl_Position.x += cos(time * 10.0) * strength;        
    gl_Position.y += cos(time * 15.0) * strength;        
  }
} 
`;
