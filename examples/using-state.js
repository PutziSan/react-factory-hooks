import React from "react";
import ReactDOM from "react-dom";
import { factory, useState } from "react-factory-hooks";

const SimpleCounter = factory(getProps => {
  const [getCount, setCount] = useState(getProps().startCount);

  return () => (
    <div>
      <p>You clicked {getCount()} times</p>
      <button onClick={() => setCount(getCount() + 1)}>Click me</button>
    </div>
  );
});

function App() {
  return <SimpleCounter startCount={3} />;
}

ReactDOM.render(<App />, document.getElementById("root"));
