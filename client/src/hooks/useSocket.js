import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room:joined', (info) => {
      setRoomInfo(info);
      setError(null);
    });

    socket.on('game:state', (state) => {
      setGameState(state);
      setResult(null);
    });

    socket.on('game:result', (res) => setResult(res));

    socket.on('chat', (msg) => {
      setMessages(prev => [...prev.slice(-99), { ...msg, id: Date.now() + Math.random() }]);
    });

    socket.on('error', ({ message }) => setError(message));

    return () => socket.disconnect();
  }, []);

  const joinRoom = useCallback((roomId, playerName) => {
    socketRef.current?.emit('room:join', { roomId, playerName });
  }, []);

  const startGame = useCallback((roomId) => {
    socketRef.current?.emit('game:start', { roomId });
  }, []);

  const sendAction = useCallback((action, amount) => {
    socketRef.current?.emit('game:action', { action, amount });
  }, []);

  const sendMessage = useCallback((message) => {
    socketRef.current?.emit('chat:message', { message });
  }, []);

  return { connected, gameState, messages, error, roomInfo, result, joinRoom, startGame, sendAction, sendMessage };
}
