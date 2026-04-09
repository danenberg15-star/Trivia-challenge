"use client";

import React from "react";
import { styles } from "../game.styles";

interface CountdownStepProps {
  timer: number;
  turnInfo: { name: string; team: string };
  isTeamMode: boolean;
}

export default function CountdownStep({ timer, turnInfo, isTeamMode }: CountdownStepProps) {
  return (
    <div style={styles.flexLayout}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '24px', color: '#64748b', marginBottom: '10px' }}>מתחילים בעוד...</div>
        <div style={{ fontSize: '120px', fontWeight: '900', color: '#ffd700', lineHeight: '1' }}>{timer}</div>
      </div>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '24px', width: '320px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
        {isTeamMode ? (
          <div style={{ fontSize: '20px', color: '#fff', lineHeight: '1.5' }}>
            תור <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{turnInfo.name}</span> מ-<span style={{ color: '#ffd700', fontWeight: 'bold' }}>{turnInfo.team}</span><br/>
            לתאר את המילה
          </div>
        ) : (
          <>
            <div style={{ fontSize: '18px', color: '#64748b', marginBottom: '8px' }}>תור השחקן:</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{turnInfo.name}</div>
          </>
        )}
      </div>
    </div>
  );
}