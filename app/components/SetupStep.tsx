"use client";
import React from "react";

export default function SetupStep({ roomData, userId, updateRoom, onStart }: any) {
  const isCreator = roomData.creatorId === userId;

  const toggleGameMode = () => {
    if (!isCreator) return;
    updateRoom({ gameMode: roomData.gameMode === 'team' ? 'individual' : 'team' });
  };

  const setDifficulty = (diff: string) => {
    if (!isCreator) return;
    updateRoom({ difficulty: diff });
  };

  const shareRoom = () => {
    const text = `בואו לשחק איתי ב-Trivia Time Challenge! הקוד הוא: ${roomData.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div style={s.layout}>
      <div style={s.header}>
        <div style={s.roomIdLabel}>קוד חדר</div>
        <div style={s.roomId} onClick={shareRoom}>{roomData.id} 🔗</div>
      </div>

      <div style={s.section}>
        <div style={s.label}>סוג משחק</div>
        <div style={s.toggleBar}>
          <button 
            onClick={toggleGameMode} 
            style={{...s.toggleBtn, backgroundColor: roomData.gameMode === 'individual' ? '#ffd700' : 'transparent', color: roomData.gameMode === 'individual' ? '#05081c' : 'white'}}
          >יחידים</button>
          <button 
            onClick={toggleGameMode} 
            style={{...s.toggleBtn, backgroundColor: roomData.gameMode === 'team' ? '#ffd700' : 'transparent', color: roomData.gameMode === 'team' ? '#05081c' : 'white'}}
          >קבוצות</button>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.label}>רמת קושי</div>
        <div style={s.toggleBar}>
          {['easy', 'medium', 'hard'].map(d => (
            <button 
              key={d} 
              onClick={() => setDifficulty(d)} 
              style={{...s.toggleBtn, flex: 1, backgroundColor: roomData.difficulty === d ? '#ffd700' : 'transparent', color: roomData.difficulty === d ? '#05081c' : 'white'}}
            >
              {d === 'easy' ? 'קל' : d === 'medium' ? 'בינוני' : 'קשה'}
            </button>
          ))}
        </div>
      </div>

      <div style={s.playersList}>
        <div style={s.label}>שחקנים בחדר ({roomData.players?.length || 0})</div>
        <div style={s.listScroll}>
          {roomData.players?.map((p: any) => (
            <div key={p.id} style={s.playerItem}>
              <div style={{...s.dot, backgroundColor: p.color}} />
              <span>{p.name}</span>
              {p.id === roomData.creatorId && <span style={s.adminTag}>מנהל</span>}
            </div>
          ))}
        </div>
      </div>

      {isCreator ? (
        <button onClick={onStart} style={s.startBtn}>בואו נתחיל! 🚀</button>
      ) : (
        <div style={s.waitingMsg}>ממתינים למנהל שיתחיל...</div>
      )}
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', padding: '20px', direction: 'rtl' },
  header: { textAlign: 'center', marginBottom: '30px', marginTop: '20px' },
  roomIdLabel: { opacity: 0.6, fontSize: '0.9rem' },
  roomId: { fontSize: '3rem', fontWeight: '900', color: '#ffd700', cursor: 'pointer' },
  section: { marginBottom: '25px' },
  label: { marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem' },
  toggleBar: { display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '5px', border: '1px solid rgba(255,255,255,0.1)' },
  toggleBtn: { flex: 1, height: '45px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' },
  playersList: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '25px', padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  listScroll: { overflowY: 'auto', flex: 1 },
  playerItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  dot: { width: '12px', height: '12px', borderRadius: '50%' },
  adminTag: { fontSize: '0.7rem', backgroundColor: '#ffd700', color: '#05081c', padding: '2px 8px', borderRadius: '10px', marginRight: 'auto', fontWeight: 'bold' },
  startBtn: { height: '60px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '20px', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer', marginTop: '20px', boxShadow: '0 10px 20px rgba(255,215,0,0.2)' },
  waitingMsg: { textAlign: 'center', padding: '20px', opacity: 0.6, fontStyle: 'italic' }
};