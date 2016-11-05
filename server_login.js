// server_login.js
var gcm = require('node-gcm');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
 var async = require("async");
 var fs = require("fs");
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
                socket.username = doc.usr_name;
                   if(doc.password == password){
                        socket.phone = phone;
                        collection.update({"phone" : socket.phone},{$set:{"status": true , "socketId":socket.id}}, function(err, result){
        
                           if (err) {
                                       console.log(err);
                                       console.log('update that bai');
                                    }else{
                                      
                                    }
                        });

                        log = true;

                   }else{
                        log = false;
                   }
                   log1 = true;
                   callback(null,1);
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
 

socket.on('user online', function(object){

    socket.broadcast.emit("user online", object);
});


  socket.on('register', function (phone1, password1, usr_name1, status1,  messageArr1) {
    
    
    var user = {usr_name: usr_name1, password: password1, phone: phone1 , status: status1, socketId: socket.id ,message_usr_arr : []};


    var cursor = collection.find({phone:phone1});

    async.series([
        function(callback){
                        cursor.each(function(err,doc){
                        if (err) {
                        console.log(err);
                        socket.emit('register', false);
                         
                      } else {
                         if(doc == null){
                          
                          used = true;
                          
                         }else{
                          used = false;
                            
                         }
                         callback(null,1);
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

                                    socket.broadcast.emit('register1', {"tf":"true", "user":{usr_name: usr_name1, password: password1, phone: phone1, status : status1}});
                                    used = false;
                                }
                                 
                                });
                  }else{
                    socket.emit('register', false);
                    used = true;
                  }

         }

      ],function(error, result){
        console.log(result);
      });
   

    
// message_usr_arr: [{name_user : name_user1 , user_message : user_message1}]


                

  });
  

  

 socket.on('add user', function (username, bind_friend) {
    // if (addedUser) return;
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
    // if (addedUser) return;
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

      // collection.update({usr_name : socket.username},{$push:{message_usr_arr:{usrname: username1 , message: message1}}}, function(err, result){
        
      //    if (err) {
      //                console.log(err);
      //                // socket.emit('update_message', false);
      //                console.log('update that bai');
      //             }else{
      //               var cursor2 = collection.find();
      //               console.log('update thanh cong');
      //               cursor2.toArray(function(err, documents) {
      //                 console.log('emit thanh cong');
      //               socket.emit("on_emit_message", documents);
      //             });
                    
      //             }
      // });
  });


socket.on('typing', function (socketIdFr) {

    socket.broadcast.to(socket.bind_friend).emit('typing', {
   
      username: socket.username
   
    });

  });

socket.on('typing all room', function () {

    socket.broadcast.to(socket.bind_user).emit('typing', {
   
      username: socket.username
   
    });

  });

 socket.on('stop typing', function (socketIdFr) {

    socket.broadcast.to(socket.bind_friend).emit('stop typing', {
      username: socket.username
    });
    
  });

socket.on('stop typing all room', function () {

    socket.broadcast.to(socket.bind_user).emit('stop typing', {
      username: socket.username
    });
    
  });


  socket.on('escape', function () {
    
    collection.update({"phone" : socket.phone},{$set:{"status":false}}, function(err, result){
        
         if (err) {
                     console.log(err);
                     console.log('update that bai');
                  }
      });


      console.log("user da off");

      socket.broadcast.emit('user off', {
       
        phone: socket.phone,
        username: socket.username,
        status: false
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
      console.log(socket.username + " left");
      
    }
  });

// socket.on('disconnectUser', function () {
//     if (addedUser) {
//       --numUsers;
//       // echo globally that this client has left
//       console.log(socket.username + " left");


//       socket.emit('usroff');

//       socket.broadcast.emit('user left', {
//         username: socket.username,
//         numUsers: numUsers
//       });
//     }
//   });

function mallerthan0(){

      if(i <0) i = 0;
      if(j <0) j = 0;
      if(k <0) k = 0;
}

 mallerthan0();

socket.on('disconnect room', function (roomName) {
      socket.roomName = roomName;
 //      console.log("hello");
 //      mallerthan0();
 //      if(socket.roomName == "Miền Bắc") --i;
 //      if(socket.roomName == "Miền Trung") --j;
 //      if(socket.roomName == "Miền Nam") --k;

 // socket.broadcast.emit('joined', socket.roomName , i, j, k);
  socket.broadcast.to(socket.bind_friend).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
     socket.leave(socket.bind_friend);
  });




  socket.on("new message",function (data , socketIdFr) {

    // socket.id_couple = id_couple;
     console.log("message from "+ socket.bind_friend);
    // socket.join(socket.id_couple);
      socket.broadcast.to(socketIdFr).emit('push to user', {
            username: socket.username,
            phone: socket.phone,
            socketId: socket.id,
            message: data
        });

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

socket.on("change pass",function (oldpass,newpass) {
          console.log("use want to change password " +oldpass +" "+newpass);
          var cursor = collection.find({"phone" : socket.phone, "password" : oldpass});
          cursor.each(function (err, doc) {
            if (err) {
              console.log(err + "loi");
            } else {
               if(doc != null){
                  collection.update({"phone" : socket.phone},{$set:{"password":newpass}}, function(err, result){
          
                             if (err) {
                                         console.log(err);
                                         socket.emit("change pass", false);
                                      }else{
                                         console.log('password has changed');
                                         socket.emit("change pass", true);
                                      }
                          });
               }else{
                console.log("van loi")
               }
            }
          
           });
          
      
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


// xu ly am thanh
           
socket.on('client gui am thanh',function(data,socketIdFr){
    console.log(data);
    var message1 = "gui 1 am thanh";
socket.broadcast.to(socketIdFr).emit('push to user', {
        username: socket.username,
        phone: socket.phone,
        socketId: socket.id,
        message: message1
        });
socket.broadcast.to(socketIdFr).emit('new record', {
        username: socket.username,
        record: data
      });


});


// xu ly hinh anh
socket.on('client gui image',function(data,socketIdFr){
    console.log(data);
    // fs.readFile(data);
    var message1 = "gui 1 hinh anh";
    socket.broadcast.to(socketIdFr).emit('push to user', {
        username: socket.username,
        phone: socket.phone,
        socketId: socket.id,
        message: message1
        });
socket.broadcast.to(socketIdFr).emit('new image', {
        username: socket.username,
        image: data
      });
});

// tao file name
  function fileName(id){
    return "image/" + id.substring(2) + getMilis() + ".png"; 
  }

// lay milis
   function getMilis(){
      var date = new Date();
      var milis = date.getTime();
      return milis;
   }   
});


function pushnotification(){
  var message = new gcm.Message();
 
// Add notification payload as key value
message.addNotification('title', 'Alert!!!');
message.addNotification('body', 'Abnormal data access');
message.addNotification('icon', 'ic_launcher');
 
 
// Set up the sender with you API key
var sender = new gcm.Sender('AIzaSyCyzKr6Eib21eyLOvMp6IdJYXHJtvp-Vg8');
 
// Add the registration tokens of the devices you want to send to
var registrationTokens = [];
registrationTokens.push('e9UgBn328CI:APA91bFs_xgz9yLfZrgl-czcVBHlHE9buz1m63rM4l-sYyYa9Xzl-0Lpz5maF-s6n-ztfZGVxqxiAaIiPqMaJpDyiBQK5QT_1We-B4_0x5DHFBxC0_iQN017bhqo8vpPcMJ3tHT_zomU');
 
 
sender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
  if(err) console.error(err);
  else    console.log(response);
});

}

 

http.listen(process.env.PORT ||3000, function(){
  console.log('listening on *:3000');
});