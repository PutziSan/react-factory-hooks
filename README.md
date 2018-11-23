# react-hooks with the factory-pattern

This is a counter-proposal to the [current hooks proposal](https://reactjs.org/docs/hooks-intro.html) of the React team.
The reasons and other questions are answered in the [FAQ](#faq) below (especially [Why the factory-pattern if the current react-proposal is so popular?](#why-the-factory-pattern-if-the-current-react-proposal-is-so-popular)).

You can also find a [list of live-demos](#live-examplesworking-demos) in the FAQs below.

## basic usage

A normal "stateful" functional Component looks like this:

```jsx
function Counter() {
  const [getCount, setCount] = useState();

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

## table of contents

- [basic usage](#basic-usage)
- [table of contents](#table-of-contents)
- [Component-Lifecycle for a factory-component](#component-lifecycle-for-a-factory-component)
- [basic hooks API reference](#basic-hooks-api-reference)
  - [factory function](#factory-function)
  - [`useState`](#usestate)
  - [`useEffect`](#useeffect)
  - [`useContext`](#usecontext)
  - [additional hooks](#additional-hooks)
    - [`useReducer`](#usereducer)
    - [`useCallback`](#usecallback)
    - [`useMemo`](#usememo)
    - [`useRef`](#useref)
    - [`useImperativeMethods`](#useimperativemethods)
    - [`useMutationEffect` and `useLayoutEffect`](#usemutationeffect-and-uselayouteffect)
- [how does `useEffect` works](#how-does-useeffect-works)
  - [when will `useEffect` be executed?](#when-will-useeffect-be-executed)
  - [skipping effects](#skipping-effects)
  - [possibilities to customize `useEffect`, example: `useMemoizedEffect`](#possibilities-to-customize-useeffect-example-usememoizedeffect)
- [advanced usage (custom hooks)](#advanced-usage-custom-hooks)
  - [custom hook example](#custom-hook-example)
- [FAQ](#faq)
  - [Why the factory-pattern if the current react-proposal is so popular?](#why-the-factory-pattern-if-the-current-react-proposal-is-so-popular)
  - [live-examples/working demos?](#live-examplesworking-demos)
  - [what is a factory function and a render function](#what-is-a-factory-function-and-a-render-function)
  - [TypeScript-typings?](#typescript-typings)
  - [Why the getter functions overall? #toomuchnoise](#why-the-getter-functions-overall-%23toomuchnoise)
  - [Adding a simple effect without an additional local state to my functional component is too complicated, how can i avoid it?](#adding-a-simple-effect-without-an-additional-local-state-to-my-functional-component-is-too-complicated-how-can-i-avoid-it)
- [history](#history)
  - [first draft - `props` overall](#first-draft---props-overall)
  - [second draft - `getProps` in the wrapping function](#second-draft---getprops-in-the-wrapping-function)

## Component-Lifecycle for a factory-component

The Component-Lifecycle with a factory-function changes a little bit. Before rendering a component for the first time, the factory function is executed once (similar to the constructor in a class component), which returns the render function. For subsequent rendering, only the render function is executed again.

> This has the advantage that the use\* functions do not have to be executed again and again with each rendering.

Let's imagine we have this factory-component:

```jsx
function SimpleCounter() {
  const [getCount, setCount] = useState();

  return props => (
    <button onClick={() => setCount(getCount() + 1)}>{getCount()}</button>
  );
}
```

When using this component (e.g. `ReactDOM.render(<SimpleCounter />, root);`), `const [getCount, setCount] = useState();` is executed only one single time. If you click on the rendered button, only the render function is called again and the button is re-rendered.

## basic hooks API reference

The API for basic use is described below. The presented functions are based on the documentation of the official React page ([Hooks API Reference](https://reactjs.org/docs/hooks-reference.html)) and additionally the signature for the factory function..

> "basic use" refers to common use in developing React components. This covers adding a local state to a functional component. To create hooks that can be reused and e.g. use "effects", see [advanced usage (custom hooks)](#advanced-usage-custom-hooks) below.

### factory function

```jsx
function Factory(initialProps) {
  // the use*-functions can only be used here

  // must return a normal react-function-component
  // the component can use the local states and variables defined in the factory
  return props => <div />;
}
```

See [Component-Lifecycle for a factory-component](#component-lifecycle-for-a-factory-component) for information how the factory-function works.

With the `initialProps` parameter, a local state can be initialized with a certain value:

```jsx
function Example(initialProps) {
  // getCount will have initialProps.startCount as default-value
  const [getCount, setCount] = useState(initialProps.startCount);

  return props => (
    <div>{getCount()} (will be startCount, until you call `setCount`)</div>
  );
}
```

Be careful, `initialProps` will not change! It will always point to the the props-object with which it was called the first time it was rendered.

### `useState`

```jsx
const [getState, setState] = useState(initialState);
```

differences to current react-proposal:

- returns a getter- and a setter-function for the local state. The getter-function always returns the current state-value

> Since the factory function is not repeated every time, the first element of the returned array must be a getter function so that the render function can still access the current state.

The rest is congruent with the current proposal, see [React-Docs - `useState`-API](https://reactjs.org/docs/hooks-reference.html#usestate).

### `useEffect`

```jsx
const effect = useEffect(
  (...params) => {
    /* your effect-function */

    // the effect-function can optionally return a cleanup-handler
    return () => {
      /* ... cleanup */
    };
  },
  /* optional: */ (...params) => [
    /* ... conditionally firing an effect */
  ]
);
```

`useEffect` returns an executable function (the "effect") during the factory-phase. You can then use your created effect in your render-function:

```jsx
function ExampleEffect() {
  const docTitleEffect = useEffect(name => {
    document.title = `Hi ${name}!`;
  });

  return props => {
    docTitleEffect(props.name);

    return <div>...</div>;
  };
}
```

Whenever the effect is called in a render cycle, the effect function is executed with the parameters passed to the effect (but only after rendering is finished). If the component is unmounted, the last cleanup handler (if specified) is executed.

differences to current react-proposal:


- `useEffect` returns a function (the "effect")
- an effect (the returned function of an `useEffect`-call) will not execute itself, but must always be called during a render cycle
- `useEffect` has no possibility to access the current `props` (see [factory function](#factory-function) above)
  - this is per design, because custom hooks have to be independent from the components
  - To use variables from `props`, you must pass them to the effect as parameters
- the effect-function can have parameters
- the second parameter must be a function which returns the array

### `useContext`

```jsx
const getContext = useContext(Context);
```

Like the current [`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext), except it returns a getter-function. See [`useState`](#usestate) above why we need the getter-function.

### additional hooks

Presented functions analogous to the [react-docs - additional hooks](https://reactjs.org/docs/hooks-reference.html#additional-hooks).

#### `useReducer`

```jsx
const [getState, dispatch] = useReducer(reducer, initialState);
```

Like the current [`useReducer`](https://reactjs.org/docs/hooks-reference.html#usereducer), except the first element of the returned array is a getter-function. See [`useState`](#usestate) above why we need the getter-function.

> In my opinion, I wouldn't add this to the core as it can be built with `setState` and could encourage people to recommend that state-handling with a reducer (and inevitably associated redux) is recommended by the React team. But, as I said, that's just IMO.

#### `useCallback`

**removed** - this can be easily done with pure JS with this proposal. basic example:

```jsx
function Example() {
  const handleClick = e => {
    console.log("clicked");
  };

  return props => <button onClick={handleClick}>click me</button>;
}
```

For an advanced example, where the callback changes when on of its input changes, we can use a memoization-library like [memoize-one](https://github.com/alexreardon/memoize-one):

```jsx
import memoizeOne from "memoize-one";

function Example() {
  const handleClick = memoizeOne((a, b) => e => {
    console.log(`clicked with ${a} and ${b}`);
  });

  return props => (
    <button onClick={handleClick(props.a, props.b)}>click me</button>
  );
}
```

(Note that the React team has so far [recommended this procedure with a memoization-library](https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization), so that is nothing new in the react-eco-system.)

#### `useMemo`

**removed** - this can be done with a normal memoization-library like [memoize-one](https://github.com/alexreardon/memoize-one):

```jsx
import memoizeOne from "memoize-one";

function Example() {
  const expensiveComputation = memoizeOne((a, b) => {
    // ... your memory-intensive-function
    return "your-computed-value";
  });

  return props => <p>{expensiveComputation(props.a, props.b)}</p>;
}
```

#### `useRef`

**removed** - this can be done with the normal [`React.createRef`](https://reactjs.org/docs/react-api.html#reactcreateref) or a normal js-variable (`let`):

```jsx
function Example() {
  // to get the ref of of the dom-element, use `React.createRef()`:
  const inputEl = React.createRef();
  // to get a mutable variable use `let`:
  let name;

  return props => {
    name = props.name;
    return <input ref={inputEl} type="text" />;
  };
}
```

#### `useImperativeMethods`

// TODO

> To be honest, I don't fully understand the meaning of this hook and I have no idea how it works internally. Maybe it can also be replaced with a normal JS construct. To be honest, I don't fully understand the meaning of this hook and I have no idea how it works internally. Maybe it can also be replaced with a normal JS construct. Otherwise it could be taken over exactly as currently described in the documentation.

#### `useMutationEffect` and `useLayoutEffect`

> Prefer the standard [`useEffect`](#useeffect) when possible to avoid blocking visual updates.

The signature is identical to [`useEffect`](#useeffect). Otherwise, the behavior is similar to that [described in the React documentation](https://reactjs.org/docs/hooks-reference.html#usemutationeffect).

## how does `useEffect` works

The basic principle of `useEffect` can be described by the following function:

```javascript
function useEffect(effect) {
  let cleanup;

  return (...params) => {
    if (cleanup) {
      cleanup();
    }
    cleanup = effect(...params);
  };
}
```

### when will `useEffect` be executed?

If we look at our previous example:

```jsx
function App() {
  const docTitleEffect = useEffect(name => {
    document.title = `Hi ${name}!`;
  });

  return props => {
    docTitleEffect(props.name);

    return <div>your component</div>;
  };
}
```

When the function is called, the effect function is not executed immediately, but pushed to a kind of `ToDo` stack. When the function is finished rendering (like `componentDidMount` or `componentDidUpdate` for classes), the ToDo stack is processed and all effects called during the render function are executed.

### skipping effects

Let's have a look at this component:

```jsx
function FriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  const friendEffect = useEffect(friendId => {
    ChatAPI.subscribeToFriendStatus(friendId, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendId, handleStatusChange);
    };
  });

  return props => {
    friendEffect(props.friend.id);

    if (getIsOnline() === null) {
      return "loading...";
    }
    return getIsOnline() ? "Online" : "Offline";
  };
}
```

The created `friendEffect` is called on every render-cycle and so we could subscribe and unsubscribe to the same friend again and again. But there are two possibilities to skip effects:

by the 2nd parameter of `useEffect`:

```jsx
function FriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  const friendEffect = useEffect(
    friendId => {
      /* ... (same effect-function as above)*/
    },
    // this is a function which gets the same parameters like your effect-function and which must return an array
    // your effect-function will now only called when one of the array-items will change
    friendId => [friendId]
  );

  return props => {
    friendEffect(props.friend.id);

    // return your ui
  };
}
```

Or you can perform the effect conditionally in the render function:

```jsx
function FriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  const friendEffect = useEffect(friendId => {
    /* ... (same effect-function as above)*/
  });

  return props => {
    if (props.subscribeToFriendStatus) {
      friendEffect(props.friend.id);
    }

    // return your ui
  };
}
```

### possibilities to customize `useEffect`, example: `useMemoizedEffect`

This form makes it easy to create customized versions of `useEffect`. For example, a version could be `useMemoizedEffect`, which could implement the skipping-effect example from above accordingly:

```javascript
function useFriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  // the following is equal to useEffect(friendId => { ... }, (friendId) => [friendId]);
  const friendEffect = useMemoizedEffect(friendId => {
    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
  });

  return friendId => {
    friendEffect(friendId); // friendEffect will now only fire if friendId changed
    return getIsOnline();
  };
}
```

Where the implementation of `useMemoizedEffect` might look like this:

```javascript
function useMemoizedEffect(effectFn) {
  const effect = useEffect(effectFn);

  let lastParams;
  return (...params) => {
    // arrayElementsEqu-implentation omitted
    // (it checks whether the elements in both arrays are the same for each index (using `===`))
    if (arrayElementsEqu(params, lastParams)) {
      return;
    }

    lastParams = params;

    return effect(...params);
  };
}
```

## advanced usage (custom hooks)

One of the biggest strengths of hooks is that you can easily build your own hooks to build logic independent of components (see react-documentation: ["Building Your Own Hooks"](https://reactjs.org/docs/hooks-custom.html)).

This proposal also makes this possible. An example of this can be seen below.

### custom hook example

The selected example corresponds to the one in the [React documentation](https://reactjs.org/docs/hooks-custom.html#extracting-a-custom-hook).

```javascript
function useFriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  const friendEffect = useEffect(friendId => {
    ChatAPI.subscribeToFriendStatus(friendId, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendId, handleStatusChange);
    };
  });

  return friendId => {
    friendEffect(friendId);
    return getIsOnline();
  };
}
```

and the usage of this custom hook:

```jsx
function FriendStatus() {
  const getIsFriendOnline = useFriendStatus();

  return props => {
    const isOnline = getIsFriendOnline(props.friend.id);

    if (isOnline === null) {
      return "loading...";
    }
    return isOnline ? "Online" : "Offline";
  };
}
```

## FAQ

Answers to a few questions that I can imagine will come up more often.

### Why the factory-pattern if the current react-proposal is so popular?

The current proposal from the React team has not only been received positively and cheeringly. The [famous rfc-github-issue#68](https://github.com/reactjs/rfcs/pull/68) has over 1000 comments with questions, counterproposals and uncertainties.

The idea is really good, but the implementation within the render function unsettles many. The "magic" of the functions is cited as a negative point, since they can tell by themselves whether they need to reinitialize a state, or whether this component has already been initialized and thus return the state of the component. Furthermore, the ["rules of hooks"](https://reactjs.org/docs/hooks-rules.html) are strongly criticized because they are not intuitive and can only be forced with a linter.

I believe that although the idea is very popular, the current implementation proposal is not optimal and I have therefore drafted this counter-proposal.

The "magic" can be better explained by this suggestion (see [Component-Lifecycle for a factory-component](#component-lifecycle-for-a-factory-component) above) and the "rules of hooks" apply to this proposal as well, but they are now intuitively forced by the language of JavaScript (by variable scopes) and work as expected.

And finally, my suggestion can make the API leaner, since many current use\* functions can be mapped by normal JavaScript features and so no new API has to be learned (see [additional hooks](#additional-hooks) above).

### live-examples/working demos?

I published a basic implementation under this package (`yarn add react-factory-hooks`), where I implemented `useEffect` and `useState` via a `factory`-HOC.

Here are some live-demos via codesandbox, using this package:

- [Basic example (Counter)](https://codesandbox.io/s/oqnv17m86)
- [Counter example with an effect](https://codesandbox.io/s/wk6qq77wkw)
- [example of an effect/state via a factory and a `UseEffect`-component](https://codesandbox.io/s/kmvqp258nr)
- [custom hook example](https://codesandbox.io/s/2wr71v8zvj)

### what is a factory function and a render function

The "factory pattern" works with an outer function, which is executed once for "initialization" before the first render, and an inner function, which reflects the visual react component.
In the following I will work with the terms "factory function" (outer wrapping function) and "render function" (inner function that provides the React component).

In the first example above is the factory-function:

```
function Counter() {
  const [getCount, setCount] = useState();

  return ... // returns the-render-function
}
```

In the first example above is the render function:

```jsx
return props => <div>...</div>;
```

### TypeScript-typings?

I added a `index.d.ts`-type-file in this repo. Especially type-hints for effects works quite good:

```typescript
function useFriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);
  const handleStatusChange = status => setIsOnline(status.isOnline);

  const friendEffect = useEffect((friendId: string) => {
    // ChatAPI.subscribeToFriendStatus(friendId, handleStatusChange);
    return () => {
      // ChatAPI.unsubscribeFromFriendStatus(friendId, handleStatusChange);
    };
  });

  return (friendId: number) => {
    friendEffect(friendId); // TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
    // ...
  };
}
```

### Why the getter functions overall? #toomuchnoise

See [`useState`](#usestate) to understand why they need to be getter functions.

About the noise: it's true, through the getter functions there are 2 (brackets for function call) + 3 (if you put a `get` before the variable name) = 5 characters more. However, I believe that this is reasonable, as opposed to the [advantages that are gained](#why-the-factory-pattern-if-the-current-react-proposal-is-so-popular). Especially if you use TypeScript, you can avoid the `get` at the front, because the typing makes it clear that it is a function.

### Adding a simple effect without an additional local state to my functional component is too complicated, how can i avoid it?

You can create a normal react-component for this use-case. A basic implementation could look like this:

```jsx
class UseEffect extends React.Component {
  componentDidMount() {
    this.cleanup = this.props.effect();
  }
  componentDidUpdate() {
    if (this.cleanup) {
      this.cleanup();
    }
    this.cleanup = this.props.effect();
  }
  componentWillUnmount() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
  render() {
    return null;
  }
}
```

and the usage:

```jsx
function App(props) {
  return (
    <>
      <UseEffect
        effect={() => {
          document.title = `Hi ${props.name}!`;
          return () => {
            console.log("cleanup");
          };
        }}
      />
      <div>your component</div>
    </>
  );
}
```

This form gives you a great flexibility in the implementation of `UseEffect`, e.g.:

```jsx
// the effect as children:
<UseEffect>
  {() => { /* ... */ }}
</UseEffect>
// current behavior of reacts `useEffect`:
<UseEffect
  whenItemsDidChange={[props.name]}
  effect={() => { /* ... */ }}
/>
```

## history

This is the 3rd draft of the proposal to implement hooks using a factory pattern. I will briefly discuss the previous drafts and describe the insights.

### first draft - `props` overall

```jsx
function FactoryExample(initialProps) {
  const [getCount, setCount] = useState(initialProps.startCount);

  useEffect(props => {
    document.title = `Hi ${props.name}! You clicked ${getCount()} times`;
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

[see this version of the proposal here (tag v0.1.0)](https://github.com/PutziSan/react-factory-hooks/tree/v0.1.0)

This is theoretically a very clean idea, but it makes a lot of noise, because `props` has to appear as a parameter in every effect (which is not nice, but would be acceptable for a clearer API). However, the bigger drawback is that effects are no longer independent of the components and can quickly be misused, resulting in worse code. Thx @mcjazzyfunky and @FredyC for pointing this out [in the issue](https://github.com/PutziSan/react-factory-hooks/issues/1#issuecomment-439683032).

### second draft - `getProps` in the wrapping function

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

[see this version of the proposal here (tag v0.2.0)](https://github.com/PutziSan/react-factory-hooks/tree/v0.2.0)

This idea originally came from @zouloux for preact, which he also published under [solid-js/prehook-proof-of-concept](https://github.com/solid-js/prehook-proof-of-concept). Since it solved the problem of the first draft, I built it into my second draft with a small adjustment (`props` should be included in the render function as a parameter).

One disadvantage was that it just didn't feel good to have `props` and `getProps` duplicated and also the access in effects via `getProps` wasn't very intuitive. A much bigger disadvantage was described by @FredyC in the [Comments on @zouloux suggestion](https://github.com/solid-js/prehook-proof-of-concept/issues/1#issuecomment-440332118):

> I think you are both forgetting one important detail ... default props and I don't mean that hack-ish static defaultProps property, but real default values you can define when destructuring props in a component scope. It means much better colocation and it's clear what default value is for a particular prop.
