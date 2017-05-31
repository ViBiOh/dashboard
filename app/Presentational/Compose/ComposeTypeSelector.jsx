import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ComposeText from './ComposeText/ComposeText';
import ComposeForm from './ComposeForm/ComposeForm';
import style from './ComposeTypeSelector.less';

const COMPOSE_TYPES = [
  {
    type: 'text',
    label: 'Text',
    component: ComposeText,
  },
  {
    type: 'form',
    label: 'Form',
    component: ComposeForm,
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
    const { compose, onCompose, onComposeChange } = this.props;

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
          <this.state.composeType.component
            compose={compose}
            onCompose={onCompose}
            onComposeChange={onComposeChange}
          />
        </article>
      </div>
    );
  }
}

ComposeTypeSelector.propTypes = {
  compose: PropTypes.shape({}).isRequired,
  onCompose: PropTypes.func.isRequired,
  onComposeChange: PropTypes.func.isRequired,
};
