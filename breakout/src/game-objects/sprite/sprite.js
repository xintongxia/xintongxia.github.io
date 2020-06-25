import {Vector3} from '@math.gl/core';
import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import GameObject from '../base/game-object';
import simpleTextureVs from '../base/simple-texture-vs';
import simpleTextureFs from '../base/simple-texture-fs';
import {GAME_STATE} from '../../game-configs';

export default class Sprite extends GameObject {
  constructor(gl, props = {}) {
    super(gl, props);
    this.radius = props.radius;
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

  createModel(props) {
    const gl = this.gl;
    const modelMatrix = this.modelMatrix;
    const offset = this.offset;
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
        0.0, 0.0, 1.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        1.0, 0.0, 0.0, 1.0
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
        uColor: this._color.toArray(),
        uOffset: offset,
        uModelMatrix: modelMatrix,
        uTexture: this.textures.sprite
      },
      vertexCount: 4
    });
  }

  _updatePositions(dt) {
    const [xMin, xMax, yMin, yMax] = this.boundaries;
    const {offset, velocity, radius} = this;
    if (offset[0] - radius < xMin) {
      offset[0] = radius + xMin;
      velocity[0] = -velocity[0];
    } else if (offset[0] + radius > xMax) {
      offset[0] = xMax - radius;
      velocity[0] = -velocity[0];
    }

    if (offset[1] + radius > yMax) {
      offset[1] = yMax - radius;
      velocity[1] = -velocity[1];
    } else if (offset[1] < yMin) {
      this.props.onFallout();
      return;
    }

    offset.add(velocity.clone().multiplyScalar(dt));
  }

  update(dt, {gameState, offset, skipUpdateOffset}) {
    switch (gameState) {
      case GAME_STATE.ACTIVE:
        this._updatePositions(dt);
        break;
      case GAME_STATE.STUCK:
        if (offset) {
          this.offset = offset;
        }
        break;
      default:
    }

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
    this._color.set(1.0, 1.0, 1.0);
  }
}
