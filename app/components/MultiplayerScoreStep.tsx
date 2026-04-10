"use client";
import React, { useEffect, useState, useRef } from "react";

export default function MultiplayerScoreStep({ roomData, onNext }: any) {
  const [showResult, setShowResult] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lastCorrect = roomData.lastCorrect;
  const teamNames = roomData.teamNames || [];
  const currentQ = roomData.currentQuestionIdx || 0;

  useEffect(() => {
    // צליל דרמטי בכניסה
    if (typeof Audio !== "undefined") {
      audioRef.current = new Audio("/reveal-sound.mp3"); 
      audioRef.current.play().catch(() => {});
    }

    // השהיה קצרה לבניית מתח (רק כשכולם בחדר) לפני החשיפה
    const revealTimer = setTimeout(() => {
      setShowResult(true);
    }, 1500);

    // מעבר לשלב הבא (Countdown 3 שניות)
    const nextTimer = setTimeout(() => {
      onNext();
    }, 5000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(nextTimer);
    };
  }, [onNext]);

  return (
    <div style={{
      ...s.layout,
      backgroundColor: showResult 
        ? (lastCorrect ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)") 
        : "#05081c"
    }}>
      {/* אפקט הבזק (Flash) ברגע החשיפה */}
      {showResult && (
        <div style={{
          ...s.flashOverlay,
          backgroundColor: lastCorrect ? "#10b981" : "#ef4444"
        }} />
      )}

      <h2 style={s.topLabel}>שאלה {currentQ} - התוצאה:</h2>

      <div style={s.mainReveal}>
        {!showResult ? (
          <div style={s.waitingText}>מחשב נתונים...</div>
        ) : (
          <div style={{...s.resultBadge, color: lastCorrect ? "#00E5FF" : "#ef4444"}}>
            {lastCorrect ? "פגעתם בול! 🎯" : "טעות בחישוב... 💥"}
          </div>
        )}
      </div>

      <div style={s.scoreGrid}>
        {teamNames.map((name: string) => (
          <div key={name} style={s.teamCard}>
            <div style={s.teamTitle}>{name}</div>
            <div style={s.timeDisplay}>
              <span style={s.timeNumber}>{roomData.timeBanks?.[name] || 0}</span>
              <span style={s.unit}>שנ'</span>
            </div>
            {showResult && (
              <div style={{
                ...s.diffPop,
                color: lastCorrect ? "#10b981" : "#ef4444"
              }}>
                {lastCorrect ? "+10" : "-7"}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={s.footer}>הסיבוב הבא מתחיל עוד רגע...</div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl', transition: 'all 0.5s ease', position: 'relative', overflow: 'hidden' },
  flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.2, animation: 'flashEffect 0.6s ease-out forwards', pointerEvents: 'none', zIndex: 10 },
  topLabel: { color: '#FF9100', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' },
  mainReveal: { height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' },
  waitingText: { fontSize: '2rem', fontWeight: '900', color: 'white', animation: 'pulse 1s infinite' },
  resultBadge: { fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', textShadow: '0 0 20px rgba(0,0,0,0.5)', animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  scoreGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', maxWidth: '500px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', textAlign: 'center', position: 'relative' },
  teamTitle: { fontSize: '0.9rem', color: '#FF9100', marginBottom: '5px', fontWeight: 'bold' },
  timeNumber: { fontSize: '2.5rem', fontWeight: '900', color: 'white' },
  unit: { fontSize: '0.8rem', opacity: 0.6, marginRight: '4px' },
  diffPop: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', fontWeight: '900', fontSize: '1.5rem', animation: 'floatUp 1.5s ease-out forwards' },
  footer: { marginTop: '40px', color: 'white', opacity: 0.4, fontSize: '0.9rem' }
};