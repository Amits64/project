// Import required modules
const http = require('http');

// Define the hostname and port for the server
const hostname = '192.168.10.11';
const port = 3010;

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Set the response status and headers
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

  // Send the response message
  res.end('Hello, World!\n');
});

// Start the server and listen on the specified port and hostname
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

