import { io } from 'socket.io-client'

const BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:5002`
  : 'http://localhost:5002'

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
