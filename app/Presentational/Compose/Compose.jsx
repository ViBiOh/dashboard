import React from 'react';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import onKeyDown from '../../Tools/input';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import ThrobberButton from '../../Presentational/Throbber/ThrobberButton';
import style from './Compose.css';

/**
 * Compose form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Compose form with inputs.
 */
const Compose = ({ onCompose, onBack, pending, error }) => {
  let nameInput;
  let composeInput;

  /**
   * Submit form with saved information.
   */
  function submit() {
    onCompose(nameInput.value, composeInput.value);
  }

  return (
    <div className={style.flex}>
      <Toolbar error={error}>
        <Button onClick={onBack}>
          <FaArrowLeft />
        </Button>
      </Toolbar>
      <h2>Create an app</h2>
      <span>
        <input
          ref={e => (nameInput = e)}
          name="name"
          type="text"
          placeholder="name"
          onKeyDown={e => onKeyDown(e, submit)}
        />
      </span>
      <span>
        <textarea
          ref={e => (composeInput = e)}
          name="compose"
          placeholder="compose file yaml v2"
          className={style.code}
          rows={20}
          onKeyDown={e => onKeyDown(e, submit)}
        />
      </span>
      <span>
        <ThrobberButton onClick={submit} pending={pending}>Create</ThrobberButton>
      </span>
    </div>
  );
};

Compose.displayName = 'Compose';

Compose.propTypes = {
  onCompose: React.PropTypes.func.isRequired,
  onBack: React.PropTypes.func.isRequired,
  pending: React.PropTypes.bool,
  error: React.PropTypes.string,
};

Compose.defaultProps = {
  pending: false,
  error: '',
};

export default Compose;
