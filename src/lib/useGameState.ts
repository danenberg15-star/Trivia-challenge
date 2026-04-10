"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update, set, get } from 'firebase/database';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

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
    setUserName(localStorage.getItem('trivia_user_name') || '');
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
    if (roomId) update(ref(db, `rooms/${roomId}`), updates);
  };

  const handleCreateRoom = async (name: string) => {
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    await set(ref(db, `rooms/${newRoomId}`), {
      id: newRoomId,
      creatorId: userId,
      step: 3,
      gameMode: 'team',
      difficulty: 'dynamic',
      seed,
      askedQuestions: [], 
      players: [{ id: userId, name, teamIdx: 0, color: '#00E5FF' }],
      teamNames: ['קבוצה 1', 'קבוצה 2'],
      timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 },
      powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] },
      currentQuestionIdx: 0,
      votes: null
    });
    localStorage.setItem('trivia_user_name', name);
    setRoomId(newRoomId);
  };

  const handleJoinRoom = async (code: string, name: string) => {
    const cleanCode = code.trim();
    const roomRef = ref(db, `rooms/${cleanCode}`);
    const snapshot = await get(roomRef);

    // לוגיקה ייעודית לחדר QA - איפוס מוחלט בכל כניסה מחודשת
    if (cleanCode === 'עומר' || cleanCode === 'qa_omer_room') {
      const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
      await set(roomRef, {
        id: cleanCode,
        creatorId: userId,
        step: 3, // תמיד מחזיר ל-SetupStep
        gameMode: 'team',
        difficulty: 'dynamic',
        seed,
        askedQuestions: [], // מאפס את היסטוריית השאלות כדי שאפשר יהיה לבדוק הכל מחדש
        players: [
          { id: userId, name, teamIdx: 0, color: '#00E5FF' },
          { id: 'bot_1', name: 'בוט אסי', teamIdx: 0, color: '#00bfa5', isBot: true },
          { id: 'bot_2', name: 'בוט גורי', teamIdx: 0, color: '#10b981', isBot: true },
          { id: 'bot_3', name: 'בוט דודו', teamIdx: 0, color: '#34d399', isBot: true },
          { id: 'bot_4', name: 'בוט רוני', teamIdx: 1, color: '#FF9100', isBot: true },
          { id: 'bot_5', name: 'בוט משה', teamIdx: 1, color: '#f59e0b', isBot: true },
          { id: 'bot_6', name: 'בוט יוסי', teamIdx: 1, color: '#fbbf24', isBot: true },
          { id: 'bot_7', name: 'בוט אבי', teamIdx: 1, color: '#fb923c', isBot: true }
        ],
        teamNames: ['קבוצת QA', 'הבוטים'],
        timeBanks: { 'קבוצת QA': 15, 'הבוטים': 15 },
        powerUps: { 'קבוצת QA': [], 'הבוטים': [] },
        currentQuestionIdx: 0,
        votes: null
      });
      localStorage.setItem('trivia_user_name', name);
      setRoomId(cleanCode);
      return true;
    }

    if (!snapshot.exists()) {
      return false; // חדר רגיל שלא קיים יחזיר שגיאה
    }

    const data = snapshot.val();
    const players = data.players || [];
    if (!players.find((p: any) => p.id === userId)) {
      const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      players.push({ id: userId, name, teamIdx: players.length % 2, color: colors[players.length % colors.length] });
      await update(roomRef, { players });
    }
    localStorage.setItem('trivia_user_name', name);
    setRoomId(cleanCode);
    return true;
  };

  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionText: string) => {
    if (!roomData || !roomId) return;
    const me = roomData.players.find((p: any) => p.id === userId);
    const teamName = roomData.teamNames[me.teamIdx];
    const newTime = Math.max(0, timeAtAnswer + (isCorrect ? 10 : -7));
    const newTimeBanks = { ...(roomData.timeBanks || {}), [teamName]: newTime };
    const nextIdx = (roomData.currentQuestionIdx || 0) + 1;
    
    const asked = roomData.askedQuestions || [];
    const nextAsked = [...asked, questionText];

    if (newTime >= 120) {
      updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: teamName, askedQuestions: nextAsked });
    } else if (newTime <= 0) {
      updateRoom({ timeBanks: newTimeBanks, step: 9, winnerName: "Game Over", askedQuestions: nextAsked });
    } else if (nextIdx > 0 && nextIdx % 5 === 0) {
      const randomPU = ['50:50', 'freeze', 'slow-mo'][Math.floor(Math.random() * 3)];
      const safePowerUpsObj = roomData.powerUps || {};
      const currentPUs = safePowerUpsObj[teamName] || [];
      updateRoom({ 
        timeBanks: newTimeBanks, step: 8, lastGrantedPowerUp: randomPU,
        currentQuestionIdx: nextIdx, votes: null, askedQuestions: nextAsked,
        powerUps: { ...safePowerUpsObj, [teamName]: [...currentPUs, randomPU] } 
      });
    } else {
      updateRoom({ timeBanks: newTimeBanks, step: 6, lastCorrect: isCorrect, currentQuestionIdx: nextIdx, votes: null, askedQuestions: nextAsked });
    }
  };

  const restartGame = () => {
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    updateRoom({ step: 3, currentQuestionIdx: 0, seed, votes: null, timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 }, askedQuestions: [] });
  };

  const handleExit = () => { setStep(2); setRoomId(''); setRoomData(null); };

  return { mounted, userId, roomId, roomData, step, setStep, updateRoom, handleCreateRoom, handleJoinRoom, setUserName, handleAnswer, restartGame, handleExit };
}