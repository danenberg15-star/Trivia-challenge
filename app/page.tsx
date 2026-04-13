"use client";
import { useState, useEffect, useRef } from "react";
import { useGameState } from "../src/lib/useGameState"; 
import EntryStep from "./components/EntryStep";
import RulesStep from "./components/RulesStep";
import HighscoresStep from "./components/HighscoresStep";
import SoloGameContainer from "./components/SoloGameContainer";
import MultiplayerGameContainer from "./components/MultiplayerGameContainer";

export default function TriviaApp() {
  const { mounted, userId, setUserName, handleCreateRoom, handleJoinRoom } = useGameState();
  
  const [gameMode, setGameMode] = useState<"none" | "solo" | "multi">("none");
  const [showHighscores, setShowHighscores] = useState(false);
  const [showRules, setShowRules] = useState(true); 
  const [playerName, setPlayerName] = useState<string>("אורח"); // נוסף סטייט לשמירת השם המוקלד
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try { 
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { 
        console.log("Wake Lock failed"); 
      }
    };
    if (mounted) requestWakeLock();
    return () => { wakeLockRef.current?.release(); };
  }, [mounted]);

  if (!mounted) return null;

  if (showRules) return <RulesStep onStart={() => { setShowRules(false); setShowHighscores(true); }} />;
  
  if (showHighscores) return <HighscoresStep onClose={() => setShowHighscores(false)} />;

  // כעת מעבירים את ה-playerName למשחק הסולו כדי לפתור את השגיאה ולהשתמש בשם המוקלד
  if (gameMode === "solo") return <SoloGameContainer userId={userId} userName={playerName} onExit={() => setGameMode("none")} />;
  if (gameMode === "multi") return <MultiplayerGameContainer onExit={() => setGameMode("none")} />;

  return (
    <main style={{ height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', overflow: 'hidden' }}>
      <EntryStep 
        onJoin={async (code, name) => {
          const success = await handleJoinRoom(code, name);
          if (success) setGameMode("multi");
          return success;
        }} 
        onCreate={async (name, solo) => {
          setUserName(name);
          setPlayerName(name); // שמירת השם שהוקלד כדי להעביר אותו כ-Prop
          if (solo) {
            setGameMode("solo");
          } else {
            await handleCreateRoom(name);
            setGameMode("multi");
          }
        }} 
        onSetName={setUserName} 
        onViewHighscores={() => setShowHighscores(true)} 
      />
      
      <button 
        onClick={() => setShowRules(true)}
        style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          background: 'none', 
          border: 'none', 
          color: 'rgba(255,255,255,0.3)', 
          cursor: 'pointer', 
          textDecoration: 'underline',
          fontSize: '0.9rem'
        }}
      >
        חוקי המשחק
      </button>
    </main>
  );
}