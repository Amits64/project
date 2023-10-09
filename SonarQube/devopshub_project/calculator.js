const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Calculator API');
});

app.post('/add', (req, res) => {
  const { num1, num2 } = req.body;
  const result = num1 + num2;
  res.json({ result });
});

app.post('/subtract', (req, res) => {
  const { num1, num2 } = req.body;
  const result = num1 - num2;
  res.json({ result });
});

app.post('/multiply', (req, res) => {
  const { num1, num2 } = req.body;
  const result = num1 * num2;
  res.json({ result });
});

app.post('/divide', (req, res) => {
  const { num1, num2 } = req.body;
  if (num2 === 0) {
    res.status(400).json({ error: 'Division by zero is not allowed.' });
  } else {
    const result = num1 / num2;
    res.json({ result });
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`Calculator app is running on port ${port}`);
});

