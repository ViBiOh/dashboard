import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import FaCloud from 'react-icons/lib/fa/cloud';
import Button from '../Button/';
import style from './index.css';

/**
 * Green status regex.
 * @type {RegExp}
 */
const GREEN_STATUS = /up/i;

/**
 * Container's card for listing.
 * @param {Object} props Props of the component.
 * @return {React.Component} Card with summarized details of container.
 */
const ContainerCard = ({ container, onClick }) => {
  const name = container.Names[0].replace(/^\//, '');

  return (
    <Button type="none" className={style.card} onClick={() => onClick(name)} data-container-card>
      <div
        className={`${style.pastille} ${GREEN_STATUS.test(container.Status) ? style.green : style.red}`}
        title={container.Status}
      />
      <span className={style.column}>
        <em className={style.image}>{container.Image}</em>
        <strong>{name}</strong>
      </span>
      <span>
        {moment.unix(container.Created).fromNow()}
        {container.Labels && container.Labels.owner ? (
          <div className={style.owner}>by {container.Labels.owner}</div>
        ) : null}
        {container.Ports.some(port => port.IP) ? (
          <div className={style.external} title="Has external IP">
            <FaCloud />
          </div>
        ) : null}
      </span>
    </Button>
  );
};

ContainerCard.displayName = 'ContainerCard';

ContainerCard.propTypes = {
  container: PropTypes.shape({
    Image: PropTypes.string.isRequired,
    Created: PropTypes.number.isRequired,
    Status: PropTypes.string.isRequired,
    Names: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ContainerCard;
