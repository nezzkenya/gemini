import db from "../database/mongodb.js";

export default async function FetchExam(id, res) {
  const collection = db.collection("exams");
  try {
    const result = await collection.findOne({ _id: id });

    if (!result) {
      res.status(404).json({ message: "Exam not found" });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error("Error fetching exam:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the exam" });
  }
}
