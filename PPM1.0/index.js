const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory data store (in a real app, this would be a database)
const parts = [
  { id: 1, part_id: 'CPU-I9-13900K', category: 'CPU', name: 'Intel Core i9-13900K', spec: '3.0GHz', vendor: 'Intel', status: 'active' },
  { id: 2, part_id: 'RAM-32GB-DDR5', category: 'Memory', name: '32GB DDR5 RAM', spec: 'DDR5-5600', vendor: 'Corsair', status: 'active' },
  { id: 3, part_id: 'SSD-1TB-NVME', category: 'Storage', name: '1TB NVMe SSD', spec: 'PCIe 4.0', vendor: 'Samsung', status: 'active' }
];

const boms = [
  { id: 1, model: 'ThinkPad X1 Carbon', version: 'Gen 11', parts: [1, 2, 3], status: 'active' }
];

const pnMaps = [
  { id: 1, part_id: 1, target_pn: 'PN-CPU-I9-13900K-001', match_strength: 'high', status: 'active' }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Part Management Routes
app.get('/api/v1/parts', (req, res) => {
  const { category, status } = req.query;
  let result = parts;
  
  if (category) {
    result = result.filter(part => part.category === category);
  }
  
  if (status) {
    result = result.filter(part => part.status === status);
  }
  
  res.json(result);
});

app.get('/api/v1/parts/:id', (req, res) => {
  const part = parts.find(p => p.id === parseInt(req.params.id));
  if (!part) {
    return res.status(404).json({ error: 'Part not found' });
  }
  res.json(part);
});

app.post('/api/v1/parts', (req, res) => {
  const { part_id, category, name, spec, vendor, status } = req.body;
  
  if (!part_id || !category || !name) {
    return res.status(400).json({ error: 'part_id, category, and name are required' });
  }
  
  const newPart = {
    id: parts.length + 1,
    part_id,
    category,
    name,
    spec: spec || '',
    vendor: vendor || '',
    status: status || 'active'
  };
  
  parts.push(newPart);
  res.status(201).json(newPart);
});

// BOM Routes
app.get('/api/v1/boms', (req, res) => {
  res.json(boms);
});

app.get('/api/v1/boms/:id', (req, res) => {
  const bom = boms.find(b => b.id === parseInt(req.params.id));
  if (!bom) {
    return res.status(404).json({ error: 'BOM not found' });
  }
  res.json(bom);
});

// PN Map Routes
app.get('/api/v1/pn-maps', (req, res) => {
  res.json(pnMaps);
});

// BOM Alignment Simulation
app.post('/api/v1/boms/:id/align', (req, res) => {
  const bom = boms.find(b => b.id === parseInt(req.params.id));
  if (!bom) {
    return res.status(404).json({ error: 'BOM not found' });
  }
  
  // Simple alignment simulation
  const alignmentResult = {
    bom_id: bom.id,
    model: bom.model,
    aligned_parts: bom.parts.map(partId => {
      const part = parts.find(p => p.id === partId);
      const pnMap = pnMaps.find(pn => pn.part_id === partId);
      return {
        part_id: partId,
        part_name: part ? part.name : 'Unknown',
        target_pn: pnMap ? pnMap.target_pn : 'Not mapped',
        match_strength: pnMap ? pnMap.match_strength : 'low'
      };
    }),
    status: 'aligned',
    created_at: new Date().toISOString()
  };
  
  res.json({
    message: 'BOM alignment completed',
    result: alignmentResult
  });
});

// Dashboard/Analytics Endpoint
app.get('/api/v1/dashboard', (req, res) => {
  res.json({
    summary: {
      total_parts: parts.length,
      total_boms: boms.length,
      total_mappings: pnMaps.length,
      alignment_rate: '85%'
    },
    recent_activity: [
      { action: 'Part created', item: 'CPU-I9-13900K', timestamp: '2023-10-01T10:00:00Z' },
      { action: 'BOM aligned', item: 'ThinkPad X1 Carbon', timestamp: '2023-10-01T09:30:00Z' }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PPM 3.0 Demo Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});

module.exports = app;