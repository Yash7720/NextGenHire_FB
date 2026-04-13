import { io } from 'socket.io-client'

const BASE_URL = 'http://localhost:5002'

let socket

export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  }
  return socket
}
