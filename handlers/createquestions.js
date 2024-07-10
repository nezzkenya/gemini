import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import db from "../database/mongodb.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function GeminiCreate(input, res) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Constructing the prompt with all questions and expected answers
    let prompt = `return a json object strictly like this containing 10 questions {
  "date": "2024-07-09",
  "class": "10th Grade",
  "subject": "Biology",
  "topic": "Cell Biology",
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "What is the function of the mitochondria in a cell?",
      "answer": ""
    },
    {
      "questionNumber": 2,
      "questionText": "Explain the process of photosynthesis.",
      "answer": ""
    },
    {
      "questionNumber": 3,
      "questionText": "Differentiate between prokaryotic and eukaryotic cells.",
      "answer": ""
    },
    {
      "questionNumber": 4,
      "questionText": "What are the components of the cell membrane?",
      "answer": ""
    },
    {
      "questionNumber": 5,
      "questionText": "Describe the role of ribosomes in protein synthesis.",
      "answer": ""
    }
  ]
}\n based on the parameters provided below \n
subject: ${input.subject} , topic: ${input.topic}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Assuming response.text() gives us the textual content
    let text = await response.text();

    // Remove Markdown-style formatting if present
    text = text.replace(/^```json\s+/g, "").replace(/```\s*$/g, "");
    // Parse the JSON response correctly
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
      if (
        !parsedResponse ||
        !parsedResponse.questions ||
        !Array.isArray(parsedResponse.questions)
      ) {
        throw new Error("Invalid JSON format: Expected 'questions' array");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse JSON response");
    }

    // Respond with the parsed questions array
    const {
      date,
      class: gradeClass,
      subject,
      topic,
      questions,
    } = parsedResponse;
    const formattedQuestions = {
      date,
      class: gradeClass,
      subject,
      topic,
      questions,
    };

    console.log("Formatted Questions:", formattedQuestions);
    const responseDB = await db
      .collection("exams")
      .insertOne(formattedQuestions);
    console.log("Response inserted into database:", responseDB);
    res.status(200).json(responseDB);
  } catch (error) {
    console.error("Error in GeminiCreate function:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
}

export default GeminiCreate;
