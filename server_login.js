// server_login.js
 
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
 var async = require("async");
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/simchat';
var numUsers = 0;
var i =0;
var j =0;
var k =0;
var used = false;
var log = false;
var log1 = false;
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
    
    
 
    var cursor = collection.find({phone:phone});
    var cursor1 = collection.find();

    async.series([
        function(callback){
                cursor.each(function (err, doc) {

            if (err) {
              console.log(err);
              socket.emit('login', false);
            } else {
               if(doc != null){
                   if(doc.password == password){
                        log = true;

                   }else{
                        log = false;
                   }
                   log1 = true;
                   callback(null,1);
               }
               else{
                  log1 = false;
               }
               callback(null,1);
            }
          
           });
           
        },
        function(callback){
             callback(null,2);
             if(log1 == true){
                  log1 = false;
                    if(log == true){
                    log = false;
                    cursor1.toArray(function(err, documents) {

                              
                              socket.emit('login', true , documents);
                              console.log(phone + " login");
                              
                               
                            });
                     
                  }else{
                     socket.emit('login', false);
                     log = true;
                  }
             }else{

                socket.emit('login1', false);
                log1 = true;
             }
             
         
        }
      ]);



    

   
  });
 
  socket.on('register', function (phone1, password1, usr_name1,  messageArr1) {
    
    
    var user = {usr_name: usr_name1, password: password1, phone: phone1 , message_usr_arr : []};


    var cursor = collection.find({phone:phone1});

    async.series([
        function(callback){
                        cursor.each(function(err,doc){
                        if (err) {
                        console.log(err);
                        socket.emit('register', false);
                         
                      } else {
                         if(doc == null){
                          callback(null,1);
                          used = true;
                          
                         }else{
                          used = false;
                            
                         }
                      } 
                     
                    });
                 
          },
         function(callback){
              if(used == true){
                callback(null,2);
                    collection.insert(user, function (err, result) {
                                if (err) {
                                   console.log(err);
                                   socket.emit('register', false);
                                } else {
                                  
                                  console.log(usr_name1 + " register");
                                    console.log('them vao db thanh cong 1');
                                    socket.emit('register', true);
                                    socket.broadcast.emit('register1', {"tf":"true", "user":{usr_name: usr_name1, password: password1, phone: phone1}});
                                    used = false;
                                }
                                 
                                });
                  }else{
                    socket.emit('register', false);
                    used = true;
                    used = false;
                  }

         }

      ],function(error, result){
        console.log(result);
      });
   

    
// message_usr_arr: [{name_user : name_user1 , user_message : user_message1}]


                

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

    // echo globally (all clients expert user) that a person has connected
    
    socket.broadcast.to(socket.bind_friend).emit('user joined', {
      username: socket.username,
      string: socket.bind_friend,
      numUsers: numUsers
    });
  });


socket.on('add user to room', function (username, bind_user) {
    if (addedUser) return;
    socket.bind_user = bind_user;
    socket.join(socket.bind_user);
    if(socket.bind_user == "Miền Bắc") i++; 
    if(socket.bind_user == "Miền Trung") j++; 
    if(socket.bind_user == "Miền Nam") k++; 
    
    console.log(username + " login to chat");
    console.log("hello couple: " + socket.bind_user);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;

    // echo globally (all clients expert user) that a person has connected
    socket.broadcast.emit('joined', socket.bind_user ,i, j, k);

    socket.broadcast.to(socket.bind_user).emit('user joined', {
      username: socket.username,
      string: socket.bind_user,
      numUsers: numUsers
    });
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

socket.on('typing all room', function () {

    socket.broadcast.to(socket.bind_user).emit('typing', {
   
      username: socket.username
   
    });

  });

 socket.on('stop typing', function () {

    socket.broadcast.to(socket.bind_friend).emit('stop typing', {
      username: socket.username
    });
    
  });

socket.on('stop typing all room', function () {

    socket.broadcast.to(socket.bind_user).emit('stop typing', {
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
function mallerthan0(){

      if(i <0) i = 0;
      if(j <0) j = 0;
      if(k <0) k = 0;
}
 mallerthan0();
socket.on('disconnect room', function (roomName) {
      socket.roomName = roomName;
      console.log("hello");
      mallerthan0();
      if(socket.roomName == "Miền Bắc") --i;
      if(socket.roomName == "Miền Trung") --j;
      if(socket.roomName == "Miền Nam") --k;

 socket.broadcast.emit('joined', socket.roomName , i, j, k);
    
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
  
  socket.on("new message all user",function (data) {

    // socket.id_couple = id_couple;
     console.log("message from "+ socket.bind_user);
    // socket.join(socket.id_couple);
  socket.broadcast.to(socket.bind_user).emit('new message', {
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