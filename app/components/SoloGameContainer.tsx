"use client";
import { useState, useEffect } from "react";
import { db } from "../../src/lib/firebase"; 
import { ref, push, set } from "firebase/database"; 
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
  
  // תוספות למדידת זמן הישרדות ושמירה רציפה
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [timeAlive, setTimeAlive] = useState(0);
  const [sessionId, setSessionId] = useState(() => `solo_${userId}_${Date.now()}`);

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
    lastCorrect: false
  });

  // תיעוד רגע תחילת המשחק (שלב 5) לצורך חישוב זמן הישרדות בלבד
  useEffect(() => {
    if (step === 5 && !gameStartTime) {
      setGameStartTime(Date.now());
    }
  }, [step, gameStartTime]);

  const updateRoom = (updates: any) => {
    setRoomData((prev: any) => ({ ...prev, ...updates }));
    if (updates.step !== undefined) setStep(updates.step);
  };

  // פונקציה פסיבית לשמירת ניקוד וזמן הישרדות בזמן אמת
  const saveLiveProgress = (currentCorrectCount: number) => {
    if (currentCorrectCount <= 0) return;

    let score = currentCorrectCount * 10;
    let difficultyLabel = "רמה משתנה";
    if (roomData.difficulty === 'easy') { score = score / 4; difficultyLabel = "קל"; }
    else if (roomData.difficulty === 'hard') { score = score * 2; difficultyLabel = "קשה"; }

    const survivalSeconds = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;

    const scoreData = {
      name: userName,
      score: Math.round(score),
      date: Date.now(),
      difficulty: difficultyLabel,
      gameId: sessionId,
      timeAlive: survivalSeconds
    };

    // עדכון הרשומה הקיימת בענן (דריסה לפי sessionId)
    set(ref(db, `highscores/${sessionId}`), scoreData);
    
    // עדכון מקומי
    const localData = JSON.parse(localStorage.getItem('trivia_solo_highscores') || '[]');
    const filteredLocal = localData.filter((s: any) => s.gameId !== sessionId);
    filteredLocal.push(scoreData);
    localStorage.setItem('trivia_solo_highscores', JSON.stringify(filteredLocal.sort((a:any, b:any) => b.score - a.score).slice(0, 50)));
  };

  const calculateAndSaveScore = (isVictory: boolean, questionsAsked: number, correctCount: number) => {
    let score = 0;
    
    if (isVictory) {
      const accuracy = correctCount / questionsAsked;
      score = (12 / questionsAsked) * 10000 * accuracy;
    } else {
      score = correctCount * 10;
    }

    let difficultyLabel = "רמה משתנה";
    if (roomData.difficulty === 'easy') {
      score = score / 4;
      difficultyLabel = "קל";
    } else if (roomData.difficulty === 'hard') {
      score = score * 2;
      difficultyLabel = "קשה";
    }

    const finalResult = Math.max(0, Math.round(score));
    const survivalSeconds = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    setTimeAlive(survivalSeconds); // עדכון לתצוגה במסך ההפסד

    const scoreData = {
      name: userName,
      score: finalResult,
      date: Date.now(),
      difficulty: difficultyLabel,
      gameId: sessionId,
      timeAlive: survivalSeconds
    };

    // שמירה סופית
    set(ref(db, `highscores/${sessionId}`), scoreData);

    const localScores = JSON.parse(localStorage.getItem('trivia_solo_highscores') || '[]');
    const filteredLocal = localScores.filter((s: any) => s.gameId !== sessionId);
    filteredLocal.push(scoreData);
    localStorage.setItem('trivia_solo_highscores', JSON.stringify(filteredLocal.sort((a:any, b:any) => b.score - a.score).slice(0, 50)));

    return finalResult;
  };

  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    const timeChange = isCorrect ? 5 : -2;
    const newTime = Math.max(0, timeAtAnswer + timeChange);
    const nextIdx = roomData.currentQuestionIdx + 1;
    const newCorrectCount = isCorrect ? (roomData.correctCount || 0) + 1 : (roomData.correctCount || 0);
    
    const questionText = typeof questionObj === 'string' ? questionObj : questionObj?.text;
    const updatedAsked = [...(roomData.askedQuestions || []), questionText];

    // שמירה שקטה של ההתקדמות אם התשובה נכונה
    if (isCorrect) {
      saveLiveProgress(newCorrectCount);
    }

    const updatedData = { 
      ...roomData, 
      timeBanks: { [userName]: newTime }, 
      currentQuestionIdx: nextIdx, 
      correctCount: newCorrectCount,
      lastCorrect: isCorrect,
      askedQuestions: updatedAsked
    };

    if (newTime >= 60) {
      const score = calculateAndSaveScore(true, nextIdx, newCorrectCount);
      setFinalScore(score);
      setStep(7);
    } else if (newTime <= 0) {
      const score = calculateAndSaveScore(false, nextIdx, newCorrectCount);
      setFinalScore(score);
      setStep(9);
    } else if (nextIdx > 0 && nextIdx % 5 === 0) {
      const powers = ['50:50', 'freeze', 'slow-mo'];
      const randomPU = powers[Math.floor(Math.random() * 3)];
      
      setLastPU(randomPU); 
      
      updatedData.powerUps = { 
        ...roomData.powerUps, 
        [userName]: [...(roomData.powerUps[userName] || []), randomPU] 
      };
      updatedData.lastGrantedPowerUp = randomPU;
      
      setRoomData(updatedData);
      setStep(8);
    } else {
      setRoomData(updatedData);
      setStep(6);
    }
  };

  const onRestart = () => {
    // אתחול מזהה סשן ומדידות זמן
    setSessionId(`solo_${userId}_${Date.now()}`);
    setGameStartTime(null);
    setTimeAlive(0);
    
    setRoomData((prev: any) => ({
      ...prev,
      askedQuestions: [],
      currentQuestionIdx: 0,
      correctCount: 0,
      timeBanks: { [userName]: 20 },
      powerUps: { [userName]: [] },
      seed: Math.floor(Math.random() * 100),
      lastCorrect: false,
      lastGrantedPowerUp: null
    }));
    setFinalScore(0);
    setStep(4);
  };

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', backgroundColor: '#05081c' }}>
      <button 
        onClick={onExit} 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          background: 'rgba(255,255,255,0.1)', 
          border: '1px solid rgba(255,255,255,0.2)', 
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
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          forcedPowerUp={lastPU} 
          onComplete={() => setStep(5)} 
        />
      )}
      
      {step === 9 && (
        <LoseStep 
          score={finalScore} 
          timeAlive={timeAlive}
          onRestart={onRestart} 
        />
      )}
    </div>
  );
}