import * as React from "react";

type UseStateReturnValue<T> = [() => T, (value: T) => void];
type UseState<T> = (initialValue: T) => UseStateReturnValue<T>;

type EffectCleanUp = () => void;
type Effect<T extends any[]> = (...params: T) => void | EffectCleanUp;
type ShouldEffectFire<T extends any[]> = (...params: T) => any[];
type UseEffect<T extends any[]> = (
  effect: Effect<T>,
  shouldFire?: ShouldEffectFire<T>
) => (...params: T) => void;

type EffectToDo = { effectKey: string; params: any[] };

type Effects = {
  [key: string]: { effect: Effect<any[]>; cleanup?: EffectCleanUp };
};

type FactoryState = {
  [key: string]: any;
};

let internalUseState: UseState<any> | undefined;

export function useState<T>(initialValue: T): UseStateReturnValue<T> {
  if (!internalUseState) {
    throw new Error(
      "Factory-hooks must be used inside a factory-component. You must wrap your factory-components with `factory(factoryComponent)`"
    );
  }

  return internalUseState(initialValue);
}

let internalUseEffect: UseEffect<any> | undefined;

export function useEffect<T extends any[]>(
  effect: Effect<T>,
  shouldFire?: ShouldEffectFire<T>
): (...params: T) => void {
  if (!internalUseEffect) {
    throw new Error(
      "Factory-hooks must be used inside a factory-component. You must wrap your factory-components with `factory(factoryComponent)`"
    );
  }

  return internalUseEffect(effect, shouldFire);
}

function arrayElementsEqu(a?: any[], b?: any[]) {
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

export function factory<T extends {}>(
  factoryComponent: (initialProps: T) => (props: T) => React.ReactNode
) {
  return class WithFactory extends React.Component<T, FactoryState> {
    renderFunc: (props: T) => React.ReactNode;

    effects: Effects;
    effectToDoStack: EffectToDo[];

    constructor(props: T) {
      super(props);

      let inc = 0;

      this.state = {};
      this.effects = {};

      this.effectToDoStack = [];

      internalUseState = (initialValue: any) => {
        inc++;
        const stateKey = `use_state_${inc}`;

        // this breaks the readonly rule, but since it is only used during initialization, it should be fine
        // @ts-ignore
        this.state[stateKey] = initialValue;

        const getState = () => this.state[stateKey];
        const setState = (val: any) => this.setState({ [stateKey]: val });

        return [getState, setState];
      };

      internalUseEffect = (
        effect: Effect<any[]>,
        shouldFire?: ShouldEffectFire<any[]>
      ) => {
        inc++;
        const effectKey = `use_state_${inc}`;

        this.effects[effectKey] = { effect };

        let lastShouldFireResult: any[] | undefined;

        return (...params: any[]) => {
          if (shouldFire) {
            const newShouldFireResult = shouldFire(...params);

            if (arrayElementsEqu(newShouldFireResult, lastShouldFireResult)) {
              return;
            }

            lastShouldFireResult = newShouldFireResult;
          }

          this.effectToDoStack.push({ effectKey, params });
        };
      };

      this.renderFunc = factoryComponent(props);

      internalUseState = undefined;
      internalUseEffect = undefined;
    }

    fireEffects() {
      while (this.effectToDoStack.length > 0) {
        const { effectKey, params } = this.effectToDoStack.pop() as EffectToDo;
        const { effect, cleanup } = this.effects[effectKey];

        if (cleanup) {
          cleanup();
        }

        this.effects[effectKey].cleanup = effect(params) as
          | EffectCleanUp
          | undefined; // return-type void is not undefined in TS, so explicitly casting is necessary;;
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
        const cleanup = this.effects[effectKey].cleanup;

        if (cleanup) {
          cleanup();
        }
      }
    }

    render() {
      return this.renderFunc(this.props);
    }
  };
}
