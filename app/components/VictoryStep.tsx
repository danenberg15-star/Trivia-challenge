"use client";
import React from "react";

interface VictoryStepProps {
  winnerName: string;
  score: number;
  onRestart: () => void;
}

export default function VictoryStep({ winnerName, score, onRestart }: VictoryStepProps) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>🏆</div>
        <h1 style={s.title}>ניצחון מוחץ!</h1>
        
        <div style={s.winnerCard}>
          <div style={s.winnerLabel}>אלוף המשחק:</div>
          <div style={s.winnerName}>{winnerName}</div>
        </div>

        <div style={s.scoreBox}>
          <div style={s.scoreLabel}>הניקוד הסופי שלך:</div>
          <div style={s.scoreVal}>{Math.round(score)}</div>
          <div style={s.scoreUnit}>נקודות</div>
        </div>

        <p style={s.text}>כל הכבוד! שברת את מחסום הזמן והוכחת שליטה מוחלטת בטריוויה.</p>
        
        <button onClick={onRestart} style={s.button}>סיבוב נוסף? 🔄</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100dvh', 
    backgroundColor: '#05081c', 
    color: 'white', 
    padding: '20px', 
    direction: 'rtl', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  container: { 
    width: '100%', 
    maxWidth: '450px', 
    backgroundColor: '#1a1d2e', 
    borderRadius: '40px', 
    padding: '40px 20px', 
    textAlign: 'center', 
    border: '2px solid #FF9100', 
    boxShadow: '0 15px 50px rgba(255,145,0,0.3)' 
  },
  icon: { 
    fontSize: '6rem', 
    marginBottom: '20px', 
    filter: 'drop-shadow(0 0 15px #FF9100)' 
  },
  title: { 
    color: '#FF9100', 
    fontSize: '2.8rem', 
    fontWeight: '900', 
    margin: '0 0 20px 0' 
  },
  winnerCard: { 
    backgroundColor: 'rgba(255,145,0,0.1)', 
    border: '1px solid #FF9100', 
    borderRadius: '20px', 
    padding: '15px', 
    marginBottom: '20px' 
  },
  winnerLabel: { 
    fontSize: '0.9rem', 
    color: '#FF9100', 
    opacity: 0.8 
  },
  winnerName: { 
    fontSize: '2rem', 
    fontWeight: '900', 
    color: 'white' 
  },
  scoreBox: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    borderRadius: '25px',
    padding: '20px',
    marginBottom: '30px'
  },
  scoreLabel: {
    fontSize: '1rem',
    color: '#00E5FF',
    marginBottom: '5px'
  },
  scoreVal: {
    fontSize: '3.5rem',
    fontWeight: '900',
    color: 'white',
    lineHeight: 1
  },
  scoreUnit: {
    fontSize: '0.8rem',
    color: '#00E5FF',
    opacity: 0.7
  },
  text: { 
    fontSize: '1.1rem', 
    lineHeight: '1.5', 
    marginBottom: '35px', 
    color: '#94a3b8' 
  },
  button: { 
    width: '100%', 
    padding: '22px', 
    backgroundColor: '#FF9100', 
    color: '#05081c', 
    border: 'none', 
    borderRadius: '20px', 
    fontSize: '1.5rem', 
    fontWeight: '900', 
    cursor: 'pointer', 
    boxShadow: '0 8px 25px rgba(255,145,0,0.4)',
    transition: 'transform 0.2s'
  }
};