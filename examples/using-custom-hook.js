import React from "react";
import ReactDOM from "react-dom";
import { factory, useEffect, useState } from "react-factory-hooks";

const ChatAPI = {
  subscribeToFriendStatus: (friendId, onStatusChange) => {
    setTimeout(() => onStatusChange({ isOnline: Math.random() <= 0.5 }), 1000);
  },
  unsubscribeFriendStatus: (friendId, onStatusChange) => {
    setTimeout(() => onStatusChange(null), 500);
  }
};

function useFriendStatus() {
  const [getIsOnline, setIsOnline] = useState(null);

  function handleStatusChange(status) {
    setIsOnline(status ? status.isOnline : null);
  }

  const friendEffect = useEffect(
    friendId => {
      ChatAPI.subscribeToFriendStatus(friendId, handleStatusChange);
      return () => {
        ChatAPI.unsubscribeFriendStatus(friendId, handleStatusChange);
      };
    },
    friendId => [friendId]
  );

  return friendId => {
    friendEffect(friendId);
    return getIsOnline();
  };
}

const FriendStatus = factory(() => {
  const getIsFriendOnline = useFriendStatus();

  return props => {
    const isOnline = getIsFriendOnline(props.friend.id);

    if (isOnline === null) {
      return "loading...";
    }
    return isOnline ? "Online" : "Offline";
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
        {getFriendId()}: <FriendStatus friend={{ id: getFriendId() }} />
      </div>
    </div>
  );
});

ReactDOM.render(<App />, document.getElementById("root"));
