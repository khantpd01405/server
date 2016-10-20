// server_login.js
 
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
 
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/simchat';
 
 var i =0;
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    collection = db.collection("usrlogin");
  }
});
 
 
 
app.get('/', function (req, res){
  res.sendfile('index.html');
});
 
 
io.on('connection', function (socket) {
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
 
  socket.on('register', function (phone1, password1, usr_name1 ) {
    console.log(usr_name1 + " register");
 
    var user = {usr_name: usr_name1, password: password1, phone: phone1 };




                collection.insert(user, function (err, result) {
                  if (err) {
                     console.log(err);
                     socket.emit('register', false);
                  } else {
                      console.log('them vao db thanh cong 1');
                      socket.broadcast.emit('register1', {"tf":"true", "user":{usr_name: usr_name1, password: password1, phone: phone1}});
                      socket.emit('register', true);
                  }
                  });

  });
  



  
    

           
 
      
});
 
http.listen(process.env.PORT ||3000, function(){
  console.log('listening on *:3000');
});