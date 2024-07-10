import db from "../database/mongodb.js";

export default async function AllExams(res) {
  try {
    let collection = db.collection("exams");
    const exams = await collection
      .find({})
      .project({
        _id: 1,
        date: 1,
        subject: 1,
        topic: 1,
      })
      .sort({ date: -1 })
      .limit(12) // Sort by date in descending order
      .toArray();
    res.json(exams).status(200);
  } catch (error) {
    console.log(error);
    res.status(500).json("An error occurred");
  }
}
