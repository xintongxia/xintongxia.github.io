import * as GL from '@luma.gl/constants';
import {Buffer} from '@luma.gl/webgl';
import {Model} from '@luma.gl/engine';

import textVs from './text-vs';
import textFs from './text-fs';
import FontAtlasManager, {HEIGHT_SCALE} from './font-atlas-manager';
import {GAME_STATE} from '../game-configs';
import {POWERUP_TYPES} from '../game-objects/powerup/powerup';

const GAME_STATE_MAP = {
  [GAME_STATE.MENU]: [
    {offset: [-250, 0], text: 'Press ENTER to start game', size: 16},
    {offset: [-250, 0], text: 'Use w/s to select levels', size: 12},
  ],
  [GAME_STATE.STUCK]: [
    {offset: [-250, 0], text: 'Press space to free the ball', size: 16},
    {offset: [-250, 0], text: 'Use a/d to move paddle', size: 12},
  ],
  [GAME_STATE.WON]: [
    {offset: [-250, 0], text: 'Congratulations, you won!', size: 16},
    {offset: [-250, 0], text: 'Press ESC to exit game or Enter to play again', size: 12},
  ],
  [GAME_STATE.FAILED]: [
    {offset: [-250, 0], text: 'Sorry, you failed!', size: 16},
    {offset: [-250, 0], text: 'Press ESC to exit game or Enter to play again', size: 12},
  ]
};

function getLevelText(level) {
  return {offset: [-380, -250], text: `Level: ${level + 1}`, size: 12};
}

function getLivesText(lives) {
  return {offset: [-380, -270], text: `Lives: ${lives}`, size: 12};
}

function getEffectsText(type) {
  let text = null;
  switch (type) {
    case 'speed':
      text = 'speed +20%';
      break;
    case 'sticky':
      text = 'Click space to free ball from paddle';
      break;
    case 'passthrough':
      text = 'passthrough breakable blocks';
      break;
    case 'increase':
      text = 'paddle size +50';
      break;
    case 'confuse':
    case 'chaos':
    case 'shake':
      break;
    default:
  }

  return text;
}

export default class Text {
  constructor(gl, props = {}) {
    this.gl = gl;
    this.props = props;
    this.projectionMatrix = props.projectionMatrix;
    const halfX = gl.drawingBufferWidth / 2;
    const halfY = gl.drawingBufferHeight / 2;
    this._boundaries = [-halfX, halfX, -halfY, halfY];

    this._fontAtlasManager = new FontAtlasManager(this.gl);
    this._cache = new Map();
    this._cache.set('', {
      attributes: {
        instancePositions: [new Buffer(gl, new Float32Array([-1000.0, -1000.0])), {divisor: 1}],
        instanceIconFrames: [new Buffer(gl, new Float32Array([0.0, 0.0, 0.0, 0.0])), {divisor: 1}],
        instanceSizes: [new Buffer(gl, new Float32Array([0.0])), {divisor: 1}],
      },
      instanceCount: 1
    });

    this._models = {
      gameState: this._createModel('gameState'),
      level: this._createModel('level'),
      lives: this._createModel('lives'),
      powerup: this._createModel('powerup')
    };

    this._lastGameState = null;
    this._lastLevel = -1;
    this._lastLives = -1;
  }

  _createModel(id) {
    const gl = this.gl;
    // buffers
    const positionBuffer = new Buffer(
      gl,
      new Float32Array([
        -1.0, -1.0, 0.0, 0.0,
        1.0, -1.0, 1.0, 0.0,
        1.0, 1.0, 1.0, 1.0,
        -1.0, 1.0, 0.0, 1.0
      ])
    );

    const iconsTexture = this._fontAtlasManager.texture;
    const model = new Model(gl, {
      id,
      vs: textVs,
      fs: textFs,
      drawMode: GL.TRIANGLE_FAN,
      attributes: {
        positions: positionBuffer,
        instancePositions: [new Buffer(gl, new Float32Array([-1000.0, -1000.0])), {divisor: 1}],
        instanceIconFrames: [new Buffer(gl, new Float32Array([0.0, 0.0, 0.0, 0.0])), {divisor: 1}],
        instanceSizes: [new Buffer(gl, new Float32Array([0.0])), {divisor: 1}]
      },
      uniforms: {
        uProjectionMatrix: this.projectionMatrix,
        uHeightScale: HEIGHT_SCALE,
        uTexture: iconsTexture,
        uColor: [1.0, 1.0, 1.0],
        uIconsTextureDim: [iconsTexture.width, iconsTexture.height]
      },
      instanceCount: 1,
      vertexCount: 4
    });

    return model;
  }

  _updateTexts(model, key, objects, disableCache) {
    let data = this._cache.get(key);
    if (data) {
      model.setProps(data);
      return;
    }
    if (!objects || !objects.length) {
      let data = this._cache.get('');
      model.setProps(data);
      return;
    }

    const gl = this.gl;
    const instancePositions = [];
    const instanceIconFrames = [];
    const instanceSizes = [];
    let instanceCount = 0;
    const maxX = this._boundaries[1];

    let offsetX = 0;
    let offsetY = 0;
    let i = 0;
    for (const obj of objects) {
      const {text, offset, size} = obj;
      const instanceCoords = this._fontAtlasManager.getTextFrames(text);
      offsetX = offset[0];
      offsetY = i > 0 ? offsetY - (size * HEIGHT_SCALE + 4) : offset[1];
      for (let i = 0; i < instanceCoords.length; i++) {
        const coord = instanceCoords[i];
        instancePositions.push(offsetX, offsetY);
        instanceIconFrames.push(coord.x, coord.y, coord.width, coord.height);
        instanceSizes.push(size);

        if (offsetX + size + 2 > maxX - 8) {
          offsetX = offset[0];
          offsetY -= size * HEIGHT_SCALE + 4;
        }
        offsetX += size + 2;
      }
      instanceCount += instanceCoords.length;
      i++;
    }

    const modelProps = {
      attributes: {
        instancePositions: [new Buffer(gl, new Float32Array(instancePositions)), {divisor: 1}],
        instanceIconFrames: [new Buffer(gl, new Float32Array(instanceIconFrames)), {divisor: 1}],
        instanceSizes: [new Buffer(gl, new Float32Array(instanceSizes)), {divisor: 1}]
      },
      instanceCount,
    };

    if (!disableCache) {
      this._cache.set(key, modelProps);
    }

    model.setProps(modelProps);
  }

  _updateGameState(gameState) {
    const objects = GAME_STATE_MAP[gameState];
    this._updateTexts(this._models.gameState, gameState, objects);
  }

  _updateLevel(level) {
    const levelObject = getLevelText(level);
    this._updateTexts(this._models.level, levelObject.text, [levelObject]);
  }

  _updateLives(lives) {
    const livesObject = getLivesText(lives);
    this._updateTexts(this._models.lives, livesObject.text, [livesObject]);
  }

  _updatePowerup(powerup) {
    let objects = null;
    const keys = [];
    let yOffset = 0;
    for (const type of POWERUP_TYPES) {
      if (powerup[type] > 0) {
        const text = getEffectsText(type);
        if (text) {
          objects = objects || [];
          yOffset -= 11;
          objects.push({
            size: 9,
            offset: [200, yOffset],
            text
          });
          keys.push(type);
        }
      }
    }

    this._updateTexts(this._models.powerup, keys.join(' '), objects, true);
  }

  update(dt, {gameState, level, lives, powerup}) {
    if (gameState !== this._lastGameState) {
      this._lastGameState = gameState;
      this._updateGameState(gameState);
    }
    if (level !== this._lastLevel) {
      this._lastLevel = level;
      this._updateLevel(level);
    }
    if (lives !== this._lastLives) {
      this._lastLives = lives;
      this._updateLives(lives);
    }

    this._updatePowerup(powerup);
    return this;
  }

  render(options) {
    const models = Object.values(this._models);
    for (const model of models) {
      model.draw(options);
    }
  }

  reset() {
    const models = Object.values(this._models);
    for (const model of models) {
      model.setProps(this._cache.get(''));
    }
    this._lastGameState = null;
    this._lastLevel = -1;
    this._lastLives = -1;
  }

  destroy() {
    const models = Object.values(this._models);
    for (const model of models) {
      model.delete();
    }
  }
}
