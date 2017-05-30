import React from 'react';
import PropTypes from 'prop-types';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import Toolbar from '../Toolbar/Toolbar';
import Button from '../Button/Button';
import ThrobberButton from '../Throbber/ThrobberButton';
import ComposeTypeSelector from './ComposeTypeSelector';
import style from './Compose.less';

/**
 * Compose form.
 * @param {Object} props Props of the component.
 * @return {React.Component} Compose form with inputs.
 */
const Compose = ({ onCompose, onComposeChange, onBack, pending, error }) => (
  <div className={style.container}>
    <Toolbar>
      <Button onClick={onBack} title="Back to containers list">
        <FaArrowLeft />
      </Button>
    </Toolbar>
    <div className={style.content}>
      <ErrorBanner error={error} />
      <h2>Create an app</h2>
      <ComposeTypeSelector onCompose={onCompose} onComposeChange={onComposeChange} />
      <span>
        <ThrobberButton onClick={onCompose} pending={pending}>Create</ThrobberButton>
      </span>
    </div>
  </div>
);

Compose.displayName = 'Compose';

Compose.propTypes = {
  onCompose: PropTypes.func.isRequired,
  onComposeChange: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  error: PropTypes.string,
};

Compose.defaultProps = {
  pending: false,
  error: '',
};

export default Compose;
