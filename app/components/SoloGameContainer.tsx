"use client";
import { useState, useEffect } from "react";
import { db } from "../../src/lib/firebase"; 
import { ref, set } from "firebase/database"; 
import CountdownStep from "./CountdownStep";
import GameStep from "./GameStep";
import ScoreStep from "./ScoreStep";
import VictoryStep from "./VictoryStep";
import CheckpointStep from "./CheckpointStep";
import LoseStep from "./LoseStep";

interface SoloGameContainerProps {
  userId: string;
  userName: string; 
  onExit: () => void;
}

export default function SoloGameContainer({ userId, userName, onExit }: SoloGameContainerProps) {
  const [step, setStep] = useState(4);
  const [finalScore, setFinalScore] = useState(0); 
  const [lastPU, setLastPU] = useState<string>(""); 

  // יצירת מזהה ייחודי למשחק הנוכחי - לא משתנה לאורך כל הסשן
  const [gameId] = useState(() => Math.random().toString(36).substring(2, 11));

  const [roomData, setRoomData] = useState<any>({
    id: 'solo',
    gameMode: 'individual',
    difficulty: 'dynamic',
    askedQuestions: [], 
    correctCount: 0,
    currentQuestionIdx: 0,
    seed: Math.floor(Math.random() * 100),
    timeBanks: { [userName]: 20 },
    powerUps: { [userName]: [] },
    players: [{ id: userId, name: userName, teamIdx: 0 }],
    teamNames: [userName],
    preGameTimer: 3,
    lastCorrect: false,
    lastQuestion: null,
    isCheckpointNext: false
  });

  // פונקציה לשמירת הניקוד בזמן אמת
  const saveLiveScore = (score: number) => {
    if (score <= 0) return;

    const scoreEntry = {
      name: userName || "אורח",
      score: score,
      date: Date.now(),
      difficulty: "Dynamic",
      gameId: gameId
    };

    // 1. שמירה ב-Firebase - דריסה של הרשומה לפי gameId
    const scoreRef = ref(db, `highscores/${gameId}`);
    set(scoreRef, scoreEntry);

    // 2. שמירה ב-LocalStorage - דריסה לפי gameId
    try {
      const localData = localStorage.getItem('trivia_solo_highscores');
      let localScores = localData ? JSON.parse(localData) : [];
      
      // הסרת גרסה קודמת של אותו משחק
      localScores = localScores.filter((s: any) => s.gameId !== gameId);
      localScores.push(scoreEntry);
      
      // מיון ושמירה של ה-20 הטובים ביותר
      localScores.sort((a: any, b: any) => b.score - a.score);
      localStorage.setItem('trivia_solo_highscores', JSON.stringify(localScores.slice(0, 20)));
    } catch (e) {
      console.error("Failed to save local score", e);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    const newCorrectCount = isCorrect ? roomData.correctCount + 1 : roomData.correctCount;
    const isCheckpoint = (newCorrectCount > 0 && newCorrectCount % 5 === 0 && isCorrect);
    
    // חישוב ניקוד עדכני (לפי הלוגיקה הקיימת של 10 נקודות לשאלה)
    if (isCorrect) {
      saveLiveScore(newCorrectCount * 10);
    }

    const update = {
      correctCount: newCorrectCount,
      lastCorrect: isCorrect,
      isCheckpointNext: isCheckpoint,
      currentQuestionIdx: roomData.currentQuestionIdx + 1
    };

    if (isCheckpoint) {
      const allPUs = ['50:50', 'freeze', 'slow-mo'];
      const randomPU = allPUs[Math.floor(Math.random() * allPUs.length)];
      setLastPU(randomPU);
      
      const currentPUs = roomData.powerUps[userName] || [];
      setRoomData({
        ...roomData,
        ...update,
        powerUps: { ...roomData.powerUps, [userName]: [...currentPUs, randomPU] }
      });
      setStep(8); 
    } else {
      setRoomData({ ...roomData, ...update });
      setStep(6); 
    }
  };

  const updateRoom = (newData: any) => {
    // בדיקת סוף משחק בגלל זמן
    if (newData.timeBanks && newData.timeBanks[userName] <= 0) {
      const score = roomData.correctCount * 10;
      setFinalScore(score);
      saveLiveScore(score); // שמירה סופית במקרה של הפסד זמן
      setStep(9);
      return;
    }
    setRoomData(newData);
  };

  const onRestart = () => {
    window.location.reload(); 
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100dvh', 
      position: 'relative', 
      backgroundColor: '#05081c',
      overflow: 'hidden'
    }}>
      <button 
        onClick={onExit}
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          background: 'rgba(255,255,255,0.1)', 
          border: 'none', 
          color: 'white', 
          borderRadius: '50%', 
          width: '40px', 
          height: '40px', 
          fontSize: '1.2rem', 
          zIndex: 100, 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        ✕
      </button>

      {step === 4 && (
        <CountdownStep 
          timer={roomData.preGameTimer || 3} 
          onComplete={() => setStep(5)} 
        />
      )}
      
      {step === 5 && (
        <GameStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          handleAnswer={handleAnswer} 
          onDirectStepChange={(s: number) => setStep(s)} 
        />
      )}
      
      {step === 6 && (
        <ScoreStep 
          roomData={roomData} 
          onNext={() => setStep(5)} 
        />
      )}
      
      {step === 7 && (
        <VictoryStep 
          winnerName={userName} 
          score={finalScore} 
          onRestart={onRestart} 
        />
      )}
      
      {step === 8 && (
        <CheckpointStep 
          powerUp={lastPU} 
          onNext={() => setStep(5)} 
        />
      )}
      
      {step === 9 && (
        <LoseStep 
          score={finalScore} 
          onRestart={onRestart} 
        />
      )}
    </div>
  );
}