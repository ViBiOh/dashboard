import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { FETCH_CONTAINERS, fetchContainers } from './actions';
import DockerService from '../Service/DockerService';
import ContainersList from '../Presentational/ContainersList/ContainersList';

class ContainersListComponent extends Component {
  componentDidMount() {
    if (!this.props.containers) {
      this.props.fetchContainers();
    }
  }

  render() {
    return (
      <ContainersList
        pending={this.props.pending}
        containers={this.props.containers}
        error={this.props.error}
        onRefresh={this.props.fetchContainers}
        onAdd={() => browserHistory.push('/containers/New')}
        onLogout={() => DockerService.logout().then(browserHistory.push('/login'))}
      />
    );
  }
}

ContainersListComponent.propTypes = {
  pending: React.PropTypes.bool.isRequired,
  containers: React.PropTypes.arrayOf(React.PropTypes.shape({})),
  fetchContainers: React.PropTypes.func.isRequired,
  error: React.PropTypes.string.isRequired,
};

ContainersListComponent.defaultProps = {
  containers: null,
};

const mapStateToProps = state => ({
  pending: !!state.pending[FETCH_CONTAINERS],
  containers: state.containers,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainers: containers => dispatch(fetchContainers(containers)),
});

const ContainersListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainersListComponent);
export default ContainersListContainer;
