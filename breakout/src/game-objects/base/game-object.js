import {Matrix4, Vector2} from '@math.gl/core';

export default class GameObject {
  constructor(gl, props) {
    this.gl = gl;
    this.props = props;

    this._size = new Vector2();
    this._halfSize = new Vector2();
    this._offset = new Vector2();
    this._velocity = new Vector2();

    this.initialize();
  }

  get offset() {
    return this._offset;
  }

  set offset(offset) {
    this._offset.set(offset[0], offset[1]);
  }

  get velocity() {
    return this._velocity;
  }

  set velocity(velocity) {
    this._velocity.set(velocity[0], velocity[1]);
  }

  get size() {
    return this._size;
  }

  set size(size) {
    this._size.set(size[0], size[1]);
    this._halfSize.set(size[0] / 2, size[1] / 2);
    this._modelMatrix = new Matrix4().scale([
      this.halfSize[0],
      this.halfSize[1],
      1
    ]);
    this.model.setUniforms({
      uModelMatrix: this._modelMatrix
    });
  }

  get halfSize() {
    return this._halfSize;
  }

  get modelMatrix() {
    return this._modelMatrix;
  }

  get model() {
    if (!this._model) {
      this._model = this.createModel(this.props);
    }
    return this._model;
  }

  get boundaries() {
    return this._boundaries;
  }

  initialize() {
    const gl = this.gl;
    const props = this.props;

    this.projectionMatrix = props.projectionMatrix;
    this.textures = props.textures;

    this.initialVelocity = props.velocity || [0, 0];
    this.initialOffset = props.offset || [0, 0];
    this.initialSize = props.size || [0, 0];

    this._velocity = this._velocity.set(this.initialVelocity[0], this.initialVelocity[1]);
    this._offset = this._offset.set(this.initialOffset[0], this.initialOffset[1]);
    this._size = this._size.set(this.initialSize[0], this.initialSize[1]);
    this._halfSize = this._halfSize.set(this._size[0] / 2, this._size[1] / 2);

    this._modelMatrix = new Matrix4().scale([
      this._halfSize[0],
      this._halfSize[1],
      1
    ]);

    const halfX = gl.drawingBufferWidth / 2;
    const halfY = gl.drawingBufferHeight / 2;
    this._boundaries = [-halfX, halfX, -halfY, halfY];
    this._model = null;
  }

  createModel() {
    console.error('should implement');
  }

  setProps() {}

  update(dt, {gameState}) {
    return this;
  }

  render(options) {
    this.model.draw(options);
  }

  reset() {
    this._velocity = this._velocity.set(...this.initialVelocity);
    this._offset = this._offset.set(...this.initialOffset);
    this._size = this._size.set(...this.initialSize);
    this._halfSize = this._halfSize.set(this._size[0] / 2, this._size[1] / 2);
    this._modelMatrix = new Matrix4().scale([
      this.initialSize[0] / 2,
      this.initialSize[1] / 2,
      1
    ]);
  }

  destroy() {
    if (this._model) {
      this._model.delete();
    }
  }
}
