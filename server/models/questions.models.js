import * as db from "../database/postgres.database.js";

export async function createQuestionData({ questionText, categoryId, imageUrl, audioUrl, difficulty }) {
  const query = `
    INSERT INTO quiz_questions (question_text, category_id, image_url, audio_url, difficulty)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await db.query(query, [questionText, categoryId, imageUrl, audioUrl, difficulty]);
  return result.rows[0];
}

export async function getQuestionByIdData(questionId) {
  const query = `
    SELECT qq.*, co.correct_option_id
    FROM quiz_questions qq
    LEFT JOIN correct_options co ON qq.question_id = co.question_id
    WHERE qq.question_id = $1
  `;
  const result = await db.query(query, [questionId]);
  return result.rows[0];
}

export async function getAllQuestionsData() {
  const query = `
    SELECT qq.*, co.correct_option_id, qc.category_name
    FROM quiz_questions qq
    LEFT JOIN correct_options co ON qq.question_id = co.question_id
    LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
    ORDER BY qq.created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

export async function updateQuestionData(questionId, { questionText, categoryId, imageUrl, audioUrl, difficulty }) {
  const query = `
    UPDATE quiz_questions
    SET question_text = COALESCE($1, question_text),
        category_id = COALESCE($2, category_id),
        image_url = COALESCE($3, image_url),
        audio_url = COALESCE($4, audio_url),
        difficulty = COALESCE($5, difficulty),
        updated_at = CURRENT_TIMESTAMP
    WHERE question_id = $6
    RETURNING *
  `;
  const result = await db.query(query, [questionText, categoryId, imageUrl, audioUrl, difficulty, questionId]);
  return result.rows[0];
}

export async function deleteQuestionData(questionId) {
  const query = `DELETE FROM quiz_questions WHERE question_id = $1`;
  const result = await db.query(query, [questionId]);
  return result.rowCount > 0;
}

export async function addQuestionToQuizData(quizId, questionId) {
  const query = `
    INSERT INTO quiz_question_relationships (quiz_id, question_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `;
  await db.query(query, [quizId, questionId]);
}

export async function removeQuestionFromQuizData(quizId, questionId) {
  const query = `
    DELETE FROM quiz_question_relationships
    WHERE quiz_id = $1 AND question_id = $2
  `;
  const result = await db.query(query, [quizId, questionId]);
  return result.rowCount > 0;
}

export async function setCorrectOptionData(questionId, optionId) {
  const query = `
    INSERT INTO correct_options (question_id, correct_option_id)
    VALUES ($1, $2)
    ON CONFLICT (question_id) DO UPDATE SET correct_option_id = EXCLUDED.correct_option_id
  `;
  await db.query(query, [questionId, optionId]);
}
