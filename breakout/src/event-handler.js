export default class EventHandler {
  constructor(gl, props) {
    this.props = props;
    this._initializeEventHandling(gl.canvas);
  }

  _initializeEventHandling(canvas) {
    canvas.addEventListener('keydown', canvas._onkeydown.bind(this));
  }

  _onkeydown(e) {
    console.log('keydown');
    switch (e.code) {
      case 'Enter':
        console.log('clicked');
        this.props.start();
        break;

      case 'Space':
        this.props.activate();
        break;

      case 'Escape':
        this.props.end();
        break;

      case 'KeyD':
        this.props.move('right');
        break;

      case 'KeyA':
        this.props.move('left');
        break;

      default:
        console.log(e.code);
    }
  };
}
