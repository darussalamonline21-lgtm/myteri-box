import { PrismaClient } from '@prisma/client';

// Membuat satu instance dari PrismaClient
const prisma = new PrismaClient();

// Mengekspor instance tersebut agar bisa digunakan di file lain
export default prisma;