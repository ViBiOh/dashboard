import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import { fetchContainer } from './actions';
import DockerService from '../Service/DockerService';
import Container from '../Presentational/Container/Container';

class ContainerComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.appendLogs = this.appendLogs.bind(this);
    this.fetchLogs = this.fetchLogs.bind(this);
    this.action = this.action.bind(this);
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

  action(promise) {
    return promise.then(this.props.fetchContainer);
  }

  render() {
    return (
      <Container
        container={this.props.container}
        logs={this.state.logs}
        fetchLogs={this.fetchLogs}
        onBack={() => browserHistory.push('/')}
        onRefresh={() => this.props.fetchContainer(this.props.params.containerId)}
        onStart={containerId => this.action(DockerService.start(containerId))}
        onRestart={containerId => this.action(DockerService.restart(containerId))}
        onStop={containerId => this.action(DockerService.stop(containerId))}
        onDelete={containerId => this.action(DockerService.delete(containerId)).then(() =>
            browserHistory.push('/'))}
        error={this.props.error}
      />
    );
  }
}

ContainerComponent.propTypes = {
  params: React.PropTypes.shape({
    containerId: React.PropTypes.string.isRequired,
  }).isRequired,
  container: React.PropTypes.shape({}),
  fetchContainer: React.PropTypes.func.isRequired,
  error: React.PropTypes.string.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
};

const mapStateToProps = state => ({
  container: state.container,
  error: state.error,
});

const mapDispatchToProps = dispatch => ({
  fetchContainer: id => dispatch(fetchContainer(id)),
});

const ContainerContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainerComponent);
export default ContainerContainer;
