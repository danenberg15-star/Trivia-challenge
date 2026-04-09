"use client";
import React from "react";

export default function VictoryStep({ winnerName, onRestart }: { winnerName: string, onRestart: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100dvh', backgroundColor: '#05081c', direction: 'rtl', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div className="confetti-container">
        <style>{`
          .confetti-container { position: absolute; width: 100%; height: 100%; overflow: hidden; pointer-events: none; top: 0; left: 0; z-index: 1; }
          .confetti { position: absolute; width: 12px; height: 12px; animation: fall 4s linear infinite; opacity: 0.9; }
          @keyframes fall { 0% { transform: translateY(-10vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }
        `}</style>
        {[...Array(50)].map((_, i) => (
          <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 4}s`, backgroundColor: ['#ffd700', '#ff5e5e', '#5eff8a', '#5ebcff'][i % 4], borderRadius: i % 3 === 0 ? '50%' : '0' }} />
        ))}
      </div>
      
      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '120px', animation: 'bounce 2s infinite' }}>🏆</div>
        <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '900' }}>ניצחון מוחץ!</h1>
        <div style={{ backgroundColor: '#ffd700', padding: '15px 40px', borderRadius: '20px', boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)' }}>
          <h2 style={{ color: '#05081c', fontSize: '2.5rem', fontWeight: '900', margin: '0' }}>{winnerName}</h2>
        </div>
      </div>

      <div style={{ zIndex: 10, position: 'absolute', bottom: '30px', width: '100%', padding: '0 20px' }}>
         <button onClick={onRestart} style={{ width: '100%', minHeight: '60px', borderRadius: '18px', backgroundColor: '#ffd700', color: '#05081c', fontWeight: '900', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>משחק חדש 🔄</button>
      </div>
    </div>
  );
}