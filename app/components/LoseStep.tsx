"use client";
import React from "react";

interface LoseStepProps {
  score: number;
  onRestart: () => void;
}

export default function LoseStep({ score, onRestart }: LoseStepProps) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>⏰</div>
        <h1 style={s.title}>הזמן נגמר!</h1>
        
        <div style={s.scoreBox}>
          <div style={s.scoreLabel}>הספקת לצבור:</div>
          <div style={s.scoreVal}>{Math.round(score)}</div>
          <div style={s.scoreUnit}>נקודות</div>
        </div>

        <p style={s.text}>לא נורא, הטיימר היה מהיר הפעם...<br/>אולי בסיבוב הבא תצליח לשבור את השיא!</p>
        
        <button onClick={onRestart} style={s.button}>ניסיון חוזר 🔄</button>
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
    maxWidth: '400px', 
    backgroundColor: '#1a1d2e', 
    borderRadius: '30px', 
    padding: '40px 20px', 
    textAlign: 'center', 
    border: '2px solid #ef4444', 
    boxShadow: '0 10px 30px rgba(239,68,68,0.2)' 
  },
  icon: { 
    fontSize: '5rem', 
    marginBottom: '15px' 
  },
  title: { 
    color: '#ef4444', 
    fontSize: '2.5rem', 
    fontWeight: '900', 
    margin: '0 0 20px 0' 
  },
  scoreBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '20px',
    padding: '15px',
    marginBottom: '25px'
  },
  scoreLabel: {
    fontSize: '0.9rem',
    color: '#ef4444',
    opacity: 0.8,
    marginBottom: '5px'
  },
  scoreVal: {
    fontSize: '3rem',
    fontWeight: '900',
    color: 'white'
  },
  scoreUnit: {
    fontSize: '0.8rem',
    color: '#ef4444',
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
    padding: '20px', 
    backgroundColor: '#FF9100', 
    color: '#05081c', 
    border: 'none', 
    borderRadius: '15px', 
    fontSize: '1.3rem', 
    fontWeight: '900', 
    cursor: 'pointer', 
    boxShadow: '0 4px 15px rgba(255,145,0,0.3)',
    transition: 'transform 0.2s'
  }
};