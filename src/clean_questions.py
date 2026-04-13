import json
import os

def remove_duplicate_questions(filename='questions.json'):
    # בדיקה שהקובץ קיים
    if not os.path.exists(filename):
        print(f"שגיאה: הקובץ {filename} לא נמצא בתיקייה הזו.")
        return

    try:
        # טעינת הנתונים
        with open(filename, 'r', encoding='utf-8') as f:
            questions = json.load(f)

        initial_count = len(questions)
        seen_texts = set()
        unique_questions = []

        for q in questions:
            # הסרת רווחים מיותרים כדי לזהות כפילויות בצורה מדויקת
            q_text = q['text'].strip()
            if q_text not in seen_texts:
                unique_questions.append(q)
                seen_texts.add(q_text)

        # שמירה חזרה לקובץ
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(unique_questions, f, ensure_ascii=False, indent=2)

        removed_count = initial_count - len(unique_questions)
        print(f"התהליך הושלם בהצלחה!")
        print(f"שאלות במקור: {initial_count}")
        print(f"שאלות כפולות שהוסרו: {removed_count}")
        print(f"שאלות שנותרו: {len(unique_questions)}")

    except Exception as e:
        print(f"קרתה שגיאה בזמן העיבוד: {e}")

if __name__ == "__main__":
    remove_duplicate_questions()