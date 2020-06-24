import * as React from 'react';
import RenderDom from 'react-dom';
import styled from 'styled-components';
import Game from './game';

const VIEW = {
  width: 800,
  height: 600
};

const CANVAS_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  ...VIEW
};

const Container = styled.div`
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  position: relative;
`;

class App extends React.PureComponent {
  constructor(props) {
    super(props);
    this._game = null;
    this._gameRef = null;
  }

  componentDidMount() {
    const gl = this._gameRef.getContext('webgl2');
    this._game = new Game(gl);
  }

  _handleKeydown(e) {
    switch (e.keyCode) {
      case 13: // 'Enter'
        this._game.start();
        break;

      case 32: // 'Space'
        this._game.activate();
        break;

      case 27: // 'Escape'
        this._game.end();
        break;

      case 68: // 'd'
      case 39: // 'ArrowRight'
        this._game.move(1);
        break;

      case 65: // 'a'
      case 37: // 'ArrowLeft'
        this._game.move(-1);
        break;

      case 87: // 'w'
      case 38: // 'ArrowUp'
        this._game.changeLevel(-1);
        break;

      case 83: // 's'
      case 40: // 'ArrowDown'
        this._game.changeLevel(1);
        break;

      default:
        console.log(e.keyCode, e.key)
    }
  }

  render() {
    return (
      <Container>
        <canvas
          tabIndex={1000}
          id="game-canvas"
          onKeyDown={this._handleKeydown.bind(this)}
          style={CANVAS_STYLE}
          height={VIEW.height}
          width={VIEW.width}
          ref={_ => this._gameRef = _}
        />
      </Container>
    );
  }
}

const el = document.getElementById('root');
RenderDom.render(<App />, el);
