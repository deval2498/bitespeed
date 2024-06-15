import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

// Use the contact routes
app.use('/identify', contactRoutes);

// Health check route for the server
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

// Function to check database health
const checkDatabaseHealth = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database is healthy');
  } catch (error) {
    console.error('Database health check failed:', error);
    process.exit(1); // Exit the process with failure
  }
};

// Check database health on startup
checkDatabaseHealth();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
