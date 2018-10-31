import React from 'react';
import PropTypes from 'prop-types';
import { FaArrowLeft, FaPlay, FaStopCircle, FaTrash, FaSync, FaRetweet } from 'react-icons/fa';
import Button from 'presentationals/Button';
import ErrorBanner from 'presentationals/ErrorBanner';
import Toolbar from 'presentationals/Toolbar';
import Throbber from 'presentationals/Throbber';
import ThrobberButton from 'presentationals/Throbber/ThrobberButton';
import Info from 'presentationals/Container/Info';
import Network from 'presentationals/Container/Network';
import Volumes from 'presentationals/Container/Volumes';
import Stats from 'presentationals/Container/Stats';
import Logs from 'presentationals/Container/Logs';
import style from './index.css';

/**
 * Container.
 * @param {Object} props Props of the component.
 * @return {React.Component} Container informations.
 */
export default function Container(props) {
  const {
    pending,
    pendingAction,
    container,
    logs,
    stats,
    onBack,
    onRefresh,
    onRestart,
    onStop,
    onStart,
    onDelete,
    fullScreenLogs,
    toggleFullScreenLogs,
    error,
  } = props;

  let content;
  const buttons = [];

  if (pending || !container) {
    content = <Throbber label="Loading informations" />;
  } else {
    content = (
      <>
        <Info container={container} />
        <Network container={container} />
        <Volumes container={container} />
        <Stats stats={stats} />
        <Logs
          logs={logs}
          isFullScreen={fullScreenLogs}
          toggleFullScreenLogs={toggleFullScreenLogs}
        />
      </>
    );

    if (container.State.Running) {
      buttons.push(
        <ThrobberButton
          key="restart"
          onClick={onRestart}
          vertical
          horizontalSm
          pending={pendingAction}
          title="Restart container"
        >
          <FaRetweet />
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton
          key="stop"
          type="danger"
          onClick={onStop}
          vertical
          horizontalSm
          pending={pendingAction}
          title="Stop container"
        >
          <FaStopCircle />
        </ThrobberButton>,
      );
    } else {
      buttons.push(
        <ThrobberButton
          key="start"
          onClick={onStart}
          vertical
          horizontalSm
          pending={pendingAction}
          title="Start container"
        >
          <FaPlay />
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton
          key="delete"
          type="danger"
          onClick={onDelete}
          vertical
          horizontalSm
          pending={pendingAction}
          title="Delete container"
        >
          <FaTrash />
        </ThrobberButton>,
      );
    }
  }

  return (
    <span className={style.container}>
      <Toolbar>
        <Button onClick={onBack} title="Back to containers list">
          <FaArrowLeft />
        </Button>
        <ThrobberButton
          onClick={onRefresh}
          vertical
          horizontalSm
          pending={pendingAction}
          title="Refresh container infos"
        >
          <FaSync />
        </ThrobberButton>
        <span className={style.fill} />
        {buttons}
      </Toolbar>
      <span className={style.content}>
        <ErrorBanner error={error} />
        {content}
      </span>
    </span>
  );
}

Container.displayName = 'Container';

Container.propTypes = {
  container: PropTypes.shape({
    State: PropTypes.shape({
      Running: PropTypes.bool,
    }).isRequired,
  }),
  error: PropTypes.string,
  fullScreenLogs: PropTypes.bool,
  logs: PropTypes.shape({
    logs: PropTypes.arrayOf(PropTypes.string),
    fullscreen: PropTypes.bool,
  }),
  onBack: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  pendingAction: PropTypes.bool,
  stats: PropTypes.shape({}),
  toggleFullScreenLogs: PropTypes.func.isRequired,
};

Container.defaultProps = {
  container: null,
  error: '',
  fullScreenLogs: false,
  logs: null,
  pending: false,
  pendingAction: false,
  stats: null,
};
