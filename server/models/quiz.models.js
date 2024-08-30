import * as db from "../database/postgres.database.js";

export async function getAllQuizzesData() {
  const query = `
      SELECT
        qz.quiz_id,
        qz.quiz_name,
        qz.cover_image_url,
        qz.created_at,
        qz.contestants_count,
        qz.success_rate,
        Count(qq.question_id) questions_count,
        array_agg (DISTINCT qc.category_name) categories 
      FROM
        quizzes qz
        LEFT JOIN quiz_question_relationships qqr ON qz.quiz_id = qqr.quiz_id
        LEFT JOIN quiz_questions qq ON qqr.question_id = qq.question_id
        JOIN quiz_categories qc ON qq.category_id = qc.category_id
      GROUP BY
        qz.quiz_id
    `;
  const result = await db.query(query);
  return result.rows;
}

export async function getQuizByIdData(quizId) {
  const query = `
    SELECT
      qz.quiz_id,
      qz.quiz_name,
      qz.description,
      qz.cover_image_url,
      qz.created_at,
      qz.updated_at,
      qz.contestants_count,
      ROUND(qz.success_rate) success_rate,
      Count(qq.question_id) questions_count,
      array_agg (DISTINCT qc.category_name) categories 
    FROM
      quizzes qz
      LEFT JOIN quiz_question_relationships qqr ON qz.quiz_id = qqr.quiz_id
      LEFT JOIN quiz_questions qq ON qqr.question_id = qq.question_id
      JOIN quiz_categories qc ON qq.category_id = qc.category_id
    WHERE
      qz.quiz_id = $1
    GROUP BY
      qz.quiz_id
  `;
  const result = await db.query(query, [quizId]);
  return result.rows[0];
}
