import { FactoryState } from './index';

function didStateChanged(getVal: (prevState?: FactoryState) => any) {

}

function arrayEqu(a: any[], b: any[]) {
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

function didValuesChanged<T>(getVal: (props: T) => any[]) {
  let prevVal: any;

  return (props: T) => {
    const newVal = getVal(props);

    const changed = arrayEqu(prevVal, new);
    prevVal = newVal;

    return changed;
  };
}

function didReturnChanged(getVal: () => any) {
  let prevVal: any;

  return () => {
    const newVal = getVal();
    const changed = newVal !== prevVal;
    prevVal = newVal;

    return changed;
  };
}

function didPropsChanged<T extends { [key: string]: any }>(keys: (keyof T)[]) {
  return (props: T, prevProps?: T) => {
    if (!prevProps) {
      return true;
    }

    return keys.every(key => props[key] === prevProps[key]);
  };
}


