import * as db from "../database/postgres.database";
import { QuestionDTO, QuestionCreateInput, QuestionUpdateInput } from "../interfaces/question.interface";

function mapToDTO(row: any): QuestionDTO {
  return {
    questionId: row.question_id,
    questionText: row.question_text,
    categoryId: row.category_id,
    categoryName: row.category_name,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    difficulty: row.difficulty,
    qtype: row.qtype,
    correctOptionId: row.correct_option_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createQuestionData({ questionText, categoryId, imageUrl, audioUrl, difficulty, qtype = "TRIVIA" }: QuestionCreateInput): Promise<QuestionDTO> {
  const queryStr = `
    INSERT INTO quiz_questions (question_text, category_id, image_url, audio_url, difficulty, qtype)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [questionText, categoryId, imageUrl, audioUrl, difficulty, qtype]);
  return mapToDTO(result.rows[0]);
}

export async function getQuestionByIdData(questionId: number): Promise<QuestionDTO> {
  const queryStr = `
    SELECT qq.*, co.correct_option_id
    FROM quiz_questions qq
    LEFT JOIN correct_options co ON qq.question_id = co.question_id
    WHERE qq.question_id = $1
  `;
  const result = await db.query<any>(queryStr, [questionId]);
  return mapToDTO(result.rows[0]);
}

export async function getAllQuestionsData(): Promise<QuestionDTO[]> {
  const queryStr = `
    SELECT qq.*, co.correct_option_id, qc.category_name
    FROM quiz_questions qq
    LEFT JOIN correct_options co ON qq.question_id = co.question_id
    LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
    ORDER BY qq.created_at DESC
  `;
  const result = await db.query<any>(queryStr);
  return result.rows.map(mapToDTO);
}

export async function updateQuestionData(questionId: number, { questionText, categoryId, imageUrl, audioUrl, difficulty, qtype }: QuestionUpdateInput): Promise<QuestionDTO> {
  const queryStr = `
    UPDATE quiz_questions
    SET question_text = COALESCE($1, question_text),
        category_id = COALESCE($2, category_id),
        image_url = COALESCE($3, image_url),
        audio_url = COALESCE($4, audio_url),
        difficulty = COALESCE($5, difficulty),
        qtype = COALESCE($6, qtype),
        updated_at = CURRENT_TIMESTAMP
    WHERE question_id = $7
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [questionText, categoryId, imageUrl, audioUrl, difficulty, qtype, questionId]);
  return mapToDTO(result.rows[0]);
}

export async function deleteQuestionData(questionId: number): Promise<boolean> {
  const queryStr = `DELETE FROM quiz_questions WHERE question_id = $1`;
  const result = await db.query(queryStr, [questionId]);
  return (result.rowCount ?? 0) > 0;
}

export async function addQuestionToQuizData(quizId: number, questionId: number): Promise<void> {
  const queryStr = `
    INSERT INTO quiz_question_relationships (quiz_id, question_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `;
  await db.query(queryStr, [quizId, questionId]);
}

export async function removeQuestionFromQuizData(quizId: number, questionId: number): Promise<boolean> {
  const queryStr = `
    DELETE FROM quiz_question_relationships
    WHERE quiz_id = $1 AND question_id = $2
  `;
  const result = await db.query(queryStr, [quizId, questionId]);
  return (result.rowCount ?? 0) > 0;
}

export async function setCorrectOptionData(questionId: number, optionId: number): Promise<void> {
  const queryStr = `
    INSERT INTO correct_options (question_id, correct_option_id)
    VALUES ($1, $2)
    ON CONFLICT (question_id) DO UPDATE SET correct_option_id = EXCLUDED.correct_option_id
  `;
  await db.query(queryStr, [questionId, optionId]);
}

export async function getRandomSimilarityQuestionsData(count: number): Promise<QuestionDTO[]> {
  const safeCount = Math.max(1, Math.min(20, count || 10));

  const questionQuery = `
    SELECT
      qq.question_id,
      qq.question_text,
      qq.category_id,
      qc.category_name,
      qq.image_url,
      qq.audio_url,
      qq.difficulty,
      qq.qtype
    FROM quiz_questions qq
    LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
    WHERE qq.qtype = 'SIMILARITY'
      AND EXISTS (SELECT 1 FROM quiz_options qo WHERE qo.question_id = qq.question_id)
    ORDER BY RANDOM()
    LIMIT $1
  `;

  const questionsResult = await db.query<any>(questionQuery, [safeCount]);
  if (!questionsResult.rows.length) {
    return [];
  }

  const questionIds = questionsResult.rows.map((row: any) => row.question_id);
  const optionQuery = `
    SELECT option_id, question_id, option_text, image_url, audio_url
    FROM quiz_options
    WHERE question_id = ANY($1::int[])
    ORDER BY question_id ASC, option_id ASC
  `;
  const optionsResult = await db.query<any>(optionQuery, [questionIds]);

  const optionsByQuestionId = new Map<number, any[]>();
  optionsResult.rows.forEach((option: any) => {
    if (!optionsByQuestionId.has(option.question_id)) {
      optionsByQuestionId.set(option.question_id, []);
    }
    optionsByQuestionId.get(option.question_id)!.push({
      optionId: option.option_id,
      questionId: option.question_id,
      optionText: option.option_text,
      imageUrl: option.image_url,
      audioUrl: option.audio_url
    });
  });

  return questionsResult.rows.map((row: any) => ({
    ...mapToDTO(row),
    options: optionsByQuestionId.get(row.question_id) || []
  }));
}

