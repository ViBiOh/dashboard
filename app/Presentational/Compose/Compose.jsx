import React from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Compose.css';

const Compose = ({ name, onNameChange, compose, onComposeChange, onCompose, error }) => {
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
          value={name}
          onKeyDown={onKeyDown}
          onChange={e => onNameChange(e.target.value)}
        />
      </span>
      <span>
        <textarea
          className={style.code}
          placeholder="compose file yaml v2"
          value={compose}
          rows={20}
          onKeyDown={onKeyDown}
          onChange={e => onComposeChange(e.target.value)}
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
  name: React.PropTypes.string,
  onNameChange: React.PropTypes.func.isRequired,
  compose: React.PropTypes.string,
  onComposeChange: React.PropTypes.func.isRequired,
  onCompose: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Compose.defaultProps = {
  name: '',
  compose: '',
  error: '',
};

export default Compose;
