import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import db from "../database/mongodb.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function Gemini(questions, res) {
  const outof = questions.length;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Constructing the prompt with all questions and expected answers
    let prompt = `return a json object strictly like this even if none of the questions are answered also reduce the marking stictness, return correct if the idea is the same or the answer is not complete  {
  "questions": [
    {
      "question": "1. Calculate 345 + 212.",
      "student_answer": "557",
      "correct_answer": "557",
      "is_correct": true
    },
    {
      "question": "2. What is the product of 24 and 8?",
      "student_answer": "192",
      "correct_answer": "192",
      "is_correct": true
    },
    {
      "question": "3. Subtract 156 from 300.",
      "student_answer": "144",
      "correct_answer": "144",
      "is_correct": true
    },
    {
      "question": "4. Divide 84 by 7.",
      "student_answer": "Not answered",
      "correct_answer": "12",
      "is_correct": false
    },
    {
      "question": "5. Simplify: 3/4 + 2/3.",
      "student_answer": "Not answered",
      "correct_answer": "17/12",
      "is_correct": false
    }
  ]
} \n
  the questions \n`;

    questions.forEach((q, index) => {
      prompt += `${index + 1}. ${q.question}\n student Answer: ${q.answer}\n\n`;
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Assuming response.text() gives us the textual content
    let text = await response.text();

    // Remove Markdown-style formatting if present
    text = text.replace(/^```json\s+/g, "").replace(/```\s*$/g, "");

    // Log the cleaned response text for debugging purposes
    console.log("Cleaned Response Text:", text);

    // Parse the JSON response correctly
    let jsonResponseArray = [];
    try {
      const parsedResponse = JSON.parse(text);
      if (!Array.isArray(parsedResponse.questions)) {
        throw new Error("Invalid JSON format: Expected 'questions' array");
      }
      jsonResponseArray = parsedResponse.questions.map((q) => {
        const correctAnswer = q.correct_answer;
        const isCorrect = questions.some((question) => {
          // Assuming `question.correct_answer` is in the same format as `correctAnswer`
          return question.answer === correctAnswer;
        });
        return {
          is_correct: isCorrect,
          correct_answer: correctAnswer,
        };
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse JSON response");
    }

    // Calculate total score
    const total_score = jsonResponseArray.reduce(
      (acc, item) => acc + (item.is_correct ? 1 : 0),
      0
    );

    // Calculate aggregated result
    const aggregatedResult = {
      responses: jsonResponseArray.map((item, index) => ({
        is_correct: item.is_correct,
        student_answer: questions[index].answer, // The student's answer
        correct_answer: item.correct_answer, // The correct answer provided by the AI
      })),
      total_score: total_score, // Calculate total score
      outof: outof,
      perc: Math.round((total_score / outof) * 100),
    };

    console.log("Aggregated Result:", aggregatedResult);

    // Store the aggregated result in the database as one document
    await db.collection("trials").insertOne(aggregatedResult);

    // Respond with the aggregated result
    res.status(200).json(aggregatedResult);
  } catch (error) {
    console.error("Error in Gemini function:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
}

export default Gemini;
