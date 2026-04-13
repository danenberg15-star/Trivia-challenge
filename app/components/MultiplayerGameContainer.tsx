"use client";
import { useGameState } from "../../src/lib/useGameState";
import SetupStep from "./SetupStep";
import CountdownStep from "./CountdownStep";
import MultiplayerGameStep from "./MultiplayerGameStep";
import MultiplayerScoreStep from "./MultiplayerScoreStep";
import VictoryStep from "./VictoryStep";
import CheckpointStep from "./CheckpointStep";
import LoseStep from "./LoseStep";

interface MultiplayerGameContainerProps {
  onExit: () => void;
}

export default function MultiplayerGameContainer({ onExit }: MultiplayerGameContainerProps) {
  const { 
    userId, roomData, step, updateRoom, handleAnswer, restartGame 
  } = useGameState();

  if (!roomData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>טוען נתוני חדר...</div>;

  const handleExitWithCleanup = () => {
    onExit();
  };

  return (
    <div style={{ position: 'relative', height: '100dvh' }}>
      {/* כפתור יציאה שמופיע רק בשלבים הרלוונטיים */}
      {step >= 3 && (
        <button 
          onClick={handleExitWithCleanup} 
          style={{ 
            position: 'absolute', top: '20px', left: '20px', 
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
            color: 'white', borderRadius: '50%', width: '40px', height: '40px', 
            fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >✕</button>
      )}

      {step === 3 && <SetupStep roomData={roomData} userId={userId} updateRoom={updateRoom} onStart={() => updateRoom({ step: 4, preGameTimer: 3 })} />}
      
      {step === 4 && <CountdownStep timer={roomData.preGameTimer || 3} onComplete={() => updateRoom({ step: 5 })} />}
      
      {step === 5 && (
        <MultiplayerGameStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          handleAnswer={handleAnswer} 
          onDirectStepChange={(s: number) => updateRoom({ step: s })} 
        />
      )}
      
      {step === 6 && (
        <MultiplayerScoreStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          onNext={() => {
            // לוגיקת הניתוב המתוקנת: בודקים אם השאלה הבאה היא צ'קפוינט
            if (roomData.isCheckpointNext) {
              updateRoom({ step: 8, isCheckpointNext: false });
            } else {
              updateRoom({ step: 4, preGameTimer: 3 });
            }
          }} 
        />
      )}

      {step === 7 && <VictoryStep winnerName={roomData.winnerName || "המנצחים"} onRestart={restartGame} />}
      
      {step === 8 && (
        <CheckpointStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          onComplete={() => updateRoom({ step: 5 })} 
        />
      )}
      
      {step === 9 && <LoseStep onRestart={restartGame} />}
    </div>
  );
}