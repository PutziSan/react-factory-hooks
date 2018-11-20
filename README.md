# react-hooks with the factory-pattern

> **BE AWARE:** The package `react-factory-hooks` is only intended to clarify the suggestions and to test them quickly with real code. It is not tested, stable or guaranteed that `react-factory-hooks` will work outside the demos.

This is another suggestion to implement the hook pattern. [React-hooks was introduced at React Conf 2018](https://reactjs.org/docs/hooks-intro.html) by the React team. For information on how hooks basically work, please visit the very good and detailed [documentation on the react page](https://reactjs.org/docs/hooks-overview.html). I will only briefly discuss the differences to my suggestion here, as the other usage doesn't change much. Besides, I will only go into `useState` and `useEffect`. The other hooks can be implemented analogously.

Please feel free to open issues or comment on the existing for some discussion.

> This is the 2nd draft, the idea to pass `getProps` to the factory function as a parameter instead of `initialProps` was first designed by @zouloux and published in its own proposal under [solid-js/prehook-proof-of-concept](https://github.com/solid-js/prehook-proof-of-concept), so credits for this idea deserves to @zouloux.

## proposals

How does it look like? Code first for both proposals/changes, then explanations.

### 1. hooks with a factory-function

([codesandbox-example](https://codesandbox.io/s/wk6qq77wkw))

```jsx
function FactoryExample(getProps) {
  const [getCount, setCount] = useState(getProps().startCount);

  useEffect(() => {
    document.title = `Hi ${getProps().name}! You clicked ${getCount()} times`;
  });

  return props => (
    <div>
      <p>
        {props.name} clicked {getCount()} times
      </p>
      <button onClick={() => setCount(getCount() + 1)}>Click me</button>
    </div>
  );
}
```

Have a look at [Motivation factory-pattern](#motivation-factory-pattern) for more information.

### 2. skipping effects with a flag

([codesandbox-example](https://codesandbox.io/s/kmvqp258nr))

```javascript
useEffect(
  () => {}, // (...) no furhter changes
  () => {
    if (mySkippingCondition) {
      return SKIP_EFFECT;
    }
  }
);
```

Which could be used like (analogous to the [React example](#https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects)): ([codesandbox-example](https://codesandbox.io/s/2wr71v8zvj))

```javascript
useEffect(
  // useEffect-example from react-docs
  () => {
    ChatAPI.subscribeToFriendStatus(getProps().friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFriendStatus(getProps().friend.id, handleStatusChange);
    };
  },
  when(itemsDidNotChanged(() => [getProps().friend.id]), () => SKIP_EFFECT)
);
```

Have a look at [Motivation for skipping effects via flag](#motivation-for-skipping-effects-via-flag) for more information.

## Motivation factory-pattern

I really like hooks a lot. In the discussion (e.g. at [RFC: React Hooks #68](https://github.com/reactjs/rfcs/pull/68)) it is noticeable that some people don't like the "magic" behind hooks. This magic is reflected, for example, in the fact that there are [rules for hooks](https://reactjs.org/docs/hooks-rules.html) which can be forced with an ESLint plugin. If you look at the basic example:

```jsx
function Example() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return <div>(...)</div>;
}
```

If I want to find out for myself if my written function/API is easy to understand for the next developer, I always try to verbalize it. If it's easy to verbalice, it's usually quite good, otherwise it's a hint that it's not exhausted yet.

So, if we try to verbalize code, it looks something like this:
"The component holds the local state by initiating the state on the first call and remembers the component on subsequent calls through some kind of internal memory and therefore returns the state of the component instead of creating a new one."

So, the "magic" is here "some kind of internal memory". If we look at the same via a factory:

```jsx
function Example() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return props => <div>(...)</div>;
}
```

The verbalization could be: "The component is wrapped in a function that holds the local state."

The implemenation of `useState` still needs some "magic" like "some kind of internal memory", but its abstracted away via the API and usage. (This "magic" this is not new to React, each component currently uses it e.g. to decide if it needs to create and render a new instance of the component, or if one already exists)

> The public API should hide the magic and the current hooks-RFC by react show too much magic for the user (developer).

### Why the render function should get `props` as argument

> "render function" means the inner function which is returned by the factory.

```jsx
// example-component where the render function has no parameter.
function Example(getProps) {
  // use*
  return () => <p>Hi {getProps().name}</p>;
}

// example-component where the render function has `props` as parameter.
function Example(getProps) {
  // use*
  // note that `props` is available here (like in a normal component)
  return props => <p>Hi {props.name}</p>;
}
```

There are 2 reasons for a factory-pattern with `props` as parameter in addition to the `getProps` parameter in the wrapping function: development cycle and testability.

#### better development-cycle through the `props` argument

It is very important that the proposal supports use in the everyday development cycle. If we want to add a state or effect to a "normal" (or stateless) functional component, it should be as simple as possible. Therefore, the render function should include `props` as a parameter, so that actually only the wrapping function needs to be added and the component (or render function) does not need any further changes.

```jsx
function Example(props) {
  return <p>Hi {props.name}</p>;
}
// and now adding a state/effect is straight forward
function Example(getProps) {
  useEffect(() => document.title = `Hi ${getProps().name}!`);

  return props => <p>Hi {props.name}</p>;
}
```

#### better testability through the `props` argument

It should be possible and easy to test the render function in isolation. If the render function contains `props` as parameter, it can be extracted and is then like a "normal" (stateless) component and can be shallow-rendered as such. If we look at this example `Counter`-component:

```jsx
// Counter.js
import React from "react";

export function renderCounter({ getCount, setCount }) {
  return props => (
    <div>
      <p>
        {props.name} clicked {getCount()} times
      </p>
      <button onClick={() => setCount(getCount() + 1)}>Click me</button>
    </div>
  );
}

export function Counter(getProps) {
  const [getCount, setCount] = useState(getProps().startCount);

  return renderCounter({ getCount, setCount });
}
```

a test might look like this (using [jest](https://jestjs.io/docs/en/tutorial-react#dom-testing) and [Enzyme's shallow renderer](https://airbnb.io/enzyme/docs/api/shallow.html)):

```jsx
// Counter.test.js
import { renderCounter } from "./Counter.js";
import { shallow } from "enzyme";

it("should call setCount on button-click", function() {
  const mockCallBack = jest.fn();

  const MockedCounter = renderCounter({
    getCount: () => 1,
    setCount: mockCallBack
  });

  const counter = shallow(<MockedCounter name="test" />);
  counter.find("button").simulate("click");

  expect(mockCallBack.mock.calls.length).toEqual(1);
});
```

## Motivation for skipping effects via flag

`useEffect` is just great! But skipping effects, by including the second parameter as an array is just not-so-great! ;-) It is some sort of "convention over code". It is simply not necessary, a simple function that passes a flag to control the behavior of the effect is much clearer. It has to be said that the code becomes a bit longer at first, let's take a look at the example from the [React-documentation](https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects):

```jsx
// SYNTAX OF CURRENT REACT-PROPOSAL:
function Example(props) {
  useEffect(
    () => {
      ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
      return () => {
        ChatAPI.unsubscribeFriendStatus(props.friend.id, handleStatusChange);
      };
    },
    [props.friend.id]
  ); // Only re-subscribe if props.friend.id changes

  return <div>...</div>;
}
```

if we rewrite that with a function and a flag (and the factory-pattern from above): ([codesandbox-example](https://codesandbox.io/s/2wr71v8zvj))

```jsx
function Example(getProps) {
  let prevId;

  useEffect(
    () => {
      ChatAPI.subscribeToFriendStatus(getProps().friend.id, handleStatusChange);
      return () => {
        ChatAPI.unsubscribeFriendStatus(getProps().friend.id, handleStatusChange);
      };
    },
    () => {
      if (prevId === getProps().friend.id) {
        return SKIP_EFFECT; // Only re-subscribe if getProps().friend.id changes)
      }

      prevId = getProps().friend.id;
    }
  );

  return props => <div>...</div>;
}
```

Yep, this is more, 8 lines of code more for this example. Now try to find out what happens in the upper and lower function. To understand the upper one you must always remember, "the 2nd parameter in the `useEffect` function is an array, and if at least one of the elements within the array changes between 2 calls, the effect is executed". You can do that, but this behavior is just not intuitive. The 2nd function tells you exactly what is going on only through its code.

However, with this approach, we can use arbitrary behavior. It offers a lot of space to let the community grow and come up with ideas that nobody can guess at the moment. For example, the current behavior can be easily recreated: ([codesandbox-example](https://codesandbox.io/s/2wr71v8zvj))

```jsx
function Example(getProps) {
  useEffect(() => {
    ChatAPI.subscribeToFriendStatus(getProps().friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFriendStatus(getProps().friend.id, handleStatusChange);
    };
  }, when(itemsDidNotChanged(() => [getProps().friend.id]), () => SKIP_EFFECT));

  return props => <div>...</div>;
}
```

If you look at the code now, you can read it like a book: "Use the effect (...). If the elements haven't changed, skip the effect." (Hello declarative programming).

## `react-factory-hooks` as "live-example" and testing-playground

This package contains under `index.js` an current implementation of this API (only for showcasing), by using a Higher Order Component. So the sandboxes will look slightly different to the examples here, cause they are using the HOC. If it were implemented directly in the React package, you could/should not use the HOC.

- [basic `useState`-Example](https://codesandbox.io/s/oqnv17m86)
- [counter with an `useEffect`-hook](https://codesandbox.io/s/wk6qq77wkw)
- [`useEffect`-example with cleanup-handler and checking for skipping without helper-functions](https://codesandbox.io/s/kmvqp258nr)
- [`useEffect`-example with cleanup-handler and checking for skipping with helper-functions](https://codesandbox.io/s/2wr71v8zvj)

The implementation-details should not really mather. For example, I could imagine that the test implementation no longer works with asynchronous rendering. Maybe it also doesn't work with more complex component trees.
