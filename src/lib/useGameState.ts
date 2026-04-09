"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update, set, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

export function useGameState() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setMounted(true);
    const savedId = localStorage.getItem('trivia_user_id') || uuidv4();
    localStorage.setItem('trivia_user_id', savedId);
    setUserId(savedId);

    const savedName = localStorage.getItem('trivia_user_name') || '';
    setUserName(savedName);
  }, []);

  // סנכרון מול Firebase
  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        if (data.step) setStep(data.step);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const updateRoom = (updates: any) => {
    if (!roomId) return;
    update(ref(db, `rooms/${roomId}`), updates);
  };

  const handleCreateRoom = async (name: string) => {
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    const initialData = {
      id: newRoomId,
      creatorId: userId,
      step: 3, // עוברים ישר ללובי/הגדרות
      gameMode: 'team',
      difficulty: 'easy',
      players: [{ id: userId, name, teamIdx: 0, color: '#3b82f6' }],
      teamNames: ['קבוצה 1', 'קבוצה 2'],
      timeBanks: { 'קבוצה 1': 20, 'קבוצה 2': 20 },
      status: 'waiting',
      createdAt: Date.now()
    };
    await set(ref(db, `rooms/${newRoomId}`), initialData);
    setRoomId(newRoomId);
    localStorage.setItem('trivia_user_name', name);
  };

  const handleJoinRoom = async (code: string, name: string) => {
    const roomRef = ref(db, `rooms/${code}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const players = data.players || [];
      if (!players.find((p: any) => p.id === userId)) {
        const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const playerColor = colors[players.length % colors.length];
        players.push({ id: userId, name, teamIdx: 1, color: playerColor });
        await update(roomRef, { players });
      }
      setRoomId(code);
      localStorage.setItem('trivia_user_name', name);
      return true;
    }
    return false;
  };

  return {
    mounted, userId, roomId, roomData, step,
    setStep: (s: number) => { setStep(s); if(roomId) updateRoom({ step: s }); },
    updateRoom, handleCreateRoom, handleJoinRoom, setUserName, userName
  };
}