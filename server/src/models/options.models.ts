import * as db from "../database/postgres.database.ts";
import { OptionDTO, OptionCreateInput, OptionUpdateInput } from "../interfaces/option.interface.ts";

function mapToDTO(row: any): OptionDTO {
  return {
    optionId: row.option_id,
    questionId: row.question_id,
    optionText: row.option_text,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    isCorrect: row.is_correct
  };
}

export async function createOptionData({ questionId, optionText, imageUrl, audioUrl }: OptionCreateInput): Promise<OptionDTO> {
  const queryStr = `
    INSERT INTO quiz_options (question_id, option_text, image_url, audio_url)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [questionId, optionText, imageUrl, audioUrl]);
  return mapToDTO(result.rows[0]);
}

export async function getOptionsByQuestionIdData(questionId: number): Promise<OptionDTO[]> {
  const queryStr = `
    SELECT * FROM quiz_options
    WHERE question_id = $1
    ORDER BY option_id ASC
  `;
  const result = await db.query<any>(queryStr, [questionId]);
  return result.rows.map(mapToDTO);
}

export async function getOptionByIdData(optionId: number): Promise<OptionDTO> {
  const queryStr = `
    SELECT * FROM quiz_options
    WHERE option_id = $1
  `;
  const result = await db.query<any>(queryStr, [optionId]);
  return mapToDTO(result.rows[0]);
}

export async function updateOptionData(optionId: number, { optionText, imageUrl, audioUrl }: OptionUpdateInput): Promise<OptionDTO> {
  const queryStr = `
    UPDATE quiz_options
    SET option_text = COALESCE($1, option_text),
        image_url = COALESCE($2, image_url),
        audio_url = COALESCE($3, audio_url)
    WHERE option_id = $4
    RETURNING *
  `;
  const result = await db.query<any>(queryStr, [optionText, imageUrl, audioUrl, optionId]);
  return mapToDTO(result.rows[0]);
}

export async function deleteOptionData(optionId: number): Promise<boolean> {
  const queryStr = `DELETE FROM quiz_options WHERE option_id = $1`;
  const result = await db.query(queryStr, [optionId]);
  return (result.rowCount ?? 0) > 0;
}
