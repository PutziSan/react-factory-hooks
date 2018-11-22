import React from "react";

function arrayElementsEqu(a, b) {
  if (!a || !b) {
    return a === b;
  }

  const lenA = a.length;
  const lenB = b.length;

  if (lenA !== lenB) {
    return false;
  }

  for (let i = 0; i < lenA; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export class UseEffect extends React.Component {
  componentDidMount() {
    this.cleanup = this.props.effect();
  }
  componentDidUpdate(prevProps) {
    const { whenItemsDidChange, effect } = this.props;

    if (arrayElementsEqu(whenItemsDidChange, prevProps.whenItemsDidChange)) {
      return;
    }

    if (this.cleanup) {
      this.cleanup();
    }
    this.cleanup = effect();
  }
  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
  render() {
    return null;
  }
}
