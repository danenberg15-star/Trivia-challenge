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

export default function TriviaApp() {
  const { 
    mounted, userId, roomId, roomData, step, setStep, updateRoom,
    handleCreateRoom, handleJoinRoom, setUserName, handleAnswer, restartGame, handleExit
  } = useGameState();

  const wakeLockRef = useRef<any>(null);
  // דגל פנימי למעבר מיידי בסולו
  const [isSoloInitiated, setIsSoloInitiated] = useState(false);

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
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', overflow: 'hidden', position: 'relative' }}>
      
      {step >= 3 && (
        <button 
          onClick={() => { setIsSoloInitiated(false); handleExit(); }} 
          style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>
      )}

      {step === 1 && <RulesStep onStart={() => setStep(2)} />}
      
      {step === 2 && (
        <EntryStep 
          onJoin={handleJoinRoom} 
          onCreate={async (name, isSolo, diff) => {
            if (isSolo) setIsSoloInitiated(true);
            await handleCreateRoom(name);
            updateRoom({ 
              gameMode: isSolo ? 'individual' : 'team',
              difficulty: diff,
              step: isSolo ? 4 : 3,
              preGameTimer: isSolo ? 3 : 0
            });
          }} 
          onSetName={setUserName} 
        />
      )}

      {step === 3 && (
        isSoloInitiated || roomData?.gameMode === "individual" ? (
          /* דריסה: אם זה סולו, מציגים את הספירה לאחור כאן כדי למנוע היתקעות */
          <CountdownStep 
            timer={3} 
            onComplete={() => {
              setIsSoloInitiated(false);
              updateRoom({ step: 5 });
            }}
          />
        ) : !roomData ? (
          <div style={{color: 'white', textAlign: 'center', marginTop: '50px', fontSize: '1.2rem'}}>טוען נתונים... ⏱️</div>
        ) : (
          <SetupStep 
            roomData={roomData} 
            userId={userId} 
            updateRoom={updateRoom} 
            onStart={() => updateRoom({ step: 4, preGameTimer: 3 })} 
          />
        )
      )}

      {step === 4 && (
        <CountdownStep 
          timer={roomData?.preGameTimer || 3} 
          onComplete={() => updateRoom({ step: 5 })}
        />
      )}
      
      {step === 5 && roomData && (
        <GameStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          handleAnswer={handleAnswer} 
        />
      )}

      {step === 6 && roomData && (
        <ScoreStep 
          roomData={roomData} 
          onNext={() => updateRoom({ step: 5, currentQuestionIdx: (roomData.currentQuestionIdx || 0) + 1 })} 
        />
      )}
      
      {step === 7 && roomData && (
        <VictoryStep 
          winnerName={roomData.winnerName || "הקבוצה המנצחת"} 
          onRestart={() => { setIsSoloInitiated(false); restartGame(); }} 
        />
      )}

      {step === 8 && roomData && (
        <CheckpointStep
          roomData={roomData}
          userId={userId}
          updateRoom={updateRoom}
        />
      )}
    </main>
  );
}