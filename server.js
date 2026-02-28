const express = require("express");
const { addJob } = require("./jobs");

const app = express();
app.use(express.json());

app.post("/task", (req, res) => {
  const { task } = req.body;

  const job = addJob(task);
  res.json({ status: "queued", id: job.id });
});

app.listen(3000, () => {
  console.log("Local PopeBot API running on port 3000");
});