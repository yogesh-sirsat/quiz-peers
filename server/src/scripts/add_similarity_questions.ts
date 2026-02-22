import axios from "axios";
import fs from "fs/promises";
import http from "http";
import https from "https";
import path from "path";
import "dotenv/config";

const API_URL = process.env.SERVER_API_URL || "http://localhost:3000/api";
const MAX_RETRIES = Number(process.env.SIMILARITY_IMPORT_MAX_RETRIES || 4);

const httpClient = axios.create({
  baseURL: API_URL,
  timeout: Number(process.env.SIMILARITY_IMPORT_TIMEOUT_MS || 15000),
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false })
});

interface SimilarityOptionInput {
  optionText?: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface SimilarityQuestionInput {
  questionText: string;
  difficulty?: string;
  categoryId?: number;
  imageUrl?: string;
  audioUrl?: string;
  options: SimilarityOptionInput[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: any): boolean {
  const code = error?.code;
  const status = error?.response?.status;
  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "EPIPE" ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function withRetry<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt += 1;
      if (attempt > MAX_RETRIES || !isRetryableNetworkError(error)) {
        throw error;
      }
      const waitMs = Math.min(5000, 300 * 2 ** (attempt - 1));
      console.warn(`${operationName} failed (${error?.code || error?.message}). Retry ${attempt}/${MAX_RETRIES} in ${waitMs}ms...`);
      await sleep(waitMs);
    }
  }
}

async function addSimilarityQuestions(): Promise<void> {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx src/scripts/add_similarity_questions.ts <path_to_json_file>");
    process.exit(1);
  }

  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = await fs.readFile(absolutePath, "utf-8");
    const questionsData = JSON.parse(fileContent) as SimilarityQuestionInput[];

    if (!Array.isArray(questionsData)) {
      throw new Error("Input JSON must be an array of similarity questions.");
    }

    console.log(`Adding ${questionsData.length} similarity questions...`);

    let created = 0;
    let failed = 0;

    for (let index = 0; index < questionsData.length; index++) {
      const question = questionsData[index];
      if (!question.questionText || !Array.isArray(question.options) || question.options.length === 0) {
        console.warn(`Skipping invalid question payload: ${question.questionText || "Untitled"}`);
        failed += 1;
        continue;
      }

      try {
        const questionResponse = await withRetry(`create question ${index + 1}`, async () =>
          httpClient.post("/questions", {
            questionText: question.questionText,
            difficulty: question.difficulty || "Medium",
            categoryId: question.categoryId,
            imageUrl: question.imageUrl,
            audioUrl: question.audioUrl,
            qtype: "SIMILARITY"
          })
        );

        const questionId = questionResponse.data.questionId || questionResponse.data.question_id;
        for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) {
          const option = question.options[optionIndex];
          await withRetry(`create option ${index + 1}.${optionIndex + 1}`, async () =>
            httpClient.post(`/questions/${questionId}/options`, {
              optionText: option.optionText,
              imageUrl: option.imageUrl,
              audioUrl: option.audioUrl
            })
          );
        }

        created += 1;
        console.log(`[${index + 1}/${questionsData.length}] Added SIMILARITY question #${questionId}: ${question.questionText.slice(0, 60)}`);
      } catch (error: any) {
        failed += 1;
        console.error(`[${index + 1}/${questionsData.length}] Failed: ${question.questionText.slice(0, 60)}`);
        if (error?.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Message: ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`Error: ${error?.code || error?.message}`);
        }
      }
    }

    console.log(`Similarity question import completed. Success=${created}, Failed=${failed}`);
  } catch (error: any) {
    console.error("Failed to add similarity questions.");
    if (error?.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error?.code || error?.message);
    }
    process.exit(1);
  }
}

addSimilarityQuestions();
