import express from "express";
import cors from "cors";
import router from "./routes/routes.js";
import("dotenv/config");

//vars
const app = express();
const PORT = process.env.PORT || 3000;

//middlewares
app.use(cors());
app.use(express.json());

//routes
app.use("/api", router);
app.get("/", async (req, res) => {
  res.send("hello there").status(200);
});

//listen
app.listen(PORT, () => {
  console.log(`server running on port : ${PORT}`);
});
