import dotenv from 'dotenv';
import path from 'path';
import app from './app.js';

//Fetch .env from root folder
dotenv.config({path: path.resolve(import.meta.dirname, '../../.env')});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


