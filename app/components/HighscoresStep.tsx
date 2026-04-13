"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

interface ScoreEntry {
  name: string;
  score: number;
  date: number;
  difficulty: string;
}

export default function HighscoresStep({ onClose }: { onClose: () => void }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. משיכת שיאים מ-Firebase
    const scoresRef = ref(db, 'highscores');
    const scoresQuery = query(scoresRef, orderByChild('score'), limitToLast(50));

    const unsubscribe = onValue(scoresQuery, (snapshot) => {
      const firebaseScores: ScoreEntry[] = [];
      const data = snapshot.val();
      
      if (data) {
        Object.values(data).forEach((s: any) => {
          firebaseScores.push(s as ScoreEntry);
        });
      }

      // 2. משיכת שיאים מקומיים (LocalStorage)
      const localData = localStorage.getItem('trivia_solo_highscores');
      const localScores: ScoreEntry[] = localData ? JSON.parse(localData) : [];

      // 3. מיזוג והסרת כפילויות (לפי שם וניקוד)
      const combined = [...firebaseScores, ...localScores];
      const uniqueScores = combined.filter((v, i, a) => 
        a.findIndex(t => t.name === v.name && t.score === v.score) === i
      );

      // 4. מיון לפי ניקוד יורד וחיתוך ל-20 הטובים ביותר
      const sorted = uniqueScores.sort((a, b) => b.score - a.score).slice(0, 20);
      
      setScores(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div style={s.layout}>
      <div style={s.container}>
        <div style={s.header}>
          <span style={s.icon}>🏆</span>
          <h1 style={s.title}>היכל התהילה</h1>
          <p style={s.subtitle}>20 התוצאות הגבוהות בעולם</p>
        </div>

        <div style={s.listContainer}>
          {loading ? (
            <p style={s.emptyState}>טוען תוצאות...</p>
          ) : scores.length === 0 ? (
            <p style={s.emptyState}>עדיין אין שיאים. זה הזמן לקבוע אחד!</p>
          ) : (
            scores.map((entry, idx) => (
              <div key={idx} style={{ 
                ...s.scoreRow, 
                backgroundColor: idx === 0 ? 'rgba(255, 145, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)', 
                borderColor: idx === 0 ? '#FF9100' : 'rgba(255, 255, 255, 0.1)',
                transform: idx === 0 ? 'scale(1.02)' : 'scale(1)'
              }}>
                <div style={s.rank}>{idx + 1}</div>
                <div style={s.details}>
                  <div style={s.name}>{entry.name}</div>
                  <div style={s.stats}>{formatDate(entry.date)} | {entry.difficulty === 'dynamic' ? 'דינמי' : 'רגיל'}</div>
                </div>
                <div style={s.score}>{Math.round(entry.score)} <span style={s.pts}>pts</span></div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} style={s.closeBtn}>הבנתי, בואו נשחק! 🚀</button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '15px', direction: 'rtl', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' },
  container: { width: '100%', maxWidth: '450px', backgroundColor: '#1a1d2e', borderRadius: '30px', padding: '25px 15px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', border: '1px solid rgba(255,145,0,0.2)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', boxSizing: 'border-box' },
  header: { textAlign: 'center', marginBottom: '20px', flexShrink: 0 },
  icon: { fontSize: '3.5rem', display: 'block', marginBottom: '5px' },
  title: { color: '#FF9100', fontSize: '2.2rem', fontWeight: '900', margin: '0 0 5px 0' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  listContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingRight: '5px', paddingLeft: '5px' },
  emptyState: { textAlign: 'center', color: '#94a3b8', marginTop: '30px', fontSize: '1.1rem' },
  scoreRow: { display: 'flex', alignItems: 'center', padding: '12px 15px', borderRadius: '18px', border: '1px solid', transition: 'all 0.3s ease' },
  rank: { width: '35px', fontSize: '1.4rem', fontWeight: '900', color: '#FF9100' },
  details: { flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '10px' },
  name: { fontSize: '1.1rem', fontWeight: 'bold', color: 'white', textAlign: 'right' },
  stats: { fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' },
  score: { fontSize: '1.4rem', fontWeight: '900', color: '#00E5FF', textAlign: 'left' },
  pts: { fontSize: '0.75rem', color: '#64748b', marginRight: '2px' },
  closeBtn: { width: '100%', height: '60px', backgroundColor: '#FF9100', color: '#05081c', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '1.3rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 15px rgba(255,145,0,0.4)' }
};