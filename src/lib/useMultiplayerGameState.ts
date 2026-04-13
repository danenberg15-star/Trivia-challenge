"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';

const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

export function useMultiplayerGameState(roomId: string) {
  const [userId, setUserId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(3); // המשחק הקבוצתי תמיד מתחיל מחדר ההמתנה (שלב 3)

  // 1. שליפת ה-ID של המשתמש שכבר נוצר במסך הכניסה
  useEffect(() => {
    const savedId = localStorage.getItem('trivia_user_id') || '';
    setUserId(savedId);
  }, []);

  // 2. האזנה אקטיבית ורציפה לנתוני החדר מ-Firebase בהתבסס על ה-roomId שהתקבל
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
    return () => unsubscribe(); // ניתוק האזנה בסיום המשחק
  }, [roomId]);

  // פונקציה מהירה לעדכון נתונים בשרת
  const updateRoom = (updates: any) => {
    if (roomId) update(ref(db, `rooms/${roomId}`), updates);
  };

  // ניהול המענה על השאלה והזמנים (ייעודי למשחק קבוצתי)
  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    if (!roomData || !roomId) return;
    
    const me = roomData.players.find((p: any) => p.id === userId);
    const teamName = roomData.teamNames[me.teamIdx];
    
    // ניקוד קבוצתי: +10 על הצלחה, -7 על כישלון
    const newTime = Math.max(0, timeAtAnswer + (isCorrect ? 10 : -7));
    const newTimeBanks = { ...(roomData.timeBanks || {}), [teamName]: newTime };
    const nextIdx = (roomData.currentQuestionIdx || 0) + 1;
    
    const asked = roomData.askedQuestions || [];
    const nextAsked = [...asked, questionObj.text];

    const isCheckpoint = nextIdx > 0 && nextIdx % 5 === 0;

    const baseUpdate: any = {
      timeBanks: newTimeBanks,
      askedQuestions: nextAsked,
      lastCorrect: isCorrect,
      lastAnsweringTeam: teamName,
      lastQuestion: questionObj,
      readyTeams: {}, // איפוס מוכנות לשאלה הבאה
      currentQuestionIdx: nextIdx,
      votes: null,
      isCheckpointNext: isCheckpoint 
    };

    // אם הגענו לשאלת כוח
    if (isCheckpoint) {
      const randomPU = ['50:50', 'freeze', 'slow-mo'][Math.floor(Math.random() * 3)];
      const safePowerUpsObj = roomData.powerUps || {};
      const currentPUs = safePowerUpsObj[teamName] || [];
      baseUpdate.lastGrantedPowerUp = randomPU;
      baseUpdate.powerUps = { ...safePowerUpsObj, [teamName]: [...currentPUs, randomPU] };
    }

    // בדיקת ניצחון או הפסד
    if (newTime >= 120) {
      updateRoom({ ...baseUpdate, step: 7, winnerName: teamName });
    } else if (newTime <= 0) {
      updateRoom({ ...baseUpdate, step: 9, winnerName: "Game Over" });
    } else {
      updateRoom({ ...baseUpdate, step: 6 });
    }
  };

  // אתחול מחדש של החדר לסיבוב נוסף
  const restartGame = () => {
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    updateRoom({ 
      step: 3, 
      currentQuestionIdx: 0, 
      seed, 
      votes: null, 
      timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 }, 
      askedQuestions: [], 
      readyTeams: {},
      isCheckpointNext: false
    });
  };

  return { userId, roomData, step, updateRoom, handleAnswer, restartGame };
}