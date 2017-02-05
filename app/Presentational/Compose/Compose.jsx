import React from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import { browserHistory } from 'react-router';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Compose.css';

const Compose = ({ onCompose, error }) => {
  let nameInput;
  let composeInput;

  function submit() {
    return onCompose(nameInput.value, composeInput.value);
  }

  function onKeyDown(event) {
    if (event.keyCode === 13) {
      return submit();
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
          ref={e => (nameInput = e)}
          name="name"
          type="text"
          placeholder="name"
          onKeyDown={onKeyDown}
        />
      </span>
      <span>
        <textarea
          ref={e => (composeInput = e)}
          name="compose"
          placeholder="compose file yaml v2"
          className={style.code}
          rows={20}
          onKeyDown={onKeyDown}
        />
      </span>
      <span>
        <ThrobberButton onClick={submit}>Create</ThrobberButton>
      </span>
    </div>
  );
};

Compose.displayName = 'Compose';

Compose.propTypes = {
  onCompose: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Compose.defaultProps = {
  error: '',
};

export default Compose;
