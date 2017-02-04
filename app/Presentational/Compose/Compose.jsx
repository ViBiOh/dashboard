import React from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Compose.css';

const Compose = ({ form, onChange, onCompose, error }) => {
  function onKeyDown(event) {
    if (event.keyCode === 13) {
      return onCompose();
    }
    return undefined;
  }

  return (
    <div className={style.flex}>
      <Toolbar error={error}>
        <Button onClick={() => browserHistory.push('/')}>
          <FaArrowLeft />
          <span>Back</span>
        </Button>
      </Toolbar>
      <span>
        <input
          name="name"
          type="text"
          placeholder="name"
          value={form.name}
          onKeyDown={onKeyDown}
          onChange={e => onChange(Object.assign({}, form, { name: e.target.value }))}
        />
      </span>
      <span>
        <textarea
          className={style.code}
          placeholder="compose file yaml v2"
          value={form.compose}
          rows={20}
          onKeyDown={onKeyDown}
          onChange={e => onChange(Object.assign({}, form, { compose: e.target.value }))}
        />
      </span>
      <span>
        <ThrobberButton onClick={onCompose}>Create</ThrobberButton>
      </span>
    </div>
  );
};

Compose.displayName = 'Compose';

Compose.propTypes = {
  form: React.PropTypes.shape({
    name: React.PropTypes.string,
    compose: React.PropTypes.string,
  }),
  onChange: React.PropTypes.func.isRequired,
  onCompose: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Compose.defaultProps = {
  form: {},
  error: '',
};

export default Compose;
