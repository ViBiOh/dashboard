import React from 'react';
import PropTypes from 'prop-types';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import setRef from '../../Tools/ref';
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
  const refs = {};

  /**
   * Submit form with saved information.
   */
  function submit() {
    onCompose(refs.nameInput.value, refs.composeInput.value);
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
          ref={e => setRef(refs, 'nameInput', e)}
          name="name"
          type="text"
          placeholder="name"
          onKeyDown={e => onKeyDown(e, submit)}
        />
      </span>
      <span>
        <textarea
          ref={e => setRef(refs, 'composeInput', e)}
          name="compose"
          placeholder="compose file yaml v2"
          className={style.code}
          rows={19}
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
  onCompose: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  error: PropTypes.string,
};

Compose.defaultProps = {
  pending: false,
  error: '',
};

export default Compose;
