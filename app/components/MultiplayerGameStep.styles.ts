// app/components/MultiplayerGameStep.styles.ts

export const s: any = {
    layout: { 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh', 
      backgroundColor: '#05081c', 
      color: 'white', 
      padding: '15px', 
      direction: 'rtl', 
      alignItems: 'center', 
      boxSizing: 'border-box', 
      overflow: 'hidden' 
    },
    clockContainer: { 
      position: 'relative', 
      width: '120px', 
      height: '120px', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      flexShrink: 0, 
      marginTop: '5px' 
    },
    clockTime: { 
      position: 'absolute', 
      fontSize: '2.8rem', 
      fontWeight: '900', 
      color: 'white', 
      fontFamily: 'monospace' 
    },
    contentArea: { 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      maxWidth: '600px', 
      overflowY: 'auto', 
      gap: '15px', 
      padding: '10px 5px', 
      boxSizing: 'border-box' 
    },
    powerUpsRow: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      width: '100%', 
      gap: '12px', 
      marginBottom: '10px', 
      flexShrink: 0 
    },
    puBtn: { 
      flex: 1, 
      border: '1px solid', 
      borderRadius: '15px', 
      padding: '12px 5px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px', 
      cursor: 'pointer', 
      color: 'white', 
      transition: 'all 0.3s ease' 
    },
    puIcon: { 
      fontSize: '1.4rem' 
    },
    puCount: { 
      fontSize: '1.1rem', 
      fontWeight: 'bold' 
    },
    questionCard: { 
      backgroundColor: 'rgba(255,255,255,0.02)', 
      borderRadius: '20px', 
      padding: '20px', 
      textAlign: 'center', 
      border: '1px solid rgba(0,229,255,0.1)', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
    },
    questionText: { 
      fontSize: '1.3rem', 
      fontWeight: 'bold', 
      color: '#FF9100', 
      lineHeight: '1.4' 
    },
    optionsGrid: { 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px' 
    },
    optionBtn: { 
      border: '2px solid', 
      borderRadius: '15px', 
      padding: '15px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      transition: 'all 0.2s',
      minHeight: '60px'
    },
    optionText: { 
      fontSize: '1.1rem', 
      fontWeight: 'bold' 
    },
    frozenBox: { 
      backgroundColor: 'rgba(0, 229, 255, 0.05)', 
      border: '2px dashed #00E5FF', 
      borderRadius: '15px', 
      padding: '25px', 
      color: '#00E5FF', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    votersContainer: { 
      display: 'flex', 
      gap: '5px' 
    },
    voterDot: { 
      width: '12px', 
      height: '12px', 
      borderRadius: '50%', 
      border: '1px solid white' 
    },
    footer: { 
      width: '100%', 
      maxWidth: '600px', 
      padding: '5px 0 10px 0', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px' 
    },
    rosterContainer: { 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      borderRadius: '12px', 
      padding: '10px', 
      border: '1px solid rgba(255,255,255,0.05)' 
    },
    rosterLabel: { 
      fontSize: '0.85rem', 
      color: '#FF9100', 
      fontWeight: 'bold', 
      marginBottom: '8px' 
    },
    rosterGrid: { 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '10px' 
    },
    rosterItem: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '5px', 
      backgroundColor: 'rgba(0,0,0,0.3)', 
      padding: '5px 10px', 
      borderRadius: '8px', 
      fontSize: '0.9rem' 
    },
    rosterDot: { 
      width: '10px', 
      height: '10px', 
      borderRadius: '50%' 
    },
    rosterName: { 
      color: 'white' 
    },
    rosterStatus: { 
      marginLeft: '5px' 
    },
    lockBadgeActive: { 
      width: '100%', 
      padding: '18px', 
      backgroundColor: 'rgba(16,185,129,0.2)', 
      color: '#10b981', 
      border: '2px solid #10b981', 
      borderRadius: '15px', 
      fontWeight: '900', 
      fontSize: '1.2rem', 
      textAlign: 'center',
      boxShadow: '0 0 20px rgba(16,185,129,0.3)'
    },
    lockBadgePending: { 
      width: '100%', 
      padding: '18px', 
      backgroundColor: '#1a1d2e', 
      color: '#94a3b8', 
      border: '1px solid rgba(255,255,255,0.05)', 
      borderRadius: '15px', 
      fontWeight: '700', 
      fontSize: '1.1rem',
      textAlign: 'center'
    }
  };