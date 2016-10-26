// server_login.js
 
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
 
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/simchat';
var numUsers = 0;
var i =0;
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    collection = db.collection("usrcl");
  }
});
 
 
 
app.get('/', function (req, res){
  res.sendfile('index.html');
});
 
 
io.on('connection', function (socket) {
  var addedUser = false;
  socket.on('login', function (phone, password) {
    console.log(phone + " login");
 
    var cursor = collection.find({phone:phone});
    var cursor1 = collection.find();
    cursor.each(function (err, doc) {
      if (err) {
        console.log(err);
        socket.emit('login', false);
      } else {
         if(doc != null){
             if(doc.password == password){


                // cursor1.each(function (err1, doc1) {
                //   if (err) {
                //     console.log(err1);
                //     socket.emit('login', false);
                //   } else {
                //      if(doc1 != null)
                //              socket.emit('login', true , doc1);
                //        }
                  
                //  });
                 
                  cursor1.toArray(function(err, documents) {

                    socket.emit('login', true , documents);
                  });

                 
                
             }else{
                 socket.emit('login', false);
             }
 
         }
      }
     });
 
  });
 
  socket.on('register', function (phone1, password1, usr_name1,  messageArr1) {
    console.log(usr_name1 + " register");
 
    var user = {usr_name: usr_name1, password: password1, phone: phone1 , message_usr_arr : []};

// message_usr_arr: [{name_user : name_user1 , user_message : user_message1}]


                collection.insert(user, function (err, result) {
                  if (err) {
                     console.log(err);
                     socket.emit('register', false);
                  } else {
                      console.log('them vao db thanh cong 1');
                      socket.emit('register', true);
                      socket.broadcast.emit('register1', {"tf":"true", "user":{usr_name: usr_name1, password: password1, phone: phone1}});
                      
                  }
                  
                  });

  });
  

  

 socket.on('add user', function (username, bind_friend) {
    if (addedUser) return;
    socket.bind_friend = bind_friend;
    socket.join(socket.bind_friend);
    console.log(username + " login to chat");
    console.log("hello couple: " + socket.bind_friend);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    if(numUsers == 2 ){
      numUsers = 2;
    }
    addedUser = true;

    // socket.emit('login1', {
    //   numUsers: numUsers
    // });

    // echo globally (all clients) that a person has connected
    
    socket.broadcast.to(socket.bind_friend).emit('user joined', {
      username: socket.username,
      string: socket.bind_friend,
      numUsers: numUsers
    });


// socket.broadcast.to('3rRUbiVtOIN8KkBoAAAA').emit(
//   'message', 
//   'for your eyes only'
//   );

  // io.sockets.socket(socket.id).emit('user joined', {
  //     username: socket.username,
  //     numUsers: numUsers
  //   });
  });
 
socket.on('update_message', function (username1, message1){

      collection.update({usr_name : socket.username},{$push:{message_usr_arr:{usrname: username1 , message: message1}}}, function(err, result){
        
         if (err) {
                     console.log(err);
                     // socket.emit('update_message', false);
                     console.log('update that bai');
                  }else{
                    var cursor2 = collection.find();
                    console.log('update thanh cong');
                    cursor2.toArray(function(err, documents) {
                      console.log('emit thanh cong');
                    socket.emit("on_emit_message", documents);
                  });
                    
                  }
      });
  });


socket.on('typing', function () {

    socket.broadcast.to(socket.bind_friend).emit('typing', {
   
      username: socket.username
   
    });

  });



 socket.on('stop typing', function () {

    socket.broadcast.to(socket.bind_friend).emit('stop typing', {
      username: socket.username
    });
    
  });


socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
 
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  socket.on("new message",function (data) {

    // socket.id_couple = id_couple;
     console.log("message from "+ socket.bind_friend);
    // socket.join(socket.id_couple);
  socket.broadcast.to(socket.bind_friend).emit('new message', {
        username : socket.username,
        message: data
      });

      // socket.broadcast.emit("new message",{
      //     username : socket.username,
      //     message: data
      // }); 
  });
  




  // socket.on('disconnect', function () {
  //   if (addedUser) {
  //     --numUsers;
  
  //     // echo globally that this client has left
  //     socket.broadcast.emit('user left', {
  //       username: socket.username,
  //       numUsers: numUsers
  //     });
  //   }
  // });

           
 
      
});
 
http.listen(process.env.PORT ||3000, function(){
  console.log('listening on *:3000');
});