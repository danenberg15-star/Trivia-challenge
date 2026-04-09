"use client";
import { useEffect, useRef } from "react";
import { useGameState } from "../src/lib/useGameState"; 
import RulesStep from "./components/RulesStep"; 
import EntryStep from "./components/EntryStep";
import SetupStep from "./components/SetupStep";
import CountdownStep from "./components/CountdownStep";
import GameStep from "./components/GameStep";
import ScoreStep from "./components/ScoreStep";
import VictoryStep from "./components/VictoryStep";

export default function TriviaApp() {
  const { 
    mounted, userId, roomId, roomData, step, setStep, updateRoom,
    handleCreateRoom, handleJoinRoom, setUserName, handleAnswer, restartGame
  } = useGameState();

  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { console.log("Wake Lock request failed"); }
    };
    if (mounted) requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
      }
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', overflow: 'hidden' }}>
      {step === 1 && <RulesStep onStart={() => setStep(2)} />}
      {step === 2 && <EntryStep onJoin={handleJoinRoom} onCreate={handleCreateRoom} onSetName={setUserName} />}
      {step === 3 && roomData && <SetupStep roomData={roomData} userId={userId} updateRoom={updateRoom} onStart={() => updateRoom({ step: 4, preGameTimer: 3 })} />}
      {step === 4 && <CountdownStep timer={roomData?.preGameTimer || 3} />}
      {step === 5 && roomData && <GameStep roomData={roomData} userId={userId} updateRoom={updateRoom} handleAnswer={handleAnswer} />}
      {step === 6 && roomData && <ScoreStep roomData={roomData} onNext={() => updateRoom({ step: 5, currentQuestionIdx: (roomData.currentQuestionIdx || 0) + 1 })} />}
      {step === 7 && roomData && <VictoryStep winnerName={roomData.winnerName} onRestart={restartGame} />}
    </main>
  );
}