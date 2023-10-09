const express = require('express');
const app = express();
const PORT = process.env.PORT || 3020;

// Vulnerability 1: Using hardcoded secret key
const SECRET_KEY = 'insecure_secret_key';

// Vulnerability 2: Storing sensitive information in plain text
const dbConfig = {
  username: 'admin',
  password: 'Password!',
  database: 'mydatabase',
};

// Vulnerability 3: Not sanitizing user input
app.get('/search', (req, res) => {
  const searchTerm = req.query.term;

  // Vulnerability 4: SQL Injection
  const query = `SELECT * FROM products WHERE name = '${searchTerm}'`;

  // Vulnerability 5: Using deprecated and unsafe methods
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }
    return res.json(results);
  });
});

// Vulnerability 6: No input validation
app.post('/upload', (req, res) => {
  const file = req.body.file;

  // Vulnerability 7: Not checking file type
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  // Process and store the uploaded file (insecurely)
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

