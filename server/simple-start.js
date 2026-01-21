require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const express = require('express');
const app = express();

app.use(express.json());

// Basic health check
app.get('/health', async (req, res) => {
  try {
    const count = await prisma.member.count();
    res.json({ 
      status: 'ok', 
      database: 'connected',
      memberCount: count 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ ReJoEs backend listening on port ${PORT}`);
  console.log(`✅ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
