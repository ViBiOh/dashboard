import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ComposeText from './ComposeText/ComposeText';
import style from './ComposeTypeSelector.less';

const COMPOSE_TYPES = [
  {
    type: 'text',
    label: 'Text',
    component: <ComposeText />,
  },
];

export default class ComposeTypeSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      composeType: COMPOSE_TYPES[0],
    };

    this.onComposeTypeChange = this.onComposeTypeChange.bind(this);
  }

  onComposeTypeChange(composeType) {
    this.setState({ composeType });
  }

  render() {
    const { onCompose, onComposeChange } = this.props;

    return (
      <div>
        <aside>
          {COMPOSE_TYPES.map(c => (
            <span key={c.type} className={style.type}>
              <input
                id={c.type}
                type="radio"
                name="composeType"
                onChange={() => this.onComposeTypeChange(c)}
                checked={this.state.composeType === c}
              />
              <label htmlFor={c.type}>{c.label}</label>
            </span>
          ))}
        </aside>
        <article>
          {React.cloneElement(this.state.composeType.component, { onCompose, onComposeChange })}
        </article>
      </div>
    );
  }
}

ComposeTypeSelector.propTypes = {
  onCompose: PropTypes.func.isRequired,
  onComposeChange: PropTypes.func.isRequired,
};
