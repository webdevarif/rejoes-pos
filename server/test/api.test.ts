import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID, createHmac } from 'crypto';

import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';
const SHOPIFY_HMAC_HEADER = 'x-shopify-hmac-sha256';
const SAMPLE_IMAGE = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUQEhIWFRUVFRUVFRUVFRUVFRUVFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIALcBEwMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAEBQIDBgABB//EADoQAAIBAgMFBgQEBQUBAAAAAAABAgMRBBIhMQUTQVEiYXGBkaGxwRQyQlJy8FKh0fAVM4KS8SNSYoKTotIV/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAJREAAgICAgEEAwEAAAAAAAAAAAECEQMhEjFBE0FRImFC/9oADAMBAAIRAxEAPwC7oiICIiAiIgIiICIiAiIgIiICIiAiIgIiICJFiioqyT1G7mZjludNndd9J1yBsop68bKtw9ST6VYtRCrDIp7t9DHV1Zdc4Wbdm1iue1Z40b205k+GwU6M0yx7c4XNzY4hag3t4nbi3y1g1Vvb7VcEk9N4jv1Zq1apR6ZQ0k9pto5m4y3mkkfGk1u0dpp25mOe4ZkA4+APUrlq+6z0jCSJ3Cx3N9SxsbC6twc9JMjKeX66jsN7Ish435nJo9xSdY6WhtTWknidbWyPCE7f5ScP1zSbXk12S4kZjZpNz7pl9vmu0bK1nVz6RqYTVm0SSSd3A5B8A8q7ZV2fUdM7W+a13Y8P1baeR6jNPV7VX1Lk7U1y+ny2bSV6M49vSfbkRYrYVaqtUx1MxSe9y7VYbW53HSQe8A8K7SNH1LTtS0W6Vht7W8L2OeWsePUfXhY+YEraCIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiID//Z',
  'base64'
);

let agent: request.SuperTest<request.Test>;

beforeAll(async () => {
  const app = await createApp();
  agent = request(app);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.auditEvent.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.loanPhoto.deleteMany();
  await prisma.member.deleteMany();
});

async function createMember(overrides: Partial<Awaited<ReturnType<typeof prisma.member.create>>> = {}) {
  const now = new Date('2024-01-01T00:00:00.000Z');
  return prisma.member.create({
    data: {
      shopifyCustomerId: overrides.shopifyCustomerId ?? `shopify-${randomUUID()}`,
      cardToken: overrides.cardToken ?? `card-${randomUUID()}`,
      tier: overrides.tier ?? 'BASIC',
      status: overrides.status ?? 'ACTIVE',
      cycleStart: overrides.cycleStart ?? now,
      cycleEnd: overrides.cycleEnd ?? new Date('2024-02-01T00:00:00.000Z'),
      itemsUsed: overrides.itemsUsed ?? 0,
      swapsUsed: overrides.swapsUsed ?? 0,
      itemsOut: overrides.itemsOut ?? 0,
    },
  });
}

function idempotencyKey() {
  return randomUUID();
}

async function uploadLoanPhoto() {
  const response = await agent
    .post('/api/uploads/loan-photo')
    .attach('photo', SAMPLE_IMAGE, 'sample.jpg');

  expect(response.status).toBe(201);
  return response.body;
}

describe('Members API', () => {
  it('returns member details by card token', async () => {
    const member = await createMember();
    const loan = await prisma.loan.create({
      data: {
        memberId: member.id,
        storeLocation: 'Downtown',
        photoUrl: '/uploads/originals/sample.jpg',
        thumbnailUrl: '/uploads/thumbnails/sample.jpg',
      },
    });

    const response = await agent.get(`/api/members/by-card/${member.cardToken}`);

    expect(response.status).toBe(200);
    expect(response.body.member.id).toBe(member.id);
    expect(response.body.activeLoans).toEqual([
      { id: loan.id, thumbnailUrl: loan.thumbnailUrl },
    ]);
    expect(response.body.allowances.maxItemsOut).toBeGreaterThan(0);
  });
});

describe('Loan APIs', () => {
  it('allows checkout, return, and swap flow', async () => {
    const member = await createMember({ tier: 'PREMIUM' });

    // Checkout
    const upload = await uploadLoanPhoto();
    const checkout = await agent
      .post('/api/loans/checkout')
      .set(IDEMPOTENCY_HEADER, idempotencyKey())
      .send({
        memberId: member.id,
        storeLocation: 'Downtown',
        uploadId: upload.uploadId,
      });

    expect(checkout.status).toBe(201);
    expect(checkout.body.memberId).toBe(member.id);

    // Return
    const returned = await agent
      .post('/api/loans/return')
      .set(IDEMPOTENCY_HEADER, idempotencyKey())
      .send({
        memberId: member.id,
        loanId: checkout.body.id,
      });

    expect(returned.status).toBe(200);
    expect(returned.body.returnedAt).toBeTruthy();

    // Create another checkout to set up swap
    const secondUpload = await uploadLoanPhoto();
    const secondCheckout = await agent
      .post('/api/loans/checkout')
      .set(IDEMPOTENCY_HEADER, idempotencyKey())
      .send({
        memberId: member.id,
        storeLocation: 'Uptown',
        uploadId: secondUpload.uploadId,
      });

    // Swap
    const swapUpload = await uploadLoanPhoto();
    const swap = await agent
      .post('/api/loans/swap')
      .set(IDEMPOTENCY_HEADER, idempotencyKey())
      .send({
        memberId: member.id,
        loanId: secondCheckout.body.id,
        storeLocation: 'Uptown',
        uploadId: swapUpload.uploadId,
      });

    expect(swap.status).toBe(200);
    expect(swap.body.newLoan.memberId).toBe(member.id);
  });

  it('lists active loans', async () => {
    const member = await createMember();
    const loan = await prisma.loan.create({
      data: {
        memberId: member.id,
        storeLocation: 'Central',
        photoUrl: '/uploads/originals/pants.jpg',
        thumbnailUrl: '/uploads/thumbnails/pants.jpg',
      },
    });

    const response = await agent.get(`/api/loans/active/${member.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(loan.id);
  });
});

describe('Shopify Webhook', () => {
  it('processes subscription events', async () => {
    const payload = {
      type: 'subscription_created',
      data: {
        shopifyCustomerId: 'shopify-123',
        cardToken: 'card-abc',
        planHandle: 'premium',
        status: 'active',
        cycleStart: new Date('2024-01-01T00:00:00.000Z').toISOString(),
        cycleEnd: new Date('2024-02-01T00:00:00.000Z').toISOString(),
      },
    };

    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || 'testsecret')
      .update(rawBody)
      .digest('base64');

    const response = await agent
      .post('/api/webhooks/subscription')
      .set('Content-Type', 'application/json')
      .set(SHOPIFY_HMAC_HEADER, signature)
      .send(rawBody);

    expect(response.status).toBe(200);

    const member = await prisma.member.findUnique({
      where: { shopifyCustomerId: 'shopify-123' },
    });

    expect(member).not.toBeNull();
    expect(member?.tier).toBe('PREMIUM');
  });
});
