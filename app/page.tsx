"use client";
import { useEffect, useState } from "react";
import { useGameState } from "../src/lib/useGameState"; 
import RulesStep from "./components/RulesStep"; 
import EntryStep from "./components/EntryStep";
import SetupStep from "./components/SetupStep";
import GameStep from "./components/GameStep"; // ניצור אותו מיד

export default function TriviaApp() {
  const { 
    mounted, userId, roomId, roomData, step, setStep, updateRoom,
    handleCreateRoom, handleJoinRoom, setUserName 
  } = useGameState();

  const [localTime, setLocalTime] = useState(20);

  // ניהול טיימר מקומי בזמן משחק
  useEffect(() => {
    if (step !== 5) return; // רק בשלב המשחק
    
    const interval = setInterval(() => {
      setLocalTime(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  if (!mounted) return null;

  return (
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', overflow: 'hidden' }}>
      {step === 1 && <RulesStep onStart={() => setStep(2)} />}
      
      {step === 2 && (
        <EntryStep 
          onJoin={handleJoinRoom} 
          onCreate={handleCreateRoom}
          onSetName={setUserName}
        />
      )}

      {step === 3 && roomData && (
        <SetupStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          onStart={() => {
            setLocalTime(roomData.gameMode === 'individual' ? 10 : 20);
            setStep(5);
          }} 
        />
      )}

      {step === 5 && roomData && (
        <GameStep 
          roomData={roomData}
          userId={userId}
          timeLeft={localTime}
          updateRoom={updateRoom}
          onFinishQuestion={() => setStep(6)} // מסך חשיפה
        />
      )}
    </main>
  );
}