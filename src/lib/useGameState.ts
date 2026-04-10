"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update, set, get } from 'firebase/database';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

// רשימת מספרים זרים ל-100 כדי להבטיח פיזור אקראי מושלם ללא חזרות
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

  const handleExit = () => {
    setStep(2);
    setRoomId('');
    setRoomData(null);
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
      const seed = coprimes[Math.floor(Math.random() * coprimes.length)]; // הגרלת סדר שאלות חכם
      
      const initialData = {
        id: newRoomId,
        creatorId: userId,
        step: 3,
        gameMode: 'team',
        difficulty: 'dynamic', 
        seed: seed,
        players: [{ id: userId, name, teamIdx: 0, color: '#3b82f6' }],
        teamNames: ['קבוצה 1', 'קבוצה 2'],
        timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 }, 
        powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] }, 
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
        const seed = coprimes[Math.floor(Math.random() * coprimes.length)];

        const botNames = ['בוט ספורט', 'בוט היסטוריה', 'בוט מדע', 'בוט מוזיקה', 'בוט סרטים'];
        const botColors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const bots = botNames.map((bn, i) => ({
          id: `bot-${i}`, name: bn, teamIdx: (i + 1) % 2, color: botColors[i], isBot: true
        }));

        const qaData = {
          id: 'עומר',
          creatorId: userId, 
          step: 3,
          gameMode: 'team',
          difficulty: 'dynamic', 
          seed: seed,
          players: [...bots, { id: userId, name, teamIdx: 0, color: '#3b82f6' }],
          teamNames: ['קבוצה 1', 'קבוצה 2'],
          timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 },
          powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] },
          currentQuestionIdx: 0,
          votes: {},
          status: 'waiting'
        };
        await set(roomRef, qaData); 
        
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

  const handleAnswer = async (isCorrect: boolean, timeAtAnswer: number) => {
    if (!roomData || !roomId) return;
    const isIndividual = roomData.gameMode === 'individual';
    const me = roomData.players.find((p: any) => p.id === userId);
    const key = isIndividual ? me.name : roomData.teamNames[me.teamIdx];
    
    let timeChange = isIndividual ? (isCorrect ? 5 : -2) : (isCorrect ? 10 : -7);
    const newTime = timeAtAnswer + timeChange;
    const newTimeBanks = { ...roomData.timeBanks, [key]: Math.max(0, newTime) };
    const nextIdx = (roomData.currentQuestionIdx || 0) + 1;

    if (isIndividual) {
      const newSoloCount = (roomData.soloQuestionCount || 0) + 1;
      
      if (newTime >= 60) {
        updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: key });
      } else if (newTime <= 0) {
        updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: "Game Over" });
      } else if (newSoloCount % 5 === 0) {
        // מסך בונוס כל 5 שאלות
        const powerUps = ['50:50', 'freeze', 'slow-mo'];
        const randomPU = powerUps[Math.floor(Math.random() * powerUps.length)];
        const currentPUs = roomData.powerUps[key] || [];
        
        updateRoom({ 
          timeBanks: newTimeBanks, 
          powerUps: { ...roomData.powerUps, [key]: [...currentPUs, randomPU] },
          step: 8, 
          soloQuestionCount: newSoloCount,
          lastGrantedPowerUp: randomPU,
          currentQuestionIdx: nextIdx,
          votes: {} 
        });
      } else {
        // המשיכו רגיל לשאלה הבאה (שלב נשאר 5)
        updateRoom({ timeBanks: newTimeBanks, currentQuestionIdx: nextIdx, soloQuestionCount: newSoloCount, votes: {} });
      }
    } else {
      if (newTime >= 120) {
        updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: key });
      } else if (newTime <= 0) {
        updateRoom({ timeBanks: newTimeBanks, step: 7, winnerName: "Game Over" });
      } else {
        // קבוצתי עובר תמיד למסך N+1
        updateRoom({ timeBanks: newTimeBanks, step: 6, lastCorrect: isCorrect, votes: {} });
      }
    }
  };

  const restartGame = () => {
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)]; // ערבוב חדש בריסטארט
    updateRoom({ step: 3, currentQuestionIdx: 0, soloQuestionCount: 0, seed: seed, votes: {}, timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 } });
  };

  return {
    mounted, userId, roomId, roomData, step,
    setStep: (s: number) => { setStep(s); if(roomId) updateRoom({ step: s }); },
    updateRoom, handleCreateRoom, handleJoinRoom, setUserName, userName, handleAnswer, restartGame, handleExit
  };
}