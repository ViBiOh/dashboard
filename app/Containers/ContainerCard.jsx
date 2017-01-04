import React from 'react';
import moment from 'moment';
import { browserHistory } from 'react-router';
import Button from '../Button/Button';
import style from './Containers.css';

const GREEN_STATUS = /up/i;

const ContainerCard = ({ container }) => (
  <span className={style.card}>
    <Button type="transparent" onClick={() => browserHistory.push(`/containers/${container.Id}`)}>
      <div
        className={`${GREEN_STATUS.test(container.Status) ? style.green : style.red}`}
      />
    </Button>
    <span className={style.column}>
      <span>Image: <em>{container.Image}</em></span>
      <span>Names: <strong>{container.Names.join(', ')}</strong></span>
    </span>
    <span>
      {moment.unix(container.Created).fromNow()}
    </span>
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