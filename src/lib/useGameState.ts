"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update, set, get } from 'firebase/database';

// תחליף מאובטח ל-uuid שמונע קריסות של ייבוא ספריות חיצוניות
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

export function useGameState() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    setMounted(true);
    const savedId = localStorage.getItem('trivia_user_id') || generateId();
    localStorage.setItem('trivia_user_id', savedId);
    setUserId(savedId);
    const savedName = localStorage.getItem('trivia_user_name') || '';
    setUserName(savedName);
  }, []);

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
    try {
      const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
      const initialData = {
        id: newRoomId,
        creatorId: userId,
        step: 3,
        gameMode: 'team',
        difficulty: 'dynamic', // מעודכן לפי אפיון 2.4 (משתנה = ברירת מחדל)
        players: [{ id: userId, name, teamIdx: 0, color: '#3b82f6' }],
        teamNames: ['קבוצה 1', 'קבוצה 2'],
        timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 }, // מעודכן ל-15 שניות פתיחה
        powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] }, // תשתית לכלים עתידיים
        currentQuestionIdx: 0,
        soloQuestionCount: 0,
        votes: {},
        status: 'waiting'
      };
      await set(ref(db, `rooms/${newRoomId}`), initialData);
      localStorage.setItem('trivia_user_name', name);
      setRoomId(newRoomId);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    try {
      const cleanCode = code.trim();
      let roomKey = cleanCode;

      if (cleanCode === 'עומר') {
        roomKey = 'qa_omer_room';
        const roomRef = ref(db, `rooms/${roomKey}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
          const botNames = ['בוט ספורט', 'בוט היסטוריה', 'בוט מדע', 'בוט מוזיקה', 'בוט סרטים'];
          const botColors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
          const bots = botNames.map((bn, i) => ({
            id: `bot-${i}`, name: bn, teamIdx: (i + 1) % 2, color: botColors[i], isBot: true
          }));

          const qaData = {
            id: 'עומר',
            creatorId: 'qa-admin',
            step: 3,
            gameMode: 'team',
            difficulty: 'dynamic', 
            players: [...bots, { id: userId, name, teamIdx: 0, color: '#3b82f6' }],
            teamNames: ['קבוצה 1', 'קבוצה 2'],
            timeBanks: { 'קבוצה 1': 60, 'קבוצה 2': 60 },
            powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] },
            currentQuestionIdx: 0,
            votes: {},
            status: 'waiting'
          };
          await set(roomRef, qaData);
        } else {
          const data = snapshot.val();
          const players = data.players || [];
          if (!players.find((p: any) => p.id === userId)) {
            players.push({ id: userId, name, teamIdx: 0, color: '#3b82f6' });
            await update(roomRef, { players });
          }
        }
        localStorage.setItem('trivia_user_name', name);
        setRoomId(roomKey);
        setStep(3);
        return true;
      }

      const roomRef = ref(db, `rooms/${cleanCode}`);
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const players = data.players || [];
        if (!players.find((p: any) => p.id === userId)) {
          const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
          const playerColor = colors[players.length % colors.length];
          players.push({ id: userId, name, teamIdx: players.length % 2, color: playerColor });
          await update(roomRef, { players, step: data.step || 3 });
        }
        localStorage.setItem('trivia_user_name', name);
        setRoomId(cleanCode);
        setStep(data.step || 3);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!roomData || !roomId) return;
    const isIndividual = roomData.gameMode === 'individual';
    const me = roomData.players.find((p: any) => p.id === userId);
    const key = isIndividual ? me.name : roomData.teamNames[me.teamIdx];
    
    let timeChange = isIndividual ? (isCorrect ? 5 : -2) : (isCorrect ? 10 : -7);
    const newTime = (roomData.timeBanks[key] || 0) + timeChange;
    const newTimeBanks = { ...roomData.timeBanks, [key]: Math.max(0, newTime) };

    if (newTime >= (isIndividual ? 60 : 120)) {
      updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: key });
    } else {
      updateRoom({ timeBanks: newTimeBanks, step: 6, lastCorrect: isCorrect, votes: {} });
    }
  };

  const restartGame = () => {
    updateRoom({ step: 3, currentQuestionIdx: 0, votes: {}, timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 } });
  };

  return {
    mounted, userId, roomId, roomData, step,
    setStep: (s: number) => { setStep(s); if(roomId) updateRoom({ step: s }); },
    updateRoom, handleCreateRoom, handleJoinRoom, setUserName, userName, handleAnswer, restartGame
  };
}