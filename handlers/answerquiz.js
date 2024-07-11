import {
  GoogleGenerativeAI,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";
import dotenv from "dotenv";
import db from "../database/mongodb.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export async function AnswerQuiz(quiz, res) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    let prompt = `answer the following question in simplicity and direct to the point without styling and include emojis where necessary, if the question is not educational or violates the policies reply with an objection not to answer : \n ${quiz}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    let text = response.text();
    res.status(200).json(text);
  } catch (error) {
    console.error("Error in Gemini function:", error);

    // Handle specific error for SAFETY violation
    if (
      error instanceof GoogleGenerativeAIResponseError &&
      error.message.includes("Candidate was blocked due to SAFETY")
    ) {
      res.status(400).json({
        error:
          "The question violates content safety policies. Please ask another question.",
      });
    } else {
      res
        .status(500)
        .json({ error: "Failed to generate content. Please try again later." });
    }
  }
}
