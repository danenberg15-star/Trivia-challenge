"use client";
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
    handleCreateRoom, handleJoinRoom, setUserName 
  } = useGameState();

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
            updateRoom({ step: 4, preGameTimer: 3 });
          }} 
        />
      )}

      {step === 4 && <CountdownStep timer={roomData?.preGameTimer || 3} />}

      {step === 5 && roomData && (
        <GameStep 
          roomData={roomData}
          userId={userId}
          updateRoom={updateRoom}
          onFinishQuestion={() => setStep(6)}
        />
      )}

      {step === 6 && roomData && (
        <ScoreStep 
          roomData={roomData}
          onNext={() => setStep(5)}
        />
      )}
    </main>
  );
}