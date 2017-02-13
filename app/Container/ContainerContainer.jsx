import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import {
  FETCH_CONTAINER,
  fetchContainer,
  ACTION_CONTAINER,
  actionContainer,
  openLogs,
  closeLogs,
} from './actions';
import Container from '../Presentational/Container/Container';

class ContainerComponent extends Component {
  componentDidMount() {
    this.props.fetchContainer(this.props.params.containerId);
  }

  componentWillUnmount() {
    this.props.closeLogs();
  }

  render() {
    const { container } = this.props;

    return (
      <Container
        pending={this.props.pending}
        pendingAction={this.props.pendingAction}
        container={this.props.container}
        logs={this.props.logs}
        openLogs={() => this.props.openLogs(container.Id)}
        closeLogs={() => this.props.closeLogs()}
        onBack={() => browserHistory.push('/')}
        onRefresh={() => this.props.actionContainer('infos', container.Id)}
        onStart={() => this.props.actionContainer('start', container.Id)}
        onRestart={() => this.props.actionContainer('restart', container.Id)}
        onStop={() => this.props.actionContainer('stop', container.Id)}
        onDelete={() => this.props.actionContainer('delete', container.Id)}
        error={this.props.error}
      />
    );
  }
}

ContainerComponent.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
  pending: React.PropTypes.bool.isRequired,
  pendingAction: React.PropTypes.bool.isRequired,
  container: React.PropTypes.shape({}),
  logs: React.PropTypes.arrayOf(React.PropTypes.string),
  error: React.PropTypes.string.isRequired,
  fetchContainer: React.PropTypes.func.isRequired,
  actionContainer: React.PropTypes.func.isRequired,
  openLogs: React.PropTypes.func.isRequired,
  closeLogs: React.PropTypes.func.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
  logs: null,
};

const mapStateToProps = state => ({
  pending: !!state.pending[FETCH_CONTAINER],
  pendingAction: !!state.pending[ACTION_CONTAINER],
  container: state.container,
  logs: state.logs,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainer: id => dispatch(fetchContainer(id)),
  actionContainer: (action, id) => dispatch(actionContainer(action, id)),
  openLogs: id => dispatch(openLogs(id)),
  closeLogs: () => dispatch(closeLogs()),
});

const ContainerContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainerComponent);
export default ContainerContainer;