"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';

const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

export function useMultiplayerGameState(roomId: string) {
  const [userId, setUserId] = useState<string>('');
  const [roomData, setRoomData] = useState<any>(null);
  const [step, setStep] = useState(3); 

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
        if (data.step) setStep(data.step);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  /**
   * Watcher: מנהל את המעברים בין השלבים ומעניק כוחות עזר
   */
  useEffect(() => {
    if (!roomData || roomData.step !== 5 || !roomId) return;

    const allTeams = roomData.teamNames || [];
    const results = roomData.roundResults || {};
    
    const allFinished = allTeams.length > 0 && allTeams.every((name: string) => results[name]?.answered === true);

    if (allFinished) {
      const currentIdx = roomData.currentQuestionIdx || 0;
      const nextIdx = currentIdx + 1;
      const isCheckpoint = nextIdx > 0 && nextIdx % 5 === 0;
      
      const updatePayload: any = {
        step: 6,
        currentQuestionIdx: nextIdx,
        readyTeams: {}, 
        votes: null,
        isCheckpointNext: isCheckpoint
      };

      // הענקת כוח עזר בכל שאלה חמישית
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

      // בדיקת תנאי ניצחון
      allTeams.forEach((name: string) => {
        if (roomData.timeBanks[name] >= 120) {
          updatePayload.step = 7;
          updatePayload.winnerName = name;
        }
      });

      // בדיקת תנאי הפסד (Game Over)
      const anyTimeLeft = allTeams.some((name: string) => roomData.timeBanks[name] > 0);
      if (!anyTimeLeft) {
        updatePayload.step = 9;
        updatePayload.winnerName = "Game Over";
      }

      update(ref(db, `rooms/${roomId}`), updatePayload);
    }
  }, [roomData, roomId]);

  /**
   * ניקוי נתוני סבב לקראת שאלה חדשה
   */
  useEffect(() => {
    if (!roomData || !roomId) return;
    if (roomData.step === 4 && roomData.roundResults !== null) {
      update(ref(db, `rooms/${roomId}`), {
        roundResults: null,
        votes: null
      });
    }
  }, [roomData?.step, roomId, roomData?.roundResults]);

  const updateRoom = (updates: any) => {
    if (roomId) update(ref(db, `rooms/${roomId}`), updates);
  };

  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any, teamToUpdate?: string) => {
    if (!roomData || !roomId) return;
    
    let teamName = teamToUpdate;
    if (!teamName) {
      const me = roomData.players.find((p: any) => p.id === userId);
      if (!me) return;
      teamName = roomData.teamNames[me.teamIdx];
    }
    
    const currentBankTime = roomData.timeBanks[teamName!] || 0;
    const newTime = Math.max(0, currentBankTime + (isCorrect ? 10 : -7));
    
    const updates: any = {};
    updates[`timeBanks/${teamName}`] = newTime;
    updates[`roundResults/${teamName}`] = {
      isCorrect,
      finalTime: newTime,
      answered: true
    };
    updates[`lastQuestion`] = questionObj;

    update(ref(db, `rooms/${roomId}`), updates);
  };

  const restartGame = () => {
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    updateRoom({ 
      step: 3, 
      currentQuestionIdx: 0, 
      seed, 
      votes: null, 
      roundResults: null,
      timeBanks: roomData.teamNames.reduce((acc: any, name: string) => ({...acc, [name]: 15}), {}), 
      askedQuestions: [], 
      readyTeams: {},
      isCheckpointNext: false,
      powerUps: roomData.teamNames.reduce((acc: any, name: string) => ({...acc, [name]: []}), {}),
      teamEffects: {}
    });
  };

  return { userId, roomData, step, updateRoom, handleAnswer, restartGame };
}