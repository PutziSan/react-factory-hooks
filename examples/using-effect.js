import React from "react";
import ReactDOM from "react-dom";
import { factory, useEffect, useState } from "react-factory-hooks";
import { UseEffect } from "./example-helper";

const SimpleCounterWithEffect = factory(() => {
  const [getCount, setCount] = useState(0);

  return () => (
    <>
      <UseEffect
        effect={() => {
          document.title = `You clicked ${getCount()} times`;
        }}
      />

      <div>
        <p>You clicked {getCount()} times</p>
        <button onClick={() => setCount(getCount() + 1)}>Click me</button>
      </div>
    </>
  );
});

function App() {
  return <SimpleCounterWithEffect />;
}

ReactDOM.render(<App />, document.getElementById("root"));
