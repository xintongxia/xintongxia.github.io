import {Vector2, Matrix4} from '@math.gl/core';
import {instrumentGLContext, setParameters} from '@luma.gl/core';
import {AnimationLoop} from '@luma.gl/engine';
import {clear, Texture2D, Framebuffer} from '@luma.gl/webgl';
import * as GL from '@luma.gl/constants';

import {detectCircleRectCollision, detectRectCollision, COMPASS} from './math-utils';
import {
  LEVELS,
  TEXTURES,
  BRICKS_PER_LINE,
  GAME_STATE
} from './game-configs';

import ResourceManager from './resource-manager';
import Sprite from './game-objects/sprite/sprite';
import Player from './game-objects/player/player';
import Bricks, {BRICK_STATE} from './game-objects/bricks/bricks';
import Particles from './game-objects/particles/particles';
import Powerup from './game-objects/powerup/powerup';
import Scene from './scene/scene';
import Text from './text/text';

const dt = 0.01;
const scratchOffset = new Vector2();
const scratchVelocity = new Vector2();

export default class Game {
  constructor(gl) {
    instrumentGLContext(gl);
    this.gl = gl;
    this._animationLoop = new AnimationLoop({
      gl,
      autoResizeViewport: false,
      useDevicePixels: false,
      onInitialize: this._onInitialize.bind(this),
      onRender: this._onRender.bind(this),
      onFinalize: this._onFinalize.bind(this)
    });
    this._animationLoop.start();
  }

  start() {
    if (this._gameState === GAME_STATE.MENU) {
      this._gameState = GAME_STATE.STUCK;
    }
  }

  activate() {
    if (this._gameState === GAME_STATE.STUCK) {
      this._gameState = GAME_STATE.ACTIVE;
    }
  }

  move(dir) {
    const gameState = this._gameState;
    if (gameState !== GAME_STATE.STUCK && gameState !== GAME_STATE.ACTIVE) {
      return;
    }
    if (this._powerup.confuse) {
      dir = -dir;
    }
    this._player.move(dir);
  }

  end(gameState) {
    if (this._gameState !== GAME_STATE.MENU) {
      if (gameState) {
        this._gameState = gameState;
        setTimeout(() => this._gameState = GAME_STATE.MENU, 2000);
      } else {
        this._gameState = GAME_STATE.MENU;
      }
      this._bricks.reset({level: this._level});
      this._particles.reset();
      this._powerup.reset();
      this._sprite.reset();
      this._player.reset();
      this._text.reset();
    }
  }

  changeLevel(delta) {
    if (this._gameState === GAME_STATE.MENU) {
      this._level = (this._level + delta) % LEVELS.length;
      this._bricks.setProps({layout:  LEVELS[this._level]});
    }
  }

  _onInitialize({gl}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: gl.LEQUAL,
      blend: true
    });

    this._level = 0;
    this._lives = 3;

    this._gameState = GAME_STATE.MENU;
    this._resourceManager = new ResourceManager(gl);

    this._initializeMatrices();
    this._initializeTextures();

    const spriteSize = [25, 25];
    const spriteRadius = 10;
    const spriteOffset = [0, -268.5];
    const spriteVelocity = [300, 400];

    const particlesSize = spriteSize;
    const particlesOffset = [
      spriteOffset[0] + spriteRadius,
      spriteOffset[1] + spriteRadius
    ];

    const playerSize = [100, 20];
    const playerOffset = [0, -290];
    const playerVelocity = [5000, 0];

    const brickSize = [gl.canvas.width / BRICKS_PER_LINE, 30];

    const powerupSize = [60, 20];
    const powerupVelocity = [0, -150];

    // models
    this._bricks = new Bricks(gl, {
      size: brickSize,
      layout: LEVELS[0],
      textures: {
        block: this._resourceManager.getTexture('block'),
        blockSolid: this._resourceManager.getTexture('blockSolid'),
      },
      projectionMatrix: this._projectionMatrix,
    });

    this._particles = new Particles(gl, {
      size: particlesSize,
      offset: particlesOffset,
      velocity: [30, 25],
      textures: {
        particle: this._resourceManager.getTexture('particle')
      },
      projectionMatrix: this._projectionMatrix,
    });

    this._powerup = new Powerup(gl, {
      size: powerupSize,
      velocity: powerupVelocity,
      textures: {
        speed: this._resourceManager.getTexture('speed'),
        sticky: this._resourceManager.getTexture('sticky'),
        passthrough: this._resourceManager.getTexture('passthrough'),
        increase: this._resourceManager.getTexture('increase'),
        confuse: this._resourceManager.getTexture('confuse'),
        chaos: this._resourceManager.getTexture('chaos'),
      },
      projectionMatrix: this._projectionMatrix,
      onActivate: this._activatePowerup.bind(this),
      onEnd: this._endPowerup.bind(this)
    });

    this._sprite = new Sprite(gl, {
      size: spriteSize,
      offset: spriteOffset,
      velocity: spriteVelocity,
      radius: spriteRadius,
      color: [1.0, 1.0, 1.0],
      textures: {
        sprite: this._resourceManager.getTexture('sprite')
      },
      projectionMatrix: this._projectionMatrix,
      onFallout: this._onSpriteFallout.bind(this)
    });

    this._player = new Player(gl, {
      size: playerSize,
      offset: playerOffset,
      velocity: playerVelocity,
      color: [1.0, 1.0, 1.0],
      textures: {
        player: this._resourceManager.getTexture('player')
      },
      projectionMatrix: this._projectionMatrix,
    });

    this._text = new Text(gl, {
      size: [16, 16 * 1.2],
      offset: [-220, 0],
      projectionMatrix: this._projectionMatrix,
    });

    this._scene = new Scene(gl, {
      projectionMatrix: this._projectionMatrix,
    });

    this._framebuffer = this._getFrameBuffer(gl);
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
    this._resourceManager.loadTextures(TEXTURES);
  }

  _onSpriteFallout() {
    this._lives--;
    if (this._lives <= 0) {
      this.end(GAME_STATE.FAILED);
      return;
    }
    this._gameState = GAME_STATE.STUCK;
    this._powerup.reset();
    this._sprite.reset();
    this._player.reset();
    this._particles.reset();
  }

  _activatePowerup({type, color}) {
    switch (type) {
      case 'speed':
        if (this._sprite.velocity[0] === this._sprite.initialVelocity[0]) {
          this._sprite.velocity.multiplyByScalar(1.05);
        }
        break;
      case 'sticky':
        break;
      case 'passthrough':
        break;
      case 'increase':
        if (this._player.size[0] === this._player.initialSize[0]) {
          this._player.size = [this._player.size[0] + 10, this._player.size[1]];
        }
        break;
      case 'confuse':
      case 'chaos':
      case 'shake':
      default:
    }

    if (color) {
      this._sprite.color = color;
      this._player.color = color;
    }
    const texture = this._resourceManager.getTexture(type);
    if (texture) {
      this._player.setTexture(texture);
    }
  }

  _endPowerup(type) {
    switch (type) {
      case 'speed':
        this._sprite.velocity = this._sprite.initialVelocity;
        break;
      case 'sticky':
        this._sprite.color = [1.0, 1.0, 1.0];
        this._gameState = GAME_STATE.ACTIVE;
        break;
      case 'passthrough':
        this._sprite.color = [1.0, 1.0, 1.0];
        break;
      case 'increase':
        this._player.size = this._player.initialSize;
        break;
      case 'confuse':
      case 'chaos':
      case 'shake':
      default:
    }

    if (!this._powerup.activated) {
      this._player.color = [1.0, 1.0, 1.0];
      this._sprite.color = [1.0, 1.0, 1.0];
      this._player.setTexture(this._resourceManager.getTexture('player'));
    }
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
            [GL.TEXTURE_WRAP_S]: GL.REPEAT,
            [GL.TEXTURE_WRAP_T]: GL.REPEAT
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
            [GL.TEXTURE_WRAP_S]: GL.REPEAT,
            [GL.TEXTURE_WRAP_T]: GL.REPEAT
          }
        })
      }
    });
  }

  _detectSpriteBricksCollision() {
    const {
      offset: spriteOffset,
      radius: spriteRadius,
      velocity: spriteVelocity,
    } = this._sprite;

    const {
      halfSize: brickHalfSize,
      instanceCount,
      instanceStates,
      instancePositions
    } = this._bricks;

    for (let i = 0; i < instanceCount; i++) {
      const brickOffset = scratchOffset.set(instancePositions[i * 2], instancePositions[i * 2 + 1]);
      const brickState = instanceStates[i];
      const {collided, dir, distance} = detectCircleRectCollision(this._sprite, {
        offset: scratchOffset,
        halfSize: brickHalfSize
      });

      if (collided && brickState !== BRICK_STATE.DESTROYED) {
        const penetrated = spriteRadius - distance;

        if (brickState === BRICK_STATE.BREAKABLE) {
          this._bricks.setInstance(i, {
            state: BRICK_STATE.DESTROYED
          });
          this._powerup.spawn(brickOffset);
        }

        if (brickState === BRICK_STATE.SOLID) {
          this._powerup.activate({type: 'shake'});
        }

        if (!(this._powerup.passthrough && brickState === BRICK_STATE.BREAKABLE)) {
          let sign;
          switch (dir) {
            case 'up':
            case 'down':
              sign = COMPASS[dir][1];
              spriteVelocity[1] = -spriteVelocity[1];
              spriteOffset[1] = spriteOffset[1] + sign * penetrated;
              break;
            case 'left':
            case 'right':
              sign = COMPASS[dir][0];
              spriteVelocity[0] = -spriteVelocity[0];
              spriteOffset[0] = spriteOffset[0] + sign * penetrated;
              break;
            default:
          }
        }
      }
    }
  }

  _detectSpritePlayerCollision() {
    if (this._sprite.velocity[1] >= 0) {
      return;
    }
    const {collided} = detectCircleRectCollision(this._sprite, this._player);
    if (collided) {
      const {
        velocity: spriteVelocity,
        initialVelocity: initialSpriteVelocity,
        offset: spriteOffset
      } = this._sprite;
      const {
        offset: playerOffset,
        size: playerSize
      } = this._player;

      const xDist = spriteOffset[0] - playerOffset[0];
      const percentage = xDist / playerSize[0] / 2;

      scratchVelocity[0] = initialSpriteVelocity[0] * percentage * 2;
      scratchVelocity[1] = Math.abs(initialSpriteVelocity[1]);

      const len = spriteVelocity.len();
      const normalized = scratchVelocity.normalize();

      this._sprite.velocity = [
        normalized[0] * len,
        normalized[1] * len
      ];

      if (this._powerup.sticky) {
        this._gameState = GAME_STATE.STUCK;
      }
    }
  }

  _detectPlayerPowerupCollision() {
    const {objects, velocity: powerupVelocity, size: powerupSize} = this._powerup;
    for (const obj of objects) {
      obj.offset[1] += dt * powerupVelocity[1];

      const isCollided = detectRectCollision(
        this._player,
        {
          offset: obj.offset,
          size: powerupSize,
        }
      );

      if (isCollided) {
        this._powerup.activate(obj);
      }
    }
  }

  _detectCollisions() {
    if (this._gameState === GAME_STATE.MENU) {
      return;
    }

    // sprite, player
    this._detectSpritePlayerCollision();

    // powerup, player
    this._detectPlayerPowerupCollision();

    // sprite, bricks
    this._detectSpriteBricksCollision();
  }

  _onRender(props) {
    const {gl} = props;

    const bricks = this._bricks;
    const player = this._player;
    const particles = this._particles;
    const powerup = this._powerup;
    const sprite = this._sprite;
    const scene = this._scene;
    const text = this._text;
    const framebuffer = this._framebuffer;

    this._detectCollisions();

    if (this._bricks.isComplete) {
      this.end(GAME_STATE.WON);
    }

    clear(gl, {color: [0, 0, 0, 1.0], depth: true, framebuffer});
    bricks
      .update(dt, {gameState: this._gameState})
      .render({framebuffer});
    player
      .update(dt, {gameState: this._gameState})
      .render({framebuffer});

    setParameters(gl, {
      blendFunc: [GL.SRC_ALPHA, GL.ONE]
    });
    particles
      .update(dt, {
        gameState: this._gameState,
        spriteOffset: this._sprite.offset
      })
      .render({framebuffer});
    setParameters(gl, {
      blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA]
    });

    powerup
      .update(dt, {gameState: this._gameState})
      .render({framebuffer});

    sprite
      .update(dt, {
        gameState: this._gameState,
        offset: [
          player.offset[0],
          player.offset[1] + player.halfSize[1] + sprite.radius
        ]
      })
      .render({framebuffer});


    clear(gl, {color: [0, 0, 0, 1.0], depth: true});

    scene
      .update(dt, {
        gameState: this._gameState,
        texture: framebuffer.texture,
        chaos: powerup.chaos > 0,
        confuse: powerup.confuse > 0,
        shake: powerup.shake > 0
      })
      .render();

    text
      .update(dt, {
        gameState: this._gameState,
        level: this._level,
        lives: this._lives,
        powerup: this._powerup
      })
      .render();
  }

  _onFinalize() {
    this._bricks.destroy();
    this._player.destroy();
    this._particles.destroy();
    this._powerup.destroy();
    this._sprite.destroy();
    this._scene.destroy();
    this._text.destroy();
    this._framebuffer.destroy();
  }
}
