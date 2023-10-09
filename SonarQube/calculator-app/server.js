const express = require('express');
const bodyParser = require('body-parser');
const math = require('mathjs'); // We'll use the 'mathjs' library for calculations

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public')); // Serve the static HTML file

app.post('/calculate', (req, res) => {
  const expression = req.body.expression;

  try {
    const result = math.evaluate(expression);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Calculator app is running on port ${port}`);
});

