import React from 'react';

class Route extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      path	: this.props.path,
      isActive	: this.props.isActive,
      component	: this.props.component,
      onMount	: this.props.onMount,
      onUnmount	: this.props.onUnmount
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  componentDidMount() {
    if(this.state.onMount !== undefined) {
      this.state.onMount(this);
    }
  }

  componentWillUnmount() {
    if(this.state.onUnmount !== undefined) {
      this.state.onUnmount(this);
    }
  }

  render() {
    if(this.props.isActive) {
      return (<this.props.component {...this.props}>{this.props.children}</this.props.component>);
    }
    else {
      return false;
    }
  }
};

Route.propTypes = {
  history	: React.PropTypes.object,
  path		: React.PropTypes.string.isRequired,
  isActive	: React.PropTypes.bool,
  component	: React.PropTypes.func.isRequired,
  onMount	: React.PropTypes.func,
  onUnmount	: React.PropTypes.func
};

Route.defaultProps = {
  isActive	: false,
  properties	: {}
}

export default Route;
