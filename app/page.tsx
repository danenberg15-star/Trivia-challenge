"use client";
import { useGameState } from "../src/lib/useGameState"; 
import RulesStep from "./components/RulesStep"; 
import EntryStep from "./components/EntryStep";
import SetupStep from "./components/SetupStep";

export default function TriviaApp() {
  const { 
    mounted, userId, roomId, roomData, step, setStep, updateRoom,
    handleCreateRoom, handleJoinRoom, setUserName 
  } = useGameState();

  if (!mounted) return null;

  return (
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl' }}>
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
          onStart={() => setStep(4)} // מעבר לטיימר 3 שניות
        />
      )}

      {step > 3 && (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px' }}>
          <h1>המשחק מתחיל!</h1>
          <p>בשלב הבא נבנה את מסך השאלות עם השעון העגול.</p>
        </div>
      )}
    </main>
  );
}