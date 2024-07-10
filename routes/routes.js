import express from "express";
import db from "../database/mongodb.js";
import Gemini from "../handlers/gemini.js";
import AllExams from "../handlers/allexams.js";
import { ObjectId } from "mongodb";
import FetchExam from "../handlers/exam.js";
import GeminiCreate from "../handlers/createquestions.js";
import SearchExams from "../handlers/search.js";
const router = express.Router();
router.get("/", async (req, res) => {
  res.send("hii");
});
router.get("/all", async (req, res) => {
  await AllExams(res);
});
router.get("/exam/:id", async (req, res) => {
  const id = req.params.id;
  const mongoid = new ObjectId(id);
  await FetchExam(mongoid, res);
});
router.post("/new", async (req, res) => {
  if (!req.body) return res.json("invalid request").status(403);
  let collection = await db.collection("exams");
  try {
    await collection.insertOne(req.body);
    res.json("exam added succesfully");
  } catch (error) {
    console.log(error);
    res.json("an arror occured");
  }
});

router.post("/mark", async (req, res) => {
  const body = req.body.questions;
  try {
    await Gemini(body, res);
  } catch (error) {
    console.log(error);
    res.json("an error occurred").status(500);
  }
});

router.post("/create", async (req, res) => {
  const body = req.body;
  await GeminiCreate(body, res);
});

router.get("/search", async (req, res) => {
  const searchTerm = req.query.q;
  try {
    await SearchExams(searchTerm, res);
  } catch (error) {
    console.log(error);
    res.json("an error occurred").status(500);
  }
});
export default router;
