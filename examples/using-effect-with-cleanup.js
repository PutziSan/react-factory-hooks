import React from "react";
import ReactDOM from "react-dom";
import { factory, useState, useEffect, SKIP_EFFECT } from "react-factory-hooks";
import { UseEffect } from "./example-helper";

const ChatAPI = {
  subscribeToFriendStatus: (friendId, onStatusChange) => {
    setTimeout(() => onStatusChange({ isOnline: Math.random() <= 0.5 }), 1000);
  },
  unsubscribeFriendStatus: (friendId, onStatusChange) => {
    setTimeout(() => onStatusChange(null), 500);
  }
};

const SubscribeWithEffect = factory(() => {
  const [getIsOnline, setIsOnline] = useState(null);

  function handleStatusChange(status) {
    setIsOnline(status ? status.isOnline : null);
  }

  return props => {
    const id = props.friend.id;

    return (
      <>
        <UseEffect
          whenItemsDidChange={[id]}
          effect={() => {
            ChatAPI.subscribeToFriendStatus(id, handleStatusChange);

            return () => {
              ChatAPI.unsubscribeFriendStatus(id, handleStatusChange);
            };
          }}
        />

        {getIsOnline() === null && "Loading..."}

        {getIsOnline() !== null && getIsOnline() && "Online"}
        {getIsOnline() !== null && !getIsOnline() && "Offline"}
      </>
    );
  };
});

const App = factory(() => {
  const [getFriendId, setFriendId] = useState("1");

  return () => (
    <div>
      <input
        value={getFriendId()}
        onChange={e => setFriendId(e.target.value)}
      />
      <div>
        {getFriendId()}: <SubscribeWithEffect friend={{ id: getFriendId() }} />
      </div>
    </div>
  );
});

ReactDOM.render(<App />, document.getElementById("root"));
