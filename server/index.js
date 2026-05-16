const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const mysql = require('mysql2/promise'); // Import mysql2
const cookieParser = require('cookie-parser')

const app = express();
const port = process.env.PORT || 8000;

// Validate that all required environment variables are present
const requiredEnv = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
requiredEnv.forEach((name) => {
  if (!process.env[name]) {
    console.error(`Error: Environment variable ${name} is missing in .env file.`);
    process.exit(1);
  }
});

// Create a connection pool to your MySQL database
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}))

const allowedOrigin = [
  'https://hotel.app.aletcloud.com',
  'http://localhost:5173'
];

app.use(
  cors({
    credentials: true,
    origin: allowedOrigin,
  })
);

// Test the database connection
pool.getConnection()
  .then((connection) => {
    console.log(`Connected to MySQL database: ${process.env.MYSQL_DATABASE} at ${process.env.MYSQL_HOST}`);
    connection.release(); // Release the connection
  })
  .catch((error) => {
    console.error('FAILED to connect to MySQL database.');
    if (process.env.MYSQL_HOST === '127.0.0.1' || process.env.MYSQL_HOST === 'localhost') {
      console.error('HINT: Your host is set to 127.0.0.1. Ensure "kubectl port-forward svc/mydatabase 3306:3306 -n db-25" is running in another terminal.');
    }
    console.error('Technical Error:', error.message);
    // If the database is critical for startup, you might want to exit here
    // process.exit(1);
  });

module.exports = {
  pool,
};

// Use 'pool' to handle MySQL queries in your routes
app.use('/api', require('./routes/authRoutes'));

app.listen(port, () => console.log('Server is running on port', port));
