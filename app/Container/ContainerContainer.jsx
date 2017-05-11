import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import actions from './actions';
import Container from '../Presentational/Container/Container';

class ContainerComponent extends Component {
  componentDidMount() {
    this.props.fetchContainer(this.props.containerId);
    this.props.openStats(this.props.containerId);
  }

  componentWillUnmount() {
    this.props.closeLogs();
    this.props.closeStats();
  }

  render() {
    const { container } = this.props;

    return (
      <Container
        pending={this.props.pending}
        pendingAction={this.props.pendingAction}
        container={this.props.container}
        logs={this.props.logs}
        stats={this.props.stats}
        onBack={this.props.onBack}
        onRefresh={() => this.props.actionContainer('infos', container.Id)}
        onStart={() => this.props.actionContainer('start', container.Id)}
        onRestart={() => this.props.actionContainer('restart', container.Id)}
        onStop={() => this.props.actionContainer('stop', container.Id)}
        onDelete={() => this.props.actionContainer('delete', container.Id)}
        openLogs={() => this.props.openLogs(container.Id)}
        error={this.props.error}
      />
    );
  }
}

ContainerComponent.propTypes = {
  containerId: PropTypes.string.isRequired,
  pending: PropTypes.bool.isRequired,
  pendingAction: PropTypes.bool.isRequired,
  container: PropTypes.shape({}),
  logs: PropTypes.arrayOf(PropTypes.string),
  stats: PropTypes.shape({}),
  error: PropTypes.string.isRequired,
  fetchContainer: PropTypes.func.isRequired,
  actionContainer: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  openLogs: PropTypes.func.isRequired,
  closeLogs: PropTypes.func.isRequired,
  openStats: PropTypes.func.isRequired,
  closeStats: PropTypes.func.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
  logs: null,
  stats: null,
};

const mapStateToProps = (state, props) => ({
  pending: !!state.pending[actions.FETCH_CONTAINER],
  pendingAction: !!state.pending[actions.ACTION_CONTAINER],
  container: state.container,
  logs: state.logs,
  stats: state.stats,
  error: state.error,
  containerId: props.match.params.containerId,
});

const mapDispatchToProps = dispatch => ({
  fetchContainer: id => dispatch(actions.fetchContainer(id)),
  actionContainer: (action, id) => dispatch(actions.actionContainer(action, id)),
  onBack: () => dispatch(push('/')),
  openLogs: id => dispatch(actions.openLogs(id)),
  closeLogs: () => dispatch(actions.closeLogs()),
  openStats: id => dispatch(actions.openStats(id)),
  closeStats: () => dispatch(actions.closeStats()),
});

/**
 * Container for handling container view.
 */
const ContainerContainer = connect(mapStateToProps, mapDispatchToProps)(ContainerComponent);
export default ContainerContainer;
