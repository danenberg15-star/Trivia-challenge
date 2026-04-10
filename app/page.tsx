"use client";
import { useEffect, useRef, useState } from "react";
import { useGameState } from "../src/lib/useGameState"; 
import RulesStep from "./components/RulesStep"; 
import EntryStep from "./components/EntryStep";
import SetupStep from "./components/SetupStep";
import CountdownStep from "./components/CountdownStep";
import GameStep from "./components/GameStep";
import ScoreStep from "./components/ScoreStep";
import VictoryStep from "./components/VictoryStep";
import CheckpointStep from "./components/CheckpointStep";
import LoseStep from "./components/LoseStep";

export default function TriviaApp() {
  const firebaseProps = useGameState();
  const { 
    mounted, userId, roomData: fbRoomData, step: fbStep, setStep: setFbStep, 
    updateRoom: updateFbRoom, handleCreateRoom, handleJoinRoom, setUserName, 
    handleAnswer: handleFbAnswer, restartGame: restartFbGame, handleExit: handleFbExit 
  } = firebaseProps;

  // State מקומי למשחק יחיד (ללא פיירבייס)
  const [isSolo, setIsSolo] = useState(false);
  const [localStep, setLocalStep] = useState(1);
  const [localRoomData, setLocalRoomData] = useState<any>(null);

  const wakeLockRef = useRef<any>(null);

  // הנתונים הפעילים (מקומי או פיירבייס)
  const currentStep = isSolo ? localStep : fbStep;
  const activeData = isSolo ? localRoomData : fbRoomData;

  useEffect(() => {
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } 
      catch (err) { console.log("Wake Lock request failed"); }
    };
    if (mounted) requestWakeLock();
    return () => { wakeLockRef.current?.release(); };
  }, [mounted]);

  if (!mounted) return null;

  // יצירת משחק (מקומי או רשת)
  const handleCreate = async (name: string, solo: boolean, diff: string = "dynamic") => {
    setUserName(name);
    if (solo) {
      setIsSolo(true);
      const initialSoloData = {
        id: 'solo',
        gameMode: 'individual',
        difficulty: diff,
        players: [{ id: userId, name, teamIdx: 0, color: '#10b981' }],
        teamNames: [name],
        timeBanks: { [name]: 20 },
        powerUps: { [name]: [] },
        currentQuestionIdx: 0,
        seed: Math.floor(Math.random() * 100),
        votes: {}
      };
      setLocalRoomData(initialSoloData);
      setLocalStep(4); // מעבר ישיר לספירה לאחור בסולו
    } else {
      setIsSolo(false);
      await handleCreateRoom(name);
    }
  };

  // עדכון נתונים גנרי
  const updateActiveRoom = (updates: any) => {
    if (isSolo) setLocalRoomData((prev: any) => ({ ...prev, ...updates }));
    else updateFbRoom(updates);
  };

  // טיפול בתשובה (פיצול לוגיקה בין סולו לקבוצה)
  const onAnswer = (isCorrect: boolean, timeAtAnswer: number) => {
    if (isSolo) {
      const me = localRoomData.players[0];
      const timeChange = isCorrect ? 5 : -2;
      const newTime = Math.max(0, timeAtAnswer + timeChange);
      const nextIdx = localRoomData.currentQuestionIdx + 1;

      const updatedData = { ...localRoomData, 
        timeBanks: { [me.name]: newTime },
        currentQuestionIdx: nextIdx,
        lastCorrect: isCorrect,
        votes: {} 
      };

      if (newTime >= 60) {
        setLocalRoomData({ ...updatedData, winnerName: me.name });
        setLocalStep(7); // ניצחון
      } else if (newTime <= 0) {
        setLocalRoomData(updatedData);
        setLocalStep(9); // הפסד
      } else if (nextIdx > 0 && nextIdx % 5 === 0) {
        // צ'ק-פוינט כל 5 שאלות
        const powers = ['50:50', 'freeze', 'slow-mo'];
        const randomPU = powers[Math.floor(Math.random() * powers.length)];
        updatedData.powerUps = { [me.name]: [...(localRoomData.powerUps[me.name] || []), randomPU] };
        updatedData.lastGrantedPowerUp = randomPU;
        setLocalRoomData(updatedData);
        setLocalStep(8);
      } else {
        // רציף - מדלג ישירות לשאלה הבאה ללא מסך ניקוד
        setLocalRoomData(updatedData);
        setLocalStep(5);
      }
    } else {
      handleFbAnswer(isCorrect, timeAtAnswer);
    }
  };

  // יציאה ואיפוס
  const onExit = () => {
    if (isSolo) { setIsSolo(false); setLocalStep(2); setLocalRoomData(null); } 
    else { handleFbExit(); }
  };

  const onRestart = () => {
    if (isSolo) handleCreate(localRoomData.players[0].name, true, localRoomData.difficulty);
    else restartFbGame();
  };

  return (
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', overflow: 'hidden', position: 'relative' }}>
      
      {currentStep >= 3 && (
        <button 
          onClick={onExit} 
          style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >✕</button>
      )}

      {currentStep === 1 && <RulesStep onStart={() => isSolo ? setLocalStep(2) : setFbStep(2)} />}
      
      {currentStep === 2 && (
        <EntryStep 
          onJoin={async (c, n) => { setIsSolo(false); return handleJoinRoom(c, n); }} 
          onCreate={handleCreate} 
          onSetName={setUserName} 
        />
      )}

      {currentStep === 3 && activeData && (
        <SetupStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} onStart={() => updateActiveRoom({ step: 4, preGameTimer: 3 })} />
      )}

      {currentStep === 4 && (
        <CountdownStep timer={activeData?.preGameTimer || 3} onComplete={() => isSolo ? setLocalStep(5) : updateActiveRoom({ step: 5 })} />
      )}
      
      {currentStep === 5 && activeData && (
        <GameStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} handleAnswer={onAnswer} />
      )}

      {currentStep === 6 && activeData && (
        <ScoreStep roomData={activeData} onNext={() => updateActiveRoom({ step: 5, currentQuestionIdx: activeData.currentQuestionIdx })} />
      )}
      
      {currentStep === 7 && activeData && (
        <VictoryStep winnerName={activeData.winnerName || "מנצח"} onRestart={onRestart} />
      )}

      {currentStep === 8 && activeData && (
        <CheckpointStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} />
      )}

      {currentStep === 9 && (
        <LoseStep onRestart={onRestart} />
      )}
    </main>
  );
}