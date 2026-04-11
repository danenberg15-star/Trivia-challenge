"use client";
import React, { useEffect, useState, useRef } from "react";

export default function MultiplayerScoreStep({ roomData, userId, updateRoom, onNext }: any) {
  const [showReveal, setShowReveal] = useState(false);
  const [animatedTimes, setAnimatedTimes] = useState<any>({});
  const hasInitialized = useRef(false); // למניעת באג הריסט בלחיצה על כפתור מוכנות
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
    // אתחול פעם אחת בלבד לכניסה למסך
    if (hasInitialized.current) return;
    
    const initialTimes: any = {};
    teamNames.forEach((name: string) => {
      let val = roomData.timeBanks[name];
      if (name === lastAnsweringTeam) {
        // מחשבים לאחור את הערך שהיה לפני העדכון ב-DB
        val = lastCorrect ? val - 10 : val + 7;
      }
      initialTimes[name] = val;
    });
    setAnimatedTimes(initialTimes);
    hasInitialized.current = true;

    // הפעלת החשיפה והסאונד לאחר השהיה קלה
    const revealTimer = setTimeout(() => {
      setShowReveal(true);
      setAnimatedTimes(roomData.timeBanks);

      // לוגיקת סאונד: מחיאות כפיים או בוז
      if (typeof Audio !== "undefined") {
        const isMeAnswering = myTeamName === lastAnsweringTeam;
        const didIWinRound = (isMeAnswering && lastCorrect) || (!isMeAnswering && !lastCorrect);
        const soundFile = didIWinRound ? "/cheer.mp3" : "/boo.mp3";
        audioRef.current = new Audio(soundFile);
        audioRef.current.play().catch(() => {});
      }
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

  const CircularTimer = ({ value, teamName }: any) => {
    const radius = 45;
    const circ = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(value / 120, 0), 1);
    const offset = circ - (progress * circ);
    
    const isAnswering = teamName === lastAnsweringTeam;
    // צבע המסגרת והשעון: ירוק להצלחה, אדום לטעות, זהב לממתין
    const color = isAnswering && showReveal ? (lastCorrect ? '#10b981' : '#ef4444') : '#FF9100';

    return (
      <div style={s.timerWrapper}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle 
            cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="8" 
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" 
            transform="rotate(-90 55 55)" 
            style={{ 
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease', 
              filter: `drop-shadow(0 0 8px ${color})` 
            }}
          />
        </svg>
        <div style={s.timerText}>
          <div style={{...s.timerNum, color: 'white'}}>{Math.round(value)}</div>
          {showReveal && isAnswering && (
            <div style={{...s.timerDiff, color}}>{lastCorrect ? "+10" : "-7"}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.layout}>
      {showReveal && (
        <div style={{...s.flashOverlay, backgroundColor: lastCorrect ? "#10b981" : "#ef4444"}} />
      )}

      <div style={s.container}>
        <div style={s.questionCard}>
          <span style={s.qLabel}>השאלה:</span>
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
            const cardColor = isAnswering && showReveal ? (lastCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.1)';
            
            return (
              <div key={name} style={{
                ...s.teamBox,
                borderColor: cardColor,
                boxShadow: isAnswering && showReveal ? `0 0 20px ${cardColor}44` : 'none'
              }}>
                <div style={{...s.teamName, color: isAnswering && showReveal ? cardColor : '#FF9100'}}>{name}</div>
                <CircularTimer value={animatedTimes[name] || 0} teamName={name} />
                <div style={s.statusText}>
                  {showReveal ? (
                    isAnswering ? (lastCorrect ? "✅ הצלחה!" : "❌ פספוס") : "⏳ המתינו"
                  ) : "מחשב..."}
                </div>
                <div style={s.readyIndicator}>
                  {readyTeams[name] ? "👍 מוכן" : "💤 ממתין"}
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
            {isMyTeamReady ? "מחכים לאחרים..." : "בואו נמשיך בטירוף! 🔥"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flashFadeOut { 0% { opacity: 0.6; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '15px', direction: 'rtl', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, animation: 'flashFadeOut 0.8s forwards', pointerEvents: 'none', zIndex: 100 },
  container: { width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  qLabel: { fontSize: '0.75rem', color: '#FF9100', opacity: 0.7, marginBottom: '4px', display: 'block' },
  qText: { fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.4' },
  answerBadge: { display: 'inline-block', backgroundColor: 'rgba(0,229,255,0.1)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.85rem' },
  answerVal: { color: '#00E5FF', fontWeight: 'bold' },
  teamsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  teamBox: { backgroundColor: 'rgba(255,255,255,0.02)', border: '3px solid', borderRadius: '28px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.4s ease' },
  teamName: { fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px' },
  timerWrapper: { position: 'relative', width: '110px', height: '110px' },
  timerText: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontSize: '2.2rem', fontWeight: '900', fontFamily: 'monospace' },
  timerDiff: { fontSize: '0.9rem', fontWeight: 'bold', marginTop: '-4px' },
  statusText: { marginTop: '10px', fontSize: '1rem', fontWeight: 'bold' },
  readyIndicator: { marginTop: '5px', fontSize: '0.75rem', opacity: 0.5 },
  actionArea: { marginTop: '10px' },
  btnActive: { width: '100%', padding: '20px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '22px', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 25px rgba(255,145,0,0.4)' },
  btnDisabled: { width: '100%', padding: '20px', backgroundColor: '#1a1d2e', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '22px', fontSize: '1.2rem', fontWeight: 'bold' }
};