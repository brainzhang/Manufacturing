// ... existing code ...
const app = require('../src/app');
const Part = require('../src/models/Part');
const mongoose = require('mongoose');

describe('Part Controller', () => {
  // Database connection is now handled in setup.js

  describe('POST /api/v1/parts', () => {
    it('should create a new part', async () => {
      const partData = {
        part_id: 'CPU-I9-12900K',
        category: 'CPU',
        name: 'Intel Core i9-12900K',
        spec: '3.2GHz, 16 cores, 24 threads',
        vendor: 'Intel',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/parts')
        .send(partData)
        .expect(201);

      expect(response.body.part_id).toBe(partData.part_id);
      expect(response.body.category).toBe(partData.category);
      expect(response.body.name).toBe(partData.name);
    });
  });

  describe('GET /api/v1/parts', () => {
    it('should get all parts', async () => {
      const response = await request(app)
        .get('/api/v1/parts')
        .expect(200);

      expect(response.body).toHaveProperty('parts');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
      expect(response.body).toHaveProperty('total');
    });
  });
});