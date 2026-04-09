"use client";
import React, { useEffect, useState } from "react";

export default function ScoreStep({ roomData, onNext }: any) {
  const [revealCorrect, setRevealCorrect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealCorrect(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const qIdx = roomData.currentQuestionIdx || 0;
  // כאן נצטרך לייבא את השאלות במידה והן לא מועברות ב-Props
  // לצורך הבנייה, נניח שהתשובה הנכונה מגיעה מה-roomData או מהשאלות
  
  return (
    <div style={s.layout}>
      <h2 style={s.title}>תוצאות הסיבוב</h2>
      
      <div style={s.teamsGrid}>
        {roomData.teamNames.map((name: string, idx: number) => (
          <div key={idx} style={s.teamCard}>
            <div style={s.teamName}>{name}</div>
            <div style={s.timeBank}>{roomData.timeBanks[name]} ש'</div>
            <div style={s.choiceLabel}>בחרו ב:</div>
            <div style={s.choice}>
              {/* כאן תופיע התשובה שהם בחרו */}
              ממתין לחשיפה...
            </div>
          </div>
        ))}
      </div>

      {revealCorrect && (
        <div style={s.correctBox}>
          <div style={{opacity: 0.7}}>התשובה הנכונה:</div>
          <div style={s.correctText}>התשובה כאן</div>
        </div>
      )}

      <button onClick={onNext} style={s.nextBtn}>לשאלה הבאה ➔</button>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl' },
  title: { textAlign: 'center', color: '#ffd700', fontSize: '2rem', marginBottom: '30px' },
  teamsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' },
  teamCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '15px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  teamName: { fontWeight: 'bold', fontSize: '1.1rem' },
  timeBank: { fontSize: '1.5rem', color: '#ffd700', margin: '10px 0' },
  choiceLabel: { fontSize: '0.8rem', opacity: 0.6 },
  correctBox: { backgroundColor: '#10b981', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: 'auto' },
  correctText: { fontSize: '1.8rem', fontWeight: 'bold' },
  nextBtn: { height: '60px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '15px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }
};