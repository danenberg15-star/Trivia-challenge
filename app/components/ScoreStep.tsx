"use client";
import React from "react";

export default function ScoreStep({ roomData, onNext }: any) {
  const isIndividual = roomData.gameMode === "individual";
  const maxTime = isIndividual ? 60 : 120;
  
  return (
    <div style={s.layout}>
      <h1 style={{ ...s.title, color: roomData.lastCorrect ? '#10b981' : '#ef4444' }}>
        {roomData.lastCorrect ? "תשובה נכונה! 🎉" : "טעות! 😢"}
      </h1>

      <div style={s.teamsGrid}>
        {roomData.teamNames.map((name: string) => {
          const time = roomData.timeBanks[name] || 0;
          const progress = Math.min(Math.max(time / maxTime, 0), 1);
          const radius = 40;
          const circ = 2 * Math.PI * radius;
          const offset = circ - (progress * circ);

          return (
            <div key={name} style={s.teamCard}>
              <h3 style={s.teamName}>{name}</h3>
              {/* השעון במסך התוצאה להמחשת הזמן המעודכן */}
              <div style={s.miniClock}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth="8" 
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div style={s.miniClockText}>{time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onNext} style={s.nextBtn}>השאלה הבאה ⏳</button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl' },
  title: { fontSize: '3rem', fontWeight: '900', marginBottom: '40px', textAlign: 'center' },
  teamsGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '600px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', flex: 1, minWidth: '150px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  teamName: { color: '#ffd700', fontSize: '1.2rem', marginBottom: '15px' },
  miniClock: { position: 'relative', width: '100px', height: '100px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  miniClockText: { position: 'absolute', fontSize: '2rem', fontWeight: 'bold' },
  nextBtn: { width: '100%', maxWidth: '400px', height: '65px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer', marginTop: '40px' }
};