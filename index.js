import React from "react";

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
  return internalUseEffect(effect, shouldFire);
}

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

export function factory(factoryComponent) {
  return class WithFactory extends React.Component {
    constructor(props) {
      super(props);

      let inc = 0;

      this.state = {};
      this.effects = {};

      this.effectToDoStack = [];

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
        inc++;
        const effectKey = `use_effect_${inc}`;

        this.effects[effectKey] = { effect };

        let lastShouldFireResult;

        return (...params) => {
          if (shouldFire) {
            const newShouldFireResult = shouldFire(...params);

            if (arrayElementsEqu(newShouldFireResult, lastShouldFireResult)) {
              return;
            }

            lastShouldFireResult = newShouldFireResult;
          }

          // effectToDoStack is
          this.effectToDoStack.push({ effectKey, params });
        };
      };

      this.renderFunc = factoryComponent(props);

      internalUseState = undefined;
      internalUseEffect = undefined;
    }

    fireEffects() {
      while (this.effectToDoStack.length > 0) {
        const { effectKey, params } = this.effectToDoStack.pop();
        const { effect, cleanup } = this.effects[effectKey];

        if (cleanup) {
          cleanup();
        }

        this.effects[effectKey].cleanup = effect(params);
      }
    }

    componentDidMount() {
      this.fireEffects();
    }

    componentDidUpdate() {
      this.fireEffects();
    }

    componentWillUnmount() {
      for (const effectKey in this.effects) {
        if (this.effects[effectKey].cleanup) {
          this.effects[effectKey].cleanup();
        }
      }
    }

    render() {
      return this.renderFunc(this.props);
    }
  };
}
