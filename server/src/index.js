import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import movieRoutes from './routes/movieRoutes.js';
import express from 'express';

//Fetch .env from root folder
dotenv.config({path: path.resolve(process.cwd(), '../.env')});
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/movies', movieRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('Token exists:', !!process.env.TMDB_API_TOKEN);


