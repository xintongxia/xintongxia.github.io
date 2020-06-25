import GameObject from '../game-objects/base/game-object';
import {Model} from '@luma.gl/engine';
import sceneVs from './scene-vs';
import sceneFs from './scene-fs';
import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';

export default class Scene extends GameObject {
  constructor(gl, props = {}) {
    super(gl, props);
    this.chaos = -1;
    this.confuse = -1;
    this.shake = -1;
    this._timer = 0;
  }

  createModel() {
    const gl = this.gl;
    /*
      3 --- 2
      |     |
      0 --- 1
   */
    const positions = [-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1];

    const model = new Model(gl, {
      vs: sceneVs,
      fs: sceneFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: new Buffer(gl, new Float32Array(positions))
      },
      uniforms: {
        chaos: false,
        confuse: false,
        shake: false
      },
      vertexCount: 4
    });

    return model;
  }

  update(dt, {gameState, texture, chaos, confuse, shake}) {
    this._timer = this._timer++ % 1e6;

    this.model.setUniforms({
      chaos,
      confuse,
      shake,
      uTime: this._timer,
      uTexture: texture
    });
    return this;
  }

  render(options) {
    this.model.draw();
  }
}
