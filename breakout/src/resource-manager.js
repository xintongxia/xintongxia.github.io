import {Texture2D} from '@luma.gl/webgl';
import * as GL from '@luma.gl/constants';

export const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_R]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE
};

export default class ResourceManager {
  constructor(gl, props = {}) {
    this.gl = gl;
    this._textures = {};
    this._textureParams = props.textureParams || DEFAULT_TEXTURE_PARAMETERS;
  }

  get textures() {
    return this._textures;
  }

  loadTextures(textures) {
    const gl = this.gl;
    for (let i = 0; i < textures.length; i++) {
      const {name, data, width, height, flipY = true} = textures[i];
      this._textures[name] = new Texture2D(gl, {
        data,
        parameters: this._textureParams,
        pixelStore: {
          [GL.UNPACK_FLIP_Y_WEBGL]: flipY
        },
        width,
        height,
        mipmaps: true
      });
    }
  }

  getTexture(name) {
    return this.textures[name];
  }
}
