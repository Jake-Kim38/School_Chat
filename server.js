var app = require("express")();
var url = require("url");
var LocalStorage = require("node-localstorage").LocalStorage;
var localStorage = new LocalStorage("./scratch");
const db = require('./DBFuncTest.js');
//루트에 대한 get 요청에 응답
app.get("/", function (req, res) {
  console.log("get:chatClient.html");
  //최초 루트 get 요청에 대해, 서버에 존재하는 chatClient.html 파일 전송
  res.sendFile("chatClient.html", { root: __dirname });
});

//기타 웹 리소스 요청에 응답
app.use(function (req, res) {
  var fileName = url.parse(req.url).pathname.replace("/", "");
  res.sendFile(fileName, { root: __dirname });
  console.log("use:", fileName);
});

var rooms = {};
var users = {};

//http 서버 생성
var server = require("http").createServer(app);
server.listen(3000);
console.log("listening at http://127.0.0.1:3000...");

//클로저를 사용해, private한 유니크 id를 만든다
var uniqueID = (function () {
  var id = localStorage.getItem("user") || 0;
  return function () {
    if (!localStorage.getItem("user")) {
      localStorage.setItem("user", ++id);
    }
    return id;
  };
})();

var uniqueRoomID = (function () {
  var id = localStorage.getItem("roomID") || 0;
  return function () {
    if (!localStorage.getItem("roomID")) {
      localStorage.setItem("roomID", ++id);
    }
    return id;
  };
})();

//서버 소켓 생성
var socket = require("socket.io")(server);
//소켓 Connection 이벤트 함수
socket.sockets.on("connection", function (socketClient) {
  //클라이언트 고유값 생성
  var clientID = uniqueID();
  console.log("Connection: " + clientID);

  //서버 receive 이벤트 함수(클라이언트에서 호출 할 이벤트)
  socketClient.on("serverReceiver", function (value, getuser) {
    console.log("3");
    //클라이언트 이베트 호출
    socket.sockets.emit("clientReceiver", {
      clientID: clientID,
      message: value,
      user: getuser
    });
  });

  socketClient.on('createRoom', function (roomName, user, password) {
    console.log("create")
    db.createRoom(user, password)
    var roomID = uniqueRoomID();
    console.log(roomID);
    var room = {
      id: roomID,
      name: roomName,
      participants: [clientID],
      type: 1
    };
    rooms[roomID] = room; // 방 객체 저장
    socketClient.join(roomID); // 클라이언트를 방에 추가
  });

  // 초대 요청 받기
  socketClient.on('inviteToRoom', function (roomId) {
    var room = rooms[roomId];
    if (room) {
      room.participants.push(clientID); // 클라이언트를 방에 추가
      socketClient.emit('roomJoined', room); // 클라이언트에게 방 참여 완료 메시지 전송
      socketClient.join(roomId);
    } else {
      socketClient.emit('roomJoinError', '방이 존재하지 않습니다.'); // 에러 메시지 전송
    }
  });

  // 클라이언트 로그인 이벤트 처리
  socketClient.on('login', function (userid, password) {
    //var userID = db.getUserId(userData.username); // 유저를 식별하기 위한 고유한 식별자 생성
    if(db.verifyUser(userid, password)){
      console.log('User logged in:', clientID, username);
    }
    // 유저 정보 저장
    users[clientID] = {
      userID: clientID,
      username: userid,
    };
    // 클라이언트에게 유저 식별자 전송
    socketClient.emit('loginSuccess');
  });

  socketClient.on('linkRoom', function (oRoomName, roomName, nRoomName) {
    var roomID = uniqueRoomID();
    console.log(roomID);
    var room = {
        id: roomID,
        name: nRoomName,
        participants: [clientID],
        type: 2
    };
    rooms[roomID] = room; // 방 객체 저장
    socketClient.join(roomID); // 클라이언트를 방에 추가

    // oRoomName과 roomName을 name으로 가지고 있는 room 객체들을 찾습니다.
    var targetRooms = Object.values(rooms).filter(function(room) {
        return room.name === oRoomName || room.name === roomName;
    });

    // 찾은 각 방의 참가자를 순회합니다.
    targetRooms.forEach(function(targetRoom) {
        targetRoom.participants.forEach(function(participantID) {
            // 여기서 각 participantID에게 socket.emit("joinRoom")을 보낼 수 있습니다.
            // 예를 들어:
            socketClient.to(participantID).emit("joinRoom", roomID);
        });
    });
});

socketClient.on('bigRoom', function (roomName) {
  var roomID = uniqueRoomID();
  console.log(roomID);
  var room = {
      id: roomID,
      name: roomName,
      participants: [clientID],
      type: 3
  };
  rooms[roomID] = room; // 방 객체 저장
  socketClient.join(roomID); // 클라이언트를 방에 추가
});

 // 클라이언트 로그인 이벤트 처리
 socketClient.on('wantRoom', function (roomID) {
  socketClient.join(roomID);
});

  // 클라이언트 로그인 이벤트 처리
socketClient.on('signup', function (name, password) {
  //var userID = db.getUserId(userData.username); // 유저를 식별하기 위한 고유한 식별자 생성
  var newname = name;
  var newpassword = password;
  db.signIn(name, password);
});

// 클라이언트 로그인 이벤트 처리
socketClient.on('getID', function (name, password) {
  //var userID = db.getUserId(userData.username); // 유저를 식별하기 위한 고유한 식별자 생성
  if(db.getID(name, password)){
    socketClient.emit('signupSuccess');
  }
});
});



 // 방에서 탈퇴하기
 socket.on('leaveRoom', function (roomId) {
  var room = rooms[roomId];
  if (room) {
    var index = room.participants.indexOf(clientID);
    if (index !== -1) {
      room.participants.splice(index, 1); // 클라이언트를 방에서 제거
      socket.leave(roomId); // 클라이언트를 방에서 나가기
      socket.emit('roomLeft', roomId); // 클라이언트에게 방 탈퇴 완료 메시지 전송
    }
  } else {
    socket.emit('roomLeaveError', '방이 존재하지 않습니다.'); // 에러 메시지 전송
  }

  // 방 삭제 이벤트 처리
socket.on('deleteRoom', function(roomId) {
  deleteRoom(roomId);
});

// 방 삭제 함수
function deleteRoom(roomId) {
  if (rooms.hasOwnProperty(roomId)) {
    delete rooms[roomId]; // 방 객체 삭제
    socket.sockets.in(roomId).emit('roomDeleted'); // 해당 방에 있는 클라이언트들에게 방 삭제 메시지 전송
  }
}
});
