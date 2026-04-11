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
  const [animatedTimes, setAnimatedTimes] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const teamNames = roomData.teamNames || [];
  const lastAnsweringTeam = roomData.lastAnsweringTeam;
  const lastCorrect = roomData.lastCorrect;

  // שחזור השאלה שהסתיימה לצורך תצוגה
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
    // אתחול אנימציית הטיימרים לערכים הישנים (לפני העדכון)
    const initialTimes: any = {};
    teamNames.forEach((name: string) => {
      let val = roomData.timeBanks[name];
      if (name === lastAnsweringTeam) {
        val = lastCorrect ? val - 10 : val + 7; // חוזרים לערך שלפני החישוב
      }
      initialTimes[name] = val;
    });
    setAnimatedTimes(initialTimes);

    // צליל חשיפה
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/reveal-sound.mp3");
      audioRef.current.play().catch(() => {});
    }

    // חשיפה דרמטית לאחר שנייה
    const revealTimer = setTimeout(() => {
      setShowReveal(true);
      setAnimatedTimes(roomData.timeBanks); // עדכון לערכים האמיתיים כדי להפעיל אנימציה
    }, 1200);

    const nextTimer = setTimeout(() => {
      onNext();
    }, 6000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(nextTimer);
    };
  }, [onNext, roomData.timeBanks, teamNames, lastAnsweringTeam, lastCorrect]);

  return (
    <div style={s.layout}>
      {/* הבזק חשיפה אישי */}
      {showReveal && (
        <div style={{
          ...s.flashOverlay,
          backgroundColor: lastCorrect ? "#10b981" : "#ef4444"
        }} />
      )}

      <div style={s.container}>
        <div style={s.questionSection}>
          <span style={s.smallLabel}>השאלה שהייתה:</span>
          <h2 style={s.questionText}>{lastQuestion?.text}</h2>
          {showReveal && (
            <div style={s.answerHighlight}>
              <span style={s.answerLabel}>תשובה נכונה:</span>
              <span style={s.answerValue}>{lastQuestion?.options[lastQuestion.correctIdx]}</span>
            </div>
          )}
        </div>

        <div style={s.resultsGrid}>
          {teamNames.map((name: string) => {
            const isTheAnsweringTeam = name === lastAnsweringTeam;
            const timeVal = animatedTimes[name] || 0;
            const progress = (timeVal / 120) * 100;

            return (
              <div key={name} style={{
                ...s.teamCard,
                borderColor: showReveal && isTheAnsweringTeam ? (lastCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.1)'
              }}>
                <div style={s.teamHeader}>
                  <span style={s.teamName}>{name}</span>
                  {showReveal && isTheAnsweringTeam && (
                    <span style={{...s.statusIcon, color: lastCorrect ? '#10b981' : '#ef4444'}}>
                      {lastCorrect ? "✅ נכון!" : "❌ טעות"}
                    </span>
                  )}
                  {showReveal && !isTheAnsweringTeam && (
                    <span style={s.waitIcon}>⏳ המתינו</span>
                  )}
                </div>

                <div style={s.timerSection}>
                  <div style={s.timeNumbers}>
                    <span style={s.currentTime}>{Math.round(timeVal)}</span>
                    <span style={s.totalTime}>/ 120</span>
                  </div>
                  <div style={s.progressBarBg}>
                    <div style={{
                      ...s.progressBarFill,
                      width: `${progress}%`,
                      backgroundColor: isTheAnsweringTeam && showReveal ? (lastCorrect ? '#10b981' : '#ef4444') : '#FF9100'
                    }} />
                  </div>
                </div>

                {showReveal && isTheAnsweringTeam && (
                  <div style={{
                    ...s.floatingDiff,
                    color: lastCorrect ? '#10b981' : '#ef4444'
                  }}>
                    {lastCorrect ? "+10 שנ'" : "-7 שנ'"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={s.footer}>הסיבוב הבא מתחיל...</div>

      <style jsx global>{`
        @keyframes flashOut { 0% { opacity: 0.8; } 100% { opacity: 0; } }
        @keyframes scoreFloat { 
          0% { transform: translateY(10px); opacity: 0; } 
          20% { opacity: 1; } 
          100% { transform: translateY(-30px); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, animation: 'flashOut 0.6s ease-out forwards', pointerEvents: 'none', zIndex: 30 },
  container: { width: '100%', maxWidth: '550px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '25px' },
  questionSection: { textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' },
  smallLabel: { fontSize: '0.8rem', color: '#ffd700', opacity: 0.6, marginBottom: '8px', display: 'block' },
  questionText: { fontSize: '1.2rem', fontWeight: 'bold', lineHeight: '1.4', margin: '0 0 15px 0' },
  answerHighlight: { backgroundColor: 'rgba(0,229,255,0.1)', padding: '10px', borderRadius: '10px', display: 'inline-block' },
  answerLabel: { fontSize: '0.8rem', marginLeft: '8px', opacity: 0.8 },
  answerValue: { fontSize: '1rem', fontWeight: 'bold', color: '#00E5FF' },
  resultsGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.04)', border: '2px solid', borderRadius: '24px', padding: '20px', position: 'relative', transition: 'all 0.5s ease' },
  teamHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  teamName: { fontSize: '1.1rem', fontWeight: 'bold', color: '#ffd700' },
  statusIcon: { fontWeight: '900', fontSize: '1.1rem' },
  waitIcon: { fontSize: '0.9rem', opacity: 0.4 },
  timerSection: { width: '100%' },
  timeNumbers: { display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '8px', justifyContent: 'center' },
  currentTime: { fontSize: '2.5rem', fontWeight: '900', fontFamily: 'monospace' },
  totalTime: { fontSize: '1rem', opacity: 0.4 },
  progressBarBg: { width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.5s ease' },
  floatingDiff: { position: 'absolute', left: '20px', bottom: '20px', fontSize: '1.5rem', fontWeight: '900', animation: 'scoreFloat 2s ease-out forwards' },
  footer: { marginTop: '30px', opacity: 0.3, fontSize: '0.9rem' }
};