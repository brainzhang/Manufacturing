const request = require('supertest');
const app = require('../index');

describe('PPM 3.0 API Tests', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);
      
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('PPM 3.0 Combination Product Management System Demo');
    });
  });

  describe('GET /api/v1/parts', () => {
    it('should return parts list', async () => {
      const res = await request(app)
        .get('/api/v1/parts')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter parts by category', async () => {
      const res = await request(app)
        .get('/api/v1/parts?category=CPU')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].category).toBe('CPU');
    });
  });

  describe('GET /api/v1/boms', () => {
    it('should return BOMs list', async () => {
      const res = await request(app)
        .get('/api/v1/boms')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/boms/:id/align', () => {
    it('should align BOM successfully', async () => {
      const res = await request(app)
        .post('/api/v1/boms/1/align')
        .expect(200);
      
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('result');
      expect(res.body.result.bom_id).toBe(1);
    });

    it('should return error for non-existent BOM', async () => {
      const res = await request(app)
        .post('/api/v1/boms/999/align')
        .expect(404);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/parts', () => {
    it('should create a new part', async () => {
      const newPart = {
        part_id: 'TEST-PART-001',
        category: 'Test',
        name: 'Test Part'
      };

      const res = await request(app)
        .post('/api/v1/parts')
        .send(newPart)
        .expect(201);
      
      expect(res.body.part_id).toBe(newPart.part_id);
      expect(res.body.category).toBe(newPart.category);
      expect(res.body.name).toBe(newPart.name);
    });

    it('should return error when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/parts')
        .send({ category: 'Test' })
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });
  });
});