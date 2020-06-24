import {Texture2D} from '@luma.gl/webgl';
import GL from '@luma.gl/constants';

const MAX_CANVAS_WIDTH = 512;
const DEFAULT__CANVAS_HEIGHT = 1024;
const BASELINE_SCALE = 0.9;
export const HEIGHT_SCALE = 1.1;
export const BUFFER = 2;

function getDefaultCharacterSet() {
  const charSet = [];
  for (let i = 32; i < 128; i++) {
    charSet.push(String.fromCharCode(i));
  }
  return charSet;
}

function setTextStyle(ctx, fontFamily, fontSize) {
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'baseline';
  ctx.textAlign = 'left';
}

function nextPowOfTwo(number) {
  return Math.pow(2, Math.ceil(Math.log2(number)));
}

export default class FontAtlasManager {
  constructor(gl, {fontFamily = 'serif', fontSize = 64} = {}) {
    this.gl = gl;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = MAX_CANVAS_WIDTH;
    canvas.height = DEFAULT__CANVAS_HEIGHT;

    setTextStyle(ctx, fontFamily, fontSize);
    this._ctx = ctx;
    this._canvas = canvas;
    this._characterSet = getDefaultCharacterSet();
    this._buildMapping();
    this._generateFontAtlas(this._characterSet, this._ctx);
    this._createTexture();
  }

  get texture() {
    return this._texture;
  }

  getTextFrames(string) {
    const texts = string.split('');
    const mapping = this._mapping;
    const instances = [];
    for (const c of texts) {
      instances.push({
        c,
        ...mapping[c]
      });
    }
    return instances;
  }

  _buildMapping() {
    this._mapping = {};
    const characterSet = this._characterSet;
    const fontHeight = this.fontSize * HEIGHT_SCALE;
    const canvas = this._canvas;

    let x = 0;
    let y = 0;
    let rows = 0;
    let canvasHeight = canvas.height;
    for (const char of characterSet) {
      const metrics = this._ctx.measureText(char);
      const width = metrics.width;
      if (x + width + 2 * BUFFER > MAX_CANVAS_WIDTH) {
        rows++;
        x = 0;
        y = rows * (fontHeight + 2 * BUFFER);
      }

      this._mapping[char] = {
        x: x + BUFFER,
        y: y + BUFFER,
        width,
        height: fontHeight
      };

      x += width + 2 * BUFFER;
    }
  }

  _generateFontAtlas(chars, ctx) {
    const mapping = this._mapping;
    const fontSize = this.fontSize;
    for (const char of chars) {
      ctx.fillText(char, mapping[char].x, mapping[char].y + fontSize * BASELINE_SCALE);
    }
  }

  _createTexture() {
    const gl = this.gl;
    const canvas = this._canvas;
    this._texture = new Texture2D(gl, {
      data: canvas,
      width: canvas.width,
      height: canvas.height,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
        [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
      },
      mipmaps: true
    });
  }

  // for debugging
  attachToDom() {
    this._canvas.id = 'font-atlas-canvas';
    this._canvas.style.position = 'absolute';
    this._canvas.style.background = 'rgba(200, 200, 200, 0.5)';
    this._canvas.style.zIndex = '1000';
    this._canvas.style.top = '0';
    this._canvas.style.left = '0';
    document.body.append(this._canvas);
  }

  detachFromDom() {
    const el = document.getElementById('font-atlas-canvas');
    el.parent.remove(el);
  }
}
