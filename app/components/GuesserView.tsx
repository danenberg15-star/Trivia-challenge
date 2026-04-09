"use client";

import { styles } from "../game.styles";

interface GuesserViewProps {
  timeLeft: number;
  describerName: string;
  describerTeam: string;
  isTeamMode: boolean;
  totalScores: { [key: string]: number };
  roundScore: number;
  entities: string[];
  onPause: () => void;
  isTeammate?: boolean;
  currentWord?: string;
  currentWordEn?: string;
}

export default function GuesserView(props: GuesserViewProps) {
  const getLiveScore = (entity: string) => {
    const currentActiveEntity = props.isTeamMode ? props.describerTeam : props.describerName;
    const pastScore = props.totalScores[entity] || 0;
    return entity === currentActiveEntity ? pastScore + props.roundScore : pastScore;
  };

  return (
    <div style={styles.gameLayout}>
      <div style={{...styles.timerDisplay, color: props.timeLeft <= 15 ? '#ef4444' : 'white'}}>
        00:{props.timeLeft < 10 ? `0${props.timeLeft}` : props.timeLeft}
      </div>

      <div style={styles.flexLayout}>
        <div style={{ textAlign: 'center', marginBottom: '20px', padding: '0 20px' }}>
          {props.isTeamMode ? (
            props.isTeammate ? (
              <>
                <h2 style={{ color: '#ffd700', fontSize: '2rem', fontWeight: '900', marginBottom: '15px' }}>
                  תהיו קשובים ל-{props.describerName} מקבוצתכם שמתאר/ת את המילה!
                </h2>
              </>
            ) : (
              <>
                <h2 style={{ color: '#ffd700', fontSize: '1.4rem', marginBottom: '20px' }}>
                  {props.describerName} מ-{props.describerTeam} מנסה לתאר את המילה:
                </h2>
                {props.currentWord && (
                  <div style={{ backgroundColor: '#1a1d2e', padding: '30px', borderRadius: '35px', border: '2px solid #ffd700' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{props.currentWord}</div>
                    <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>({props.currentWordEn})</div>
                  </div>
                )}
              </>
            )
          ) : (
            <>
              <h2 style={{ color: '#ffd700', fontSize: '2rem' }}>{props.describerName} מתאר/ת...</h2>
              <p style={{ opacity: 0.7 }}>היו מוכנים לנחש!</p>
            </>
          )}
        </div>

        <div style={{ width: '320px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '10px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', marginBottom: '10px' }}>מצב הנקודות בלייב:</p>
          {props.entities.map(entity => (
            <div key={entity} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px 15px', 
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              color: 'white'
            }}>
              <span style={{ fontWeight: props.describerTeam === entity || props.describerName === entity ? 'bold' : 'normal' }}>
                {entity}
              </span>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{getLiveScore(entity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.gameFooter}>
        <div style={{ color: 'white', fontSize: '14px', opacity: 0.5 }}>
          {props.isTeamMode && props.isTeammate ? "נסו לנחש מהר!" : "הקשיבו למתאר..."}
        </div>
        <button onClick={props.onPause} style={styles.modernPauseBtn}>⏸️</button>
      </div>
    </div>
  );
}