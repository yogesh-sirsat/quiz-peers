import * as db from "../database/postgres.database.js";

export async function createOptionData({ questionId, optionText, imageUrl, audioUrl }) {
  const query = `
    INSERT INTO quiz_options (question_id, option_text, image_url, audio_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query(query, [questionId, optionText, imageUrl, audioUrl]);
  return result.rows[0];
}

export async function getOptionsByQuestionIdData(questionId) {
  const query = `SELECT * FROM quiz_options WHERE question_id = $1 ORDER BY option_id ASC`;
  const result = await db.query(query, [questionId]);
  return result.rows;
}

export async function getOptionByIdData(optionId) {
  const query = `SELECT * FROM quiz_options WHERE option_id = $1`;
  const result = await db.query(query, [optionId]);
  return result.rows[0];
}

export async function updateOptionData(optionId, { optionText, imageUrl, audioUrl }) {
  const query = `
    UPDATE quiz_options
    SET option_text = COALESCE($1, option_text),
        image_url = COALESCE($2, image_url),
        audio_url = COALESCE($3, audio_url)
    WHERE option_id = $4
    RETURNING *
  `;
  const result = await db.query(query, [optionText, imageUrl, audioUrl, optionId]);
  return result.rows[0];
}

export async function deleteOptionData(optionId) {
  const query = `DELETE FROM quiz_options WHERE option_id = $1`;
  const result = await db.query(query, [optionId]);
  return result.rowCount > 0;
}
