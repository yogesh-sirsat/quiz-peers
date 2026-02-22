/**
 * @fileoverview Script to add questions to an existing quiz from a JSON file via the backend API.
 * 
 * Usage: 
 * 1. Set SERVER_API_URL in your environment or use default http://localhost:3000/api
 * 2. node scripts/add_questions_to_quiz.js <quizId> <path_to_json_file>
 * 
 * JSON format:
 * [
 *   {
 *     "questionText": "What is 2+2?",
 *     "difficulty": "Easy",
 *     "categoryId": 11,
 *     "options": [
 *       { "optionText": "3" },
 *       { "optionText": "4", "isCorrect": true },
 *       { "optionText": "5" }
 *     ]
 *   }
 * ]
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const API_URL = process.env.SERVER_API_URL || 'http://localhost:3000/api';

async function addQuestions() {
  const quizId = process.argv[2];
  const filePath = process.argv[3];
  
  if (!quizId || !filePath) {
    console.error('Error: Please provide a quizId and a path to a JSON file.');
    console.log('Usage: node scripts/add_questions_to_quiz.js <quizId> <path_to_json_file>');
    process.exit(1);
  }

  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    const questionsData = JSON.parse(fileContent);

    if (!Array.isArray(questionsData)) {
      throw new Error('JSON file must contain an array of questions.');
    }

    console.log(`🚀 Adding ${questionsData.length} questions to quiz ID: ${quizId}`);

    // Verify quiz exists
    try {
        await axios.get(`${API_URL}/quizzes/${quizId}`);
    } catch (e) {
        throw new Error(`Quiz with ID ${quizId} not found or API unreachable.`);
    }

    for (const q of questionsData) {
      console.log(`  Processing Question: "${q.questionText.substring(0, 30)}..."`);
      
      // 1. Create Question
      const questionResponse = await axios.post(`${API_URL}/questions`, {
        questionText: q.questionText,
        difficulty: q.difficulty || 'Medium',
        categoryId: q.categoryId,
        imageUrl: q.imageUrl,
        audioUrl: q.audioUrl,
        quizId: quizId
      });

      const questionId = questionResponse.data.questionId || questionResponse.data.question_id;
      let correctOptionId = null;

      // 2. Create Options
      if (q.options && Array.isArray(q.options)) {
        for (const opt of q.options) {
          const optionResponse = await axios.post(`${API_URL}/questions/${questionId}/options`, {
            optionText: opt.optionText,
            imageUrl: opt.imageUrl,
            audioUrl: opt.audioUrl
          });

          const optionId = optionResponse.data.optionId || optionResponse.data.option_id;
          if (opt.isCorrect) {
            correctOptionId = optionId;
          }
        }
      }

      // 3. Set Correct Option
      if (correctOptionId) {
        await axios.put(`${API_URL}/questions/${questionId}/correct-option`, {
          optionId: correctOptionId
        });
        console.log(`    ✅ Question added and correct option set.`);
      } else {
        console.warn(`    ⚠️ Warning: No correct option specified for this question.`);
      }
    }

    console.log('✨ Questions added successfully!');
    
  } catch (error: any) {
    console.error('❌ Failed to add questions:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    process.exit(1);
  }
}

addQuestions();
