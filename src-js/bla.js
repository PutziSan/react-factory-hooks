import * as React from "react";

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

      // useEffectStates holds the parameters of the `useEffect` calls,
      // and also holds the last return value of the `effect` function in the `cleanUp`-key.
      // The `cleanUp`-value is overwritten every time the `effect` function is called.
      this.useEffectStates = [];

      internalUseState = initialValue => {
        inc++;
        const stateKey = `use_state_${inc}`;

        // this breaks the readonly rule, but since it is only used during initialization, it should be fine
        // @ts-ignore
        this.state[stateKey] = initialValue;

        const getState = () => this.state[stateKey];
        const setState = val => this.setState({ [stateKey]: val });

        return [getState, setState];
      };

      internalUseEffect = (effect, shouldFire) => {
        this.useEffectStates.push({ effect, shouldFire });
      };

      this.renderFunc = factoryComponent(props);

      internalUseState = undefined;
      internalUseEffect = undefined;
    }

    fireEffects(prevProps) {
      this.useEffectStates.forEach(useEffectState => {
        if (
          useEffectState.shouldFire &&
          !useEffectState.shouldFire(this.props, prevProps)
        ) {
          return;
        }

        if (useEffectState.cleanUp) {
          useEffectState.cleanUp();
        }

        useEffectState.cleanUp = useEffectState.effect(this.props);
      });
    }

    componentDidMount() {
      this.fireEffects();
    }

    componentDidUpdate(prevProps) {
      this.fireEffects(prevProps);
    }

    componentWillUnmount() {
      this.useEffectStates.forEach(({ cleanUp }) => cleanUp && cleanUp());
    }

    render() {
      return this.renderFunc(this.props);
    }
  };
}
