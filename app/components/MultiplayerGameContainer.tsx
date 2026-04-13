"use client";
import { useState, useEffect } from "react";
import { useMultiplayerGameState } from "../../src/lib/useMultiplayerGameState";
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
  const [activeRoomId, setActiveRoomId] = useState<string>("");

  // שליפת מספר החדר שנשמר בעת הכניסה
  useEffect(() => {
    const savedRoomId = localStorage.getItem("trivia_room_id") || "";
    setActiveRoomId(savedRoomId);
  }, []);

  // שימוש בלוגיקה הייעודית למשחק קבוצתי
  const { 
    userId, 
    roomData, 
    step, 
    updateRoom, 
    handleAnswer, 
    restartGame 
  } = useMultiplayerGameState(activeRoomId);

  // הצגת הודעת טעינה רק אם באמת אין עדיין נתונים מה-Firebase
  if (!roomData) {
    return (
      <div style={{ 
        color: 'white', 
        textAlign: 'center', 
        marginTop: '50px', 
        fontFamily: 'sans-serif',
        direction: 'rtl' 
      }}>
        טוען נתוני חדר {activeRoomId}...
      </div>
    );
  }

  // מציאת הקבוצה של המשתמש הנוכחי לצורך הצגת ניקוד בהפסד
  const me = roomData.players?.find((p: any) => p.id === userId);
  const myTeamName = me ? roomData.teamNames[me.teamIdx] : (roomData.teamNames ? roomData.teamNames[0] : "");
  
  // שליפת הניקוד הרלוונטי
  const winningScore = roomData.winnerName ? (roomData.timeBanks?.[roomData.winnerName] || 0) : 0;
  const myTeamScore = roomData.timeBanks?.[myTeamName] || 0;

  return (
    <div style={{ height: '100dvh', backgroundColor: '#05081c', overflow: 'hidden' }}>
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
            if (roomData.isCheckpointNext) {
              updateRoom({ step: 8, isCheckpointNext: false });
            } else {
              updateRoom({ step: 4, preGameTimer: 3 });
            }
          }} 
        />
      )}

      {step === 7 && (
        <VictoryStep 
          winnerName={roomData.winnerName || "המנצחים"} 
          score={winningScore}
          onRestart={restartGame} 
        />
      )}
      
      {step === 8 && (
        <CheckpointStep 
          roomData={roomData} 
          userId={userId} 
          updateRoom={updateRoom} 
          onComplete={() => updateRoom({ step: 4, preGameTimer: 3 })} 
        />
      )}
      
      {step === 9 && (
        <LoseStep 
          score={myTeamScore} 
          onRestart={restartGame} 
        />
      )}
    </div>
  );
}