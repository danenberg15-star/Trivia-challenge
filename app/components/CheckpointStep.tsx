"use client";
import React, { useEffect, useState } from "react";

export default function CheckpointStep({ roomData, userId, updateRoom, onComplete }: any) {
  const me = roomData.players.find((p: any) => p.id === userId) || roomData.players[0];
  const teamName = roomData.teamNames[me.teamIdx];
  const powerUp = roomData.lastGrantedPowerUp || 'freeze';
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    if (timer <= 0) {
      if (onComplete) onComplete(); 
      else updateRoom({ step: 5 });
      return;
    }
    const t = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timer, updateRoom, onComplete]);

  const puName = powerUp === '50:50' ? '🌗 50:50' : powerUp === 'freeze' ? '❄️ הקפאה' : '🐢 האטה';

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.icon}>🎁</div>
        <h1 style={s.title}>צ'ק פוינט!</h1>
        <p style={s.text}>כל הכבוד {me.name}, שרדתם מספיק זמן!</p>
        
        <div style={s.puCard}>
          <div style={s.puLabel}>קבלו כוח עזר לקבוצת {teamName}:</div>
          <div style={s.puName}>{puName}</div>
        </div>

        <p style={s.subText}>המשחק יתחדש בעוד {timer} שניות...</p>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '400px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '40px 20px', textAlign: 'center', border: '1px solid rgba(0,229,255,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  icon: { fontSize: '5rem', marginBottom: '20px' },
  title: { color: '#FF9100', fontSize: '3rem', fontWeight: '900', margin: '0 0 10px 0' },
  text: { fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 },
  puCard: { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px', marginBottom: '30px' },
  puLabel: { fontSize: '1rem', color: '#94a3b8', marginBottom: '10px' },
  // שם הכוח זוהר בטורקיז
  puName: { fontSize: '2.5rem', fontWeight: '900', color: '#00E5FF', textShadow: '0 0 10px rgba(0,229,255,0.5)' },
  subText: { fontSize: '1rem', color: '#94a3b8' }
};