import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { FETCH_CONTAINER, fetchContainer, ACTION_CONTAINER, actionContainer } from './actions';
import DockerService from '../Service/DockerService';
import Container from '../Presentational/Container/Container';

class ContainerComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.appendLogs = this.appendLogs.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
  }

  componentDidMount() {
    this.props.fetchContainer(this.props.params.containerId);
  }

  componentWillUnmount() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  appendLogs(log) {
    this.setState({
      logs: [...this.state.logs, log],
    });
  }

  fetchLogs() {
    try {
      this.setState({ logs: [] });
      this.websocket = DockerService.logs(this.props.params.containerId, this.appendLogs);
    } catch (e) {
      this.setState({
        error: JSON.stringify(e, null, 2),
      });
    }
  }

  render() {
    const { container } = this.props;

    return (
      <Container
        pending={this.props.pending}
        pendingAction={this.props.pendingAction}
        container={this.props.container}
        logs={this.state.logs}
        fetchLogs={this.fetchLogs}
        onBack={() => browserHistory.push('/')}
        onRefresh={() => this.props.actionContainer('infos', container.Id)}
        onStart={() => this.props.actionContainer('start', container.Id)}
        onRestart={() => this.props.actionContainer('restart', container.Id)}
        onStop={() => this.props.actionContainer('stop', container.Id)}
        onDelete={() => DockerService.delete(container.Id).then(() => browserHistory.push('/'))}
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
  fetchContainer: React.PropTypes.func.isRequired,
  actionContainer: React.PropTypes.func.isRequired,
  error: React.PropTypes.string.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
};

const mapStateToProps = state => ({
  pending: !!state.pending[FETCH_CONTAINER],
  pendingAction: !!state.pending[ACTION_CONTAINER],
  container: state.container,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainer: id => dispatch(fetchContainer(id)),
  actionContainer: (action, id) => dispatch(actionContainer(action, id)),
});

const ContainerContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainerComponent);
export default ContainerContainer;
