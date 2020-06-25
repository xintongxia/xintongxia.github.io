import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import GameObject from '../base/game-object';
import {GAME_STATE} from '../../game-configs';
import powerupVs from './powerup-vs';
import powerupFs from './powerup-fs';

export const POWERUP_TYPES = [
  'speed',
  'sticky',
  'passthrough',
  'increase',
  'confuse',
  'chaos',
  'shake'
];
const SHAKE_TIME = 0.5;
const CHAOS_TIME = 2;
const CONFUSE_TIME = 2;

export default class Powerup extends GameObject {
  constructor(gl, props) {
    super(gl, props);

    this._objects = [];

    // initialize powerup effects to 0
    // number represent the active time for that effect
    this._speed = 0;
    this._sticky = 0;
    this._passthrough = 0;
    this._increase = 0;
    this._confuse = 0;
    this._chaos = 0;
    this._shake = 0;
  }

  get objects() {
    return this._objects;
  }

  get speed() {
    return this._speed;
  }
  set speed(val) {
    this._speed = val;
  }

  get sticky() {
    return this._sticky;
  }
  set sticky(val) {
    this._sticky = val;
  }

  get passthrough() {
    return this._passthrough;
  }
  set passthrough(val) {
    this._passthrough = val;
  }

  get increase() {
    return this._increase;
  }
  set increase(val) {
    this._increase = val;
  }

  get chaos() {
    return this._chaos;
  }
  set chaos(val) {
    this._chaos = val;
  }

  get confuse() {
    return this._confuse;
  }
  set confuse(val) {
    this._confuse = val;
  }

  get shake() {
    return this._shake;
  }
  set shake(val) {
    this._shake = val;
  }

  get activated() {
    let count = 0;
    POWERUP_TYPES.forEach((type) => (count += this[type] > 0));
    return count;
  }

  createModel() {
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

    const model = new Model(gl, {
      vs: powerupVs,
      fs: powerupFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [
          new Buffer(gl, new Float32Array([-1000.0, -10000.0, 0.0])),
          {divisor: 1}
        ],
        instanceColors: [new Buffer(gl, new Float32Array([0.0, 0.0, 0.0])), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this.projectionMatrix,
        uModelMatrix: modelMatrix,
        uSpeedTexture: this.textures.speed,
        uStickyTexture: this.textures.sticky,
        uPassthroughTexture: this.textures.passthrough,
        uIncreaseTexture: this.textures.increase,
        uConfuseTexture: this.textures.confuse,
        uChaosTexture: this.textures.chaos
      },
      instanceCount: 1,
      vertexCount: 4
    });

    return model;
  }

  update(dt, {gameState}) {
    if (gameState === GAME_STATE.MENU) {
      return this;
    }

    const gl = this.gl;
    POWERUP_TYPES.forEach((type) => {
      const leftTime = this[type];
      if (leftTime > 0) {
        this[type] -= dt;
        if (this[type] <= 0) {
          this.props.onEnd(type);
          this[type] = 0;
        }
      }
    });

    const objects = this._objects;
    if (!objects.length) {
      return this;
    }

    this._objects = [];
    const velocity = this.velocity;
    const boundaries = this.boundaries;
    const instancePositions = [];
    const instanceColors = [];
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      const {offset, color, texIndex} = object;
      object.duration -= dt;
      if (offset[1] > boundaries[2]) {
        offset[0] += dt * velocity[0];
        offset[1] += dt * velocity[1];
        instancePositions.push(offset[0], offset[1], texIndex);
        instanceColors.push(color[0], color[1], color[2]);
        this._objects.push(object);
      }
    }

    this.model.setProps({
      attributes: {
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceColors: [new Buffer(gl, new Float32Array(instanceColors)), {divisor: 1}]
      },
      instanceCount: this._objects.length
    });

    return this;
  }

  activate(object) {
    const {type} = object;
    switch (type) {
      case 'speed':
        this._speed = object.duration;
        this.props.onActivate(object);
        this._activated++;
        break;
      case 'sticky':
        this._sticky = object.duration;
        this.props.onActivate(object);
        break;
      case 'passthrough':
        this._passthrough = object.duration;
        this.props.onActivate(object);
        break;
      case 'increase':
        this._increase = object.duration;
        this.props.onActivate(object);
        break;
      case 'confuse':
        if (this._chaos <= 0) {
          this._confuse = CONFUSE_TIME;
          this.props.onActivate(object);
        }
        break;
      case 'chaos':
        if (this._confuse <= 0) {
          this._chaos = CHAOS_TIME;
          this.props.onActivate(object);
        }
        break;
      case 'shake':
        this._shake = SHAKE_TIME;
        this.props.onActivate(object);
        break;
      default:
    }
  }

  spawn(offset) {
    if (this._shouldSpawnPowerup(75)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'speed',
        color: [0.5, 0.5, 1.0],
        duration: 5,
        texIndex: 1
      });
    }
    if (this._shouldSpawnPowerup(75)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'sticky',
        color: [1.0, 0.5, 1.0],
        duration: 5,
        texIndex: 2
      });
    }

    if (this._shouldSpawnPowerup(75)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'passthrough',
        color: [0.5, 1.0, 0.5],
        duration: 5,
        texIndex: 3
      });
    }

    if (this._shouldSpawnPowerup(15)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'increase',
        color: [1.0, 0.6, 0.4],
        duration: 5,
        texIndex: 4
      });
    }
    if (this._shouldSpawnPowerup(15)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'confuse',
        color: [1.0, 0.3, 0.3],
        duration: CONFUSE_TIME,
        texIndex: 5
      });
    }
    if (this._shouldSpawnPowerup(15)) {
      this._objects.push({
        offset: [offset[0], offset[1]],
        type: 'chaos',
        color: [0.9, 0.25, 0.25],
        duration: CHAOS_TIME,
        texIndex: 6
      });
    }
  }

  render(options) {
    this.model.draw(options);
  }

  reset() {
    const gl = this.gl;
    this.model.setProps({
      attributes: {
        instancePositions: [
          new Buffer(gl, new Float32Array([-1000.0, -10000.0, 0.0])),
          {divisor: 1}
        ],
        instanceColors: [new Buffer(gl, new Float32Array([0.0, 0.0, 0.0])), {divisor: 1}]
      },
      instanceCount: 1
    });

    POWERUP_TYPES.forEach((type) => {
      this[type] = 0;
    });
    this._objects = [];
  }

  _shouldSpawnPowerup(chance) {
    const r = Math.floor(Math.random() * 100);
    return chance % r === 0;
  }
}
