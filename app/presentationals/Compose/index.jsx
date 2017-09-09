import React from 'react';
import PropTypes from 'prop-types';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import setRef from '../../utils/ref';
import onKeyDown from '../../utils/input';
import ErrorBanner from '../ErrorBanner';
import Toolbar from '../Toolbar';
import Button from '../Button';
import ThrobberButton from '../Throbber/ThrobberButton';
import style from './index.less';

/**
 * Compose form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Compose form with inputs.
 */
const Compose = ({ onCompose, onBack, pending, error }) => {
  const refs = {};

  /**
   * Submit current inputs.
   */
  function submit() {
    onCompose(refs.nameInput.value, refs.fileInput.value);
  }

  return (
    <div className={style.container}>
      <Toolbar>
        <Button onClick={onBack} title="Back to containers list">
          <FaArrowLeft />
        </Button>
      </Toolbar>
      <div className={style.content}>
        <ErrorBanner error={error} />
        <h2>Create an app</h2>
        <input
          ref={e => setRef(refs, 'nameInput', e)}
          name="name"
          type="text"
          placeholder="name"
          onKeyDown={e => onKeyDown(e, submit)}
        />
        <textarea
          ref={e => setRef(refs, 'fileInput', e)}
          name="compose"
          placeholder="compose file yaml v2"
          className={style.code}
          rows={18}
          onKeyDown={e => onKeyDown(e, submit)}
        />
        <span>
          <ThrobberButton onClick={submit} pending={pending}>
            Create
          </ThrobberButton>
        </span>
      </div>
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
