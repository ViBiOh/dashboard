import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { FETCH_CONTAINER, fetchContainer, actionContainerSucceeded } from './actions';
import DockerService from '../Service/DockerService';
import Container from '../Presentational/Container/Container';

class ContainerComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.onAction = this.onAction.bind(this);
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

  onAction(promise) {
    return promise.then(() => this.props.action(this.props.params.containerId));
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
    return (
      <Container
        containerPending={this.props.containerPending}
        container={this.props.container}
        logs={this.state.logs}
        fetchLogs={this.fetchLogs}
        onBack={() => browserHistory.push('/')}
        onRefresh={() => this.props.fetchContainer(this.props.params.containerId)}
        onStart={id => this.onAction(DockerService.start(id))}
        onRestart={id => this.onAction(DockerService.restart(id))}
        onStop={id => this.onAction(DockerService.stop(id))}
        onDelete={id => DockerService.delete(id).then(() => browserHistory.push('/'))}
        error={this.props.error}
      />
    );
  }
}

ContainerComponent.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
  containerPending: React.PropTypes.bool.isRequired,
  container: React.PropTypes.shape({}),
  fetchContainer: React.PropTypes.func.isRequired,
  action: React.PropTypes.func.isRequired,
  error: React.PropTypes.string.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
};

const mapStateToProps = state => ({
  containerPending: !!state.pending[FETCH_CONTAINER],
  container: state.container,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainer: id => dispatch(fetchContainer(id)),
  action: id => dispatch(actionContainerSucceeded(id)),
});

const ContainerContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainerComponent);
export default ContainerContainer;
