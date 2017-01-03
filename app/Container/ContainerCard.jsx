import React from 'react';
import moment from 'moment';
import { browserHistory } from 'react-router';
import FaEye from 'react-icons/lib/fa/eye';
import Button from '../Button/Button';
import style from './Containers.css';

const ContainerCard = ({ container }) => (
  <span className={style.row}>
    <pre>{container.Id.substring(0, 12)}</pre>
    <span className={style.fluid}>{container.Image}</span>
    <span className={style.fluid}>{container.Command}</span>
    <span className={style.created}>
      {moment.unix(container.Created).fromNow()}
    </span>
    <span className={style.fluid}>
      {container.Status}
    </span>
    <span className={style.fluid}>{container.Names.join(', ')}</span>
    <Button onClick={() => browserHistory.push(`/containers/${container.Id}`)}>
      <FaEye />
    </Button>
  </span>
);

ContainerCard.displayName = 'ContainerCard';

ContainerCard.propTypes = {
  container: React.PropTypes.shape({
    Image: React.PropTypes.string.isRequired,
    Created: React.PropTypes.number.isRequired,
    Status: React.PropTypes.string.isRequired,
    Names: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  }).isRequired,
};

export default ContainerCard;
