import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const { address, port } = server.address();
  console.log(`Access backend at http://${address}:${port}`);
});
