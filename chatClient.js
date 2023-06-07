//const db = require('./DB.js');
//루트에 대한 get 요청에 응답
//클라이언트 소켓 생성
var socket = io.connect("ws://127.0.0.1:3000");
//DOM 참조



//텍스트 박스에 포커스 주기
//공유 버튼 로직
sharePage = () => {
  const shareObject = {
    title: "채팅방 초대",
    text: `${window.location.href}`,
    url: window.location.href,
  };

  if (navigator.share) {
    navigator
      .share(shareObject)
      .then(() => {
        alert("공유하기 성공");
      })
      .catch((error) => {
        alert("에러가 발생했습니다.");
      });
  } else {
    alert("페이지 공유를 지원하지 않습니다.");
  }
};

window.onload = function () {

  //채팅에 현재 날짜 출력
  function getToday() {
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);

    return ` ${year}/${month}/${day}, ${hours}:${minutes}`;
  }

  //방 버튼 추가 로직
  var roomForm = document.querySelector("#roomInsertForm");
  var roomOptions = document.querySelector("#roomOptions");
  var loginBtn = document.querySelector("#loginBtn");
  var linkForm = document.querySelector("#roomLinkForm");
  var loginStatus = localStorage.getItem("login");
  var curUser = localStorage.getItem("name");
  var curPassword = localStorage.getItem("password");
  var loginStatus = localStorage.getItem("login");
  var loginProfileBtn = document.querySelector("#loginProfileBtn"); // 로그인 폼으로 이동하는 버튼 선택
  var div = document.getElementById("message");
  var txt = document.getElementById("txtChat");
  const bigroomArray = [];
  const linkedroomArray = [];
  const roomArray = [];

  if (loginStatus == 1) {
    // 로그인이 되어 있다면, 로그인 폼으로 이동하는 버튼 비활성화
    loginProfileBtn.style.pointerEvents = "none";
    loginProfileBtn.style.opacity = "0.5"; // 선택적: 버튼이 비활성화된 것처럼 보이게 하려면
  }

  
  if (localStorage.getItem("roomId")) {
    JSON.parse(localStorage.getItem("roomId")).forEach((item) => {
      var myButton = document.createElement("div");
      var myLink = document.createElement("a");

      myLink.href = `http://127.0.0.1:3000/?room_name=${item}`;
      myLink.innerText = item;
      myLink.style.textDecoration = "none";
      myLink.style.color = "white";
      myLink.style.fontWeight = "bold";
      myButton.style.width = "70%";
      myButton.style.height = "10%";
      myButton.style.margin = "15px";
      myButton.style.borderRadius = "10%";
      myButton.style.display = "flex";
      myButton.style.justifyContent = "center";
      myButton.style.alignItems = "center";
      myButton.appendChild(myLink);
      myButton.style.background = "black";
      roomOptions.appendChild(myButton);
      roomArray.push(item);
      localStorage.setItem("roomId", JSON.stringify(roomArray));
    });
  }

  document
    .querySelector("#copyLinkButton")
    .addEventListener("click", function () {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert("링크가 복사되었습니다.");
        })
        .catch((err) => {
          console.error("링크 복사 실패:", err);
        });
    });

    document
    .querySelector("#comeButton")
    .addEventListener("click", function () {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          alert("링크가 복사되었습니다.");
        })
        .catch((err) => {
          console.error("링크 복사 실패:", err);
        });
    });

    document
    .querySelector("#signup-saveProfile")
    .addEventListener("click", function () {
      console.log("1");
      var newuser = document.querySelector("#signup-nameInput").value;
      var newpassword = document.querySelector("#signup-passwordInput").value;
      
      if(socket.emit("signup", newuser, newpassword)){
        login(newuser, newpassword);
      }
      else{alert("회원가입 실패");}
      toggleModal("signupModal");
    });

    document.querySelector("#quitButton")
    .addEventListener("click", function () {
      // Get roomName from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const roomName = urlParams.get('room_name');
  
      // Get arrays from localStorage and parse them
      let bigroomArray = JSON.parse(localStorage.getItem('bigroomId')) || [];
      let linkedroomArray = JSON.parse(localStorage.getItem('linkedroomId')) || [];
      let roomArray = JSON.parse(localStorage.getItem('roomId')) || [];
  
      // Delete roomName from the arrays if it exists
      [bigroomArray, linkedroomArray, roomArray].forEach(array => {
        const index = array.indexOf(roomName);
        if (index > -1) {
          array.splice(index, 1);
        }
      });

       // Save the updated arrays back to localStorage
       localStorage.setItem('bigroomId', JSON.stringify(bigroomArray));
       localStorage.setItem('linkedroomId', JSON.stringify(linkedroomArray));
       localStorage.setItem('roomId', JSON.stringify(roomArray));
   
       // Navigate back to the home page
       window.location.href = 'http://127.0.0.1:3000/';
     });

  document.querySelector("#logout")
    .addEventListener("click", function () {
    console.log("1");
    // Clear LocalStorage
    localStorage.removeItem('roomId');
    localStorage.removeItem('bigroomId');
    localStorage.removeItem('linkedroomId');
    localStorage.removeItem('userId');
    localStorage.removeItem('password');

    // Set loginStatus to 0
    localStorage.setItem('login', 0);
    toggleModal('changeProfileModal');
    // Navigate back to the home page
    window.location.href = 'http://127.0.0.1:3000/';
});



  
     
  var linkedroomArea = document.querySelector("#linkedRooms");
  if (localStorage.getItem("linkedroomId")) {
    JSON.parse(localStorage.getItem("linkedroomId")).forEach((item) => {
      var linkedroomButton = document.createElement("div");
      var linkedroomLink = document.createElement("a");
      linkedroomLink.href = `http://127.0.0.1:3000/?room_name=${item}`;
      linkedroomLink.innerText = item;
      linkedroomLink.style.textDecoration = "none";
      linkedroomLink.style.color = "white";
      linkedroomLink.style.fontWeight = "bold";
      linkedroomButton.style.width = "70%";
      linkedroomButton.style.height = "10%";
      linkedroomButton.style.margin = "15px";
      linkedroomButton.style.borderRadius = "10%";
      linkedroomButton.style.display = "flex";
      linkedroomButton.style.justifyContent = "center";
      linkedroomButton.style.alignItems = "center";
      linkedroomButton.appendChild(linkedroomLink);
      linkedroomButton.style.background = "black";
      linkedroomArea.appendChild(linkedroomButton);
      linkedroomArray.push(item);
    });
  }

  
  var bigroomArea = document.querySelector("#bigRooms");
  if (localStorage.getItem("bigroomId")) {
    JSON.parse(localStorage.getItem("bigroomId")).forEach((item) => {
      var bigroomButton = document.createElement("div");
      var bigroomLink = document.createElement("a");
      bigroomLink.href = `http://127.0.0.1:3000/?room_name=${item}`;
      bigroomLink.innerText = item;
      bigroomLink.style.textDecoration = "none";
      bigroomLink.style.color = "white";
      bigroomLink.style.fontWeight = "bold";
      bigroomButton.style.width = "70%";
      bigroomButton.style.height = "10%";
      bigroomButton.style.margin = "15px";
      bigroomButton.style.borderRadius = "10%";
      bigroomButton.style.display = "flex";
      bigroomButton.style.justifyContent = "center";
      bigroomButton.style.alignItems = "center";
      bigroomButton.appendChild(bigroomLink);
      bigroomButton.style.background = "black";
      bigroomArea.appendChild(bigroomButton);
      bigroomArray.push(item);
    });
  }

  linkForm.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("hi");

    var newRoomName = document.querySelector("#newLinkRoomName").value;

    var urlParams = new URLSearchParams(window.location.search);
    var ownerRoomName = urlParams.get("room_name");
    ownerRoomName = decodeURIComponent(ownerRoomName);

    var copiedUrl = document.querySelector("#roomLink").value; // 복사된 링크
    var urlParams = new URLSearchParams(copiedUrl);
    // URLSearchParams 객체를 이용해 쿼리 문자열에서 특정 값을 얻음

    var roomName = urlParams.get("room_name"); // "%E3%85%82%E3%85%82%E3%85%82"
    // 해당 값이 URL 인코딩된 경우 decodeURIComponent 함수를 사용해 디코딩
    roomName = decodeURIComponent(roomName);
    addLinkedRooms(newRoomName, linkedroomArray);
    socket.emit("linkRoom", ownerRoomName, roomName, newRoomName);
    document.getElementById('copyLinkButton').disabled = true;
    toggleModal("modalLinkRoom");
  });


  var bigroomForm = document.querySelector("#bigInsertForm");
  bigroomForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var bigroomName = document.querySelector("#bigInput").value;
    socket.emit("bigRoom", bigroomName );
    addBigRooms(bigroomName, bigroomArray);
  });

  loginBtn.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("1");
    var userid = document.querySelector("#login-nameInput").value;
    var password = document.querySelector("#login-passwordInput").value;
    if (userid == false) {
      alert("아이디 작성");
      return false;
    }
    if (password == false) {
      alert("비밀번호 작성");
      return false;
    } else {
      login(userid, password);
    }
  });

txt.onkeydown = sendMessage.bind(this);
function sendMessage(event) {
 
  if (event.keyCode == 13) {
    
    //메세지 입력 여부 체크
    var message = event.target.value;
    if (message) {
      //소켓서버 함수 호출s
      socket.emit("serverReceiver", message, curUser);
      //텍스트박스 초기화
      txt.value = ""
    }
  }
}

socket.on("clientReceiver", function (data) {
  //console.log('서버에서 전송:', data);
  //채팅창에 메세지 출력하기
  console.log("2")
  var message =
    "[" + curUser + "님의 말," + getToday() + "] " + data.message;
  div.innerText += message + "\r\n";
  //채팅창 스크롤바 내리기
  div.scrollTop = div.scrollHeight;
});

socket.on("joinRoom", function (roomID) {
  socket.emit("wantRoom", roomID);
});

  roomForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var roomName = document.querySelector("#roomInput").value;
    if (roomName.length > 5) {
      alert("5글자 이하 작성");
      roomInput.value = "";
      return false;
    }
    if (localStorage.getItem("roomId")) {
      if (
        JSON.parse(localStorage.getItem("roomId")).find(
          (room) => room === roomName
        )
      ) {
        alert("이미 존재하는 방 이름입니다.");
        roomInput.value = "";
        return false;
      }
    }
    console.log(curPassword);
    socket.emit("createRoom", roomName, curUser, curPassword);
    var roomButton = document.createElement("div");
    var roomLink = document.createElement("a");
    roomArray.push(roomName);
    localStorage.setItem("roomId", JSON.stringify(roomArray));

    roomLink.href = `http://127.0.0.1:3000/?room_name=${roomName}`;
    roomLink.innerText = roomName;
    roomLink.style.textDecoration = "none";
    roomLink.style.color = "white";
    roomLink.style.fontWeight = "bold";
    roomButton.style.width = "70%";
    roomButton.style.height = "10%";
    roomButton.style.margin = "15px";
    roomButton.style.borderRadius = "10%";
    roomButton.style.display = "flex";
    roomButton.style.justifyContent = "center";
    roomButton.style.alignItems = "center";
    roomButton.appendChild(roomLink);
    roomButton.style.background = "black";
    roomOptions.appendChild(roomButton);
    roomInput.value = "";
    toggleModal("modalCreateRoom");
  });
};
//방 이름 출력 로직
var roomTitle = document.querySelector("#groupName");
if (window.location.href != "http://127.0.0.1:3000/") {
  roomTitle.innerText = `${decodeURI(window.location.href.split("=")[1])}`;
} else {
  roomTitle.innerText = "Home";
}

//클라이언트 소켓 생성

//DOM 참조
var div = document.getElementById("message");
var txt = document.getElementById("txtChat");
//텍스트 박스에 포커스 주기
txt.focus();

//텍스트 박스에 이벤트 바인딩


//클라이언트 receive 이벤트 함수(서버에서 호출할 이벤트)




//-------------------------------------------
//클릭해서 사진 파일 추가하기
function triggerFileInput() {
  const fileInput = document.getElementById("fileInput");
  fileInput.click();
}

function login(userid, password) {
  console.log("click");
  // Call the signup function using socketClient
  socket.emit("login", userid, password);

  // Handling the response from the server
  socket.on("loginSuccess", function () {
    console.log("로그인 성공");
    // Display a success message
    alert("로그인이 성공적으로 완료되었습니다.");

    // Save name and password in localStorage
    localStorage.setItem("name", userid);
    localStorage.setItem("password", password);
    // Set login status to 1
    localStorage.setItem("login", "1");
    console.log("프로필 저장:", userid, password);

    // Reload the page to log in the user
    location.reload();
  });

  socket.on("loginError", function (error) {
    console.log("로그인 실패:", error);
    // Display an error message
    alert("로그인에 실패했습니다. 다시 시도해주세요.");
  });

  // 프로필 폼 닫기
  toggleModal("loginModal");
}

function addLinkedRooms(roomname, newroomArray) {
  var newroomButton = document.createElement("div");
  var newroomLink = document.createElement("a");
  var newroomArea = document.querySelector("#linkedRooms");
  newroomArray.push(roomname);
  localStorage.setItem("linkedroomId", JSON.stringify(newroomArray));

  newroomLink.href = `http://127.0.0.1:3000/?room_name=${roomname}`;
  newroomLink.innerText = roomname;
  newroomLink.style.textDecoration = "none";
  newroomLink.style.color = "white";roomid
  newroomLink.style.fontWeight = "bold";
  newroomButton.style.width = "70%";
  newroomButton.style.height = "10%";
  newroomButton.style.margin = "15px";
  newroomButton.style.borderRadius = "10%";
  newroomButton.style.display = "flex";
  newroomButton.style.justifyContent = "center";
  newroomButton.style.alignItems = "center";
  newroomButton.appendChild(newroomLink);
  newroomButton.style.background = "black";
  newroomArea.appendChild(newroomButton);
}

function addBigRooms(roomname, newroomArray) {
  var newroomButton = document.createElement("div");
  var newroomLink = document.createElement("a");
  var newroomArea = document.querySelector("#bigRooms");
  newroomArray.push(roomname);
  localStorage.setItem("bigroomId", JSON.stringify(newroomArray));

  newroomLink.href = `http://127.0.0.1:3000/?room_name=${roomname}`;
  newroomLink.innerText = roomname;
  newroomLink.style.textDecoration = "none";
  newroomLink.style.color = "white";
  newroomLink.style.fontWeight = "bold";
  newroomButton.style.width = "70%";
  newroomButton.style.height = "10%";
  newroomButton.style.margin = "15px";
  newroomButton.style.borderRadius = "10%";
  newroomButton.style.display = "flex";
  newroomButton.style.justifyContent = "center";
  newroomButton.style.alignItems = "center";
  newroomButton.appendChild(newroomLink);
  newroomButton.style.background = "black";
  newroomArea.appendChild(newroomButton);
}
