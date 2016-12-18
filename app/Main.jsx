import React from 'react';
import { Link } from 'react-router';
import Toggle from './Toggle/Toggle';

const toggleProps = {
  idle: <span>&#x2715;</span>,
  active: <span>&#x2261;</span>,
};

const Main = ({ children }) => (
  <span id="mainLayout">
    <Toggle {...toggleProps}>
      <nav>
        <ul>
          <li><Link to="/">Containers</Link></li>
          <li><hr /></li>
          <li>&copy; ViBiOh 2016</li>
        </ul>
      </nav>
    </Toggle>
    <article>{children}</article>
  </span>
);

Main.propTypes = {
  children: React.PropTypes.element.isRequired,
};

export default Main;
