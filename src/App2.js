import React from "react";
import MessageList from "./MessageList2";
import SendMessageForm from "./SendMessageForm2";
import RoomList from "./RoomList2";
import NewRoomForm from "./NewRoomForm2";
import axios from "axios";
import LoginForm from "./LoginForm";


class App extends React.Component {
  constructor() {
    super();
    this.state = {
      roomId: null,
      messages: [],
      joinableRooms: [],
      joinedRooms: [],
      isLoggedIn: false
    };

    this.currentToken = null;

    this.sendMessage = this.sendMessage.bind(this);
    this.subscribeToRoom = this.subscribeToRoom.bind(this);
    this.getRooms = this.getRooms.bind(this);
    this.createRoom = this.createRoom.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.displayMessages = this.displayMessages.bind(this);
    this.onRoomCreation = this.onRoomCreation.bind(this);
    this.onFetchRooms = this.onFetchRooms.bind(this);
    this.onMessageSent = this.onMessageSent.bind(this);
    this.login = this.login.bind(this);
  }

  onLogin(response) {
    this.currentToken = response.data.access_token;
    this.setState({ isLoggedIn: true });
    this.getRooms();
  }

  componentDidMount() {
   
  }

  onFetchRooms(response) {
   
    var t = response.data.rooms.map(r => {
      var name = r.messages.chunk
        .filter(c => c.type === "m.room.aliases")
        .map(
          c => c.content.aliases.map(a => a.split(":")[0].split("#")[1])[0] 
        )[0]; 
      var result = {
        id: r.room_id,
        name: name
      };
      return result;
    });

   
    this.setState({
      joinableRooms: t,
      joinedRooms: []
    });
  }

  getRooms() {
   

    axios
      .get(
        "http://localhost:8008/_matrix/client/api/v1/initialSync?access_token=" +
          this.currentToken
      )
      .then(this.onFetchRooms)
      .catch(function(error) {
        console.log("error on joinableRooms: ", error);
      });

   
  }

  displayMessages(roomId, response) {
  

    var t = response.data.chunk
      .filter(c => c.type === "m.room.message")
      .map(c => {
        return {
          key: c.event_id,
          senderId: c.sender.split(":")[0].split("@")[1],
          text: c.content.body
        };
      });

  

    this.setState({
      messages: t
    });
  }

  subscribeToRoom(roomId) {
   

    this.setState({
      roomId: roomId
    });
    this.getRooms();

    this.setState({ messages: [] });
    axios
      .get(
        "http://localhost:8008/_matrix/client/r0/rooms/" +
          encodeURIComponent(roomId) +
          "/messages?access_token=" +
          this.currentToken +
          "&from=END&dir=b"
      )
      .then(this.displayMessages.bind(null, roomId))
      .catch(function(error) {
        console.log("error with sendMessage: ", error);
      });

  
  }

  onMessageSent(response) {
    
    this.subscribeToRoom(this.state.roomId);
  }

  sendMessage(text) {
    axios
      .post(
        "http://localhost:8008/_matrix/client/r0/rooms/" +
          encodeURIComponent(this.state.roomId) +
          "/send/m.room.message?access_token=" +
          this.currentToken,
        {
          msgtype: "m.text",
          body: text
        }
      )
      .then(this.onMessageSent)
      .catch(function(error) {
        console.log("error with sendMessage: ", error);
      });

   
  }

  login(email, password) {
    axios
      .post("http://localhost:8008/_matrix/client/r0/login", {
        user: email,
        password: password,
        type: "m.login.password"
      })
      .then(this.onLogin)
      .catch(function(error) {
        this.props.handler(false, "");
        console.log(error);
      });
  }

  onRoomCreation(response) {
    var roomId = response.data.room_id;
    this.subscribeToRoom(roomId);
  }

  createRoom(name) {
    axios
      .post(
        "http://localhost:8008/_matrix/client/r0/createRoom?access_token=" +
          this.currentToken,
        {
          room_alias_name: name
        }
      )
      .then(this.onRoomCreation)
      .catch(function(error) {
        console.log("error with createRoom: ", error);
      });

   
  }

  render() {
    return (
      <div className="app">
        {this.state.isLoggedIn ? (
          <RoomList
            subscribeToRoom={this.subscribeToRoom}
            rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]}
            roomId={this.state.roomId}
          />
        ) : (
          ""
        )}
        {this.state.isLoggedIn ? (
          <MessageList
            roomId={this.state.roomId}
            messages={this.state.messages}
          />
        ) : (
          ""
        )}
        {this.state.isLoggedIn ? (
          <SendMessageForm
            disabled={!this.state.roomId}
            sendMessage={this.sendMessage}
          />
        ) : (
          ""
        )}

        {!this.state.isLoggedIn ? <LoginForm login={this.login} /> : ""}
        {this.state.isLoggedIn ? (
          <NewRoomForm createRoom={this.createRoom} />
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default App;
