import React from "react";
import ReactDOM from "react-dom";
import { factory, useState, useEffect } from "react-factory-hooks";

const SimpleCounterWithEffect = factory(() => {
  const [getCount, setCount] = useState(0);

  useEffect(() => {
    document.title = `You clicked ${getCount()} times`;
  });

  return () => (
    <div>
      <p>You clicked {getCount()} times</p>
      <button onClick={() => setCount(getCount() + 1)}>Click me</button>
    </div>
  );
});

function App() {
  return <SimpleCounterWithEffect />;
}

ReactDOM.render(<App />, document.getElementById("root"));
