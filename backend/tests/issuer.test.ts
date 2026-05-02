import request from 'supertest';
import app from '../src/app';

const KEY = process.env.API_KEY!;
const VALID_HASH = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

describe('POST /api/v1/issuer/credential/revoke', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/revoke')
      .send({ credentialHash: VALID_HASH });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_ERROR');
  });

  it('returns 400 for short / invalid credentialHash', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/revoke')
      .set('X-API-Key', KEY)
      .send({ credentialHash: '0xshort' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.field).toBe('credentialHash');
  });

  it('returns 400 when credentialHash is missing', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/revoke')
      .set('X-API-Key', KEY)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 and revokes a valid credentialHash', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/revoke')
      .set('X-API-Key', KEY)
      .send({ credentialHash: VALID_HASH });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('revoked');
  });
});

describe('GET /api/v1/issuer/credential/:hash', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).get(`/api/v1/issuer/credential/${VALID_HASH}`);
    expect(res.status).toBe(401);
  });

  it('returns isValid: true for a non-revoked hash', async () => {
    const freshHash = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const res = await request(app)
      .get(`/api/v1/issuer/credential/${freshHash}`)
      .set('X-API-Key', KEY);
    expect(res.status).toBe(200);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.isRevoked).toBe(false);
  });

  it('reflects revocation — revoke then check returns isRevoked: true', async () => {
    const hash = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    await request(app)
      .post('/api/v1/issuer/credential/revoke')
      .set('X-API-Key', KEY)
      .send({ credentialHash: hash });

    const res = await request(app)
      .get(`/api/v1/issuer/credential/${hash}`)
      .set('X-API-Key', KEY);

    expect(res.status).toBe(200);
    expect(res.body.data.isRevoked).toBe(true);
    expect(res.body.data.isValid).toBe(false);
  });
});

describe('POST /api/v1/issuer/credential/register', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/register')
      .send({ credentialHash: VALID_HASH, userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid userAddress', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/register')
      .set('X-API-Key', KEY)
      .send({ credentialHash: VALID_HASH, userAddress: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('userAddress');
  });

  it('returns 400 for invalid credentialHash', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/credential/register')
      .set('X-API-Key', KEY)
      .send({ credentialHash: 'bad', userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' });
    expect(res.status).toBe(400);
    expect(res.body.error.field).toBe('credentialHash');
  });
});

describe('POST /api/v1/issuer/add', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/add')
      .send({ issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty name', async () => {
    const res = await request(app)
      .post('/api/v1/issuer/add')
      .set('X-API-Key', KEY)
      .send({ issuerAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: '' });
    expect(res.status).toBe(400);
  });
});
