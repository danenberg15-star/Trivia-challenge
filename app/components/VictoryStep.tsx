"use client";
import React from "react";

export default function VictoryStep({ winnerName, onRestart }: { winnerName: string; onRestart: () => void }) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>🏆</div>
        <h1 style={s.title}>יש לנו מנצח!</h1>
        <div style={s.winnerCard}>
          <div style={s.winnerLabel}>מקום ראשון:</div>
          <div style={s.winnerName}>{winnerName}</div>
        </div>
        <p style={s.text}>כל הכבוד! הגעתם ליעד הזמן וניצחתם במשחק.</p>
        <button onClick={onRestart} style={s.button}>לשחק שוב? 🔄</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '450px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '40px 20px', textAlign: 'center', border: '2px solid #FF9100', boxShadow: '0 10px 30px rgba(255,145,0,0.3)' },
  icon: { fontSize: '6rem', marginBottom: '20px', filter: 'drop-shadow(0 0 10px #FF9100)' },
  title: { color: '#FF9100', fontSize: '3rem', fontWeight: '900', margin: '0 0 20px 0' },
  winnerCard: { backgroundColor: 'rgba(255,145,0,0.1)', border: '1px solid #FF9100', borderRadius: '20px', padding: '20px', marginBottom: '30px' },
  winnerLabel: { fontSize: '1.1rem', color: '#FF9100', marginBottom: '10px' },
  winnerName: { fontSize: '2.5rem', fontWeight: '900', color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.5)' },
  text: { fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9, lineHeight: '1.5' },
  button: { width: '100%', height: '65px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '18px', fontSize: '1.5rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,145,0,0.3)', transition: 'transform 0.2s' }
};