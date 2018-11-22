import * as React from "react";
export declare const SKIP_EFFECT = "SKIP_EFFECT";
declare type UseStateReturnValue<T> = [() => T, (value: T) => void];
declare type EffectCleanUp = () => void;
declare type Effect<T extends any[]> = (...params: T) => void | EffectCleanUp;
declare type ShouldEffectFire<T extends any[]> = (...params: T) => any[];
declare type EffectToDo = {
  effectKey: string;
  params: any[];
};
declare type Effects = {
  [key: string]: {
    effect: Effect<any[]>;
    cleanup?: EffectCleanUp;
  };
};
declare type FactoryState = {
  [key: string]: any;
};
export declare function useState<T>(initialValue: T): UseStateReturnValue<T>;
export declare function useEffect<T extends any[]>(effect: Effect<T>, shouldFire?: ShouldEffectFire<T>): Effect<T>;
export declare function factory<T extends {}>(factoryComponent: (initialProps: T) => (props: T) => React.ReactNode): {
  new (props: T): {
    renderFunc: (props: T) => React.ReactNode;
    effects: Effects;
    effectToDoStack: EffectToDo[];
    fireEffects(): void;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    render(): React.ReactNode;
    context: any;
    setState<K extends string | number>(state: FactoryState | ((prevState: Readonly<FactoryState>, props: Readonly<T>) => FactoryState | Pick<FactoryState, K> | null) | Pick<FactoryState, K> | null, callback?: (() => void) | undefined): void;
    forceUpdate(callBack?: (() => void) | undefined): void;
    readonly props: Readonly<{
      children?: React.ReactNode;
    }> & Readonly<T>;
    state: Readonly<FactoryState>;
    refs: {
      [key: string]: React.ReactInstance;
    };
  };
  contextType?: React.Context<any> | undefined;
};
export {};
