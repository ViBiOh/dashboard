import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import actions from '../actions';
import Container from '../presentationals/Container/Container';

/**
 * Container.
 * @extends {Component}
 */
class ContainerComponent extends Component {
  /**
   * React lifecycle.
   * Fetch container and open streams for bus if bus provided.
   */
  componentDidMount() {
    const { fetchContainer, containerId, bus } = this.props;

    fetchContainer(containerId);

    if (bus) {
      this.openStreams();
    }
  }

  /**
   * React lifecycle.
   * Open streams for bus if bus provided.
   * @param {Object} nextProps Next props for component
   */
  componentWillReceiveProps({ bus: nextBus, logs: { fullscreen: nextFullscreen } }) {
    const {
      bus,
      logs: { fullscreen },
    } = this.props;

    if (!bus && nextBus) {
      this.openStreams();
    }

    if (!fullscreen && nextFullscreen) {
      window.scrollTo(0, 0);
    }
  }

  /**
   * React lifecycle.
   * Close previously opened streams.
   */
  componentWillUnmount() {
    this.closeStreams();
  }

  /**
   * Open streams in bus for given container.
   * @memberof ContainerComponent
   */
  openStreams() {
    const { openLogs, openStats, containerId } = this.props;

    openLogs(containerId);
    openStats(containerId);
  }

  /**
   * Close streams in bus for given container.
   * @memberof ContainerComponent
   */
  closeStreams() {
    const { closeLogs, closeStats } = this.props;

    closeLogs();
    closeStats();
  }

  /**
   * React lifecycle.
   */
  render() {
    const {
      pending,
      pendingAction,
      container,
      logs,
      stats,
      onBack,
      actionContainer,
      toggleFullScreenLogs,
      error,
    } = this.props;

    return (
      <Container
        pending={pending}
        pendingAction={pendingAction}
        container={container}
        logs={logs}
        stats={stats}
        onBack={onBack}
        openStreams={this.openStreams}
        onRefresh={() => actionContainer('containerInfos', container.Id)}
        onStart={() => actionContainer('containerStart', container.Id)}
        onRestart={() => actionContainer('containerRestart', container.Id)}
        onStop={() => actionContainer('containerStop', container.Id)}
        onDelete={() => actionContainer('containerDelete', container.Id)}
        toggleFullScreenLogs={toggleFullScreenLogs}
        error={error}
      />
    );
  }
}

ContainerComponent.propTypes = {
  actionContainer: PropTypes.func.isRequired,
  bus: PropTypes.bool.isRequired,
  closeLogs: PropTypes.func.isRequired,
  closeStats: PropTypes.func.isRequired,
  container: PropTypes.shape({}),
  containerId: PropTypes.string.isRequired,
  error: PropTypes.string.isRequired,
  fetchContainer: PropTypes.func.isRequired,
  logs: PropTypes.shape({
    logs: PropTypes.arrayOf(PropTypes.string),
    fullscreen: PropTypes.bool,
  }),
  onBack: PropTypes.func.isRequired,
  openLogs: PropTypes.func.isRequired,
  openStats: PropTypes.func.isRequired,
  pending: PropTypes.bool.isRequired,
  pendingAction: PropTypes.bool.isRequired,
  stats: PropTypes.shape({}),
  toggleFullScreenLogs: PropTypes.func.isRequired,
};

ContainerComponent.defaultProps = {
  container: null,
  logs: null,
  stats: null,
};

/**
 * Select props from Redux state.
 * @param {Object} state Current state
 */
function mapStateToProps(
  state,
  {
    match: {
      params: { containerId },
    },
  },
) {
  return {
    pending: !!state.pending[actions.FETCH_CONTAINER],
    pendingAction: !!state.pending[actions.ACTION_CONTAINER],
    container: state.container,
    bus: state.bus,
    logs: state.logs,
    stats: state.stats,
    error: state.error,
    containerId,
  };
}

/**
 * Provide dispatch functions in props.
 * @param {Function} dispatch Redux dispatch function
 */
function mapDispatchToProps(dispatch) {
  return {
    fetchContainer: id => dispatch(actions.fetchContainer(id)),
    actionContainer: (action, id) => dispatch(actions.actionContainer(action, id)),
    onBack: () => dispatch(actions.goHome()),
    openLogs: id => dispatch(actions.openLogs(id)),
    closeLogs: () => dispatch(actions.closeLogs()),
    openStats: id => dispatch(actions.openStats(id)),
    closeStats: () => dispatch(actions.closeStats()),
    toggleFullScreenLogs: () => dispatch(actions.toggleFullScreenLogs()),
  };
}

/**
 * Container for handling container view.
 */
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContainerComponent);
