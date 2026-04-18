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

  const updateRoom = (updates: any) => {
    if (roomId) update(ref(db, `rooms/${roomId}`), updates);
  };

  /**
   * handleAnswer המעודכן:
   * מקבל כעת פרמטר אופציונלי teamToUpdate כדי לאפשר לבוטים לסיים סבב.
   */
  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any, teamToUpdate?: string) => {
    if (!roomData || !roomId) return;
    
    // קביעת שם הקבוצה לעדכון (של המשתמש או שם קבוצה שנכפה, למשל בוט)
    let teamName = teamToUpdate;
    if (!teamName) {
      const me = roomData.players.find((p: any) => p.id === userId);
      if (!me) return;
      teamName = roomData.teamNames[me.teamIdx];
    }
    
    const currentBankTime = roomData.timeBanks[teamName!] || 0;
    const newTime = Math.max(0, currentBankTime + (isCorrect ? 10 : -7));
    const newTimeBanks = { ...(roomData.timeBanks || {}), [teamName!]: newTime };
    
    const currentRoundResults = roomData.roundResults || {};
    const updatedRoundResults = {
      ...currentRoundResults,
      [teamName!]: {
        isCorrect,
        finalTime: newTime,
        answered: true
      }
    };

    const baseUpdate: any = {
      timeBanks: newTimeBanks,
      roundResults: updatedRoundResults,
      lastQuestion: questionObj,
    };

    const allTeams = roomData.teamNames || [];
    const allFinished = allTeams.every((name: string) => updatedRoundResults[name]?.answered);

    if (allFinished) {
      const nextIdx = (roomData.currentQuestionIdx || 0) + 1;
      const isCheckpoint = nextIdx > 0 && nextIdx % 5 === 0;
      
      baseUpdate.step = 6;
      baseUpdate.currentQuestionIdx = nextIdx;
      baseUpdate.readyTeams = {}; 
      baseUpdate.votes = null;    
      baseUpdate.isCheckpointNext = isCheckpoint;

      allTeams.forEach((name: string) => {
        if (newTimeBanks[name] >= 120) {
          baseUpdate.step = 7;
          baseUpdate.winnerName = name;
        }
      });
      
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
      roundResults: null,
      timeBanks: roomData.teamNames.reduce((acc: any, name: string) => ({...acc, [name]: 15}), {}), 
      askedQuestions: [], 
      readyTeams: {},
      isCheckpointNext: false
    });
  };

  return { userId, roomData, step, updateRoom, handleAnswer, restartGame };
}