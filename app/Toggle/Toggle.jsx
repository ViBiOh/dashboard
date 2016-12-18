import React, { Component } from 'react';
import style from './toggle.css';

export default class Toggle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      elementDisplayed: false,
    };

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.hideOnTouch = this.hideOnTouch.bind(this);
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.hideOnTouch);
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.hideOnTouch);
  }

  show() {
    this.setState({ elementDisplayed: true });
  }

  hide() {
    this.setState({ elementDisplayed: false });
  }

  hideOnTouch(event) {
    if (this.content.contains(event.target)) {
      return;
    }

    if (!this.button.contains(event.target) || this.state.elementDisplayed) {
      this.hide();
    } else {
      this.show();
    }
  }

  render() {
    const displayed = this.state.elementDisplayed ? style.displayed : style.hidden;

    return (
      <span>
        <button ref={c => (this.button = c)} className={style.toggle}>
          {this.state.elementDisplayed ? this.props.idle : this.props.active}
        </button>
        <span ref={c => (this.content = c)} className={displayed}>
          {this.props.children}
        </span>
      </span>
    );
  }
}

Toggle.propTypes = {
  idle: React.PropTypes.element.isRequired,
  active: React.PropTypes.element.isRequired,
  children: React.PropTypes.element.isRequired,
};
