import db from "../database/mongodb.js";

export default async function SearchExams(searchTerm, res) {
  try {
    const results = await db
      .collection("exams")
      .find({
        $or: [
          { subject: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex search for subject
          { topic: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex search for topic
        ],
      })
      .project({
        date: 1,
        subject: 1,
        topic: 1,
        _id: 1, // Return the ID for the exam
      })
      .limit(10) // Limit to 10 results
      .toArray();

    res.status(200).json({ results });
  } catch (error) {
    console.error("Error in SearchExams function:", error);
    res.status(500).json({ error: "Failed to search exams" });
  }
}
