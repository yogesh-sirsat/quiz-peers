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

export async function getQuizQuestionsForPlay(quizId) {
  const questionQuery = `
    SELECT
      qq.question_id,
      qq.question_text,
      qq.image_url,
      qq.audio_url,
      qq.difficulty,
      co.correct_option_id
    FROM
      quiz_question_relationships qqr
      JOIN quiz_questions qq ON qqr.question_id = qq.question_id
      LEFT JOIN correct_options co ON qq.question_id = co.question_id
    WHERE
      qqr.quiz_id = $1
    ORDER BY
      qq.question_id ASC
  `;
  const optionQuery = `
    SELECT
      qo.option_id,
      qo.question_id,
      qo.option_text,
      qo.image_url,
      qo.audio_url
    FROM
      quiz_options qo
      JOIN quiz_question_relationships qqr ON qo.question_id = qqr.question_id
    WHERE
      qqr.quiz_id = $1
    ORDER BY
      qo.question_id ASC, qo.option_id ASC
  `;

  const [questionsResult, optionsResult] = await Promise.all([
    db.query(questionQuery, [quizId]),
    db.query(optionQuery, [quizId])
  ]);

  const optionsByQuestionId = new Map();
  optionsResult.rows.forEach((option) => {
    if (!optionsByQuestionId.has(option.question_id)) {
      optionsByQuestionId.set(option.question_id, []);
    }
    optionsByQuestionId.get(option.question_id).push({
      optionId: option.option_id,
      optionText: option.option_text,
      imageUrl: option.image_url,
      audioUrl: option.audio_url
    });
  });

  return questionsResult.rows.map((question) => ({
    questionId: question.question_id,
    questionText: question.question_text,
    imageUrl: question.image_url,
    audioUrl: question.audio_url,
    difficulty: question.difficulty || "Medium",
    correctOptionId: question.correct_option_id,
    options: optionsByQuestionId.get(question.question_id) || []
  }));
}

export async function updateQuizStats(quizId, playerCount, sessionSuccessRate) {
  const query = `
    UPDATE quizzes
    SET
      success_rate = CASE
        WHEN (contestants_count + $2) = 0 THEN 0
        ELSE ((COALESCE(success_rate, 0) * contestants_count) + ($3 * $2)) / (contestants_count + $2)
      END,
      contestants_count = contestants_count + $2
    WHERE quiz_id = $1
  `;
  await db.query(query, [quizId, playerCount, sessionSuccessRate]);
}
