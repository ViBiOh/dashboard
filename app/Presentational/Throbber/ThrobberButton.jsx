import React, { Component } from 'react';
import Button from '../../Presentational/Button/Button';
import Throbber from './Throbber';

export default class ThrobberButton extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.onClick = this.onClick.bind(this);
    this.hideThrobber = this.hideThrobber.bind(this);
  }

  componentWillMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onClick(...args) {
    this.setState({ loading: true });

    if (this.props.onClick) {
      this.props.onClick(args)
        .then(this.hideThrobber, this.hideThrobber);
    }
  }

  hideThrobber() {
    if (this.mounted) {
      this.setState({ loading: false });
    }
  }

  render() {
    let content;

    if (this.state.loading) {
      content = <Throbber white />;
    } else {
      content = this.props.children;
    }

    return (
      <Button {...this.props} onClick={this.onClick}>
        {content}
      </Button>
    );
  }
}

ThrobberButton.propTypes = {
  onClick: React.PropTypes.func,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node,
  ]),
};

ThrobberButton.defaultProps = {
  onClick: () => null,
  children: '',
};
