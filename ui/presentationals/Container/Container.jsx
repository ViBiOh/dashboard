import React from 'react';
import PropTypes from 'prop-types';
import FaArrowLeft from 'react-icons/lib/fa/arrow-left';
import FaPlay from 'react-icons/lib/fa/play';
import FaStopCircle from 'react-icons/lib/fa/stop-circle';
import FaTrash from 'react-icons/lib/fa/trash';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaRetweet from 'react-icons/lib/fa/retweet';
import Toolbar from '../Toolbar';
import Button from '../Button';
import ErrorBanner from '../ErrorBanner';
import Throbber from '../Throbber';
import ThrobberButton from '../Throbber/ThrobberButton';
import ContainerInfo from './ContainerInfo';
import ContainerStats from './ContainerStats';
import ContainerNetwork from './ContainerNetwork';
import ContainerVolumes from './ContainerVolumes';
import ContainerLogs from './ContainerLogs';
import style from './Container.css';

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
    stats,
    onBack,
    onRefresh,
    onRestart,
    onStop,
    onStart,
    onDelete,
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
      <ContainerStats key="stats" stats={stats} />,
      <ContainerLogs key="logs " logs={logs} />,
    ];

    if (container.State.Running) {
      buttons.push(<ThrobberButton
        key="restart"
        onClick={onRestart}
        vertical
        horizontalSm
        pending={pendingAction}
        title="Restart container"
      >
        <FaRetweet />
                   </ThrobberButton>);
      buttons.push(<ThrobberButton
        key="stop"
        type="danger"
        onClick={onStop}
        vertical
        horizontalSm
        pending={pendingAction}
        title="Stop container"
      >
        <FaStopCircle />
      </ThrobberButton>);
    } else {
      buttons.push(<ThrobberButton
        key="start"
        onClick={onStart}
        vertical
        horizontalSm
        pending={pendingAction}
        title="Start container"
      >
        <FaPlay />
      </ThrobberButton>);
      buttons.push(<ThrobberButton
        key="delete"
        type="danger"
        onClick={onDelete}
        vertical
        horizontalSm
        pending={pendingAction}
        title="Delete container"
      >
        <FaTrash />
                   </ThrobberButton>);
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
          <FaRefresh />
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
  stats: PropTypes.shape({}),
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
  logs: null,
  stats: null,
  error: '',
};

export default Container;
