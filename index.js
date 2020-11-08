//This is the server file

const express = require("express");
const socket = require("socket.io");
const app = express();
const PORT = 3000;

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

let currentusers = [];
let currentmessages = [];

const SMILEYS = {
  ':)': '&#x1F600',
  ':-)': '&#x1F600',
  ':(': '&#128577',
  ':-(': '&#128577',
  ':o': '&#128558',
  ':O': '&#128558',
  ':/': '&#128533',
  ':-/': '&#128533',
};

function parseMessage(message) {
  let smileys = Object.keys(SMILEYS);
  smileys.forEach(smiley => message = message.replace(smiley, SMILEYS[smiley]));
  return message;
}

function isValid(username) {
  for (let i = 0; i < currentusers.length; i++){
    if (currentusers[i].username == username) {
      return false;
    }
  }
  return true;
}

function convertTimestamp(){
  let timestamp = new Date();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var date = MONTHS[timestamp.getMonth()] + ' ' + timestamp.getDate();
  var time = null;
  if (timestamp.getHours() > 12) {
    time = timestamp.getHours() % 12 + ":" + (timestamp.getMinutes() < 10 ? '0' : '') + (timestamp.getMinutes()) + ' PM';
  } else {
    time = timestamp.getHours() + ":" + (timestamp.getMinutes() < 10 ? '0' : '') + (timestamp.getMinutes()) + ' AM';
  }
  const dateTime = date + ', ' + time;
  return dateTime;
}

//Load static files
app.use(express.static("public"));
const io = socket(server);


io.on('connection', (socket) => {
  //console.log("Someone connected");
  
  // socket.on('disconnect', () => {
  //   currentusers.delete(socket.id);
  //   //add code here for when someone disconnects (closes browser)
  //   //do all things in the leave CODE HERE
  //   socket.broadcast.emit('update-users', currentusers);
  // });

  socket.on('joined', (data) => {
    let user = {};
    //if user provided a username
    if (data != null) {
      if (isValid(data)) {
        user = { username: data, color: '#000000' };
      } else {
        user = { username: 'user' + Math.floor(Math.random() * 100), color: '#00000' };
      }
      
    } else {
      user = { username: 'user' + Math.floor(Math.random() * 100), color: '#00000'}
    }
    currentusers.push(user);
    socket.emit('joined', user);
  });

  socket.on('leave', (username) => {
    for (let i = 0; i < currentusers.length; i++) {
      if (currentusers[i].username == username) {
        currentusers.splice(i, 1);
      }
    }
  });

  socket.on('message', msg => {
    if (msg.message.slice(0, 7) === "/color ") {
      let newcolor = msg.message.slice(7, 14);
      for (let i = 0; i < currentusers.length; i++){
        if (currentusers[i].username == msg.user.username) {
          currentusers[i].color = newcolor;
          msg.user.color = newcolor;
        }
      }
      for (let j = 0; j < currentmessages.length; j++) {
        if (currentmessages[j].user.username === msg.user.username) {
          currentmessages[j].user.color = newcolor;
        }
      }
      socket.emit('update-color', newcolor);
        
    } else if (msg.message.slice(0, 6) === "/name ") {
      let oldusername = msg.user.username;
      let newusername = msg.message.slice(6, msg.message.length);

      //validate whether the username is taken if its not taken do this
      if (isValid(newusername)) {
        for (let i = 0; i < currentusers.length; i++) {
          if (currentusers[i].username == oldusername) {
            currentusers[i].username = newusername;
            msg.user.username = newusername;
          }
        }
        for (let j = 0; j < currentmessages.length; j++) {
          if (currentmessages[j].user.username === oldusername) {
            currentmessages[j].user.username = newusername;
          }
        }
        socket.emit('update-username', newusername);
      } else {
        socket.emit('invalid-username');
      }
    } else {
      currentmessages.push({ message: parseMessage(msg.message), user: msg.user, timestamp: convertTimestamp()});
      socket.emit('message', { message: parseMessage(msg.message), user: msg.user, timestamp: convertTimestamp() });
    }
  });

  socket.on('change-username', (data) => {
    let oldname = data.olduser;
    let newname = data.newuser;

    for (let i = 0; i < currentusers.length; i++) {
      if (currentusers[i].username == oldname) {
        currentusers[i].username = newname;
      }
    }
  });

  //events for continuous polling
  socket.on('get-users', () => {
    socket.emit('get-users-response', currentusers);
  });

  socket.on('get-messages', (username) => {
    for (let j = 0; j < currentmessages.length; j++) {
      if (currentmessages[j].user.username === username) {
        currentmessages[j].user.type = 0;
      } else {
        currentmessages[j].user.type = 1;
      }
    }
    socket.emit('get-messages-response', currentmessages);
  });
});