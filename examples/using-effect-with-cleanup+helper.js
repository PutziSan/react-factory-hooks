import React from "react";
import ReactDOM from "react-dom";
import { factory, useState, useEffect, SKIP_EFFECT } from "react-factory-hooks";
import { itemsDidNotChanged, when } from "./should-effect-fire-helper";

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

  useEffect(props => {
    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFriendStatus(props.friend.id, handleStatusChange);
    };
  }, when(itemsDidNotChanged(props => [props.friend.id]), () => SKIP_EFFECT));

  return () => {
    if (getIsOnline() === null) {
      return "Loading...";
    }

    return getIsOnline() ? "Online" : "Offline";
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
