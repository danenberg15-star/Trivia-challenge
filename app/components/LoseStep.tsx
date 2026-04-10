"use client";
import React from "react";

interface LoseStepProps {
  onRestart: () => void;
}

export default function LoseStep({ onRestart }: LoseStepProps) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>⏰</div>
        <h1 style={s.title}>הזמן נגמר!</h1>
        <p style={s.text}>לא נורא, הטיימר היה מהיר הפעם... רוצה לנסות שוב?</p>
        
        <button onClick={onRestart} style={s.button}>
          ניסיון חוזר 🔄
        </button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '400px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 20px 50px rgba(239, 68, 68, 0.2)', border: '2px solid #ef4444' },
  icon: { fontSize: '5rem', marginBottom: '20px' },
  title: { color: '#ef4444', fontSize: '2.5rem', fontWeight: '900', marginBottom: '15px' },
  text: { fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9, lineHeight: '1.5' },
  button: { width: '100%', height: '65px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '18px', fontSize: '1.5rem', fontWeight: '900', cursor: 'pointer', transition: 'transform 0.2s' }
};