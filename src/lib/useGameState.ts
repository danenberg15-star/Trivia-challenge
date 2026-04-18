"use client";
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, get, set } from 'firebase/database';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

// רשימת מספרים ראשוניים לערבוב ה-Seed (כמו במשחק המולטיפלייר)
const coprimes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

// רשימת שמות חדרים מיוחדים שמפעילים בוטים
const BOT_ROOMS = ['עומר', 'qa_omer_room', 'עומר Q', 'עומר q'];

export function useGameState() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const savedId = localStorage.getItem('trivia_user_id') || generateId();
    localStorage.setItem('trivia_user_id', savedId);
    setUserId(savedId);
  }, []);

  // יצירת חדר חדש (משחק רשת חברים)
  const handleCreateRoom = async (creatorName: string) => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = ref(db, `rooms/${newRoomId}`);
    const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
    
    await set(roomRef, {
      id: newRoomId,
      step: 3,
      players: [{ id: userId, name: creatorName, teamIdx: 0 }],
      teamNames: ['קבוצה 1', 'קבוצה 2'],
      timeBanks: { 'קבוצה 1': 15, 'קבוצה 2': 15 },
      powerUps: { 'קבוצה 1': [], 'קבוצה 2': [] },
      gameMode: 'group',
      seed: seed,
      currentQuestionIdx: 0,
      askedQuestions: []
    });
    return newRoomId;
  };

  // הצטרפות לחדר קיים או חדר QA
  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    const upperCode = roomCode.toUpperCase().trim();
    const originalCode = roomCode.trim();

    // בדיקה אם זה חדר בוטים (QA)
    if (BOT_ROOMS.includes(originalCode) || BOT_ROOMS.includes(upperCode)) {
       const roomRef = ref(db, `rooms/${upperCode}`);
       // יצירת Seed אקראי גם בחדר ה-QA כדי לגוון בשאלות בכל כניסה
       const seed = coprimes[Math.floor(Math.random() * coprimes.length)];
       
       await set(roomRef, {
         id: upperCode,
         step: 3,
         players: [
           { id: userId, name: playerName, teamIdx: 0 },
           { id: 'bot1', name: 'בוט אלפא', teamIdx: 1 },
           { id: 'bot2', name: 'בוט בטא', teamIdx: 1 }
         ],
         teamNames: ['הקבוצה שלי', 'הבוטים'],
         timeBanks: { 'הקבוצה שלי': 15, 'הבוטים': 15 },
         powerUps: { 'הקבוצה שלי': [], 'הבוטים': [] },
         gameMode: 'group',
         seed: seed,
         currentQuestionIdx: 0,
         askedQuestions: []
       });
       return true;
    }

    const roomRef = ref(db, `rooms/${upperCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const players = data.players || [];
      
      const isAlreadyIn = players.find((p: any) => p.id === userId);
      if (!isAlreadyIn) {
        const team0Count = players.filter((p: any) => p.teamIdx === 0).length;
        const team1Count = players.filter((p: any) => p.teamIdx === 1).length;
        const teamIdx = team0Count <= team1Count ? 0 : 1;
        
        const updatedPlayers = [...players, { id: userId, name: playerName, teamIdx }];
        await update(roomRef, { players: updatedPlayers });
      }
      return true;
    }
    return false;
  };

  return { mounted, userId, setUserName, handleCreateRoom, handleJoinRoom };
}

// פונקציית עזר לייבוא - הוספת פקודת ה-update שחסרה ב-imports בגרסה הקודמת
import { update } from 'firebase/database';