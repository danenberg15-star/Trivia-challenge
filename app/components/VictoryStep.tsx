"use client";
import React, { useMemo } from "react";
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

interface Props {
  roomData: any;
  userId: string;
  restartGame: () => void;
}

export default function VictoryStep({ roomData, userId, restartGame }: Props) {
  const { width, height } = useWindowSize();
  const isIndividual = roomData.gameMode === 'individual';

  const winners = useMemo(() => {
    if (isIndividual) {
      const sorted = [...roomData.players].sort((a: any, b: any) => {
        const scoreA = roomData.timeBanks[a.name] || 0;
        const scoreB = roomData.timeBanks[b.name] || 0;
        return scoreB - scoreA;
      });
      return [sorted[0]];
    } else {
      const sortedTeams = roomData.teamNames.map((name: string, idx: number) => ({
        name,
        time: roomData.timeBanks[name] || 0,
        players: roomData.players.filter((p: any) => p.teamIdx === idx)
      })).sort((a: any, b: any) => b.time - a.time);
      
      return [sortedTeams[0]];
    }
  }, [roomData, isIndividual]);

  const winnerName = isIndividual ? winners[0]?.name : winners[0]?.name;
  const winnerTime = isIndividual ? roomData.timeBanks[winnerName] : winners[0]?.time;

  return (
    <div style={s.layout}>
      <Confetti width={width} height={height} numberOfPieces={300} recycle={false} colors={['#ffd700', '#ef4444', '#3b82f6', '#10b981']} />
      
      <div style={s.container}>
        <div style={s.crown}>👑</div>
        <h1 style={s.title}>יש לנו מנצח!</h1>
        
        <div style={s.winnerText}>
          {winnerName}
        </div>
        
        <div style={s.scoreBox}>
          <div style={s.scoreLabel}>עם בנק שניות סופי של:</div>
          <div style={s.scoreNumber}>{Math.max(0, winnerTime)}</div>
          <div style={s.scoreSuffix}>שניות</div>
        </div>

        {!isIndividual && winners[0]?.players && (
          <div style={s.teamPlayers}>
            <div style={s.label}>חברי הקבוצה המנצחת:</div>
            <div style={s.playersList}>
              {winners[0].players.map((p: any) => (
                <div key={p.id} style={{...s.playerItem, border: `2px solid ${p.color}`}}>
                  <div style={{...s.dot, backgroundColor: p.color}} />
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={restartGame} style={s.restartBtn}>
          לשחק שוב? 🔄
        </button>
      </div>
    </div>
  );
}

const s: any = {
  layout: { display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#05081c', color: 'white', alignItems: 'center', justifyContent: 'center', padding: '20px', direction: 'rtl', overflow: 'hidden' },
  container: { width: '100%', maxWidth: '450px', backgroundColor: '#1a1d2e', borderRadius: '40px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', border: '2px solid rgba(255, 215, 0, 0.3)', textAlign: 'center' },
  crown: { fontSize: '5rem', marginBottom: '10px' },
  title: { color: '#ffd700', fontSize: '2.2rem', fontWeight: '900', margin: '0 0 10px 0' },
  winnerText: { fontSize: '3rem', fontWeight: '900', marginBottom: '20px', color: 'white' },
  scoreBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '25px', padding: '20px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '25px' },
  scoreLabel: { fontSize: '1rem', opacity: 0.7, marginBottom: '5px' },
  scoreNumber: { fontSize: '4rem', fontWeight: '900', color: '#ffd700', lineHeight: 1 },
  scoreSuffix: { fontSize: '1.2rem', fontWeight: 'bold' },
  teamPlayers: { width: '100%', marginBottom: '25px' },
  label: { fontSize: '0.9rem', opacity: 0.6, marginBottom: '8px', textAlign: 'right' },
  playersList: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' },
  playerItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 15px', borderRadius: '15px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  restartBtn: { width: '100%', height: '60px', backgroundColor: '#ffd700', color: '#05081c', border: 'none', borderRadius: '20px', fontSize: '1.4rem', fontWeight: '900', cursor: 'pointer' },
};