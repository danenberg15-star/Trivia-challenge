const fs = require('fs');

// שנה את הנתיב כאן למיקום המדויק של קובץ השאלות שלך
const inputPath = './src/lib/questions.json';
const outputPath = './src/lib/questions_clean.json';

try {
  // 1. קריאת הקובץ הקיים
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const questions = JSON.parse(rawData);

  // 2. סינון כפילויות
  const uniqueQuestions = [];
  const seenTexts = new Set();

  questions.forEach(q => {
    // מנקה רווחים מיותרים כדי למנוע פספוסים
    const cleanText = q.text.trim();
    
    // אם עוד לא ראינו את השאלה הזו - נוסיף אותה למערך החדש
    if (!seenTexts.has(cleanText)) {
      seenTexts.add(cleanText);
      uniqueQuestions.push(q);
    }
  });

  // 3. יצירת הקובץ החדש והנקי
  fs.writeFileSync(outputPath, JSON.stringify(uniqueQuestions, null, 2));

  console.log('✅ הניקוי עבר בהצלחה!');
  console.log(`📉 ירדנו מ-${questions.length} שאלות במקור, ל-${uniqueQuestions.length} שאלות ייחודיות בלבד.`);
} catch (error) {
  console.error('❌ שגיאה במהלך הניקוי:', error.message);
}