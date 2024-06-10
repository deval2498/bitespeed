import express from 'express';
import dotenv from 'dotenv';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Use the contact routes
app.use('/identify', contactRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
