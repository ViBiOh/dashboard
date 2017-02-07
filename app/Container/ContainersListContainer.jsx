import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { fetchContainers } from './actions';
import DockerService from '../Service/DockerService';
import ContainersList from '../Presentational/ContainersList/ContainersList';

class Container extends Component {
  componentDidMount() {
    this.props.fetchContainers();
  }

  render() {
    return (
      <ContainersList
        throbber={this.props.throbber}
        containers={this.props.containers}
        error={this.props.error}
        onRefresh={this.props.fetchContainers}
        onAdd={() => browserHistory.push('/containers/New')}
        onLogout={() => DockerService.logout().then(browserHistory.push('/login'))}
      />
    );
  }
}

Container.propTypes = {
  throbber: React.PropTypes.bool.isRequired,
  containers: React.PropTypes.arrayOf(React.PropTypes.shape({})).isRequired,
  error: React.PropTypes.string.isRequired,
  fetchContainers: React.PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  throbber: state.throbber,
  containers: state.containers,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainers: containers => dispatch(fetchContainers(containers)),
});

const ContainersListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Container);
export default ContainersListContainer;
