//const mysql = require('mysql');
const mysql = require('mysql2');
//const selectQueries = require('./queryModule');
//const updateQueries = require('./queryModule');
//지금 임포트하는데 문제 생겨서 모듈 가져와서 합침

const selectQueries = {
  getAllUsers: 'SELECT * FROM user_info',
  getID: 'SELECT id from user_info WHERE nickname = ? AND pass_word= ?',
  verifyUser :`WITH user_id AS (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?)
    SELECT nickname AS name FROM user_info WHERE id IN (SELECT id FROM user_id) and pass_word = ?`,
  getRoomID : `WITH user_id AS (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?)
    SELECT room_id FROM room WHERE (SELECT id FROM user_id) IN ( room_owner_id, room_member_id_1, room_member_id_2 ,room_member_id_3, room_member_id_4)`,
  getBigRoomID : `WITH my_room AS (
    SELECT room.room_id as my_room_id FROM room
    WHERE (SELECT id FROM user_info WHERE nickname = ? AND pass_word = ?)
    IN (room.room_owner_id, room.room_member_id_1, room.room_member_id_2, room.room_member_id_3, room.room_member_id_4))

  SELECT big_room.room_id FROM big_room WHERE  
  big_room.room_owner_id IN (SELECT my_room_id FROM my_room ) OR
  big_room.room_member_id_1 IN (SELECT my_room_id FROM my_room) OR
  big_room.room_member_id_2 IN (SELECT my_room_id FROM my_room) OR
  big_room.room_member_id_3 IN (SELECT my_room_id FROM my_room) OR
  big_room.room_member_id_4 IN (SELECT my_room_id FROM my_room)`,
  getLinkedRoomID_BY_ID : `SELECT link_id FROM linked_room_list WHERE ? IN (linked_room_id, linked_room_id_2)`,
  getLinkedRoomID : `WITH my_room AS (
    SELECT room.room_id as my_room_id FROM room
    WHERE (SELECT id FROM user_info WHERE nickname = ? AND pass_word = ?)
    IN (room.room_owner_id, room.room_member_id_1, room.room_member_id_2, room.room_member_id_3, room.room_member_id_4))

    SELECT DISTINCT link_id FROM linked_room_list WHERE 
      linked_room_id IN (SELECT my_room_id FROM my_room ) OR
      linked_room_id_2 IN (SELECT my_room_id FROM my_room)`,
  };
//WITH user_id AS (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?) 와
//(SELECT id FROM user_id) 이 구문을 사용해서 다시 만듬

const updateQueries = {
  insertUser: `WITH user_id AS (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?)
  UPDATE room 
  SET room_member_id_1 = CASE 
      WHEN (SELECT id FROM user_id) IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_1 
      WHEN room_member_id_1 IS NULL THEN (SELECT id FROM user_id)
      ELSE  room_member_id_1 
      END,
  room_member_id_2 = CASE
      WHEN (SELECT id FROM user_id) IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_2
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NULL THEN (SELECT id FROM user_id)
      ELSE room_member_id_2
      END,
  room_member_id_3 = CASE
    WHEN (SELECT id FROM user_id) IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_3
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NOT NULL AND room_member_id_3 IS NULL THEN (SELECT id FROM user_id)
      ELSE room_member_id_3
      END,
  room_member_id_4 = CASE
    WHEN (SELECT id FROM user_id) IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_4
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NOT NULL AND room_member_id_3 IS NOT NULL AND room_member_id_4 IS NULL THEN (SELECT id FROM user_id)
      ELSE room_member_id_4
      END
  WHERE room_id = ? AND 
   room_id NOT IN (
    SELECT room_id 
    FROM (
      SELECT room_id
      FROM room
      WHERE room_member_id_1 IS NOT NULL 
      AND room_member_id_2 IS NOT NULL 
      AND room_member_id_3 IS NOT NULL 
      AND room_member_id_4 IS NOT NULL
      ) AS subquery
    )`,
  //SET문의 ?들은 user id이고, WHERE구문의 ?는 room id이다.
  deleteUser: `WITH user_id AS (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?)
  UPDATE room 
  SET room_member_id_1 = CASE 
      WHEN room_member_id_1 = (SELECT id FROM user_id) THEN NULL
      ELSE room_member_id_1
      END,
  room_member_id_2 = CASE 
      WHEN room_member_id_2 = (SELECT id FROM user_id) THEN NULL
      ELSE room_member_id_2
      END,
  room_member_id_3 = CASE 
      WHEN room_member_id_3 = (SELECT id FROM user_id) THEN NULL
      ELSE room_member_id_3
      END,
  room_member_id_4 = CASE 
      WHEN room_member_id_4 = (SELECT id FROM user_id) THEN NULL
      ELSE room_member_id_4
      END
  WHERE room_id = ?`,
  //createRoom: `INSERT INTO room(room_id,room_name,room_owner_id) VALUES ((select room_id from(select max(room_id) as room_id from room)AS newNum) + 1 ,concat((SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?),'의 그룹'), (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?));`,
  createRoom: `INSERT INTO room(room_id,room_name,room_owner_id) VALUES ((select room_id from(select max(room_id) as room_id from room)AS newNum) + 1 ,concat(?,'의 그룹'), (SELECT id from user_info AS host WHERE nickname = ? AND pass_word= ?));`,
  signIn: `insert into user_info VALUES ((SELECT CONCAT('user',MAX(CONVERT(MID(id,5),unsigned))+1) as id FROM user_info AS NewID), ?, ?);`,
  createBigRoom : `INSERT INTO big_room (room_id, room_name, room_owner_id) 
    VALUES(IFNULL((select room_id from(select max(room_id) as room_id from big_room)AS newNum) + 1,1), concat(?,'의 big room'), ?)`,
  createLinkedRoom : `INSERT INTO linked_room_list (link_id, linked_room_id, linked_room_id_2) 
  VALUES(IFNULL((SELECT CONCAT('link_',MAX(CONVERT(MID(link_id,6),unsigned))+1) as id FROM linked_room_list AS NewID),'link_1'), ?, ?)`,
  insertRoom : `
  UPDATE big_room 
  SET room_member_id_1 = CASE 
      WHEN ? IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_1 
      WHEN room_member_id_1 IS NULL THEN ?
      ELSE  room_member_id_1 
      END,
  room_member_id_2 = CASE
      WHEN ? IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_2
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NULL THEN ?
      ELSE room_member_id_2
      END,
  room_member_id_3 = CASE
    WHEN ? IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_3
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NOT NULL AND room_member_id_3 IS NULL THEN ?
      ELSE room_member_id_3
      END,
  room_member_id_4 = CASE
    WHEN ? IN (room_member_id_1,room_member_id_2,room_member_id_3,room_member_id_4) THEN room_member_id_4
      WHEN room_member_id_1 IS NOT NULL AND room_member_id_2 IS NOT NULL AND room_member_id_3 IS NOT NULL AND room_member_id_4 IS NULL THEN ?
      ELSE room_member_id_4
      END
  WHERE room_id = ? AND 
   room_id NOT IN (
    SELECT room_id 
    FROM (
      SELECT room_id
      FROM big_room
      WHERE room_member_id_1 IS NOT NULL 
      AND room_member_id_2 IS NOT NULL 
      AND room_member_id_3 IS NOT NULL 
      AND room_member_id_4 IS NOT NULL
      ) AS subquery)`,
  deleteRoom : `
  UPDATE big_room 
  SET room_member_id_1 = CASE 
      WHEN room_member_id_1 = ? THEN NULL
      ELSE room_member_id_1
      END,
  room_member_id_2 = CASE 
      WHEN room_member_id_2 = ? THEN NULL
      ELSE room_member_id_2
      END,
  room_member_id_3 = CASE 
      WHEN room_member_id_3 = ? THEN NULL
      ELSE room_member_id_3
      END,
  room_member_id_4 = CASE 
      WHEN room_member_id_4 = ? THEN NULL
      ELSE room_member_id_4
      END
  WHERE room_id = ?`,
  deleteLinkedRoomID_BY_ALL : `DELETE FROM linked_room_list where link_id IN (SELECT * FROM (SELECT link_id FROM linked_room_list WHERE ? IN (linked_room_id, linked_room_id_2))AS SUB);`,
  deleteLinkedRoom : `DELETE FROM linked_room_list where link_id = ?;`,
  updateLinkedRoom : `UPDATE linked_room_list 
    SET linked_room_id = ?,
    SET linked room_id_2 = ?`,

};

//------------------------함수 부분-------------------------------------------

  function getID(name, password){
    connection.query(selectQueries.getID, [name, password], (error, result_room) => {
      if (error) {
        console.error('생성 과정 중 문제 발생:', error);
        return;
      }
      console.log("생성완료 결과 : ",result_room);
      // return results;
    });
  }

  function verifyUser(name, password) {
    connection.query(selectQueries.verifyUser, [name, password, password], (error, results) => {
        if (error) {
          console.error('유저 인증 쿼리에서 문제 발생 :', error);
          return;
        }

        if(results == undefined){ //유저 정보 없는 경우
            console.log("해당 유저 정보가 없습니다.");
            return false;
          }else{
            const userName = results.nickname;
            console.log("인증 성공! :" + userName);
            return true;
          }
        //console.log('인증 결과 : ', results);
      });
  }

  //----------------------방에 유저 넣기, 없애기, 새 방 생성----------------------

  function insertUser(name, password, roomID) { //방에 유저 추가
    connection.query(updateQueries.insertUser, [name,password,roomID], (error, results) => {
        if (error) {
          console.error('SQL에러 발생:', error);
          return;
        }
        console.log('실행 결과 :', results);
        //return results;
      });
  }

  function deleteUser(name, password, roomID) { //방에서 유저 삭제
    connection.query(updateQueries.deleteUser, [name,password,roomID], (error, results) => {
        if (error) {
          console.error('SQL에러 발생:', error);
          return;
        }
        console.log('실행 결과 :', results);
        //return results;
      });
  }

 function createRoom(name,password) {
    connection.query(updateQueries.createRoom, [name, name,password], (error, result_room) => {
      if (error) {
        console.error('방 생성 과정 중 문제 발생:', error);
        return;
      }
      console.log("생성완료 결과 : ",result_room);
      // return results;
    });
 }

 function signIn(name, password){
    connection.query(updateQueries.signIn, [name, password], (error, result_room) => {
      if (error) {
        console.error('생성 과정 중 문제 발생:', error);
        return;
      }
      console.log("생성완료 결과 : ",result_room);
      // return results;
    });
 }

 //--------------새로 추가

 function getBigRoomID(name, password){
  connection.query(selectQueries.getBigRoomID, [name, password], (error, result_room) => {
    if (error) {
      console.error('bigRoom 색인 과정 문제 발생:', error);
      return;
    }
    console.log("bigRoomID 색인결과 : ",result_room);
    // return results;
  });
}

function getLinkedRoomID(name, password){
  connection.query(selectQueries.getLinkedRoomID, [name, password], (error, result_room) => {
    if (error) {
      console.error('링크 아이디 색인 에러:', error);
      return;
    }
    console.log("링크되있는 방 아이디 색인 결과 : ",result_room);
    // return results;
  });
}

function createBigRoom(name, roomID){
  connection.query(updateQueries.createBigRoom, [name, roomID], (error, result_room) => {
    if (error) {
      console.error('big Room 생성 과정 중 문제 발생:', error);
      return;
    }
    console.log("big Room 생성완료, 결과 : ",result_room);
    // return results;
  });
}

function createLinkedRoom(roomID_1, roomID_2){
  connection.query(updateQueries.createLinkedRoom, [roomID_1, roomID_2], (error, result_room) => {
    if (error) {
      console.error('생성 과정 중 문제 발생:', error);
      return;
    }
    console.log("생성완료 결과 : ",result_room);
    // return results;
  });
}

function insertRoom(roomID, bigRoomID){
  connection.query(updateQueries.insertRoom, [roomID,roomID,roomID,roomID,roomID,roomID,roomID,roomID, bigRoomID], (error, result_room) => {
    if (error) {
      console.error('방 추가 중 문제 발생:', error);
      return;
    }
    console.log("방 추가 완료, 결과 : ",result_room);
    // return results;
  });
}

function deleteRoom(roomID, bigRoomID){
  connection.query(updateQueries.deleteRoom, [roomID,roomID,roomID,roomID,bigRoomID], (error, result_room) => {
    if (error) {
      console.error('방 삭제 중 문제 발생:', error);
      return;
    }
    console.log("방 삭제 완료, 결과 : ",result_room);
    // return results;
  });
}

function deleteLinkedRoom(linkID){
  connection.query(updateQueries.deleteLinkedRoom, [linkID], (error, result_room) => {
    if (error) {
      console.error('링크 해제 중 문제 발생:', error);
      return;
    }
    console.log("링크 해제 완료, 결과 : ",result_room);
    // return results;
  });
}

function updateLinkedRoom(linkID_1, linkID_2){
  connection.query(updateQueries.updateLinkedRoom, [linkID_1, linkID_2], (error, result_room) => {
    if (error) {
      console.error('링크 수정 중 문제 발생:', error);
      return;
    }
    console.log("링크 수정 완료, 결과 : ",result_room);
    // return results;
  });
}
//------------------------연결 설정 부분---------------------

const connection = mysql.createConnection({
  host: '34.64.139.219',
  user: 'user',
  password: 'thrhd0604',
  database: 'messanger'
});

connection.connect((error) => {
  if (error) {
    console.error('연결 실패:', error);
    return;
  }
  console.log('successfully connected with MySQL!');
});

//---------------------함수 실행 구간---------------------

getID('kimchiman','1234');
verifyUser('kimchiman','1234');
createBigRoom('kimchiman',1);
createLinkedRoom(1,2);
insertRoom(2,1);
getLinkedRoomID('kimchiman','1234');
getBigRoomID('kimchiman','1234');
//deleteRoom(2,1);
//deleteLinkedRoom('link_1');

//insertUser('gochugirl','0000',2);
//deleteUser('gochugirl','0000',2);
//createRoom('gochugirl','0000');
//signIn('Yee','2222');
//다음처럼 함수 실행

//--------------------------------------------------------
connection.end();

module.exports = {
  verifyUser: verifyUser,
  signIn: signIn,
  getID: getID,
  createRoom: createRoom
};


connection.connect((error) => {
  if (error) {
    console.error('연결 실패:', error);
    return;
  }
  console.log('successfully connected with MySQL!');
});

//---------------------함수 실행 구간---------------------

//verifyUser('user3','0530');

//insertUser(1,'user4');
//deleteUser(1,'user4');
//createRoom('user2');
//다음처럼 함수 실행

//--------------------------------------------------------
//connection.end();
