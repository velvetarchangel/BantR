const express = require("express");
const socket = require("socket.io");
const app = express();
const PORT = 3000;

//map for smileys
const SMILEYS = {
  ':)': '&#x1F600',
  ':-)': '&#x1F600',
  ':(': '&#128577',
  ':-(': '&#128577',
  ':o': '&#128558',
  ':O':'&#128558',
  ':/': '&#128533',
  ':-/': '&#128533',
};

const server = app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

//Load static files
app.use(express.static("public"));
//Setup socket io
const io = socket(server);        //init socket

//functions associated with parsing messages
/**
 * This function changes current date to format MMM DD hh: mm AM/PM
 */
function convertTimestamp() {
  let timestamp = new Date();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var date = MONTHS[timestamp.getMonth()] + ' ' + timestamp.getDate();
  var time = null;
  if (timestamp.getHours() > 12) {
    time = timestamp.getHours() % 12 + ":" + (timestamp.getMinutes()<10?'0':'') + (timestamp.getMinutes()) + ' PM';
  } else {
    time = timestamp.getHours()+ ":" + (timestamp.getMinutes()<10?'0':'') + (timestamp.getMinutes()) + ' AM';
  }
  const dateTime = date + ' ' + time;
  return dateTime;
}

/**
 * Handles different emojis
 * 
 * This function will change the emojis to a hex code
 * that is compatible with html tags. To achieve this I have
 * used v-html tags
 */
function parseMessage(message) {
  let smileys = Object.keys(SMILEYS);
  smileys.forEach(smiley => message = message.replace(smiley, SMILEYS[smiley]));
  return message;
}

io.on('connection', (socket) => {
  
  socket.connections = Object.keys(io.sockets.connected).length;
  
  //create user id, default color of user will be black
  socket.user = {
    username: 'user' + Math.floor(Math.random() * 100),
    color: '#000000'
  };

  socket.emit('connections', socket.user);

  socket.on('joined', (username) => {
    //if the user has not picked a us
    if (username === null) {
      socket.emit('joined', {'user' : socket.user})
    } else {
      console.log(username);
      socket.emit('joined', {'user' : {username: username, color: '#000000'}})
    }
  });

  //this function receives the message from the client
  // on io.emit --> sends message back to the client
  socket.on('message', msg => {
    io.emit('message', { 'message': parseMessage(msg.message), 'user': msg.user, 'timestamp': convertTimestamp()});
  });

});