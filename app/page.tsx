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
  const [showRules, setShowRules] = useState(false);
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

  // הצגת חלונות עזר (חוקים ושיאים)
  if (showRules) return <RulesStep onStart={() => setShowRules(false)} />;
  if (showHighscores) return <HighscoresStep onClose={() => setShowHighscores(false)} />;

  // ניתוב לקונטיינר הנבחר
  if (gameMode === "solo") return <SoloGameContainer userId={userId} onExit={() => setGameMode("none")} />;
  if (gameMode === "multi") return <MultiplayerGameContainer onExit={() => setGameMode("none")} />;

  // מסך כניסה (Router)
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
          if (solo) setGameMode("solo");
          else {
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