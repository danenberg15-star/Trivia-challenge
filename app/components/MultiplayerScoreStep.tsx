"use client";
import React, { useEffect, useState, useRef } from "react";

export default function MultiplayerScoreStep({ roomData, userId, updateRoom, onNext }: any) {
  const [showReveal, setShowReveal] = useState(false);
  const [displayTimes, setDisplayTimes] = useState<any>(null);
  const [targetTimes, setTargetTimes] = useState<any>(null);
  const hasInitialized = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const me = roomData.players.find((p: any) => p.id === userId);
  const myTeamName = roomData.teamNames[me.teamIdx];
  const lastAnsweringTeam = roomData.lastAnsweringTeam;
  const lastCorrect = roomData.lastCorrect;
  const lastQuestion = roomData.lastQuestion;
  const teamNames = roomData.teamNames || [];

  const readyTeams = roomData.readyTeams || {};
  const isMyTeamReady = !!readyTeams[myTeamName];
  const allReady = teamNames.every((name: string) => !!readyTeams[name]);

  useEffect(() => {
    if (hasInitialized.current) return;

    // 1. חישוב ערכי ההתחלה (לפני השינוי)
    const startTimes: any = {};
    teamNames.forEach((name: string) => {
      let val = roomData.timeBanks[name];
      if (name === lastAnsweringTeam) {
        val = lastCorrect ? val - 10 : val + 7;
      }
      startTimes[name] = val;
    });
    
    setDisplayTimes(startTimes);
    setTargetTimes(startTimes); // בהתחלה היעד הוא המצב הקיים
    hasInitialized.current = true;

    // 2. בניית המתח והפעלת המונה הרץ
    const revealTimer = setTimeout(() => {
      setShowReveal(true);
      setTargetTimes(roomData.timeBanks); // קביעת היעד החדש לשעונים (3 שניות אנימציה)

      // הפעלת סאונד - שמות קבצים תואמים ל-public
      if (typeof Audio !== "undefined") {
        const isMeAnswering = myTeamName === lastAnsweringTeam;
        const didIWinRound = (isMeAnswering && lastCorrect) || (!isMeAnswering && !lastCorrect);
        const soundFile = didIWinRound ? "/Cheer.m4a" : "/Boo.m4a";
        
        const audio = new Audio(soundFile);
        audio.volume = 0.9;
        audio.play().catch(e => console.warn("Audio play blocked:", e));
        audioRef.current = audio;
      }

      // 3. יצירת אפקט "מונה רץ" למספרים
      const duration = 3000; // 3 שניות
      const frameRate = 50; // עדכון כל 50 מילי-שנייה
      const totalSteps = duration / frameRate;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        
        const nextDisplay: any = {};
        teamNames.forEach((name: string) => {
          const start = startTimes[name];
          const end = roomData.timeBanks[name];
          // חישוב הערך היחסי לכל צעד
          nextDisplay[name] = start + (end - start) * progress;
        });

        setDisplayTimes(nextDisplay);

        if (step >= totalSteps) {
          clearInterval(interval);
          setDisplayTimes(roomData.timeBanks); // וידוא ערך סופי מדויק
        }
      }, frameRate);

    }, 1200);

    return () => clearTimeout(revealTimer);
  }, [roomData.timeBanks, teamNames, lastAnsweringTeam, lastCorrect, myTeamName]);

  useEffect(() => {
    if (allReady) {
      const t = setTimeout(() => onNext(), 800);
      return () => clearTimeout(t);
    }
  }, [allReady, onNext]);

  const handleReadyClick = () => {
    if (isMyTeamReady) return;
    let updates: any = { [`readyTeams/${myTeamName}`]: true };
    if (roomData.id === 'עומר' || roomData.id === 'qa_omer_room') {
      teamNames.forEach((name: string) => { updates[`readyTeams/${name}`] = true; });
    }
    updateRoom(updates);
  };

  const CircularTimer = ({ displayValue, targetValue, teamName }: any) => {
    const radius = 45;
    const circ = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(targetValue / 120, 0), 1);
    const offset = circ - (progress * circ);
    
    const isAnswering = teamName === lastAnsweringTeam;
    const color = (isAnswering && showReveal) 
      ? (lastCorrect ? '#10b981' : '#ef4444') 
      : '#FF9100';

    return (
      <div style={s.timerWrapper}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="8" 
            strokeDasharray={circ} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            transform="rotate(-90 55 55)" 
            style={{ 
              transition: 'stroke-dashoffset 3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease', 
              filter: `drop-shadow(0 0 10px ${color})` 
            }}
          />
        </svg>
        <div style={s.timerText}>
          <div style={{...s.timerNum, color: 'white'}}>{Math.round(displayValue)}</div>
          {showReveal && isAnswering && (
            <div style={{...s.timerDiff, color, animation: 'scoreFloat 2.5s forwards'}}>
              {lastCorrect ? "+10" : "-7"}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!displayTimes) return <div style={s.layout}>טוען תוצאות...</div>;

  return (
    <div style={s.layout}>
      {showReveal && (
        <div style={{...s.flashOverlay, backgroundColor: lastCorrect ? "#10b981" : "#ef4444"}} />
      )}

      <div style={s.container}>
        <div style={s.questionCard}>
          <span style={s.qLabel}>השאלה שנשאלה:</span>
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
            const cardColor = (isAnswering && showReveal) ? (lastCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.1)';
            
            return (
              <div key={name} style={{
                ...s.teamBox,
                borderColor: cardColor,
                boxShadow: (isAnswering && showReveal) ? `0 0 30px ${cardColor}44` : 'none'
              }}>
                <div style={{...s.teamName, color: (isAnswering && showReveal) ? cardColor : '#FF9100'}}>
                  {name} {name === myTeamName ? "(אני)" : ""}
                </div>
                <CircularTimer 
                  displayValue={displayTimes[name]} 
                  targetValue={targetTimes[name]} 
                  teamName={name} 
                />
                <div style={s.statusText}>
                  {showReveal ? (
                    isAnswering ? (lastCorrect ? "✅ פגיעה!" : "❌ פספוס") : "⏳ המתנה"
                  ) : "מנתח..."}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.actionArea}>
          <button 
            onClick={handleReadyClick} 
            disabled={!showReveal || isMyTeamReady}
            style={(!showReveal || isMyTeamReady) ? s.btnDisabled : s.btnActive}
          >
            {isMyTeamReady ? "מחכים לאחרים..." : "בואו נמשיך בטירוף! 🔥"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flashEffect { 0% { opacity: 0.6; } 100% { opacity: 0; } }
        @keyframes scoreFloat { 
          0% { opacity: 0; transform: translateY(10px); } 
          20% { opacity: 1; transform: translateY(0); } 
          100% { opacity: 0; transform: translateY(-30px); } 
        }
      `}</style>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '15px', direction: 'rtl', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, animation: 'flashEffect 1s forwards', pointerEvents: 'none', zIndex: 100 },
  container: { width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  qLabel: { fontSize: '0.8rem', color: '#FF9100', opacity: 0.7, marginBottom: '5px', display: 'block' },
  qText: { fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 15px 0', lineHeight: '1.4' },
  answerBadge: { display: 'inline-block', backgroundColor: 'rgba(0,229,255,0.1)', padding: '8px 15px', borderRadius: '12px', fontSize: '0.9rem' },
  answerVal: { color: '#00E5FF', fontWeight: 'bold' },
  teamsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  teamBox: { backgroundColor: 'rgba(255,255,255,0.02)', border: '3px solid', borderRadius: '35px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.8s ease' },
  teamName: { fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px' },
  timerWrapper: { position: 'relative', width: '110px', height: '110px' },
  timerText: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' },
  timerDiff: { position: 'absolute', top: '0', fontSize: '1.2rem', fontWeight: '900' },
  statusText: { marginTop: '15px', fontSize: '1.2rem', fontWeight: 'bold' },
  actionArea: { marginTop: '10px' },
  btnActive: { width: '100%', padding: '22px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '25px', fontSize: '1.6rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 35px rgba(255,145,0,0.5)' },
  btnDisabled: { width: '100%', padding: '22px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '25px', fontSize: '1.3rem', fontWeight: 'bold' }
};