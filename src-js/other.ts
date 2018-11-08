import * as React from "react";

export type FactoryState = {
  [key: string]: any;
};

type UseStateReturnValue<T> = [(prevState?: FactoryState) => T, (value: T) => void];
type UseState<T> = (initialValue: T) => UseStateReturnValue<T>;

type EffectCleanUp = () => void;
type Effect<T> = (props: T) => void | EffectCleanUp;
type ShouldEffectFire<T> = (props: T, prevProps?: T, prevState?: FactoryState) => boolean;
type UseEffect<T> = (
  effect: Effect<T>,
  shouldFire?: ShouldEffectFire<T>
) => void;

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

export function useEffect<T>(
  effect: Effect<T>,
  shouldFire?: ShouldEffectFire<T>
) {
  if (!internalUseEffect) {
    throw new Error(
      "Factory-hooks must be used inside a factory-component. You must wrap your factory-components with `factory(factoryComponent)`"
    );
  }

  internalUseEffect(effect, shouldFire);
}

export function factory<T extends {}>(
  factoryComponent: (initialProps: T) => (props: T) => React.ReactNode
) {
  return class WithFactory extends React.Component<T, FactoryState> {
    // This variable holds the parameters of the `useEffect` calls,
    // and also holds the last return value of the `effect` function in the `cleanUp`-key.
    // The `cleanUp`-value is overwritten every time the `effect` function is called.
    useEffectStates: {
      effect: Effect<T>;
      shouldFire?: ShouldEffectFire<T>;
      cleanUp?: EffectCleanUp;
    }[];

    renderFunc: (props: T) => React.ReactNode;

    constructor(props: T) {
      super(props);

      let inc = 0;

      this.state = {};

      this.useEffectStates = [];

      internalUseState = (initialValue: any) => {
        inc++;
        const stateKey = `use_state_${inc}`;

        // this breaks the readonly rule, but since it is only used during initialization, it should be fine
        // @ts-ignore
        this.state[stateKey] = initialValue;

        const getState = (prevState?: FactoryState) => {
          if (prevState !== undefined) {
            return prevState[stateKey];
          }

          return this.state[stateKey];
        };
        const setState = (val: any) => this.setState({ [stateKey]: val });

        return [getState, setState];
      };

      internalUseEffect = (
        effect: Effect<T>,
        shouldFire?: ShouldEffectFire<T>
      ) => {
        this.useEffectStates.push({ effect, shouldFire });
      };

      this.renderFunc = factoryComponent(props);

      internalUseState = undefined;
      internalUseEffect = undefined;
    }

    fireEffects(prevProps?: T, prevState?: FactoryState) {
      this.useEffectStates.forEach(useEffectState => {
        if (
          useEffectState.shouldFire &&
          !useEffectState.shouldFire(this.props, prevProps, prevState)
        ) {
          return;
        }

        if (useEffectState.cleanUp) {
          useEffectState.cleanUp();
        }

        useEffectState.cleanUp = useEffectState.effect(this.props) as
          | EffectCleanUp
          | undefined; // return-type void is not undefined in TS, so explicitly casting is necessary
      });
    }

    componentDidMount() {
      this.fireEffects();
    }

    componentDidUpdate(prevProps: T, prevState: FactoryState) {
      this.fireEffects(prevProps, prevState);
    }

    componentWillUnmount() {
      this.useEffectStates.forEach(({ cleanUp }) => cleanUp && cleanUp());
    }

    render() {
      return this.renderFunc(this.props);
    }
  };
}
