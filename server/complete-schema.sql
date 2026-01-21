-- ReJoEs Backend - Complete PostgreSQL Schema
-- Copy and paste this into Supabase SQL Editor

-- Enable UUID extension for CUID-like IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Member table
CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT PRIMARY KEY,
    "shopifyCustomerId" TEXT UNIQUE NOT NULL,
    "cardToken" TEXT UNIQUE NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'BASIC',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "itemsUsed" INTEGER NOT NULL DEFAULT 0,
    "swapsUsed" INTEGER NOT NULL DEFAULT 0,
    "itemsOut" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Loan table
CREATE TABLE IF NOT EXISTS "Loan" (
    "id" TEXT PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "storeLocation" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "checkoutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Loan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create LoanPhoto table
CREATE TABLE IF NOT EXISTS "LoanPhoto" (
    "id" TEXT PRIMARY KEY,
    "photoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create AuditEvent table
CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Member_shopifyCustomerId_idx" ON "Member"("shopifyCustomerId");
CREATE INDEX IF NOT EXISTS "Loan_memberId_returnedAt_idx" ON "Loan"("memberId", "returnedAt");

-- Create updated_at trigger for Member table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_member_updated_at 
    BEFORE UPDATE ON "Member" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO "Member" (
    "id", "shopifyCustomerId", "cardToken", "tier", "status", 
    "cycleStart", "cycleEnd", "itemsUsed", "swapsUsed", "itemsOut", "createdAt", "updatedAt"
) VALUES (
    'test-member-1', 
    'test-shopify-customer-1', 
    'test-card-123', 
    'BASIC', 
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    0, 0, 0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("shopifyCustomerId") DO NOTHING;

-- Grant permissions (adjust as needed for your Supabase setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
