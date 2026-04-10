"use client";
import React, { useEffect, useState } from "react";

interface ScoreEntry {
  name: string;
  score: number;
  questions: number;
  date: string;
}

export default function HighscoresStep({ onClose }: { onClose: () => void }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem('trivia_solo_highscores') || '[]');
    setScores(savedScores);
  }, []);

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.icon}>🏆</span>
          <h1 style={s.title}>היכל התהילה</h1>
          <p style={s.subtitle}>השיאים של משחק היחידים</p>
        </div>

        <div style={s.listContainer}>
          {scores.length === 0 ? (
            <p style={s.emptyState}>עדיין אין שיאים... זה הזמן לשחק!</p>
          ) : (
            scores.map((entry, idx) => (
              <div key={idx} style={{ 
                ...s.scoreRow, 
                // מקום ראשון מודגש בכתום
                backgroundColor: idx === 0 ? 'rgba(255, 145, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
                borderColor: idx === 0 ? '#FF9100' : 'rgba(255, 255, 255, 0.1)' 
              }}>
                <div style={s.rank}>{idx + 1}</div>
                <div style={s.details}>
                  <div style={s.name}>{entry.name}</div>
                  <div style={s.stats}>{entry.questions} שאלות | {entry.date}</div>
                </div>
                {/* ניקוד בטורקיז */}
                <div style={s.score}>{entry.score.toLocaleString()} <span style={s.pts}>pts</span></div>
              </div>
            ))
          )}
        </div>

        {/* כפתור סגירה בכתום */}
        <button onClick={onClose} style={s.closeBtn}>המשך למסך כניסה 🚀</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl', alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '450px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '30px 20px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid rgba(255,145,0,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  header: { textAlign: 'center', marginBottom: '20px' },
  icon: { fontSize: '4rem', display: 'block', marginBottom: '10px' },
  title: { color: '#FF9100', fontSize: '2.5rem', fontWeight: '900', margin: '0 0 5px 0' },
  subtitle: { color: '#94a3b8', fontSize: '1rem', margin: 0 },
  listContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingRight: '5px' },
  emptyState: { textAlign: 'center', color: '#94a3b8', marginTop: '20px' },
  scoreRow: { display: 'flex', alignItems: 'center', padding: '15px', borderRadius: '15px', border: '1px solid', transition: 'transform 0.2s' },
  rank: { width: '40px', fontSize: '1.5rem', fontWeight: '900', color: '#FF9100' },
  details: { flex: 1, display: 'flex', flexDirection: 'column' },
  name: { fontSize: '1.2rem', fontWeight: 'bold', color: 'white' },
  stats: { fontSize: '0.8rem', color: '#94a3b8' },
  score: { fontSize: '1.5rem', fontWeight: '900', color: '#00E5FF', textAlign: 'left' },
  pts: { fontSize: '0.8rem', color: '#64748b', marginRight: '3px' },
  closeBtn: { width: '100%', height: '60px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '1.3rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(255,145,0,0.3)', transition: 'transform 0.2s' }
};