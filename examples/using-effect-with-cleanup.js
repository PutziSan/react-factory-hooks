import React from "react";
import ReactDOM from "react-dom";
import { factory, useState, useEffect, SKIP_EFFECT } from "index";

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

  let prevId;

  useEffect(
    props => {
      ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
      return () => {
        ChatAPI.unsubscribeFriendStatus(props.friend.id, handleStatusChange);
      };
    },
    props => {
      // Only re-subscribe if props.friend.id changes
      if (prevId === props.friend.id) {
        return SKIP_EFFECT;
      }

      prevId = props.friend.id;
    }
  );

  return () => {
    if (getIsOnline() === null) {
      return "Loading...";
    }

    return getIsOnline() ? "Online" : "Offline";
  };
});

const App = factory(() => {
  const [getFriendId, setFreindId] = useState("1");

  return () => (
    <div>
      <input
        value={getFriendId()}
        onChange={e => setFreindId(e.target.value)}
      />
      <div>
        {getFriendId()}: <SubscribeWithEffect friend={{ id: getFriendId() }} />
      </div>
    </div>
  );
});

ReactDOM.render(<App />, document.getElementById("root"));
