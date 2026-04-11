"use client";
import React, { useEffect, useState, useRef } from "react";

export default function MultiplayerScoreStep({ roomData, userId, updateRoom, onNext }: any) {
  const [showReveal, setShowReveal] = useState(false);
  const [animatedTimes, setAnimatedTimes] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = roomData.teamNames[me.teamIdx];
  const lastAnsweringTeam = roomData.lastAnsweringTeam;
  const lastCorrect = roomData.lastCorrect;
  const lastQuestion = roomData.lastQuestion;
  const teamNames = roomData.teamNames || [];

  // בדיקת מוכנות
  const readyTeams = roomData.readyTeams || {};
  const isMyTeamReady = !!readyTeams[myTeamName];
  const allReady = teamNames.every((name: string) => !!readyTeams[name]);

  useEffect(() => {
    // אתחול ערכי הטיימר לפני האנימציה
    const initialTimes: any = {};
    teamNames.forEach((name: string) => {
      let val = roomData.timeBanks[name];
      if (name === lastAnsweringTeam) {
        val = lastCorrect ? val - 10 : val + 7;
      }
      initialTimes[name] = val;
    });
    setAnimatedTimes(initialTimes);

    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/reveal-sound.mp3");
      audioRef.current.play().catch(() => {});
    }

    const revealTimer = setTimeout(() => {
      setShowReveal(true);
      setAnimatedTimes(roomData.timeBanks);
    }, 1200);

    return () => clearTimeout(revealTimer);
  }, [roomData.timeBanks, teamNames, lastAnsweringTeam, lastCorrect]);

  // מעבר שלב רק כשכולם מוכנים
  useEffect(() => {
    if (allReady) {
      const t = setTimeout(() => onNext(), 1000);
      return () => clearTimeout(t);
    }
  }, [allReady, onNext]);

  const handleReadyClick = () => {
    if (isMyTeamReady) return;
    
    let updates: any = { [`readyTeams/${myTeamName}`]: true };
    
    // לוגיקת QA: לחיצה של המשתמש מאשרת אוטומטית גם את הבוטים
    if (roomData.id === 'עומר' || roomData.id === 'qa_omer_room') {
      teamNames.forEach((name: string) => {
        updates[`readyTeams/${name}`] = true;
      });
    }
    
    updateRoom(updates);
  };

  // פונקציה לציור שעון עגול
  const CircularTimer = ({ value, color, teamName }: any) => {
    const radius = 45;
    const circ = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value / 120, 0), 1);
    const offset = circ - (progress * circ);
    const isAnswering = teamName === lastAnsweringTeam;

    return (
      <div style={s.timerWrapper}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle 
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" 
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" 
            transform="rotate(-90 50 50)" 
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <div style={s.timerText}>
          <div style={s.timerNum}>{Math.round(value)}</div>
          {showReveal && isAnswering && (
            <div style={{...s.timerDiff, color}}>{lastCorrect ? "+10" : "-7"}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      ...s.layout,
      backgroundColor: showReveal 
        ? (lastCorrect ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)") 
        : "#05081c"
    }}>
      {showReveal && (
        <div style={{...s.flashOverlay, backgroundColor: lastCorrect ? "#10b981" : "#ef4444"}} />
      )}

      <div style={s.container}>
        <div style={s.questionCard}>
          <span style={s.qLabel}>השאלה הייתה:</span>
          <h2 style={s.qText}>{lastQuestion?.text}</h2>
          {showReveal && (
            <div style={s.answerBadge}>
              תשובה נכונה: <span style={s.answerVal}>{lastQuestion?.options[lastQuestion.correctIdx]}</span>
            </div>
          )}
        </div>

        <div style={s.teamsGrid}>
          {teamNames.map((name: string) => {
            const isAnswering = name === lastAnsweringTeam;
            const statusColor = isAnswering && showReveal ? (lastCorrect ? '#10b981' : '#ef4444') : '#FF9100';
            
            return (
              <div key={name} style={{
                ...s.teamBox,
                borderColor: isAnswering && showReveal ? statusColor : 'rgba(255,255,255,0.1)'
              }}>
                <div style={s.teamName}>{name}</div>
                <CircularTimer value={animatedTimes[name] || 0} color={statusColor} teamName={name} />
                <div style={s.readyIndicator}>
                  {readyTeams[name] ? "✅ מוכנים!" : "⏳ ממתינים..."}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.actionArea}>
          <button 
            onClick={handleReadyClick} 
            disabled={!showReveal || isMyTeamReady}
            style={!showReveal || isMyTeamReady ? s.btnDisabled : s.btnActive}
          >
            {!showReveal ? "מנתח נתונים..." : (isMyTeamReady ? "מחכים לאחרים..." : "בואו נמשיך בטירוף! 🔥")}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flashFade { 0% { opacity: 0.7; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '15px', direction: 'rtl', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, animation: 'flashFade 0.6s forwards', pointerEvents: 'none', zIndex: 50 },
  container: { width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  qLabel: { fontSize: '0.8rem', color: '#FF9100', opacity: 0.7, marginBottom: '5px', display: 'block' },
  qText: { fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 15px 0', lineHeight: '1.4' },
  answerBadge: { display: 'inline-block', backgroundColor: 'rgba(0,229,255,0.1)', padding: '8px 15px', borderRadius: '12px', fontSize: '0.9rem', color: 'white' },
  answerVal: { color: '#00E5FF', fontWeight: 'bold' },
  teamsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  teamBox: { backgroundColor: 'rgba(255,255,255,0.02)', border: '2px solid', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.4s' },
  teamName: { fontSize: '1rem', fontWeight: 'bold', color: '#FF9100', marginBottom: '10px' },
  timerWrapper: { position: 'relative', width: '100px', height: '100px' },
  timerText: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: '1.8rem', fontWeight: '900', fontFamily: 'monospace' },
  timerDiff: { fontSize: '0.8rem', fontWeight: 'bold', marginTop: '-5px' },
  readyIndicator: { marginTop: '10px', fontSize: '0.8rem', opacity: 0.6 },
  actionArea: { marginTop: '10px' },
  btnActive: { width: '100%', padding: '18px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '18px', fontSize: '1.3rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,145,0,0.3)' },
  btnDisabled: { width: '100%', padding: '18px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'not-allowed' }
};