import React from 'react';
import PropTypes from 'prop-types';
import FaPlus from 'react-icons/lib/fa/plus';
import FaRefresh from 'react-icons/lib/fa/refresh';
import FaUserTimes from 'react-icons/lib/fa/user-times';
import FaCubes from 'react-icons/lib/fa/cubes';
import Toolbar from '../Toolbar';
import Button from '../Button';
import ThrobberButton from '../Throbber/ThrobberButton';
import Throbber from '../Throbber/Throbber';
import ErrorBanner from '../ErrorBanner';
import FilterBar from '../Filter';
import ContainerCard from '../ContainerCard';
import style from './index.less';

/**
 * Container's list.
 * @param {Object} props Props of the component.
 * @return {React.Component} List view of containers
 */
const ContainersList = ({
  pending,
  containersTotalCount,
  containers,
  filter,
  error,
  onRefresh,
  onAdd,
  onSelect,
  onLogout,
  onFilterChange,
}) => {
  let content;

  if (pending || !Array.isArray(containers)) {
    content = <Throbber label="Loading containers" />;
  } else {
    const count =
      containers.length !== containersTotalCount
        ? `${containers.length} / ${containersTotalCount}`
        : containers.length;

    content = [
      <span key="size" className={style.size} title="Number of containers">
        {count}
        <FaCubes />
        <FilterBar value={filter} onChange={onFilterChange} />
      </span>,
      containers.map(container =>
        <ContainerCard key={container.Id} container={container} onClick={onSelect} />,
      ),
    ];
  }

  return (
    <span className={style.container}>
      <Toolbar>
        <Button onClick={onAdd} title="Deploy a new stack">
          <FaPlus />
        </Button>
        <ThrobberButton
          pending={pending}
          onClick={onRefresh}
          title="Refresh containers list"
          vertical
          horizontalSm
        >
          <FaRefresh />
        </ThrobberButton>
        <span className={style.fill} />
        <Button onClick={onLogout} title="Logout" type="danger">
          <FaUserTimes />
        </Button>
      </Toolbar>
      <div className={style.content}>
        <ErrorBanner error={error} />
        {content}
      </div>
    </span>
  );
};

ContainersList.displayName = 'ContainersList';

ContainersList.propTypes = {
  pending: PropTypes.bool,
  containersTotalCount: PropTypes.number,
  containers: PropTypes.arrayOf(PropTypes.shape({})),
  filter: PropTypes.string,
  error: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};

ContainersList.defaultProps = {
  pending: false,
  pendingInfo: false,
  containersTotalCount: 0,
  containers: null,
  infos: null,
  filter: '',
  error: '',
};

export default ContainersList;
