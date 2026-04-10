"use client";
import React from "react";

const powerUpNames: any = {
  '50:50': '50:50 (העלמת 2 תשובות)',
  'freeze': 'הקפאת זמן (10 שניות)',
  'slow-mo': 'הילוך איטי (שאלה אחת)'
};

export default function CheckpointStep({ roomData, userId, updateRoom }: any) {
  const me = roomData.players.find((p: any) => p.id === userId);
  const myTime = roomData.timeBanks[me.name];
  const pu = roomData.lastGrantedPowerUp;

  const handleNext = () => {
    updateRoom({ step: 5 }); // חזרה למשחק
  };

  return (
    <div style={s.layout}>
      <h1 style={s.title}>צ'ק-פוינט! 🎯</h1>
      <p style={s.subtitle}>סיימת 5 שאלות בהצלחה.</p>
      
      <div style={s.statsBox}>
        <div style={s.stat}>זמן בקופה: <span style={{ color: '#ffd700', fontSize: '2rem', display: 'block' }}>{myTime} שניות</span></div>
      </div>

      <div style={s.bonusBox}>
        <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>בונוס הוענק! 🎁</h3>
        <div style={s.puName}>{powerUpNames[pu] || pu}</div>
        <p style={{fontSize: '0.9rem', opacity: 0.8, marginTop: '10px'}}>נאגר עבורך לשימוש בשאלות הבאות</p>
      </div>

      <button onClick={handleNext} style={s.nextBtn}>המשך בטירוף 🚀</button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl', textAlign: 'center' },
  title: { fontSize: '3.5rem', fontWeight: '900', color: '#ffd700', margin: '0 0 10px 0' },
  subtitle: { fontSize: '1.5rem', margin: '0 0 40px 0', opacity: 0.9 },
  statsBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px 40px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' },
  stat: { fontSize: '1.2rem', fontWeight: 'bold' },
  bonusBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px dashed #10b981', borderRadius: '20px', padding: '25px', marginBottom: '40px', width: '100%', maxWidth: '400px' },
  puName: { fontSize: '1.5rem', fontWeight: 'bold', color: 'white', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px' },
  nextBtn: { width: '100%', maxWidth: '400px', height: '65px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.5rem', cursor: 'pointer' }
};