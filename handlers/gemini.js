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
    let prompt = `return a json object with two fields : "is_true" which is true or false and "answer" which provides the correct answer for the question\n`;

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
    let jsonResponseArray;
    try {
      jsonResponseArray = JSON.parse(text);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error("Failed to parse JSON response");
    }
    const total_score = jsonResponseArray.reduce(
      (acc, item) => acc + (item.is_true ? 1 : 0),
      0
    );
    // Calculate score for each object and aggregate into one document
    const aggregatedResult = {
      responses: jsonResponseArray.map((item) => ({
        is_true: item.is_true,
        answer: item.answer,
        score: item.is_true ? 1 : 0, // Assuming 1 point for correct answers, 0 for incorrect
      })),
      total_score: total_score, // Calculate total score
      outof: outof,
      perc: Math.round((total_score / outof) * 100),
    };
    console.log(aggregatedResult);
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
