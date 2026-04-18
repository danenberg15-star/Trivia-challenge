"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';

const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

export function useMultiplayerGameState(roomId: string) {
  const [userId, setUserId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(3); 

  // 1. שליפת ה-ID של המשתמש
  useEffect(() => {
    const savedId = localStorage.getItem('trivia_user_id') || '';
    setUserId(savedId);
  }, []);

  // 2. האזנה אקטיבית ל-Firebase
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

  /**
   * handleAnswer המעודכן:
   * לא מעביר שלב מיד, אלא רושם את תוצאת הקבוצה ב-roundResults.
   * המעבר לשלב 6 יקרה רק כשכל הקבוצות סיימו.
   */
  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    if (!roomData || !roomId) return;
    
    const me = roomData.players.find((p: any) => p.id === userId);
    const teamName = roomData.teamNames[me.teamIdx];
    
    // חישוב זמן חדש
    const newTime = Math.max(0, timeAtAnswer + (isCorrect ? 10 : -7));
    const newTimeBanks = { ...(roomData.timeBanks || {}), [teamName]: newTime };
    
    // עדכון תוצאות הסבב עבור הקבוצה הספציפית
    const currentRoundResults = roomData.roundResults || {};
    const updatedRoundResults = {
      ...currentRoundResults,
      [teamName]: {
        isCorrect,
        finalTime: newTime,
        answered: true
      }
    };

    const baseUpdate: any = {
      timeBanks: newTimeBanks,
      roundResults: updatedRoundResults,
      lastQuestion: questionObj, // נשמר לצורך תצוגה במסך הניקוד
    };

    // בדיקה האם כל הקבוצות בחדר סיימו לענות
    const allTeams = roomData.teamNames || [];
    const allFinished = allTeams.every((name: string) => updatedRoundResults[name]?.answered);

    if (allFinished) {
      // אם כולם סיימו, עוברים למסך הצ'ק-אין (שלב 6) ומקדמים אינדקס שאלה
      const nextIdx = (roomData.currentQuestionIdx || 0) + 1;
      const isCheckpoint = nextIdx > 0 && nextIdx % 5 === 0;
      
      baseUpdate.step = 6;
      baseUpdate.currentQuestionIdx = nextIdx;
      baseUpdate.readyTeams = {}; // איפוס מוכנות לשלב הבא
      baseUpdate.votes = null;    // ניקוי הצבעות לסבב הבא
      baseUpdate.isCheckpointNext = isCheckpoint;

      // בדיקת ניצחון/הפסד גלובלית (אם קבוצה הגיעה ליעד או כולם נפסלו)
      // הערה: הלוגיקה הזו תופעל במסך הניקוד או בסיום האנימציה, 
      // אבל אנחנו רושמים את המנצח כבר עכשיו אם מישהו עבר את ה-120
      allTeams.forEach((name: string) => {
        if (newTimeBanks[name] >= 120) {
          baseUpdate.step = 7;
          baseUpdate.winnerName = name;
        }
      });
      
      // אם כל הזמנים של כולם הם 0
      const anyTimeLeft = allTeams.some((name: string) => newTimeBanks[name] > 0);
      if (!anyTimeLeft) {
        baseUpdate.step = 9;
        baseUpdate.winnerName = "Game Over";
      }
    }

    updateRoom(baseUpdate);
  };

  const restartGame = () => {
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    updateRoom({ 
      step: 3, 
      currentQuestionIdx: 0, 
      seed, 
      votes: null, 
      roundResults: null, // איפוס תוצאות סבב
      timeBanks: roomData.teamNames.reduce((acc: any, name: string) => ({...acc, [name]: 15}), {}), 
      askedQuestions: [], 
      readyTeams: {},
      isCheckpointNext: false
    });
  };

  return { userId, roomData, step, updateRoom, handleAnswer, restartGame };
}