const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Use direct URL for DDL operations
    }
  }
});

async function createTables() {
  try {
    console.log('Creating tables...');
    
    // Create Member table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Member" (
        "id" TEXT NOT NULL,
        "shopifyCustomerId" TEXT NOT NULL,
        "cardToken" TEXT NOT NULL,
        "tier" TEXT NOT NULL DEFAULT 'BASIC',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "cycleStart" TIMESTAMP(3) NOT NULL,
        "cycleEnd" TIMESTAMP(3) NOT NULL,
        "itemsUsed" INTEGER NOT NULL DEFAULT 0,
        "swapsUsed" INTEGER NOT NULL DEFAULT 0,
        "itemsOut" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Member_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Member_shopifyCustomerId_key" UNIQUE ("shopifyCustomerId"),
        CONSTRAINT "Member_cardToken_key" UNIQUE ("cardToken")
      );
    `;
    
    // Create Loan table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Loan" (
        "id" TEXT NOT NULL,
        "memberId" TEXT NOT NULL,
        "storeLocation" TEXT NOT NULL,
        "photoUrl" TEXT NOT NULL,
        "thumbnailUrl" TEXT NOT NULL,
        "checkoutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "returnedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Loan_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Loan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;
    
    // Create LoanPhoto table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "LoanPhoto" (
        "id" TEXT NOT NULL,
        "photoUrl" TEXT NOT NULL,
        "thumbnailUrl" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LoanPhoto_pkey" PRIMARY KEY ("id")
      );
    `;
    
    // Create AuditEvent table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditEvent" (
        "id" TEXT NOT NULL,
        "memberId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "metadata" TEXT NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AuditEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `;
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Member_shopifyCustomerId_idx" ON "Member"("shopifyCustomerId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Loan_memberId_returnedAt_idx" ON "Loan"("memberId", "returnedAt");`;
    
    console.log('✅ Tables created successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to create tables:', error);
    process.exit(1);
  }
}

createTables();
