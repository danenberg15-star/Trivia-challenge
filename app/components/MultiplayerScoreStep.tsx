"use client";
import React, { useEffect, useState, useRef } from "react";
import questionsData from "../../src/lib/questions.json";

interface QuestionType {
  level: number;
  text: string;
  options: string[];
  correctIdx: number;
}

const ALL_QUESTIONS = questionsData as QuestionType[];

export default function MultiplayerScoreStep({ roomData, onNext }: any) {
  const [showReveal, setShowReveal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // חילוץ נתוני השאלה שהרגע הסתיימה
  const lastCorrect = roomData.lastCorrect;
  const teamNames = roomData.teamNames || [];
  
  // שחזור השאלה שהוצגה (מכיוון שהאינדקס ב-Firebase כבר התקדם)
  const prevIdx = (roomData.currentQuestionIdx || 1) - 1;
  const seed = roomData.seed || 37;
  
  const difficulty = roomData.difficulty || 'dynamic';
  const timeBanksArray = Object.values(roomData.timeBanks || {}) as number[];
  const maxTimeInGame = timeBanksArray.length > 0 ? Math.max(...timeBanksArray) : 15;

  let targetLevel = 1;
  if (difficulty === 'easy') targetLevel = maxTimeInGame <= 60 ? 1 : ((prevIdx % 2) + 1); 
  else if (difficulty === 'hard') targetLevel = maxTimeInGame <= 60 ? 3 : 4;
  else {
    if (maxTimeInGame <= 40) targetLevel = 1;
    else if (maxTimeInGame <= 80) targetLevel = 2;
    else if (maxTimeInGame <= 105) targetLevel = 3;
    else targetLevel = 4;
  }

  const levelPool = ALL_QUESTIONS.filter((q) => q.level === targetLevel);
  const qIdx = ((prevIdx + 1) * seed) % levelPool.length;
  const lastQuestion = levelPool[qIdx];

  useEffect(() => {
    // 1. אפקט דרמטי בכניסה: צליל חשיפה
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/reveal-sound.mp3"); 
      audioRef.current.play().catch(() => {});
    }

    // 2. בניית מתח: חשיפה לאחר שנייה אחת (הבזק + תשובה + עדכון שעונים)
    const revealTimer = setTimeout(() => {
      setShowReveal(true);
    }, 1000);

    // 3. מעבר אוטומטי לספירה לאחור של השאלה הבאה (Step 4)
    const transitionTimer = setTimeout(() => {
      onNext();
    }, 5500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(transitionTimer);
    };
  }, [onNext]);

  return (
    <div style={{
      ...s.layout,
      backgroundColor: showReveal 
        ? (lastCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)") 
        : "#05081c"
    }}>
      {/* הבזק (Flash) דרמטי ברגע החשיפה */}
      {showReveal && (
        <div style={{
          ...s.flashOverlay,
          backgroundColor: lastCorrect ? "#10b981" : "#ef4444"
        }} />
      )}

      <div style={s.container}>
        <div style={s.header}>
          <span style={s.headerLabel}>סיכום סיבוב</span>
          <h2 style={s.questionPreview}>{lastQuestion?.text}</h2>
        </div>

        <div style={s.revealBox}>
          {!showReveal ? (
            <div style={s.suspenseText}>מחשב תוצאות...</div>
          ) : (
            <div style={s.outcomeContainer}>
              <div style={{...s.statusBadge, color: lastCorrect ? "#10b981" : "#ef4444"}}>
                {lastCorrect ? "פגיעה בול! 🎉" : "פספוס... ❌"}
              </div>
              <div style={s.answerReveal}>
                <span style={s.answerLabel}>התשובה הנכונה:</span>
                <span style={s.answerValue}>{lastQuestion?.options[lastQuestion.correctIdx]}</span>
              </div>
            </div>
          )}
        </div>

        <div style={s.scoreGrid}>
          {teamNames.map((name: string) => (
            <div key={name} style={s.teamCard}>
              <div style={s.teamInfo}>
                <span style={s.teamName}>{name}</span>
                <div style={s.timeWrapper}>
                  <span style={s.timeNumber}>{roomData.timeBanks?.[name] || 0}</span>
                  <span style={s.timeUnit}>שנ'</span>
                </div>
              </div>
              {showReveal && (
                <div style={{
                  ...s.scoreDiff,
                  color: lastCorrect ? "#10b981" : "#ef4444"
                }}>
                  {lastCorrect ? "+10" : "-7"}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={s.countdownNotice}>השאלה הבאה מתחילה עוד רגע...</div>

      <style jsx global>{`
        @keyframes flashEffect {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes popUp {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes floatScore {
          0% { transform: translate(-50%, 15px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -35px); opacity: 0; }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl', transition: 'background-color 0.6s ease', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, animation: 'flashEffect 0.5s ease-out forwards', pointerEvents: 'none', zIndex: 20 },
  container: { width: '100%', maxWidth: '500px', textAlign: 'center', zIndex: 10 },
  header: { marginBottom: '30px' },
  headerLabel: { color: '#ffd700', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 },
  questionPreview: { fontSize: '1.3rem', color: 'white', marginTop: '10px', fontWeight: 'bold', lineHeight: '1.4' },
  revealBox: { height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' },
  suspenseText: { fontSize: '2.2rem', fontWeight: '900', color: '#ffd700', animation: 'pulseText 1s infinite' },
  outcomeContainer: { animation: 'popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  statusBadge: { fontSize: '2.8rem', fontWeight: '900', marginBottom: '10px', textShadow: '0 0 20px rgba(0,0,0,0.5)' },
  answerReveal: { backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' },
  answerLabel: { fontSize: '0.9rem', color: 'white', opacity: 0.6, display: 'block' },
  answerValue: { fontSize: '1.2rem', color: '#00E5FF', fontWeight: 'bold' },
  scoreGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', position: 'relative' },
  teamInfo: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  teamName: { fontSize: '0.9rem', color: '#ffd700', marginBottom: '5px', fontWeight: 'bold' },
  timeWrapper: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  timeNumber: { fontSize: '2.8rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' },
  timeUnit: { fontSize: '0.8rem', opacity: 0.5 },
  scoreDiff: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', fontWeight: '900', fontSize: '1.8rem', animation: 'floatScore 2s ease-out forwards' },
  countdownNotice: { marginTop: '40px', color: 'white', opacity: 0.4, fontSize: '0.9rem', fontWeight: 'bold' }
};