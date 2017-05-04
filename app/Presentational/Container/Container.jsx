import React from 'react';
import PropTypes from 'prop-types';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import FaPlay from 'react-icons/lib/fa/play';
import FaStopCircle from 'react-icons/lib/fa/stop-circle';
import FaTrash from 'react-icons/lib/fa/trash';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaRetweet from 'react-icons/lib/fa/retweet';
import Toolbar from '../Toolbar/Toolbar';
import Button from '../Button/Button';
import Throbber from '../Throbber/Throbber';
import ThrobberButton from '../Throbber/ThrobberButton';
import ContainerInfo from './ContainerInfo';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';
import style from './Container.less';

/**
 * Container.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container informations.
 */
const Container = (props) => {
  const {
    pending,
    pendingAction,
    container,
    logs,
    onBack,
    onRefresh,
    onRestart,
    onStop,
    onStart,
    onDelete,
    openLogs,
    error,
  } = props;

  let content;
  const buttons = [];

  if (pending || !container) {
    content = <Throbber label="Loading informations" />;
  } else {
    content = [
      <ContainerInfo key="info" container={container} />,
      <ContainerNetwork key="network" container={container} />,
      <ContainerVolumes key="volumes" container={container} />,
      <ContainerLogs key="logs " logs={logs} openLogs={openLogs} />,
    ];

    if (container.State.Running) {
      buttons.push(
        <ThrobberButton
          className={style.button}
          key="restart"
          onClick={onRestart}
          pending={pendingAction}
        >
          <FaRetweet />
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton
          className={style.button}
          key="stop"
          type="danger"
          onClick={onStop}
          pending={pendingAction}
        >
          <FaStopCircle />
        </ThrobberButton>,
      );
    } else {
      buttons.push(
        <ThrobberButton
          className={style.button}
          key="start"
          onClick={onStart}
          pending={pendingAction}
        >
          <FaPlay />
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton
          className={style.button}
          key="delete"
          type="danger"
          onClick={onDelete}
          pending={pendingAction}
        >
          <FaTrash />
        </ThrobberButton>,
      );
    }
  }

  return (
    <span>
      <Toolbar error={error}>
        <Button onClick={onBack}>
          <FaArrowLeft />
        </Button>
        <ThrobberButton className={style.button} onClick={onRefresh} pending={pendingAction}>
          <FaRefresh />
        </ThrobberButton>
        <span className={style.fill} />
        {buttons}
      </Toolbar>
      {content}
    </span>
  );
};

Container.displayName = 'Container';

Container.propTypes = {
  pending: PropTypes.bool,
  pendingAction: PropTypes.bool,
  container: PropTypes.shape({
    State: PropTypes.shape({
      Running: PropTypes.bool,
    }).isRequired,
  }),
  logs: PropTypes.arrayOf(PropTypes.string),
  openLogs: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  error: PropTypes.string,
};

Container.defaultProps = {
  pending: false,
  pendingAction: false,
  container: null,
  logs: undefined,
  error: '',
};

export default Container;
