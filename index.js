require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const history = require('connect-history-api-fallback');
const http = require('http');
const { Server } = require("socket.io");

app.use(cors());
app.use(express.json());


const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  maxHttpBufferSize: 2e8 // 200 MB
});
////////////////////////////////=======/////////////////

app.use(history({
  // verbose: true,
  htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
}), express.static('www'));

//Iniciando Server
httpServer.listen(process.env.HTTP_PORT, () => {
  console.log('Server running on port ' + process.env.HTTP_PORT);
});
let messages = [];
// adicionando websocket
io.on('connection', (socket) => {
  io.fetchSockets().then((sockets) => {
    io.emit('users', sockets.map((socket) => { return { id: socket.id, address: socket.handshake.address }; }));
    setTimeout(() => {
      io.to(socket.id).emit('messages', messages);
    }, 1000);
  });

  socket.on('disconnect', () => {
    io.fetchSockets().then((sockets) => {
      io.emit('users', sockets.map((socket) => { return { id: socket.id, address: socket.handshake.address }; }));
    });
  });
  // message
  socket.on('message', (msg) => {
    msg.from = socket.id;
    console.log('message: ', msg);
    if (msg.to === 'All') {
      io.emit('message', msg);
      messages.push(msg);
      if (messages.length > 100) {
        messages.shift();
      }
    } else {
      io.to(msg.to).emit('message', msg);
      io.to(msg.from).emit('message', msg);
    }
  });
  // file
  socket.on('file', (msg) => {
    msg.from = socket.id;
    console.log('file: ', msg);
    if (msg.to === 'All') {
      io.emit('file', msg);
    } else {
      io.to(msg.to).emit('file', msg);
      io.to(msg.from).emit('file', msg);
    }
  });
});