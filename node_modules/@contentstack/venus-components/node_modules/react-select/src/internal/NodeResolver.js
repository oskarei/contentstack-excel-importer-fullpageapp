// @flow

import { Component, type Element, type ElementRef } from 'react';
import ReactDOM from 'react-dom';

type Props = {
  children: Element<*>,
  innerRef: ElementRef<*>,
};

export default class NodeResolver extends Component<Props> {
  componentDidMount() {

    ReactDOM.findDOMNode
      ? this.props.innerRef(ReactDOM.findDOMNode(this))
      : this.props.innerRef(ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.findDOMNode(this));
  }
  componentWillUnmount() {
    this.props.innerRef(null);
  }
  render() {
    return this.props.children;
  }
}
