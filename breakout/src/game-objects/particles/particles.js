import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import GameObject from '../base/game-object';
import {GAME_STATE, NEW_PARTICLES_PER_FRAME, NUMBER_OF_PARTICLES} from '../../game-configs';
import particlesVs from './particles-vs';
import particlesFs from './particles-fs';

export default class Particles extends GameObject {
  constructor(gl, props) {
    super(gl, props);

    this._lastUnused = 0;
    this._instanceColors = null;
    this._instancePositions = null;
    this._initialInstanceColors = null;
    this._initialInstancePositions = null;
  }

  createModel() {
    const gl = this.gl;
    const modelMatrix = this.modelMatrix;
    const offset = this.offset;

    const positionBuffer = new Buffer(
      gl,
      new Float32Array([
        -1.0, -1.0, 0.0, 0.0,
        1.0, -1.0, 1.0, 0.0,
        1.0, 1.0, 1.0, 1.0,
        -1.0, 1.0, 0.0, 1.0
      ])
    );

    const instanceCount = NUMBER_OF_PARTICLES;
    const instancePositions = new Float32Array(instanceCount * 2);
    const instanceColors = new Float32Array(instanceCount * 4);

    for (let i = 0; i < instanceCount; i++) {
      const random = Math.random() * 10 - 5;
      const rColor = Math.random();
      instancePositions[i * 2] = offset[0] + random;
      instancePositions[i * 2 + 1] = offset[1] + random;
      instanceColors[i * 4] = rColor;
      instanceColors[i * 4 + 1] = rColor;
      instanceColors[i * 4 + 2] = rColor;
      instanceColors[i * 4 + 3] = rColor;
    }



    const model = new Model(gl, {
      vs: particlesVs,
      fs: particlesFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, instancePositions), {divisor: 1}],
        instanceColors: [new Buffer(gl, instanceColors), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this.projectionMatrix,
        uModelMatrix: modelMatrix,
        uTexture: this.textures.particle
      },
      instanceCount,
      vertexCount: 4
    });

    this._instanceColors = instanceColors;
    this._instancePositions = instancePositions;
    this._initialInstanceColors =  instanceColors.slice();
    this._initialInstancePositions = instancePositions.slice();

    return model;
  }

  update(dt, {
    gameState,
    spriteOffset
  }) {
    if (gameState !== GAME_STATE.STUCK && gameState !== GAME_STATE.ACTIVE) {
      return this;
    }

    const gl = this.gl;
    const instancePositions = this._instancePositions;
    const instanceColors = this._instanceColors;
    const velocity = this.velocity;

    for (let i = 0; i < NEW_PARTICLES_PER_FRAME; i++) {
      const firstUnused = this._getFirsUnused();
      const random = Math.random() * 10 - 5;
      const rColor = Math.min(0.5 + Math.random(), 1);
      instanceColors[firstUnused * 4] = rColor;
      instanceColors[firstUnused * 4 + 1] = rColor;
      instanceColors[firstUnused * 4 + 2] = rColor;
      instanceColors[firstUnused * 4 + 3] = 1;
      instancePositions[firstUnused * 2] = random + spriteOffset[0];
      instancePositions[firstUnused * 2 + 1] = random + spriteOffset[1];
    }

    for (let i = 0; i < NUMBER_OF_PARTICLES; i++) {
      instanceColors[i * 4 + 3] = instanceColors[i * 4 + 3] - dt * 2.5;
      instancePositions[i * 2] = instancePositions[i * 2] - dt * velocity[0];
      instancePositions[i * 2 + 1] = instancePositions[i * 2 + 1] - dt * velocity[1];
    }

    this.model.setAttributes({
      instanceColors: [new Buffer(gl, instanceColors), {divisor: 1}],
      instancePositions: [new Buffer(gl, instancePositions), {divisor: 1}]
    });

    return this;
  }

  _getFirsUnused() {
    const instanceColors = this._instanceColors;
    const lastUnused = this._lastUnused;
    for (let i = lastUnused; i < NUMBER_OF_PARTICLES; i++) {
      if (instanceColors[i * 4 + 3] <= 0) {
        this._lastUnused = i;
        return i;
      }
    }

    for (let i = 0; i < lastUnused; i++) {
      if (instanceColors[i * 4 + 3] <= 0) {
        this._lastUnused = i;
        return i;
      }
    }
    this._lastUnused = 0;
    return 0;
  }

  render(options) {
    this.model.draw(options);
  }

  reset() {
    super.reset();
    this._instanceColors = this._initialInstanceColors.slice();
    this._instancePositions = this._initialInstancePositions.slice();
    this.model.setAttributes({
      instanceColors: [
        new Buffer(this.gl, this._instanceColors),
        {divisor: 1}
      ],
      instancePositions: [
        new Buffer(this.gl, this._instancePositions),
        {divisor: 1}
      ]
    });
  }
}
