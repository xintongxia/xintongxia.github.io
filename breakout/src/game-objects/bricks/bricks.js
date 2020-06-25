import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import GameObject from '../base/game-object';
import {COLOR_MAP} from '../../game-configs';
import bricksVs from './bricks-vs';
import bricksFs from './bricks-fs';

export const BRICK_STATE = {
  SOLID: 1,
  BREAKABLE: 2,
  DESTROYED: -1
};

export default class Bricks extends GameObject {
  constructor(gl, props) {
    super(gl, props);
    this._intanceCount = 0;
    this._instancePositions = null;
    this._instanceColors = null;
    this._instanceStates = null;
    this._initialInstanceStates = null;
    this._activeBricks = 0;
    this._changed = false;
  }

  get isComplete() {
    return this._activeBricks === 0;
  }

  get instanceCount() {
    return this._intanceCount;
  }

  get instancePositions() {
    return this._instancePositions;
  }

  get instanceStates() {
    return this._instanceStates;
  }

  get instanceColors() {
    return this._instanceColors;
  }

  setInstance(index, props) {
    if ('state' in props) {
      this._instanceStates[index] = props.state;
      this._changed = true;
    }
  }

  setProps(props) {
    this.props = props;
    if ('layout' in props) {
      this._updateModel(props);
    }
  }

  _updateModel(props) {
    const gl = this.gl;
    const {
      instancePositions,
      instanceColors,
      instanceStates,
      instanceCount
    } = this._createInstances(props.layout);

    this.model.setProps({instanceCount});
    this.model.setAttributes({
      instancePositions: [new Buffer(gl, instancePositions), {divisor: 1}],
      instanceColors: [new Buffer(gl, instanceColors), {divisor: 1}],
      instanceStates: [new Buffer(gl, instanceStates), {divisor: 1}]
    });
  }

  createModel(props) {
    const gl = this.gl;
    const modelMatrix = this.modelMatrix;

    const positionBuffer = new Buffer(
      gl,
      new Float32Array([
        -1.0,
        -1.0,
        0.0,
        0.0,
        1.0,
        -1.0,
        1.0,
        0.0,
        1.0,
        1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        0.0,
        1.0
      ])
    );

    const {
      instancePositions,
      instanceColors,
      instanceStates,
      instanceCount
    } = this._createInstances(props.layout);

    return new Model(gl, {
      vs: bricksVs,
      fs: bricksFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, instancePositions), {divisor: 1}],
        instanceColors: [new Buffer(gl, instanceColors), {divisor: 1}],
        instanceStates: [new Buffer(gl, instanceStates), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this.projectionMatrix,
        uModelMatrix: modelMatrix,
        // case 1
        uBlockSolidTexture: this.textures.blockSolid,
        // case >= 2
        uBlockTexture: this.textures.block
      },
      instanceCount,
      vertexCount: 4
    });
  }

  update(dt, {gameState}) {
    const gl = this.gl;
    if (this._changed) {
      this.model.setAttributes({
        instanceStates: new Buffer(gl, this._instanceStates)
      });
      this._changed = false;
    }

    return this;
  }

  render(options) {
    this.model.draw(options);
  }

  reset() {
    const gl = this.gl;
    this._instancePositions = this._initialInstancePositions.slice();
    this._instanceColors = this._initialInstanceColors.slice();
    this._instanceStates = this._initialInstanceStates.slice();
    this.model.setAttributes({
      instancePositions: [new Buffer(gl, this._instancePositions), {divisor: 1}],
      instanceColors: [new Buffer(gl, this._instanceColors), {divisor: 1}],
      instanceStates: [new Buffer(gl, this._instanceStates), {divisor: 1}]
    });
  }

  getInstance(index) {
    const {instanceColors, instancePositions, instanceStates} = this;
    return {
      color: instanceColors.subarray(index * 4, index * 4 + 3),
      state: instanceStates[index],
      offset: instancePositions.subarray(index * 2, index * 2 + 2)
    };
  }

  _createInstances(layout) {
    const gl = this.gl;
    const size = this.size;
    const halfX = gl.canvas.width / 2;
    const halfY = gl.canvas.height / 2;
    const instanceCount = layout.length;
    this._activeBricks = instanceCount;

    let instancePositions = new Float32Array(instanceCount * 2);
    let instanceColors = new Float32Array(instanceCount * 4);
    let instanceStates = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      let textureIndex = 0;
      let state = BRICK_STATE.DESTROYED;
      const brickCode = layout[i];
      switch (brickCode) {
        case 0:
          this._activeBricks--;
          state = BRICK_STATE.DESTROYED;
          textureIndex = 0;
          break;
        case 1:
          state = BRICK_STATE.SOLID;
          textureIndex = 1.0;
          break;
        default:
          state = BRICK_STATE.BREAKABLE;
          textureIndex = 2.0;
      }

      const row = Math.floor(i / 15);
      const col = i % 15;
      const xOffset = col * size[0] + size[0] / 2 - halfX;
      const yOffset = halfY - (row * size[1] + size[1] / 2);
      const color = COLOR_MAP[brickCode];

      instancePositions[i * 2] = xOffset;
      instancePositions[i * 2 + 1] = yOffset;

      instanceColors[i * 4] = color[0];
      instanceColors[i * 4 + 1] = color[1];
      instanceColors[i * 4 + 2] = color[2];
      instanceColors[i * 4 + 3] = textureIndex;

      instanceStates[i] = state;
    }

    this._intanceCount = instanceCount;
    this._instancePositions = instancePositions;
    this._instanceColors = instanceColors;
    this._instanceStates = instanceStates;
    this._initialInstancePositions = instancePositions.slice();
    this._initialInstanceColors = instanceColors.slice();
    this._initialInstanceStates = instanceStates.slice();
    this._activeBricks = instanceCount;

    return {
      instancePositions,
      instanceColors,
      instanceStates,
      instanceCount
    };
  }
}
