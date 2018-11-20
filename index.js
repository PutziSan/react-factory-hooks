import React from "react";

export const SKIP_EFFECT = "SKIP_EFFECT";

let internalUseState;
export function useState(initialValue) {
  if (!internalUseState) {
    throw new Error(
      "Factory-hooks must be used inside a factory-component. You must wrap your factory-components with `factory(factoryComponent)`"
    );
  }
  return internalUseState(initialValue);
}

let internalUseEffect;
export function useEffect(effect, shouldFire) {
  if (!internalUseEffect) {
    throw new Error(
      "Factory-hooks must be used inside a factory-component. You must wrap your factory-components with `factory(factoryComponent)`"
    );
  }
  internalUseEffect(effect, shouldFire);
}

export function factory(factoryComponent) {
  return class WithFactory extends React.Component {
    constructor(props) {
      super(props);

      let inc = 0;

      this.state = {};
      this.useEffectStates = [];

      internalUseState = initialValue => {
        inc++;

        const stateKey = `use_state_${inc}`;

        // this breaks the readonly rule, but since it is only used during initialization, it should be fine
        this.state[stateKey] = initialValue;

        const getState = () => this.state[stateKey];
        const setState = val => this.setState({ [stateKey]: val });

        return [getState, setState];
      };

      internalUseEffect = (effect, shouldFire) => {
        this.useEffectStates.push({ effect, shouldFire });
      };

      this.renderFunc = factoryComponent(() => this.props);

      internalUseState = undefined;
      internalUseEffect = undefined;
    }

    fireEffects() {
      this.useEffectStates.forEach(useEffectState => {
        if (
          useEffectState.shouldFire &&
          useEffectState.shouldFire() === SKIP_EFFECT
        ) {
          return;
        }

        if (useEffectState.cleanUp) {
          useEffectState.cleanUp();
        }

        useEffectState.cleanUp = useEffectState.effect();
      });
    }

    componentDidMount() {
      this.fireEffects();
    }

    componentDidUpdate() {
      this.fireEffects();
    }

    componentWillUnmount() {
      this.useEffectStates.forEach(({ cleanUp }) => cleanUp && cleanUp());
    }

    render() {
      return this.renderFunc(this.props);
    }
  };
}
