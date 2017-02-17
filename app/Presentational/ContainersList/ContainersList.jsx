import React from 'react';
import FaPlus from 'react-icons/lib/fa/plus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaUserTimes from 'react-icons/lib/fa/user-times';
import Toolbar from '../../Presentational/Toolbar/Toolbar';
import Button from '../../Presentational/Button/Button';
import Throbber from '../../Presentational/Throbber/Throbber';
import ContainerCard from '../../Presentational/ContainerCard/ContainerCard';
import style from './ContainersList.css';

const ContainersList = ({ pending, containers, error, onRefresh, onAdd, onSelect, onLogout }) => {
  let content;

  if (pending || !containers) {
    content = <Throbber label="Loading containers" error={error} />;
  } else {
    content = (
      <div key="list" className={style.flex}>
        {
          containers.map(container => (
            <ContainerCard key={container.Id} container={container} onClick={onSelect} />
          ))
        }
      </div>
    );
  }

  return (
    <span>
      <Toolbar error={error}>
        <Button onClick={onRefresh}>
          <FaRefresh />
          <span>Refresh</span>
        </Button>
        <Button onClick={onAdd}>
          <FaPlus />
          <span>Add an app</span>
        </Button>
        <span className={style.fill} />
        <Button onClick={onLogout} type="danger">
          <FaUserTimes />
          <span>Disconnect</span>
        </Button>
      </Toolbar>
      {content}
    </span>
  );
};

ContainersList.displayName = 'ContainersList';

ContainersList.propTypes = {
  pending: React.PropTypes.bool.isRequired,
  containers: React.PropTypes.arrayOf(React.PropTypes.shape({})),
  error: React.PropTypes.string,
  onRefresh: React.PropTypes.func.isRequired,
  onAdd: React.PropTypes.func.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  onLogout: React.PropTypes.func.isRequired,
};

ContainersList.defaultProps = {
  containers: null,
  error: '',
};

export default ContainersList;
