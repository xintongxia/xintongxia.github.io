import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import GameObject from '../base/game-object';
import simpleTextureVs from '../base/simple-texture-vs';
import simpleTextureFs from '../base/simple-texture-fs';
import {Vector3} from '@math.gl/core';

export default class Player extends GameObject {
  constructor(gl, props) {
    super(gl, props);
    this._color = new Vector3(1.0, 1.0, 1.0);
    if (props.color) {
      this._color.set(props.color[0], props.color[1], props.color[2]);
    }
  }

  get color() {
    return this._color;
  }

  set color(color) {
    this._color.set(color[0], color[1], color[2]);
  }

  set texture(texture) {
    this.model.setUniforms({
      uTexture: texture
    });
  }

  createModel() {
    const gl = this.gl;
    // buffers
    const positionBuffer = new Buffer(
      gl,
      // prettier-ignore
      new Float32Array([
        -1.0, -1.0, 0.0, 0.0,
        1.0, -1.0, 1.0, 0.0,
        1.0, 1.0, 1.0, 1.0,
        -1.0, 1.0, 0.0, 1.0
      ])
    );

    const colorBuffer = new Buffer(
      gl,
      // prettier-ignore
      new Float32Array([
        1.0, 0.0, 1.0, 0.0,
        1.0, 1.0, 0.0, 0.0,
        1.0, 1.0, 0.0, 1.0
      ])
    );

    return new Model(gl, {
      vs: simpleTextureVs,
      fs: simpleTextureFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        colors: colorBuffer
      },
      uniforms: {
        uModelMatrix: this.modelMatrix,
        uOffset: this.offset,
        uProjectionMatrix: this.projectionMatrix,
        uTexture: this.textures.player,
        uColor: [1.0, 1.0, 1.0]
      },
      vertexCount: 4
    });
  }

  move(direction) {
    const {offset, velocity, halfSize, boundaries} = this;
    const halfX = halfSize.x;
    const [xMin, xMax] = boundaries;

    switch (direction) {
      case -1: // left
        offset[0] -= velocity[0] * 0.01;
        if (offset[0] < xMin) {
          offset[0] = halfX;
        }
        break;
      case 1: // right
        offset[0] += velocity[0] * 0.01;
        if (offset[0] > xMax) {
          offset[0] = xMax;
        }
        break;
      default:
    }
  }

  setTexture(texture) {
    this.model.setUniforms({
      uTexture: texture
    });
  }

  update(dt, {gameState}) {
    return this;
  }

  render(options) {
    this.model
      .setUniforms({
        uOffset: this.offset,
        uColor: this.color
      })
      .draw(options);
  }

  reset() {
    super.reset();
    this.model.setUniforms({
      uTexture: this.textures['player']
    });
    this.color.set(1.0, 1.0, 1.0);
  }
}
