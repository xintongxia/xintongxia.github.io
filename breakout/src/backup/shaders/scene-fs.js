export default `#version 300 es

#define SHADER_NAME scene-fs

in vec2 vTexCoords;

out vec4 FragColor;
  
uniform sampler2D uTexture;

uniform bool chaos;
uniform bool confuse;
uniform bool shake;

float edgeKernel[9] = float[](
  1.0, 1.0, 1.0,
  1.0, -8.0, 1.0,
  1.0, 1.0, 1.0
);

float blurKernel[9] = float[](
  1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
  2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0  
);

float offset = 1.0 / 300.0;

void main() {
  vec4 color = vec4(0.0f);
  vec2 offsets[9] = vec2[](
    vec2(-offset,  offset), // top-left
    vec2( 0.0f,    offset), // top-center
    vec2( offset,  offset), // top-right
    vec2(-offset,  0.0f),   // center-left
    vec2( 0.0f,    0.0f),   // center-center
    vec2( offset,  0.0f),   // center-right
    vec2(-offset, -offset), // bottom-left
    vec2( 0.0f,   -offset), // bottom-center
    vec2( offset, -offset)  // bottom-right    
 );

  vec3 subTexture[9];
  // sample from texture offsets if using convolution matrix
  if (chaos || shake) {
    for(int i = 0; i < 9; i++) {
      subTexture[i] = vec3(texture(uTexture, vTexCoords.st + offsets[i]));
    }
  }

  // process effects
  if (chaos) {           
    for(int i = 0; i < 9; i++) {
      color += vec4(subTexture[i] * edgeKernel[i], 0.0f);
     }
    color.a = 1.0f;
  } else if (confuse) {
    color = vec4(1.0 - texture(uTexture, vTexCoords).rgb, 1.0);
  } else if (shake) {
    for(int i = 0; i < 9; i++) {
      color += vec4(subTexture[i] * blurKernel[i], 0.0f);
    }
    color.a = 1.0f;
  } else {
    color =  texture(uTexture, vTexCoords);
  }

  FragColor = color;
} 
`;
