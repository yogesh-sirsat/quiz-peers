import * as db from "../database/postgres.database";
import { CategoryDTO, QuizCreateInput, QuizDTO, QuizQuestion, QuizUpdateInput } from "../interfaces/quiz.interface";
function mapQuizToDTO(row: any): QuizDTO {
  return {
    quizId: row.quiz_id,
    quizName: row.quiz_name,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contestantsCount: row.contestants_count,
    successRate: row.success_rate,
    questionsCount: row.questions_count,
    categories: row.categories
  };
}

function mapCategoryToDTO(row: any): CategoryDTO {
  return {
    categoryId: row.category_id,
    categoryName: row.category_name
  };
}

export async function getAllQuizzesData(onlyValid = true, includeTesting = false): Promise<QuizDTO[]> {
  let queryStr = `
      SELECT
        qz.quiz_id,
        qz.quiz_name,
        qz.description,
        qz.cover_image_url,
        qz.status,
        qz.created_at,
        qz.contestants_count,
        qz.success_rate,
        Count(qq.question_id) questions_count,
        array_agg (DISTINCT qc.category_name) FILTER (WHERE qc.category_name IS NOT NULL) categories 
      FROM
        quizzes qz
        LEFT JOIN quiz_question_relationships qqr ON qz.quiz_id = qqr.quiz_id
        LEFT JOIN quiz_questions qq ON qqr.question_id = qq.question_id
        LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
  `;

  const whereClauses = [];

  if (onlyValid) {
    whereClauses.push(`
      EXISTS (
        SELECT 1 FROM quiz_question_relationships qqr2
        WHERE qqr2.quiz_id = qz.quiz_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM quiz_question_relationships qqr3
        JOIN quiz_questions qq3 ON qqr3.question_id = qq3.question_id
        LEFT JOIN correct_options co ON qq3.question_id = co.question_id
        WHERE qqr3.quiz_id = qz.quiz_id
        AND (
          co.correct_option_id IS NULL 
          OR NOT EXISTS (SELECT 1 FROM quiz_options qo WHERE qo.question_id = qq3.question_id)
        )
      )
    `);
  }

  if (!includeTesting) {
    whereClauses.push(`qz.status = 'published'`);
  } else {
    whereClauses.push(`qz.status IN ('published', 'testing')`);
  }

  if (whereClauses.length > 0) {
    queryStr += ` WHERE ` + whereClauses.join(" AND ");
  }

  queryStr += `
      GROUP BY
        qz.quiz_id
    `;
  const result = await db.query<any>(queryStr);
  return result.rows.map(mapQuizToDTO);
}

export async function createQuizData({ quizName, description, coverImageUrl, status = 'draft' }: QuizCreateInput): Promise<QuizDTO> {
  const queryStr = `
    INSERT INTO quizzes (quiz_name, description, cover_image_url, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [quizName, description, coverImageUrl, status]);
  return mapQuizToDTO(result.rows[0]);
}

export async function updateQuizData(quizId: number, { quizName, description, coverImageUrl, status }: QuizUpdateInput): Promise<QuizDTO> {
  const queryStr = `
    UPDATE quizzes
    SET quiz_name = COALESCE($1, quiz_name),
        description = COALESCE($2, description),
        cover_image_url = COALESCE($3, cover_image_url),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE quiz_id = $5
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [quizName, description, coverImageUrl, status, quizId]);
  return mapQuizToDTO(result.rows[0]);
}

export async function deleteQuizData(quizId: number, deleteQuestions = false): Promise<boolean> {
  if (deleteQuestions) {
    const getQuestionsQuery = `SELECT question_id FROM quiz_question_relationships WHERE quiz_id = $1`;
    const questionsResult = await db.query<{ question_id: number }>(getQuestionsQuery, [quizId]);
    const questionIds = questionsResult.rows.map((r) => r.question_id);

    if (questionIds.length > 0) {
      const deleteQuestionsQuery = `
          DELETE FROM quiz_questions
          WHERE question_id = ANY($1)
          AND question_id NOT IN (
            SELECT question_id FROM quiz_question_relationships WHERE quiz_id != $2
          )
        `;
      await db.query(deleteQuestionsQuery, [questionIds, quizId]);
    }
  }

  const queryStr = `DELETE FROM quizzes WHERE quiz_id = $1`;
  const result = await db.query(queryStr, [quizId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getQuizByIdData(quizId: number): Promise<QuizDTO> {
  const queryStr = `
    SELECT
      qz.quiz_id,
      qz.quiz_name,
      qz.description,
      qz.cover_image_url,
      qz.status,
      qz.created_at,
      qz.updated_at,
      qz.contestants_count,
      ROUND(qz.success_rate) success_rate,
      Count(qq.question_id) questions_count,
      array_agg (DISTINCT qc.category_name) FILTER (WHERE qc.category_name IS NOT NULL) categories 
    FROM
      quizzes qz
      LEFT JOIN quiz_question_relationships qqr ON qz.quiz_id = qqr.quiz_id
      LEFT JOIN quiz_questions qq ON qqr.question_id = qq.question_id
      LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
    WHERE
      qz.quiz_id = $1
    GROUP BY
      qz.quiz_id
  `;
  const result = await db.query<any>(queryStr, [quizId]);
  return mapQuizToDTO(result.rows[0]);
}

export async function getQuizQuestionsForPlay(quizId: number): Promise<QuizQuestion[]> {
  const questionQuery = `
    SELECT
      qq.question_id,
      qq.question_text,
      qq.category_id,
      qc.category_name,
      qq.image_url,
      qq.audio_url,
      qq.difficulty,
      qq.qtype,
      co.correct_option_id
    FROM
      quiz_question_relationships qqr
      JOIN quiz_questions qq ON qqr.question_id = qq.question_id
      LEFT JOIN quiz_categories qc ON qq.category_id = qc.category_id
      LEFT JOIN correct_options co ON qq.question_id = co.question_id
    WHERE
      qqr.quiz_id = $1 AND qq.qtype = 'TRIVIA'
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
    db.query<any>(questionQuery, [quizId]),
    db.query<any>(optionQuery, [quizId])
  ]);

  const optionsByQuestionId = new Map<number, any[]>();
  optionsResult.rows.forEach((option: any) => {
    if (option.question_id !== null && option.question_id !== undefined) {
      if (!optionsByQuestionId.has(option.question_id)) {
        optionsByQuestionId.set(option.question_id, []);
      }
      optionsByQuestionId.get(option.question_id)?.push({
        optionId: option.option_id,
        optionText: option.option_text,
        imageUrl: option.image_url,
        audioUrl: option.audio_url
      });
    }
  });

  const allQuestions: QuizQuestion[] = questionsResult.rows.map((question: any) => {
    const options = optionsByQuestionId.get(question.question_id) || [];
    // Shuffle options using Fisher-Yates algorithm
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return {
      questionId: question.question_id,
      questionText: question.question_text,
      categoryId: question.category_id,
      categoryName: question.category_name,
      imageUrl: question.image_url,
      audioUrl: question.audio_url,
      difficulty: question.difficulty || "Medium",
      qtype: question.qtype,
      correctOptionId: question.correct_option_id,
      options
    };
  });

  // Filter out questions that don't have a correct option set OR don't have any options
  const playableQuestions = allQuestions.filter(q => {
    const hasOptions = q.options.length > 0;
    const hasCorrectOption = q.correctOptionId !== null && q.correctOptionId !== undefined;
    
    if (!hasOptions || !hasCorrectOption) {
        console.warn(`Question ${q.questionId} ("${q.questionText}") is not playable: HasOptions=${hasOptions}, HasCorrect=${hasCorrectOption}`);
    }
    
    return hasOptions && hasCorrectOption;
  });

  console.log(`getQuizQuestionsForPlay: Found ${playableQuestions.length} playable questions for quiz ${quizId} (out of ${allQuestions.length} total)`);

  return playableQuestions;
}

export async function updateQuizStats(quizId: number, playerCount: number, sessionSuccessRate: number): Promise<void> {
  const queryStr = `
    UPDATE quizzes
    SET
      success_rate = CASE
        WHEN (contestants_count + $2) = 0 THEN 0
        ELSE ROUND(((COALESCE(success_rate, 0) * contestants_count) + ($3 * $2)) / (contestants_count + $2))
      END,
      contestants_count = contestants_count + $2
    WHERE quiz_id = $1
  `;
  await db.query(queryStr, [quizId, playerCount, sessionSuccessRate]);
}

export async function getAllCategoriesData(): Promise<CategoryDTO[]> {
  const queryStr = `SELECT * FROM quiz_categories ORDER BY category_name ASC`;
  const result = await db.query<any>(queryStr);
  return result.rows.map(mapCategoryToDTO);
}

