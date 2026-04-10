"use client";
import React from "react";

export default function LoseStep({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>⏰</div>
        <h1 style={s.title}>הזמן נגמר!</h1>
        <p style={s.text}>לא נורא, הטיימר היה מהיר הפעם... רוצה לנסות שוב?</p>
        {/* כפתור אתחול בכתום */}
        <button onClick={onRestart} style={s.button}>ניסיון חוזר 🔄</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  // גבול אדוםUX נשמר
  container: { width: '100%', maxWidth: '400px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '40px 20px', textAlign: 'center', border: '2px solid #ef4444', boxShadow: '0 10px 30px rgba(239,68,68,0.2)' },
  icon: { fontSize: '5rem', margin: '0 0 20px 0' },
  title: { color: '#ef4444', fontSize: '2.5rem', fontWeight: '900', margin: '0 0 15px 0' },
  text: { fontSize: '1.2rem', margin: '0 0 30px 0', opacity: 0.9, lineHeight: '1.5' },
  button: { width: '100%', height: '65px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '18px', fontSize: '1.5rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,145,0,0.3)', transition: 'transform 0.2s' }
};