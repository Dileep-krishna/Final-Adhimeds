import { io } from 'socket.io-client';
import SERVERURL from "@/app/services/serverURL";

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SERVERURL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ✅ Always join the store room using the ObjectId from the token
export const joinStoreRoom = (storeId) => {
  const socket = getSocket();

  // ✅ If storeId is missing or not a valid ObjectId, get it from token
  if (!storeId || !storeId.match(/^[0-9a-fA-F]{24}$/)) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id) {
          storeId = payload.id; // ✅ ObjectId
        }
      } catch (_) {}
    }
    if (!storeId) {
      storeId = localStorage.getItem('storeId') || sessionStorage.getItem('storeId');
    }
  }

  if (socket && storeId) {
    // Only join if it's a valid ObjectId
    if (storeId.match(/^[0-9a-fA-F]{24}$/)) {
      socket.emit('join-store-room', storeId);
      console.log(`📡 Joined store room: store-${storeId}`);
    } else {
      console.warn(`⚠️ Invalid storeId (not an ObjectId): ${storeId} – skipping room join`);
    }
  } else {
    console.warn('⚠️ Cannot join store room: socket not initialized or storeId missing');
  }
};