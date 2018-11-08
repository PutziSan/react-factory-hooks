


function observeGetter(getVal) {
  let prevVal;

  return () => {
    const newVal = getVal();
    const changed = newVal !== prevVal;
    prevVal = newVal;

    return changed;
  };
}

function checkKeys() {
  
}
