"use client";
import { useState } from "react";
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
  // התחלה ישירה משלב 4 (Countdown) ללא מסך Setup כפי שביקשת
  const [step, setStep] = useState(4);
  const [roomData, setRoomData] = useState<any>({
    id: 'solo',
    gameMode: 'individual',
    difficulty: 'dynamic',
    askedQuestions: [], 
    players: [{ id: userId, name: localStorage.getItem('trivia_user_name') || 'שחקן', teamIdx: 0, color: '#00E5FF' }],
    teamNames: [localStorage.getItem('trivia_user_name') || 'שחקן'],
    timeBanks: { [localStorage.getItem('trivia_user_name') || 'שחקן']: 20 },
    powerUps: { [localStorage.getItem('trivia_user_name') || 'שחקן']: [] },
    currentQuestionIdx: 0,
    seed: Math.floor(Math.random() * 100),
    votes: {},
    preGameTimer: 3
  });

  const updateRoom = (updates: any) => {
    setRoomData((prev: any) => ({ ...prev, ...updates }));
    if (updates.step !== undefined) setStep(updates.step);
  };

  const handleAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    const me = roomData.players[0];
    const timeChange = isCorrect ? 5 : -2;
    const newTime = Math.max(0, timeAtAnswer + timeChange);
    const nextIdx = roomData.currentQuestionIdx + 1;
    
    const updatedAsked = [...(roomData.askedQuestions || []), questionObj.text];

    const updatedData = { 
      ...roomData, 
      timeBanks: { [me.name]: newTime }, 
      currentQuestionIdx: nextIdx, 
      lastCorrect: isCorrect, 
      votes: {},
      askedQuestions: updatedAsked
    };

    if (newTime >= 60) {
      push(ref(db, 'highscores'), {
        name: me.name,
        score: newTime,
        date: Date.now(),
        difficulty: roomData.difficulty
      });
      setRoomData({ ...updatedData, winnerName: me.name });
      setStep(7);
    } else if (newTime <= 0) {
      setRoomData(updatedData);
      setStep(9);
    } else if (nextIdx > 0 && nextIdx % 5 === 0) {
      const powers = ['50:50', 'freeze', 'slow-mo'];
      const randomPU = powers[Math.floor(Math.random() * powers.length)];
      updatedData.powerUps = { [me.name]: [...(roomData.powerUps[me.name] || []), randomPU] };
      updatedData.lastGrantedPowerUp = randomPU;
      setRoomData(updatedData);
      setStep(8); // Checkpoint
    } else {
      setRoomData(updatedData);
      setStep(6); // Score
    }
  };

  const onRestart = () => {
    setRoomData({
      ...roomData,
      askedQuestions: [],
      currentQuestionIdx: 0,
      timeBanks: { [roomData.players[0].name]: 20 },
      powerUps: { [roomData.players[0].name]: [] },
      seed: Math.floor(Math.random() * 100),
      preGameTimer: 3
    });
    setStep(4);
  };

  return (
    <div style={{ position: 'relative', height: '100dvh' }}>
      <button 
        onClick={onExit} 
        style={{ 
          position: 'absolute', top: '20px', left: '20px', 
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
          color: 'white', borderRadius: '50%', width: '40px', height: '40px', 
          fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}
      >✕</button>

      {step === 4 && <CountdownStep timer={roomData.preGameTimer || 3} onComplete={() => setStep(5)} />}
      {step === 5 && <GameStep roomData={roomData} userId={userId} updateRoom={updateRoom} handleAnswer={handleAnswer} onDirectStepChange={(s: number) => setStep(s)} />}
      {step === 6 && <ScoreStep roomData={roomData} onNext={() => setStep(5)} />}
      {step === 7 && <VictoryStep winnerName={roomData.winnerName} onRestart={onRestart} />}
      {step === 8 && <CheckpointStep roomData={roomData} userId={userId} updateRoom={updateRoom} onComplete={() => setStep(5)} />}
      {step === 9 && <LoseStep onRestart={onRestart} />}
    </div>
  );
}