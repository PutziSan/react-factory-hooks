function arrayEqu(a, b) {
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

export function itemsDidNotChanged(getVal) {
  let prevVal;

  return (props) => {
    const newVal = getVal(props);

    const isEqual = arrayEqu(prevVal, newVal);

    prevVal = newVal;

    return isEqual;
  };
}

export function when(condition, then) {
  return val => {
    if (condition(val)) {
      return then(val);
    }
  }
}
