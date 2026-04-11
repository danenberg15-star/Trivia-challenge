"use client";
import { useEffect, useRef, useState } from "react";
import { useGameState } from "../src/lib/useGameState"; 
import { db } from "../src/lib/firebase"; 
import { ref, push } from "firebase/database"; 
import RulesStep from "./components/RulesStep"; 
import EntryStep from "./components/EntryStep";
import SetupStep from "./components/SetupStep";
import CountdownStep from "./components/CountdownStep";
import GameStep from "./components/GameStep";
import MultiplayerGameStep from "./components/MultiplayerGameStep";
import ScoreStep from "./components/ScoreStep";
import MultiplayerScoreStep from "./components/MultiplayerScoreStep"; // המנוע החדש של מסך ה-N+1
import VictoryStep from "./components/VictoryStep";
import CheckpointStep from "./components/CheckpointStep";
import LoseStep from "./components/LoseStep";
import HighscoresStep from "./components/HighscoresStep";

export default function TriviaApp() {
  const firebaseProps = useGameState();
  const { 
    mounted, userId, roomData: fbRoomData, step: fbStep, setStep: setFbStep, 
    updateRoom: updateFbRoom, handleCreateRoom, handleJoinRoom, setUserName, 
    handleAnswer: handleFbAnswer, restartGame: restartFbGame, handleExit: handleFbExit 
  } = firebaseProps;

  const [isSolo, setIsSolo] = useState(false);
  const [localStep, setLocalStep] = useState(1);
  const [localRoomData, setLocalRoomData] = useState<any>(null);
  const wakeLockRef = useRef<any>(null);

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

  const handleCreate = async (name: string, solo: boolean, difficulty: string = "dynamic") => {
    setUserName(name);
    if (solo) {
      setIsSolo(true);
      setLocalRoomData({
        id: 'solo',
        gameMode: 'individual',
        difficulty,
        askedQuestions: [], 
        players: [{ id: userId, name, teamIdx: 0, color: '#00E5FF' }],
        teamNames: [name],
        timeBanks: { [name]: 20 },
        powerUps: { [name]: [] },
        currentQuestionIdx: 0,
        seed: Math.floor(Math.random() * 100),
        votes: {}
      });
      setLocalStep(4);
    } else {
      setIsSolo(false);
      await handleCreateRoom(name);
    }
  };

  const updateActiveRoom = (updates: any) => {
    if (isSolo) {
      setLocalRoomData((prev: any) => ({ ...prev, ...updates }));
      if (updates.step !== undefined) setLocalStep(updates.step);
    } else {
      updateFbRoom(updates);
    }
  };

  const handleDirectStepChange = (newStep: number) => {
    if (isSolo) setLocalStep(newStep);
    else updateFbRoom({ step: newStep });
  };

  const onAnswer = (isCorrect: boolean, timeAtAnswer: number, questionObj: any) => {
    if (isSolo) {
      const me = localRoomData.players[0];
      const timeChange = isCorrect ? 5 : -2;
      const newTime = Math.max(0, timeAtAnswer + timeChange);
      const nextIdx = localRoomData.currentQuestionIdx + 1;
      
      const updatedData = { 
        ...localRoomData, 
        timeBanks: { [me.name]: newTime }, 
        currentQuestionIdx: nextIdx, 
        lastCorrect: isCorrect, 
        votes: {},
        askedQuestions: [...(localRoomData.askedQuestions || []), questionObj.text]
      };

      if (newTime >= 60) {
        setLocalRoomData({ ...updatedData, winnerName: me.name });
        setLocalStep(7); 
      } else if (newTime <= 0) {
        setLocalRoomData(updatedData);
        setLocalStep(9); 
      } else if (nextIdx > 0 && nextIdx % 5 === 0) {
        const powers = ['50:50', 'freeze', 'slow-mo'];
        const randomPU = powers[Math.floor(Math.random() * powers.length)];
        updatedData.powerUps = { [me.name]: [...(localRoomData.powerUps[me.name] || []), randomPU] };
        updatedData.lastGrantedPowerUp = randomPU;
        setLocalRoomData(updatedData);
        setLocalStep(8); 
      } else {
        setLocalRoomData(updatedData);
        setLocalStep(6); 
      }
    } else {
      handleFbAnswer(isCorrect, timeAtAnswer, questionObj);
    }
  };

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
      {currentStep >= 3 && currentStep !== 10 && (
        <button onClick={onExit} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', zIndex: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      )}
      
      {currentStep === 1 && <RulesStep onStart={() => isSolo ? setLocalStep(10) : setFbStep(10)} />}
      {currentStep === 2 && <EntryStep onJoin={async (c, n) => { setIsSolo(false); return handleJoinRoom(c, n); }} onCreate={handleCreate} onSetName={setUserName} onViewHighscores={() => isSolo ? setLocalStep(10) : setFbStep(10)} />}
      {currentStep === 3 && activeData && <SetupStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} onStart={() => updateActiveRoom({ step: 4, preGameTimer: 3 })} />}
      {currentStep === 4 && <CountdownStep timer={activeData?.preGameTimer || 3} onComplete={() => isSolo ? setLocalStep(5) : updateActiveRoom({ step: 5 })} />}
      
      {currentStep === 5 && activeData && (
        isSolo ? (
          <GameStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} handleAnswer={onAnswer} onDirectStepChange={handleDirectStepChange} />
        ) : (
          <MultiplayerGameStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} handleAnswer={onAnswer} onDirectStepChange={handleDirectStepChange} />
        )
      )}
      
      {/* ניתוב חכם למסך הניקוד עם העברת הכלים הנדרשים (userId ו-updateRoom) */}
      {currentStep === 6 && activeData && (
        isSolo ? (
          <ScoreStep roomData={activeData} onNext={() => setLocalStep(5)} />
        ) : (
          <MultiplayerScoreStep 
            roomData={activeData} 
            userId={userId} 
            updateRoom={updateActiveRoom} 
            onNext={() => updateActiveRoom({ step: 4, preGameTimer: 3 })} 
          />
        )
      )}

      {currentStep === 7 && activeData && <VictoryStep winnerName={activeData.winnerName || "מנצח"} onRestart={onRestart} />}
      {currentStep === 8 && activeData && <CheckpointStep roomData={activeData} userId={userId} updateRoom={updateActiveRoom} onComplete={() => isSolo ? setLocalStep(5) : updateActiveRoom({ step: 5 })} />}
      {currentStep === 9 && <LoseStep onRestart={onRestart} />}
      {currentStep === 10 && <HighscoresStep onClose={() => isSolo ? setLocalStep(2) : setFbStep(2)} />}
    </main>
  );
}