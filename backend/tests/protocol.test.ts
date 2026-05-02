import request from 'supertest';
import app from '../src/app';

const KEY = process.env.API_KEY!;
const PROTOCOL = '0x503De26148ACa67Aa97E12eC545B22e7216f1BE4';
const USER     = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('POST /api/v1/protocol/requirements', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/requirements')
      .send({ minAge: 18 });
    expect(res.status).toBe(401);
  });

  it('returns 400 for non-integer minAge', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/requirements')
      .set('X-API-Key', KEY)
      .send({ minAge: 18.5 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for negative minAge', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/requirements')
      .set('X-API-Key', KEY)
      .send({ minAge: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for minAge > 150', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/requirements')
      .set('X-API-Key', KEY)
      .send({ minAge: 200 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when minAge is missing', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/requirements')
      .set('X-API-Key', KEY)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/protocol/requirements/:address', () => {
  it('is public — no API key needed', async () => {
    // RPC call may fail in sandbox; check that auth is not the blocker
    const res = await request(app).get(`/api/v1/protocol/requirements/${PROTOCOL}`);
    expect(res.status).not.toBe(401);
  });

  it('returns 400 for invalid address', async () => {
    const res = await request(app).get('/api/v1/protocol/requirements/not-an-address');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/protocol/access/check', () => {
  it('is public — no API key needed', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/check')
      .send({ protocolAddress: PROTOCOL, userAddress: USER });
    // RPC may fail in sandbox; ensure 401 is NOT returned
    expect(res.status).not.toBe(401);
  });

  it('returns 400 for invalid protocolAddress', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/check')
      .send({ protocolAddress: 'bad', userAddress: USER });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid userAddress', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/check')
      .send({ protocolAddress: PROTOCOL, userAddress: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when both addresses are missing', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/check')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/protocol/access/request', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/request')
      .send({ protocolAddress: PROTOCOL, userAddress: USER });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid userAddress', async () => {
    const res = await request(app)
      .post('/api/v1/protocol/access/request')
      .set('X-API-Key', KEY)
      .send({ protocolAddress: PROTOCOL, userAddress: 'bad' });
    expect(res.status).toBe(400);
  });
});
