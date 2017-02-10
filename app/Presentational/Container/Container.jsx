import React from 'react';
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
import style from './Container.css';

const Container = (props) => {
  const {
    pending,
    pendingAction,
    container,
    logs,
    openLogs,
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
      <ContainerLogs key="logs "logs={logs} openLogs={openLogs} />,
    ];

    if (container.State.Running) {
      buttons.push(
        <ThrobberButton key="restart" onClick={onRestart} pending={pendingAction}>
          <FaRetweet />
          <span>Restart</span>
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton key="stop" type="danger" onClick={onStop} pending={pendingAction}>
          <FaStopCircle />
          <span>Stop</span>
        </ThrobberButton>,
      );
    } else {
      buttons.push(
        <ThrobberButton key="start" onClick={onStart} pending={pendingAction}>
          <FaPlay />
          <span>Start</span>
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton key="delete" type="danger" onClick={onDelete} pending={pendingAction}>
          <FaTrash />
          <span>Delete</span>
        </ThrobberButton>,
      );
    }
  }

  return (
    <span>
      <Toolbar error={error}>
        <Button onClick={onBack}>
          <FaArrowLeft />
          <span>Back</span>
        </Button>
        <ThrobberButton onClick={onRefresh} pending={pendingAction}>
          <FaRefresh />
          <span>Refresh</span>
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
  pending: React.PropTypes.bool.isRequired,
  pendingAction: React.PropTypes.bool.isRequired,
  container: React.PropTypes.shape({}),
  logs: React.PropTypes.arrayOf(React.PropTypes.string),
  openLogs: React.PropTypes.func.isRequired,
  onBack: React.PropTypes.func.isRequired,
  onRefresh: React.PropTypes.func.isRequired,
  onStart: React.PropTypes.func.isRequired,
  onRestart: React.PropTypes.func.isRequired,
  onStop: React.PropTypes.func.isRequired,
  onDelete: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Container.defaultProps = {
  container: null,
  logs: undefined,
  error: '',
};

export default Container;
