import * as db from "../database/postgres.database.ts";
import { OptionDTO, OptionCreateInput, OptionUpdateInput } from "../interfaces/option.interface.ts";

export async function createOptionData({ questionId, optionText, imageUrl, audioUrl }: OptionCreateInput): Promise<OptionDTO> {
  const queryStr = `
    INSERT INTO quiz_options (question_id, option_text, image_url, audio_url)
    VALUES (, $2, $3, $4)
    RETURNING *
  `;
  const result = await db.query<OptionDTO>(queryStr, [questionId, optionText, imageUrl, audioUrl]);
  return result.rows[0];
}

export async function getOptionsByQuestionIdData(questionId: number): Promise<OptionDTO[]> {
  const queryStr = `
    SELECT * FROM quiz_options
    WHERE question_id = 
    ORDER BY option_id ASC
  `;
  const result = await db.query<OptionDTO>(queryStr, [questionId]);
  return result.rows;
}

export async function getOptionByIdData(optionId: number): Promise<OptionDTO> {
  const queryStr = `
    SELECT * FROM quiz_options
    WHERE option_id = 
  `;
  const result = await db.query<OptionDTO>(queryStr, [optionId]);
  return result.rows[0];
}

export async function updateOptionData(optionId: number, { optionText, imageUrl, audioUrl }: OptionUpdateInput): Promise<OptionDTO> {
  const queryStr = `
    UPDATE quiz_options
    SET option_text = COALESCE(, option_text),
        image_url = COALESCE($2, image_url),
        audio_url = COALESCE($3, audio_url)
    WHERE option_id = $4
    RETURNING *
  `;
  const result = await db.query<OptionDTO>(queryStr, [optionText, imageUrl, audioUrl, optionId]);
  return result.rows[0];
}

export async function deleteOptionData(optionId: number): Promise<boolean> {
  const queryStr = `DELETE FROM quiz_options WHERE option_id = $1`;
  const result = await db.query(queryStr, [optionId]);
  return (result.rowCount ?? 0) > 0;
}
