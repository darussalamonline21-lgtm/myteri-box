import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import boxRoutes from './routes/boxRoutes.js'; // <-- IMPORT BARU

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.send('...'));

// API ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/boxes', boxRoutes); // <-- DAFTARKAN ROUTE BARU

export default app;