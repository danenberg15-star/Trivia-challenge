"use client";

import Logo from "./Logo";
import { styles } from "../game.styles";

interface ScoreStepProps {
  scores: { [key: string]: number };
  entities: string[]; // שמות השחקנים או הקבוצות
  onNextRound: () => void;
  gameMode?: string;
  players?: any[];
}

export default function ScoreStep({ scores, entities, onNextRound, gameMode, players }: ScoreStepProps) {
  return (
    <div style={{...styles.flexLayout, justifyContent: 'flex-start', paddingTop: '40px'}}>
      <Logo />
      <h2 style={{ color: '#ffd700', fontSize: '24px', marginBottom: '20px' }}>טבלת ניקוד</h2>
      
      <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '15px' }}>
        {entities.map((entity, idx) => {
          // משיכת חברי הקבוצה במידה ומדובר במצב קבוצתי
          const teamMembers = gameMode === 'team' && players
            ? players.filter((p: any) => p.teamIdx === idx).map((p: any) => p.name).join(", ")
            : null;

          return (
            <div key={entity} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '12px 15px', 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{entity}</span>
                {teamMembers && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{teamMembers}</span>}
              </div>
              <span style={{ color: '#ffd700', fontSize: '18px', fontWeight: 'bold' }}>
                {scores[entity] || 0} 🏆
              </span>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onNextRound} 
        style={{ ...styles.goldButton, marginTop: '30px', fontSize: '20px' }}
      >
        המשך לסבב הבא ➔
      </button>
    </div>
  );
}