import {instrumentGLContext, setParameters} from '@luma.gl/core';
import {AnimationLoop} from '@luma.gl/engine';
import {Buffer, clear, Texture2D, Framebuffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';
import * as GL from '@luma.gl/constants';
import {Vector2, Matrix4, radians} from '@math.gl/core';
import EventHandler from '../controller';

import baseVs from './shaders/base-vs';
import baseFs from './shaders/base-fs';
import bricksVs from './shaders/bricks-vs';
import bricksFs from './shaders/bricks-fs';
import particlesVs from './shaders/particles-vs';
import particlesFs from './shaders/particles-fs';
import simpleTextureVs from './shaders/simple-texture-vs';
import simpleTextureFs from './shaders/simple-texture-fs';
import powerupVs from './shaders/powerup-vs';
import powerupFs from './shaders/powerup-fs';
import sceneVs from './shaders/scene-vs';
import sceneFs from './shaders/scene-fs';
import textVs from './shaders/text-vs';
import textFs from './shaders/text-fs';

import {
  LAYOUT_STANDARD,
  COLOR_MAP,
  BRICKS_PER_LINE,
  NUMBER_OF_PARTICLES,
  NEW_PARTICLES_PER_FRAME
} from '../game-configs';
import TextRenderer from './text-renderer';

const dt = 0.01;
const IDENTITY_MATRIX = new Matrix4();

const BRICK_STATE = {
  SOLID: 1,
  BREAKABLE: 2,
  DESTROYED: -1
};

const COMPASS = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0]
};

const SHAKE_TIME = 15;
const CONFUSE_TIME = 15;
const CHAOS_TIME = 15;

const DEFAULT_TEXTURE_PARAMETERS = {
  [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
  [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
  [GL.TEXTURE_WRAP_R]: GL.CLAMP_TO_EDGE,
  [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE
};

function clamp(value, min, max) {
  return [value.x, value.y].map((val, i) => Math.min(Math.max(min[i], val), max[i]));
}

function length(xy) {
  const x = xy[0];
  const y = xy[1];
  return Math.sqrt(x * x + y * y);
}

const POWER_UP_TYPES = ['speed', 'sticky', 'passthrough', 'increase', 'confuse', 'chaos', 'shake'];

const scratchPos = new Vector2();
const scratchClosest = new Vector2();
const scratchCircleCenter = new Vector2();
const scratchCompass = new Vector2();
const scratchVelocity = new Vector2();

export default class Game {
  constructor(gl, props = {}) {
    instrumentGLContext(gl);
    this.gl = gl;
    this._animationLoop = new AnimationLoop({
      gl,
      autoResizeViewport: false,
      useDevicePixels: false,
      onInitialize: this._onInitialize.bind(this),
      onRender: this._onRender.bind(this)
    });
    this._animationLoop.start();
    this._bricks = {};
    this._paddle = {};
    this._sprite = {};
    this._powerup = {};
    this._activeBricks = 0;
    this._timer = 1;
  }

  _onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL,
      blend: true
    });

    this._fontAtlasManager = new TextRenderer(gl);

    const initialSpriteOffset = [0, -270];
    const initialPaddleOffset = [0, -290];
    const initialSpriteVelocity = [500, 400];
    const brickSize = [gl.canvas.width / BRICKS_PER_LINE, 30];
    const paddleSize = [100, 20];
    const spriteSize = [25, 25];
    const spriteRadius = 12.5;
    const powerupSize = [60, 20];

    this._controller = new EventHandler(this.gl.canvas, {
      width: this.gl.width,
      height: this.gl.height,
      initialSpriteOffset,
      initialPaddleOffset,
      initialSpriteVelocity,
      spriteSize,
      onStart: this._onStart.bind(this),
      onReset: this._onReset.bind(this)
    });

    this._initializeMatrices();
    this._initializeTextures();

    // models
    const bricksModel = this._getBricksModel(gl, {size: brickSize});
    const paddleModel = this._getPaddleModel(gl, {
      size: paddleSize,
      offset: this._controller.paddleOffset
    });
    const spriteModel = this._getSpriteModel(gl, {
      size: spriteSize,
      offset: this._controller.spriteOffset
    });
    const particlesOffset = [
      initialSpriteOffset[0] + spriteRadius,
      initialSpriteOffset[1] + spriteRadius
    ];
    const particlesModel = this._getParticlesModel(gl, {
      size: spriteSize,
      offset: particlesOffset,
      velocity: [30, 25]
    });
    const powerupModel = this._getPowerUpModel(gl, {size: powerupSize});

    POWER_UP_TYPES.forEach((type) => {
      this._powerup[type] = 0;
    });

    const baselineModel = this._getBaselineModel(gl);
    const framebuffer = this._getFrameBuffer(gl);
    const sceneModel = this._getSceneModel(gl);
    const textModel = this._getTextModel(gl);
    this._paddle = {
      model: paddleModel,
      size: paddleSize
    };

    this._sprite = {
      model: spriteModel,
      radius: spriteRadius,
      size: spriteSize,
      color: [1.0, 1.0, 1.0]
    };

    this._lastUsedParticle = 0;
    this._gameState = 'stopped';

    return {
      bricksModel,
      paddleModel,
      particlesModel,
      spriteModel,
      powerupModel,
      baselineModel,
      sceneModel,
      textModel,
      framebuffer
    };
  }

  _initializeMatrices() {
    const gl = this.gl;
    const halfX = gl.canvas.width / 2;
    const halfY = gl.canvas.height / 2;
    this._projectionMatrix = new Matrix4().ortho({
      left: -halfX,
      right: halfX,
      bottom: -halfY,
      top: halfY,
      near: -1,
      far: 1
    });
  }

  _initializeTextures() {
    const gl = this.gl;
    this._spriteTexture = new Texture2D(gl, {
      data: 'src/img/awesomeface.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 512,
      mipmaps: true
    });

    this._blockTexture = new Texture2D(gl, {
      data: 'src/img/block.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 128,
      height: 128,
      mipmaps: true
    });

    this._blockSolidTexture = new Texture2D(gl, {
      data: 'src/img/block_solid.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 128,
      height: 128,
      mipmaps: true
    });

    this._paddleTexture = new Texture2D(gl, {
      data: 'src/img/paddle.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._particleTexture = new Texture2D(gl, {
      data: 'src/img/particle.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 500,
      height: 500,
      mipmaps: true
    });

    this._speedTexture = new Texture2D(gl, {
      data: 'src/img/powerup_speed.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._stickyTexture = new Texture2D(gl, {
      data: 'src/img/powerup_sticky.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._passthroughTexture = new Texture2D(gl, {
      data: 'src/img/powerup_passthrough.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._increaseTexture = new Texture2D(gl, {
      data: 'src/img/powerup_increase.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._confuseTexture = new Texture2D(gl, {
      data: 'src/img/powerup_confuse.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });

    this._chaosTexture = new Texture2D(gl, {
      data: 'src/img/powerup_chaos.png',
      parameters: DEFAULT_TEXTURE_PARAMETERS,
      pixelStore: {
        [GL.UNPACK_FLIP_Y_WEBGL]: true
      },
      width: 512,
      height: 128,
      mipmaps: true
    });
  }

  _getBricksModel(gl, {size}) {
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

    const instancePositions = [];
    const instanceColors = [];
    const instanceStates = [];
    const instanceCount = LAYOUT_STANDARD.length;
    this._activeBricks = instanceCount;

    const halfX = gl.canvas.width / 2;
    const halfY = gl.canvas.height / 2;

    for (let i = 0; i < instanceCount; i++) {
      let textureCode = 0;
      let state = BRICK_STATE.DESTROYED;
      const brickCode = LAYOUT_STANDARD[i];
      switch (brickCode) {
        case 0:
          this._activeBricks--;
          state = BRICK_STATE.DESTROYED;
          textureCode = 0;
          break;
        case 1:
          state = BRICK_STATE.SOLID;
          textureCode = 1.0;
          break;
        default:
          state = BRICK_STATE.BREAKABLE;
          textureCode = 2.0;
      }

      const row = Math.floor(i / 15);
      const col = i % 15;
      const xOffset = col * size[0] + size[0] / 2 - halfX;
      const yOffset = halfY - (row * size[1] + size[1] / 2);

      instancePositions.push(xOffset, yOffset, textureCode);
      instanceColors.push(...COLOR_MAP[brickCode]);
      instanceStates.push(state);
    }

    const modelMatrix = new Matrix4().scale([size[0] / 2, size[1] / 2, 1]);
    const model = new Model(gl, {
      vs: bricksVs,
      fs: bricksFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceColors: [new Buffer(gl, new Float32Array(instanceColors)), {divisor: 1}],
        instanceStates: [new Buffer(gl, new Float32Array(instanceStates)), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this._projectionMatrix,
        uModelMatrix: modelMatrix,
        // case 1
        uBlockSolidTexture: this._blockSolidTexture,
        // case >= 2
        uBlockTexture: this._blockTexture
      },
      instanceCount,
      vertexCount: 4
    });

    this._bricks = {
      model,
      size,
      initialInstanceColors: [...instanceColors],
      initialInstanceStates: [...instanceStates],
      instanceStates,
      instanceCount,
      positions: positionBuffer,
      instancePositions,
      instanceColors
    };

    return model;
  }

  _getPaddleModel(gl, {size, offset}) {
    const modelMatrix = new Matrix4().scale([size[0] / 2, size[1] / 2, 1]);
    // buffers
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

    const colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0])
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
        hasTexture: true,
        uModelMatrix: modelMatrix,
        uOffset: offset,
        uProjectionMatrix: this._projectionMatrix,
        uTexture: this._paddleTexture
      },
      vertexCount: 4
    });
  }

  _getFirsUnused() {
    const {instanceColors, lastUnused} = this._particles;
    for (let i = lastUnused; i < PARTICLES; i++) {
      if (instanceColors[i * 4 + 3] <= 0) {
        this._particles.lastUnused = i;
        return i;
      }
    }

    for (let i = 0; i < lastUnused; i++) {
      if (instanceColors[i * 4 + 3] <= 0) {
        this._particles.lastUnused = i;
        return i;
      }
    }
    this._particles.lastUnused = 0;
    return 0;
  }

  _updateParticles(particlesModel) {
    if (this._controller.stuck) {
      return;
    }
    const gl = this.gl;
    const {instancePositions, instanceColors, velocity} = this._particles;
    const spriteOffset = this._controller.spriteOffset;

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

    for (let i = 0; i < PARTICLES; i++) {
      instanceColors[i * 4 + 3] = instanceColors[i * 4 + 3] - dt * 2.5;
      instancePositions[i * 2] = instancePositions[i * 2] - dt * velocity[0];
      instancePositions[i * 2 + 1] = instancePositions[i * 2 + 1] - dt * velocity[1];
    }

    particlesModel.setAttributes({
      instanceColors: [new Buffer(gl, new Float32Array(instanceColors)), {divisor: 1}],
      instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}]
    });
  }

  _getParticlesModel(gl, {size, offset, velocity}) {
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

    const instancePositions = [];
    const instanceColors = [];
    const instanceCount = PARTICLES;

    for (let i = 0; i < instanceCount; i++) {
      const random = Math.random() * 10 - 5;
      const rColor = Math.random();
      instancePositions.push(offset[0] + random, offset[1] + random);
      instanceColors.push(rColor, rColor, rColor, rColor);
    }

    const modelMatrix = new Matrix4().scale([size[0] / 2, size[1] / 2, 1]);
    const model = new Model(gl, {
      vs: particlesVs,
      fs: particlesFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceColors: [new Buffer(gl, new Float32Array(instanceColors)), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this._projectionMatrix,
        uModelMatrix: modelMatrix,
        uTexture: this._particleTexture
      },
      instanceCount,
      vertexCount: 4
    });

    this._particles = {
      model,
      lastUnused: 0,
      instancePositions,
      instanceColors,
      initialInstanceColors: [...instanceColors],
      initialInstancePositions: [...instancePositions],
      velocity
    };
    return model;
  }

  _getSpriteModel(gl, {size, offset}) {
    const modelMatrix = new Matrix4().scale([size[0] / 2, size[1] / 2, 1]);
    // buffers
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

    const colorBuffer = new Buffer(
      gl,
      new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0])
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
        uOffset: offset,
        uModelMatrix: modelMatrix,
        uProjectionMatrix: this._projectionMatrix,
        uTexture: this._spriteTexture
      },
      vertexCount: 4
    });
  }

  _getFrameBuffer(gl) {
    return new Framebuffer(gl, {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: new Texture2D(gl, {
          format: GL.RGBA,
          type: GL.UNSIGNED_BYTE,
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          mipmaps: false,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
            [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
            [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
            [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
          }
        }),
        [GL.DEPTH_ATTACHMENT]: new Texture2D(gl, {
          format: GL.DEPTH_COMPONENT16,
          type: GL.UNSIGNED_SHORT,
          dataFormat: GL.DEPTH_COMPONENT,
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          mipmaps: false,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
            [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
            [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
            [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
          }
        })
      }
    });
  }

  _getSceneModel(gl) {
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

    this._scene = {
      model
    };

    return model;
  }

  _updatePowerups(dt) {
    if (this._controller.stuck) {
      return;
    }

    const gl = this.gl;
    const {objects, velocity, size} = this._powerup;

    const instancePositions = [];
    const instanceColors = [];
    const newObjects = [];
    for (const obj of objects) {
      const texIndex = obj.texIndex;
      obj.position[1] += dt * velocity[1];

      const paddleOffset = this._controller.paddleOffset;

      const paddle = this._paddle;
      const isCollided = this._detectCollision(
        {size, position: obj.position},
        {
          size: paddle.size,
          position: paddleOffset
        }
      );
      if (isCollided) {
        this._activatePowerup(obj);
      } else if (obj.position[1] >= -gl.drawingBufferHeight / 2) {
        newObjects.push(obj);
        instancePositions.push(obj.position[0], obj.position[1], texIndex);
        instanceColors.push(...obj.color);
      }
    }

    POWER_UP_TYPES.forEach((type) => {
      if (this._powerup[type] > 0) {
        this._powerup[type] -= dt * 100;
        if (this._powerup[type] === 0) {
          switch (type) {
            case 'speed':
              const velocity = this._controller.spriteVelocity;
              this._controller.setProps({spriteVelocity: [velocity[0] / 1.2, velocity[1] / 1.2]});
              break;
            case 'sticky':
              this._sprite.color = [1.0, 1.0, 1.0];
              break;
            case 'passthrough':
              this._sprite.color = [1.0, 1.0, 1.0];
              break;
            case 'increase':
              this._paddle.size[1] = this._paddle.size[1] - 50;
              break;
            case 'confuse':
            case 'chaos':
            default:
          }
        }
      }
    });

    this._powerup.model.setProps({
      attributes: {
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceColors: [new Buffer(gl, new Float32Array(instanceColors)), {divisor: 1}]
      },
      instanceCount: newObjects.length
    });

    this._powerup.objects = newObjects;
  }

  _activatePowerup(object) {
    const {type} = object;
    switch (type) {
      case 'speed':
        this._powerup.speed = object.duration;
        const velocity = this._controller.spriteVelocity;
        this._controller.setProps({spriteVelocity: [velocity[0] * 1.2, velocity[1] * 1.2]});
        break;
      case 'sticky':
        this._powerup.sticky = object.duration;
        this._sprite.color = [1.0, 0.5, 1.0];
        this._controller.setProps({stuck: true});
        break;
      case 'passthrough':
        this._powerup.passthrough = object.duration;
        this._sprite.color = [1.0, 0.5, 0.5];
        break;
      case 'increase':
        this._powerup.increase = object.duration;
        this._paddle.size[1] = this._paddle.size[1] + 50;
        break;
      case 'confuse':
        this._powerup.confuse = CONFUSE_TIME;
        break;
      case 'chaos':
        this._powerup.chaos = CHAOS_TIME;
        break;
      default:
    }
  }

  _getPowerUpModel(gl, {size}) {
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

    const modelMatrix = new Matrix4().scale([size[0] / 2, size[1] / 2, 1]);
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
        uProjectionMatrix: this._projectionMatrix,
        uModelMatrix: modelMatrix,
        uSpeedTexture: this._speedTexture,
        uStickyTexture: this._stickyTexture,
        uPassthroughTexture: this._passthroughTexture,
        uIncreaseTexture: this._increaseTexture,
        uConfuseTexture: this._confuseTexture,
        uChaosTexture: this._chaosTexture
      },
      instanceCount: 1,
      vertexCount: 4
    });

    this._powerup = {
      model,
      shake: 0,
      velocity: [0, -150],
      size,
      objects: []
    };

    return model;
  }

  _getTextModel(gl) {
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

    const instancePositions = [];
    const instanceIconFrames = [];
    const instanceCoords = this._fontAtlasManager.getTextFrames('Press ENTER to start');
    const instanceCount = instanceCoords.length;

    const scale = [8, 8 * 1.5];
    let offsetX = -220;
    let offsetY = 0;
    const maxX = 220;
    for (let i = 0; i < instanceCount; i++) {
      const coord = instanceCoords[i];
      instancePositions.push(offsetX, offsetY);
      instanceIconFrames.push(coord.x, coord.y, coord.width, coord.height);
      offsetX += scale[0] * 2 + 4;

      if (offsetX > maxX) {
        offsetX = -200;
        offsetY -= scale[1] * 2 * 1.2;
      }
    }

    const iconsTexture = this._fontAtlasManager.texture;
    const modelMatrix = new Matrix4().scale([...scale, 1]);
    const model = new Model(gl, {
      vs: textVs,
      fs: textFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceIconFrames: [new Buffer(gl, new Float32Array(instanceIconFrames)), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this._projectionMatrix,
        uModelMatrix: modelMatrix,
        uTexture: iconsTexture,
        uColor: [1.0, 1.0, 1.0],
        iconsTextureDim: [iconsTexture.width, iconsTexture.height]
      },
      instanceCount,
      vertexCount: 4
    });

    this._texts = {
      model,
      lastUnused: 0,
      instanceIconFrames: [...instanceIconFrames],
      initialInstancePositions: [...instancePositions]
    };
    return model;
  }

  _shouldSpawnPowerup(chance) {
    const r = Math.floor(Math.random() * 100);
    return chance % r === 0;
  }

  _spawnPowerup(position) {
    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'speed',
        color: [0.5, 0.5, 1.0],
        duration: 10,
        texIndex: 1
      });
    }
    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'sticky',
        color: [1.0, 0.5, 1.0],
        duration: 20,
        texIndex: 2
      });
    }

    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'passthrough',
        color: [0.5, 1.0, 0.5],
        duration: 10,
        texIndex: 3
      });
    }

    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'increase',
        color: [1.0, 0.6, 0.4],
        duration: 10,
        texIndex: 4
      });
    }
    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'confuse',
        color: [1.0, 0.3, 0.3],
        duration: 15,
        texIndex: 5
      });
    }
    if (this._shouldSpawnPowerup(75)) {
      this._powerup.objects.push({
        position: [...position],
        type: 'chaos',
        color: [0.9, 0.25, 0.25],
        duration: 15,
        texIndex: 6
      });
    }
  }

  _getBaselineModel(gl) {
    // pos.x, pos.y, color.r color.g
    const buffer = new Buffer(
      gl,
      new Float32Array([
        -1.0,
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        0.0,
        -1.0,
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        1.0
      ])
    );

    return new Model(gl, {
      vs: baseVs,
      fs: baseFs,
      drawMode: GL.LINES,
      attributes: {
        positionColors: buffer
      },
      uniforms: {
        uModelMatrix: IDENTITY_MATRIX,
        uProjectionMatrix: IDENTITY_MATRIX
      },
      vertexCount: 4
    });
  }

  _detectBricksCollision() {
    if (this._controller.stuck) {
      return;
    }
    const {spriteOffset} = this._controller;
    const gl = this.gl;
    const {
      instanceCount,
      size: brickSize,
      positions,
      instanceStates,
      instancePositions,
      model
    } = this._bricks;
    const {size: spriteSize, radius: spriteRadius} = this._sprite;
    const min = [-brickSize[0] / 2, -brickSize[1] / 2];
    const max = [brickSize[0] / 2, brickSize[1] / 2];

    const spriteVelocity = this._controller.spriteVelocity;

    let changed = false;
    let shake = false;
    for (let i = 0; i < instanceCount; i++) {
      const state = instanceStates[i];
      scratchCircleCenter.set(spriteOffset[0], spriteOffset[1]);
      const brickPos = scratchPos.set(instancePositions[i * 3], instancePositions[i * 3 + 1]);
      let diff = scratchCircleCenter.subtract(brickPos).clone();
      const clamped = clamp(diff, min, max);
      scratchClosest.set(clamped[0], clamped[1]);
      let dist = diff.distance(scratchClosest);
      if (dist <= spriteRadius && state !== BRICK_STATE.DESTROYED) {
        scratchCircleCenter.set(spriteOffset[0], spriteOffset[1]);
        scratchClosest.set(clamped[0] + brickPos[0], clamped[1] + brickPos[1]);
        dist = scratchCircleCenter.distance(scratchClosest);
        const penetrated = spriteRadius - dist;
        if (!this._powerup.passthrough && state === BRICK_STATE.BREAKABLE) {
          instanceStates[i] = BRICK_STATE.DESTROYED;
          this._activeBricks--;
          changed = true;
          this._spawnPowerup(brickPos);
        }

        if (state === BRICK_STATE.SOLID) {
          this._powerup.shake = SHAKE_TIME;
        }

        if (!this._powerup.passthrough) {
          let dir = null;
          let maxVal = -1;
          diff.normalize();
          Object.keys(COMPASS).map((key) => {
            const value = COMPASS[key];
            scratchCompass.set(value[0], value[1]);
            const cos = scratchCompass.dot(diff);
            if (cos > maxVal) {
              dir = key;
              maxVal = cos;
            }
          });

          let sign;
          switch (dir) {
            case 'up':
            case 'down':
              sign = COMPASS[dir][1];
              spriteVelocity[1] = sign * spriteVelocity[1];
              spriteOffset[1] = spriteOffset[1] + sign * penetrated;
              break;
            case 'left':
            case 'right':
              sign = COMPASS[dir][0];
              spriteVelocity[0] = sign * spriteVelocity[0];
              spriteOffset[0] = spriteOffset[0] + sign * penetrated;
              break;
            default:
          }
        }
      }
    }

    if (changed) {
      this._gameState = 'bounced';
      model.setAttributes({
        instanceStates: [new Buffer(gl, new Float32Array(instanceStates)), {divisor: 1}]
      });
    }

    if (this._activeBricks === 0) {
      this._gameState = 'won';
    }
  }

  _detectPaddleCollision() {
    const {
      spriteOffset,
      paddleOffset,
      props: {initialSpriteVelocity}
    } = this._controller;
    const spritePos = scratchCircleCenter.set(spriteOffset[0], spriteOffset[1]);
    const paddlePos = scratchPos.set(paddleOffset[0], paddleOffset[1]);
    const diff = scratchCircleCenter.subtract(paddlePos).clone();
    const {radius: spriteRadius} = this._sprite;
    const {size: paddleSize} = this._paddle;

    const min = [-paddleSize[0] / 2, -paddleSize[1] / 2];
    const max = [paddleSize[0] / 2, paddleSize[1] / 2];
    const clamped = clamp(diff, min, max);
    scratchClosest.set(clamped[0], clamped[1]);
    let dist = spritePos.distance(scratchClosest);
    if (dist <= spriteRadius) {
      scratchCircleCenter.set(spritePos[0], spritePos[1]);
      const xDist = spritePos.x - paddlePos.x;
      const percentage = xDist / paddleSize[0] / 2;

      const spriteVelocity = this._controller.spriteVelocity;
      scratchVelocity.x = initialSpriteVelocity[0] * percentage;
      scratchVelocity.y = Math.abs(initialSpriteVelocity[1]);

      const l = length(spriteVelocity);
      const normalized = scratchVelocity.normalize();
      spriteVelocity[0] = normalized[0] * l;
      spriteVelocity[1] = normalized[1] * l;
    }
  }

  _detectCollision(one, two) {
    // collision x-axis?
    const collisionX =
      one.position[0] + one.size[0] >= two.position[0] &&
      two.position[0] + two.size[0] >= one.position[0];
    // collision y-axis?
    const collisionY =
      one.position[1] + one.size[1] >= two.position[1] &&
      two.position[1] + two.size[1] >= one.position[1];
    // collision only if on both axes
    return collisionX && collisionY;
  }

  _onStart() {
    this._gameState = 'started';
  }

  _onReset() {
    this._timer = 1;

    this._gameState = 'stopped';
    this._bricks.instanceStates = [...this._bricks.initialInstanceStates];
    this._bricks.model.setAttributes({
      instanceStates: [
        new Buffer(this.gl, new Float32Array(this._bricks.instanceStates)),
        {divisor: 1}
      ]
    });

    this._particles.instanceColors = [...this._particles.initialInstanceColors];
    this._particles.instancePositions = [...this._particles.initialInstancePositions];
    this._particles.model.setAttributes({
      instanceColors: [
        new Buffer(this.gl, new Float32Array(this._particles.instanceColors)),
        {divisor: 1}
      ],
      instancePositions: [
        new Buffer(this.gl, new Float32Array(this._particles.instancePositions)),
        {divisor: 1}
      ]
    });

    this._powerup.objects = [];
  }

  _onRender(props) {
    this._controller.animate();
    const {
      baselineModel,
      bricksModel,
      paddleModel,
      particlesModel,
      spriteModel,
      framebuffer,
      powerupModel,
      sceneModel,
      textModel,
      gl
    } = props;

    this._detectBricksCollision();
    this._detectPaddleCollision();
    this._updatePowerups(dt);

    const {paddleOffset, spriteOffset} = this._controller;
    const {radius: spriteRadius} = this._sprite;

    clear(gl, {color: [0, 0, 0, 1.0], depth: true, framebuffer});
    baselineModel.draw({framebuffer});
    bricksModel.draw({framebuffer});
    paddleModel.setUniforms({uOffset: paddleOffset}).draw({framebuffer});
    setParameters(gl, {
      blendFunc: [GL.SRC_ALPHA, GL.ONE]
    });
    this._updateParticles(particlesModel);
    particlesModel.draw({framebuffer});
    setParameters(gl, {
      blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA]
    });
    powerupModel.draw({framebuffer});
    spriteModel
      .setUniforms({uOffset: spriteOffset, uColor: this._sprite.color})
      .draw({framebuffer});

    clear(gl, {color: [0, 0, 0, 1.0], depth: true});

    if (!this._controller.stuck) {
      this._timer++;
    }

    sceneModel
      .setUniforms({
        shake: this._powerup.shake > 0,
        chaos: this._powerup.chaos > 0,
        confuse: this._powerup.confuse > 0,
        time: this._timer,
        uTexture: framebuffer.texture
      })
      .draw();

    textModel.draw();
  }
}
