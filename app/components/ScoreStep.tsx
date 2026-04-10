"use client";
import React, { useEffect, useState } from "react";

export default function ScoreStep({ roomData, onNext }: any) {
  const [timer, setTimer] = useState(4);
  const lastCorrect = roomData.lastCorrect;

  useEffect(() => {
    if (timer <= 0) {
      onNext();
      return;
    }
    const t = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timer, onNext]);

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={{ ...s.resultBadge, backgroundColor: lastCorrect ? 'rgba(0, 229, 255, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderColor: lastCorrect ? '#00E5FF' : '#ef4444', color: lastCorrect ? '#00E5FF' : '#ef4444' }}>
          {lastCorrect ? "✓ תשובה נכונה!" : "✕ טעות!"}
        </div>
        
        <h1 style={s.title}>מצב השעונים</h1>

        <div style={s.timeGrid}>
          {roomData.teamNames.map((name: string, i: number) => {
            const time = roomData.timeBanks[name];
            const isWinner = time >= 120;
            return (
              <div key={i} style={{ ...s.teamCard, borderColor: isWinner ? '#FF9100' : 'rgba(255,255,255,0.1)' }}>
                <div style={s.teamName}>{name}</div>
                <div style={{...s.teamTime, color: isWinner ? '#FF9100' : 'white'}}>{time}s</div>
                <div style={s.progressBg}><div style={{ ...s.progressFill, width: `${(time / 120) * 100}%`, backgroundColor: isWinner ? '#FF9100' : '#00E5FF' }} /></div>
              </div>
            );
          })}
        </div>

        <p style={s.subText}>השאלה הבאה בעוד {timer} שניות...</p>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '500px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  resultBadge: { display: 'inline-block', padding: '10px 20px', borderRadius: '20px', border: '2px solid', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '20px' },
  title: { color: '#FF9100', fontSize: '2.5rem', fontWeight: '900', margin: '0 0 30px 0' },
  timeGrid: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: '15px', padding: '15px', textAlign: 'right' },
  teamName: { fontSize: '1rem', color: '#94a3b8', marginBottom: '5px' },
  teamTime: { fontSize: '2rem', fontWeight: '900', marginBottom: '10px' },
  progressBg: { width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '5px', transition: 'width 0.5s ease-out' },
  subText: { fontSize: '1rem', color: '#94a3b8', margin: 0 }
};