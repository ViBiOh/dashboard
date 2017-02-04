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
import ContainerLogs from '../../Container/Container/ContainerLogs';
import style from './Container.css';

const Container = (props) => {
  const { container, onBack, onRefresh, onRestart, onStop, onStart, onDelete, error } = props;
  const loaded = typeof container !== 'undefined';

  let content;
  if (loaded) {
    content = [
      <ContainerInfo key="info" container={container} />,
      <ContainerNetwork key="network" container={container} />,
      <ContainerVolumes key="volumes" container={container} />,
      <ContainerLogs key="logs "containerId={container.Id} />,
    ];
  } else {
    content = <Throbber label="Loading informations" />;
  }

  const buttons = [];
  if (loaded) {
    if (container.State.Running) {
      buttons.push(
        <ThrobberButton key="restart" onClick={() => onRestart(container.Id)}>
          <FaRetweet />
          <span>Restart</span>
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton key="stop" type="danger" onClick={() => onStop(container.Id)}>
          <FaStopCircle />
          <span>Stop</span>
        </ThrobberButton>,
      );
    } else {
      buttons.push(
        <ThrobberButton key="start" onClick={() => onStart(container.Id)}>
          <FaPlay />
          <span>Start</span>
        </ThrobberButton>,
      );
      buttons.push(
        <ThrobberButton key="delete" type="danger" onClick={() => onDelete(container.Id)}>
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
        <Button onClick={onRefresh}>
          <FaRefresh />
          <span>Refresh</span>
        </Button>
        <span className={style.fill} />
        {loaded && buttons}
      </Toolbar>
      {content}
    </span>
  );
};

Container.displayName = 'Container';

Container.propTypes = {
  container: React.PropTypes.shape({}),
  onBack: React.PropTypes.func.isRequired,
  onRefresh: React.PropTypes.func.isRequired,
  onStart: React.PropTypes.func.isRequired,
  onRestart: React.PropTypes.func.isRequired,
  onStop: React.PropTypes.func.isRequired,
  onDelete: React.PropTypes.func.isRequired,
  error: React.PropTypes.string,
};

Container.defaultProps = {
  container: undefined,
  error: '',
};

export default Container;
