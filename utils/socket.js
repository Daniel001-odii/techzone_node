// socket.js
const http = require('http');
const { Server } = require('socket.io');

let io;

const initializeSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"],
      credentials: true,  // Allow credentials (cookies, etc.)
    },
  });

  io.on('connection', (socket) => {
      console.log("new socket io connection...");

      // Listen for the 'join' event and join the room
      socket.on('join', (room) => {
          socket.join(room);
          console.log(`Socket joined room: ${room}`);
      });

      socket.on('disconnect', () => {
          console.log('Socket disconnected');
      });
  });

  return server;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIo };
