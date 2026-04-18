"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../src/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

interface ScoreEntry {
  name: string;
  score: number;
  date: number;
  difficulty: string;
  gameId?: string;
  timeAlive?: number; // תוספת: שדה לזמן הישרדות
}

export default function HighscoresStep({ onClose }: { onClose: () => void }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. משיכת נתוני ענן
    const scoresRef = ref(db, 'highscores');
    const scoresQuery = query(scoresRef, orderByChild('score'), limitToLast(150));

    const unsubscribe = onValue(scoresQuery, (snapshot) => {
      const firebaseScores: ScoreEntry[] = [];
      const data = snapshot.val();
      
      if (data) {
        Object.values(data).forEach((s: any) => {
          firebaseScores.push(s as ScoreEntry);
        });
      }

      // 2. משיכת נתונים מקומיים
      const localData = localStorage.getItem('trivia_solo_highscores');
      const localScores: ScoreEntry[] = localData ? JSON.parse(localData) : [];

      // 3. מיזוג וסינון כפילויות לפי gameId (או שם+תאריך לגרסאות ישנות)
      const combined = [...firebaseScores, ...localScores];
      const uniqueScoresMap = new Map<string, ScoreEntry>();
      
      combined.forEach(entry => {
        const key = entry.gameId || `${entry.name}-${entry.date}`;
        const existing = uniqueScoresMap.get(key);
        
        if (!existing || entry.score > existing.score) {
          uniqueScoresMap.set(key, entry);
        }
      });

      // 4. המרה חזרה למערך, מיון וחיתוך ל-20 הטובים ביותר
      const finalScores = Array.from(uniqueScoresMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      setScores(finalScores);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        
        <div style={styles.header}>
          <span style={styles.icon}>🏆</span>
          <h2 style={styles.title}>אלופי הטריוויה</h2>
          <p style={styles.subtitle}>20 התוצאות הגבוהות ביותר</p>
        </div>

        <div style={styles.listContainer}>
          {loading ? (
            <div style={styles.emptyState}>טוען תוצאות...</div>
          ) : scores.length === 0 ? (
            <div style={styles.emptyState}>עדיין אין תוצאות. תהיו הראשונים!</div>
          ) : (
            scores.map((s, idx) => (
              <div 
                key={s.gameId || `${s.date}-${idx}`} 
                style={{
                  ...styles.scoreRow,
                  backgroundColor: idx === 0 ? 'rgba(255, 145, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                  borderColor: idx === 0 ? '#FF9100' : 'rgba(255,255,255,0.1)',
                  transform: idx === 0 ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={styles.rank}>#{idx + 1}</div>
                <div style={styles.details}>
                  <div style={styles.name}>{s.name}</div>
                  <div style={styles.stats}>
                    {new Date(s.date).toLocaleDateString('he-IL')} | {s.difficulty}
                    {/* תצוגת זמן ההישרדות במידה וקיים הנתון */}
                    {s.timeAlive !== undefined && s.timeAlive > 0 && (
                      <span style={{ color: '#FF9100' }}> | ⏱️ {s.timeAlive} שניות</span>
                    )}
                  </div>
                </div>
                <div style={styles.scoreValue}>{s.score.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} style={styles.actionBtn}>חזרה לתפריט</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 28, 0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' },
  modal: { width: '100%', maxWidth: '500px', maxHeight: '85vh', backgroundColor: '#0f172a', borderRadius: '30px', border: '2px solid rgba(255, 145, 0, 0.3)', padding: '30px', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  closeBtn: { position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' },
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
  stats: { fontSize: '0.75rem', color: '#64748b', marginTop: '2px', textAlign: 'right' },
  scoreValue: { fontSize: '1.6rem', fontWeight: '900', color: 'white' },
  actionBtn: { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', background: 'linear-gradient(135deg, #FF9100 0%, #FF6D00 100%)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 145, 0, 0.3)' }
};