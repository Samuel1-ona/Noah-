import request from 'supertest';
import app from '../src/app';

const KEY = process.env.API_KEY!;

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok and relayer address', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.relayerAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });
});

describe('GET /api/v1/relayer/status', () => {
  it('returns 401 with missing key', async () => {
    const res = await request(app).get('/api/v1/relayer/status');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_ERROR');
  });

  it('returns 401 with wrong key', async () => {
    const res = await request(app)
      .get('/api/v1/relayer/status')
      .set('X-API-Key', 'totally-wrong-key');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_ERROR');
  });
});

describe('GET /api/v1/identity/nullifier/:address', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .get('/api/v1/identity/nullifier/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(res.status).toBe(401);
  });

  it('returns a deterministic 32-byte nullifier', async () => {
    const addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const res = await request(app)
      .get(`/api/v1/identity/nullifier/${addr}`)
      .set('X-API-Key', KEY);
    expect(res.status).toBe(200);
    expect(res.body.data.nullifier).toMatch(/^0x[0-9a-f]{64}$/);
    expect(res.body.data.address).toBe(addr);
  });

  it('is deterministic — same address always returns same nullifier', async () => {
    const addr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const [r1, r2] = await Promise.all([
      request(app).get(`/api/v1/identity/nullifier/${addr}`).set('X-API-Key', KEY),
      request(app).get(`/api/v1/identity/nullifier/${addr}`).set('X-API-Key', KEY),
    ]);
    expect(r1.body.data.nullifier).toBe(r2.body.data.nullifier);
  });

  it('returns 400 for an invalid Ethereum address', async () => {
    const res = await request(app)
      .get('/api/v1/identity/nullifier/not-an-address')
      .set('X-API-Key', KEY);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/identity/status/:address', () => {
  it('returns 400 for invalid address', async () => {
    const res = await request(app).get('/api/v1/identity/status/bad-address');
    expect(res.status).toBe(400);
  });

  it('returns shape { address, isRegistered } for valid address (RPC may fail in CI)', async () => {
    const res = await request(app)
      .get('/api/v1/identity/status/0x0000000000000000000000000000000000000001');
    if (res.status === 200) {
      expect(typeof res.body.data.isRegistered).toBe('boolean');
    } else {
      // RPC unreachable in sandbox — acceptable
      expect([500, 502]).toContain(res.status);
    }
  });
});

describe('POST /api/v1/identity/register', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/identity/register')
      .send({ userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid userAddress', async () => {
    const res = await request(app)
      .post('/api/v1/identity/register')
      .set('X-API-Key', KEY)
      .send({ userAddress: 'not-valid' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('userAddress');
  });

  it('returns 400 when fheInput is missing', async () => {
    const res = await request(app)
      .post('/api/v1/identity/register')
      .set('X-API-Key', KEY)
      .send({ userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('fheInput');
  });

  it('returns 400 when fheInput.signature is missing', async () => {
    const res = await request(app)
      .post('/api/v1/identity/register')
      .set('X-API-Key', KEY)
      .send({
        userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        fheInput: { ctHash: '1', utype: '1', securityZone: '0' },
      });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toContain('signature');
  });
});

describe('POST /api/v1/identity/verify', () => {
  it('returns 401 without key', async () => {
    const res = await request(app).post('/api/v1/identity/verify').send({
      protocolAddress: '0x503De26148ACa67Aa97E12eC545B22e7216f1BE4',
      userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid addresses', async () => {
    const res = await request(app)
      .post('/api/v1/identity/verify')
      .set('X-API-Key', KEY)
      .send({ protocolAddress: 'bad', userAddress: 'also-bad' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1 — 404', () => {
  it('returns structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
