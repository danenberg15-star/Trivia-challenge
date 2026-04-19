"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';

const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

export function useMultiplayerGameState(roomId: string) {
  const [userId, setUserId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(3); 

  const roomDataRef = useRef<any>(null);
  const isChangingStepRef = useRef(false); 

  useEffect(() => {
    const savedId = localStorage.getItem('trivia_user_id') || '';
    setUserId(savedId);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
        roomDataRef.current = data;
        if (data.step) setStep(data.step);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  /**
   * Watcher 1: מעבר לשלב התוצאות והענקת כוחות
   */
  useEffect(() => {
    if (!roomData || !roomId) return;

    if (roomData.step !== 5) {
      isChangingStepRef.current = false;
      return;
    }

    const allTeams = roomData.teamNames || [];
    const results = roomData.roundResults || {};
    
    // מוודא שכל הקבוצות בחדר סיימו לענות באופן תקין
    const allFinished = allTeams.length > 0 && allTeams.every((name: string) => results[name]?.answered === true);

    if (allFinished && !isChangingStepRef.current) {
      isChangingStepRef.current = true; 

      const currentIdx = roomData.currentQuestionIdx || 0;
      const nextIdx = currentIdx + 1;
      const isCheckpoint = nextIdx > 0 && nextIdx % 5 === 0;
      
      const updatePayload: any = {
        step: 6,
        currentQuestionIdx: nextIdx,
        readyTeams: null, 
        votes: null,
        isCheckpointNext: isCheckpoint
      };

      if (isCheckpoint) {
        const powerUps = ['50:50', 'freeze', 'slow-mo'];
        const randomPU = powerUps[Math.floor(Math.random() * powerUps.length)];
        const currentPowerUpsObj = roomData.powerUps || {};
        const updatedPowerUps: any = {};

        allTeams.forEach((name: string) => {
          const teamPUs = currentPowerUpsObj[name] || [];
          updatedPowerUps[name] = [...teamPUs, randomPU];
        });

        updatePayload.powerUps = updatedPowerUps;
        updatePayload.lastGrantedPowerUp = randomPU;
      }

      // --- לוגיקת הניצחון וההישרדות החדשה ---
      const aliveTeams = allTeams.filter((name: string) => (roomData.timeBanks[name] || 0) > 0);
      let winner = null;
      let isGameOver = false;

      // 1. תנאי ניצחון ראשון: מישהו הגיע ל-120 שניות
      allTeams.forEach((name: string) => {
        if ((roomData.timeBanks[name] || 0) >= 120) {
          winner = name;
        }
      });

      // 2. תנאי ניצחון שני (השורד האחרון): נשארה רק קבוצה אחת חיה (ובמשחק התחילו יותר מקבוצה אחת)
      if (!winner && aliveTeams.length === 1 && allTeams.length > 1) {
        winner = aliveTeams[0];
      }

      // 3. תנאי הפסד כולל: כל הקבוצות הגיעו ל-0
      if (aliveTeams.length === 0) {
        isGameOver = true;
      }

      // החלת תוצאות הסיום אם יש
      if (isGameOver) {
        updatePayload.step = 9;
        updatePayload.winnerName = "Game Over";
      } else if (winner) {
        updatePayload.step = 7;
        updatePayload.winnerName = winner;
      }

      update(ref(db, `rooms/${roomId}`), updatePayload).catch(console.error);
    }
  }, [roomData, roomId]);

  /**
   * Watcher 2: ניקוי נתונים
   */
  useEffect(() => {
    if (!roomData || !roomId) return;
    if (roomData.step === 4 && roomData.roundResults) {
      update(ref(db, `rooms/${roomId}`), {
        roundResults: null,
        votes: null
      }).catch(console.error);
    }
  }, [roomData?.step, roomId, roomData?.roundResults]);

  const updateRoom = useCallback((updates: any) => {
    if (roomId) update(ref(db, `rooms/${roomId}`), updates).catch(console.error);
  }, [roomId]);

  const handleAnswer = useCallback((isCorrect: boolean, timeAtAnswer: number, questionObj: any, teamToUpdate?: string) => {
    if (!roomId) return;
    
    const data = roomDataRef.current;
    if (!data) return;

    let teamName = teamToUpdate;
    if (!teamName) {
      const me = data.players.find((p: any) => p.id === userId);
      if (!me) return;
      teamName = data.teamNames[me.teamIdx];
    }
    
    const currentBankTime = data.timeBanks?.[teamName!] || 0;
    
    // מניעת "תחיית המתים": אם אתה על 0 שניות, אתה נשאר שם
    let newTime = currentBankTime;
    let finalIsCorrect = isCorrect;

    if (currentBankTime > 0) {
      newTime = Math.max(0, currentBankTime + (isCorrect ? 10 : -7));
    } else {
      newTime = 0;
      finalIsCorrect = false; 
    }
    
    const updates: any = {};
    updates[`timeBanks/${teamName}`] = newTime;
    updates[`roundResults/${teamName}`] = {
      isCorrect: finalIsCorrect,
      finalTime: newTime,
      answered: true
    };
    updates[`lastQuestion`] = questionObj;

    update(ref(db, `rooms/${roomId}`), updates).catch(console.error);
  }, [roomId, userId]);

  const restartGame = useCallback(() => {
    const data = roomDataRef.current;
    if (!data) return;
    
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    const teams = data.teamNames || ['קבוצה 1', 'קבוצה 2'];
    
    updateRoom({ 
      step: 3, 
      currentQuestionIdx: 0, 
      seed, 
      votes: null, 
      roundResults: null,
      timeBanks: teams.reduce((acc: any, name: string) => ({...acc, [name]: 15}), {}), 
      askedQuestions: [], 
      readyTeams: null,
      isCheckpointNext: false,
      powerUps: teams.reduce((acc: any, name: string) => ({...acc, [name]: []}), {}),
      teamEffects: {}
    });
  }, [updateRoom]);

  return { userId, roomData, step, updateRoom, handleAnswer, restartGame };
}