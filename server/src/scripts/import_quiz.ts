/**
 * @fileoverview Script to import a quiz from a JSON file into the Quiz Peers database via the backend API.
 * 
 * Usage: 
 * 1. Set SERVER_API_URL in your environment or use default http://localhost:3000/api
 * 2. node scripts/import_quiz.js <path_to_json_file>
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

const API_URL = process.env.SERVER_API_URL || 'http://localhost:3000/api';

/**
 * @typedef {Object} Option
 * @property {string} optionText
 * @property {string} [imageUrl]
 * @property {string} [audioUrl]
 * @property {boolean} [isCorrect]
 */

/**
 * @typedef {Object} Question
 * @property {string} questionText
 * @property {string} [difficulty]
 * @property {number} [categoryId]
 * @property {string} [imageUrl]
 * @property {string} [audioUrl]
 * @property {Option[]} options
 */

/**
 * @typedef {Object} Quiz
 * @property {string} quizName
 * @property {string} [description]
 * @property {string} [coverImageUrl]
 * @property {Question[]} questions
 */

async function importQuiz() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Error: Please provide a path to a JSON file.');
    console.log('Usage: node scripts/import_quiz.js <path_to_json_file>');
    process.exit(1);
  }

  try {
    const absolutePath = path.resolve(filePath);
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    /** @type {Quiz} */
    const quizData = JSON.parse(fileContent);

    console.log(`🚀 Starting import for quiz: "${quizData.quizName}"`);

    // 1. Create the Quiz
    const quizResponse = await axios.post(`${API_URL}/quizzes`, {
      quizName: quizData.quizName,
      description: quizData.description,
      coverImageUrl: quizData.coverImageUrl
    });
    
    const quizId = quizResponse.data.quiz_id;
    console.log(`✅ Created Quiz (ID: ${quizId})`);

    // 2. Iterate through Questions
    for (const q of quizData.questions) {
      console.log(`  Processing Question: "${q.questionText.substring(0, 30)}..."`);
      
      const questionResponse = await axios.post(`${API_URL}/questions`, {
        questionText: q.questionText,
        difficulty: q.difficulty || 'Medium',
        categoryId: q.categoryId,
        imageUrl: q.imageUrl,
        audioUrl: q.audioUrl,
        quizId: quizId // Link to quiz automatically
      });

      const questionId = questionResponse.data.question_id;
      let correctOptionId = null;

      // 3. Create Options for each question
      for (const opt of q.options) {
        const optionResponse = await axios.post(`${API_URL}/questions/${questionId}/options`, {
          optionText: opt.optionText,
          imageUrl: opt.imageUrl,
          audioUrl: opt.audioUrl
        });

        const optionId = optionResponse.data.option_id;
        if (opt.isCorrect) {
          correctOptionId = optionId;
        }
      }

      // 4. Set Correct Option if found
      if (correctOptionId) {
        await axios.put(`${API_URL}/questions/${questionId}/correct-option`, {
          optionId: correctOptionId
        });
        console.log(`    ✅ Question created and correct option set.`);
      } else {
        console.warn(`    ⚠️ Warning: No correct option specified for this question.`);
      }
    }

    console.log('✨ Import completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Import failed:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    process.exit(1);
  }
}

importQuiz();
