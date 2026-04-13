"use client";
import { useState, useEffect } from "react";
import { db } from "../../src/lib/firebase"; 
import { ref, push } from "firebase/database"; 
import CountdownStep from "./CountdownStep";
import GameStep from "./GameStep";
import ScoreStep from "./ScoreStep";
import VictoryStep from "./VictoryStep";
import CheckpointStep from "./CheckpointStep";
import LoseStep from "./LoseStep";

interface SoloGameContainerProps {
  userId: string;
  onExit: () => void;
}

export default function SoloGameContainer({ userId, onExit }: SoloGameContainerProps) {
  const [step, setStep] = useState(4);
  const [finalScore, setFinalScore] = useState(0); 

  // פונקציה לשליפת שם עדכני למניעת "שחקן"
  const getInitialName = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('trivia_user_name') || 'שחקן';
    }
    return 'שחקן';
  };

  const [roomData, setRoomData] = useState<any>({
    id: 'solo',
    gameMode: 'individual',
    difficulty: 'dynamic',
    askedQuestions: [], 
    correctCount: 0,
    players: [{ id: userId, name: getInitialName(), teamIdx: 0, color: '#00E5FF' }],
    teamNames: [getInitialName()],
    timeBanks: { [getInitialName()]: 20 },
    powerUps: { [getInitialName()]: [] },
    currentQuestionIdx: 0,
    seed: Math.floor(Math.random() * 100),
    votes: {},
    preGameTimer: 3
  });

  const updateRoom = (updates: any) => {
    setRoomData((prev: any) => ({ ...prev, ...updates }));
    if (updates.step !== undefined) setStep(updates.step);
  };

  const calculateAndSaveScore = (isVictory: boolean, questionsAsked: number, correctCount: number) => {
    const currentName = localStorage.getItem('trivia_user_name') || 'שחקן';
    
    let score = 0;
    if (isVictory) {
      // נוסחת היעילות: (12 / שאלות) * 10,000 * אחוז דיוק
      const accuracy = correctCount / questionsAsked;
      score = (12 / questionsAsked) * 10000 * accuracy;
    } else {
      score = correctCount * 10;
    }

    // מכפילי קושי
    let difficultyLabel = "רמה משתנה";
    if (roomData.difficulty === 'easy') {
      score = score / 4;
      difficultyLabel = "קל";
    } else if (roomData.difficulty === 'hard') {
      score = score * 2;
      difficultyLabel = "קשה";
    }

    const finalResult = Math.max(0, Math.round(score));
    const timestamp = Date.now(); // זמן אחיד לשתי השמירות למניעת כפילויות

    // 1. שמירה לענן
    push(ref(db, 'highscores'), {
      name: currentName,
      score: finalResult,
      date: timestamp,
      difficulty: difficultyLabel
    });

    // 2. שמירה מקומית
    const localScores = JSON.parse(localStorage.getItem('trivia_solo_highscores') || '[]');
    localScores.push({ name: currentName, score: finalResult, date: timestamp, difficulty: difficultyLabel });
    localStorage.setItem('trivia_solo_highscores', JSON.stringify(localScores.slice(-50)));

    return finalResult;
  };

  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    const currentName = localStorage.getItem('trivia_user_name') || 'שחקן';
    const timeChange = isCorrect ? 5 : -2;
    const newTime = Math.max(0, timeAtAnswer + timeChange);
    const nextIdx = roomData.currentQuestionIdx + 1;
    const newCorrectCount = isCorrect ? (roomData.correctCount || 0) + 1 : (roomData.correctCount || 0);
    
    const questionText = typeof questionObj === 'string' ? questionObj : questionObj?.text;
    const updatedAsked = [...(roomData.askedQuestions || []), questionText];

    const updatedData = { 
      ...roomData, 
      timeBanks: { [currentName]: newTime }, 
      currentQuestionIdx: nextIdx, 
      correctCount: newCorrectCount,
      lastCorrect: isCorrect, 
      votes: {},
      askedQuestions: updatedAsked
    };

    if (newTime >= 60) {
      const score = calculateAndSaveScore(true, nextIdx, newCorrectCount);
      setFinalScore(score);
      setRoomData({ ...updatedData, winnerName: currentName });
      setStep(7);
    } else if (newTime <= 0) {
      const score = calculateAndSaveScore(false, nextIdx, newCorrectCount);
      setFinalScore(score);
      setRoomData(updatedData);
      setStep(9);
    } else if (nextIdx > 0 && nextIdx % 5 === 0) {
      const powers = ['50:50', 'freeze', 'slow-mo'];
      const randomPU = powers[Math.floor(Math.random() * 3)];
      updatedData.powerUps = { [currentName]: [...(roomData.powerUps[currentName] || []), randomPU] };
      updatedData.lastGrantedPowerUp = randomPU;
      setRoomData(updatedData);
      setStep(8);
    } else {
      setRoomData(updatedData);
      setStep(6);
    }
  };

  const onRestart = () => {
    const currentName = localStorage.getItem('trivia_user_name') || 'שחקן';
    setRoomData((prev: any) => ({
      ...prev,
      askedQuestions: [],
      currentQuestionIdx: 0,
      correctCount: 0,
      timeBanks: { [currentName]: 20 },
      powerUps: { [currentName]: [] },
      seed: Math.floor(Math.random() * 100),
      preGameTimer: 3
    }));
    setFinalScore(0);
    setStep(4);
  };

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <button onClick={onExit} style={s.exitBtn}>✕</button>

      {step === 4 && <CountdownStep timer={roomData.preGameTimer || 3} onComplete={() => setStep(5)} />}
      {step === 5 && <GameStep roomData={roomData} userId={userId} updateRoom={updateRoom} handleAnswer={handleAnswer} onDirectStepChange={(s: number) => setStep(s)} />}
      {step === 6 && <ScoreStep roomData={roomData} onNext={() => setStep(5)} />}
      {step === 7 && <VictoryStep winnerName={localStorage.getItem('trivia_user_name') || 'מנצח'} score={finalScore} onRestart={onRestart} />}
      {step === 8 && <CheckpointStep roomData={roomData} userId={userId} updateRoom={updateRoom} onComplete={() => setStep(5)} />}
      {step === 9 && <LoseStep score={finalScore} onRestart={onRestart} />}
    </div>
  );
}

const s: any = {
  exitBtn: { position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};