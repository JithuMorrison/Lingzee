import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './authcontext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const WS_URL = "http://localhost:5000";

  useEffect(() => {
    if (user) {
      const newSocket = io(WS_URL, {
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};