# PPM 3.0 API Documentation

## Overview

This document provides detailed information about the PPM 3.0 REST API endpoints.

## Authentication

All API requests (except for authentication endpoints) require a valid JWT token in the Authorization header:

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "61e8f3c9b3c1a4001f8b4567",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "product_manager"
  }
}
```

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "product_manager"
}
```

## Parts Management

### Get Parts

```http
GET /api/v1/parts?page=1&limit=20&category=CPU&status=active
```

### Get Part by ID

```http
GET /api/v1/parts/61e8f3c9b3c1a4001f8b4567
```

### Create Part

```http
POST /api/v1/parts
Content-Type: application/json

{
  "part_no": "CPU-I9-12900K",
  "category": "CPU",
  "name": "Intel Core i9-12900K",
  "spec": "3.2GHz, 16 cores, 24 threads",
  "vendor": "Intel",
  "status": "active"
}
```

### Update Part

```http
PUT /api/v1/parts/61e8f3c9b3c1a4001f8b4567
Content-Type: application/json

{
  "name": "Updated Intel Core i9-12900K"
}
```

### Delete Part

```http
DELETE /api/v1/parts/61e8f3c9b3c1a4001f8b4567
```

## BOM Management

### Get BOMs

```http
GET /api/v1/boms?model=ThinkPad-X1&version=Gen10
```

### Get BOM by ID

```http
GET /api/v1/boms/61e8f3c9b3c1a4001f8b4568
```

### Create BOM

```http
POST /api/v1/boms
Content-Type: application/json

{
  "model": "ThinkPad X1 Carbon",
  "version": "Gen 10",
  "parts": [
    {
      "part_id": "61e8f3c9b3c1a4001f8b4567",
      "quantity": 1
    },
    {
      "part_id": "61e8f3c9b3c1a4001f8b4568",
      "quantity": 2
    }
  ],
  "status": "active"
}
```

### Update BOM

```http
PUT /api/v1/boms/61e8f3c9b3c1a4001f8b4568
Content-Type: application/json

{
  "status": "deprecated"
}
```

### Delete BOM

```http
DELETE /api/v1/boms/61e8f3c9b3c1a4001f8b4568
```

### Perform Alignment

```http
POST /api/v1/boms/61e8f3c9b3c1a4001f8b4568/align
Content-Type: application/json

{
  "strategy": "auto",
  "priority": "high"
}
```

## PN Mapping

### Get PN Maps

```http
GET /api/v1/pn-maps?part_id=61e8f3c9b3c1a4001f8b4567
```

### Get PN Map by ID

```http
GET /api/v1/pn-maps/61e8f3c9b3c1a4001f8b4569
```

### Create PN Map

```http
POST /api/v1/pn-maps
Content-Type: application/json

{
  "part_id": "61e8f3c9b3c1a4001f8b4567",
  "target_pn": "PN-THINKPAD-X1-CARBON-GEN10",
  "match_strength": "high",
  "source": "auto_generated",
  "status": "active"
}
```

### Update PN Map

```http
PUT /api/v1/pn-maps/61e8f3c9b3c1a4001f8b4569
Content-Type: application/json

{
  "status": "inactive"
}
```

### Delete PN Map

```http
DELETE /api/v1/pn-maps/61e8f3c9b3c1a4001f8b4569
```

## Alignment Management

### Get Alignments

```http
GET /api/v1/alignments?status=completed
```

### Get Alignment by ID

```http
GET /api/v1/alignments/61e8f3c9b3c1a4001f8b4570
```

### Perform Alignment

```http
POST /api/v1/alignments
Content-Type: application/json

{
  "bom_id": "61e8f3c9b3c1a4001f8b4568",
  "pn_id": "61e8f3c9b3c1a4001f8b4569",
  "target_pn": "PN-THINKPAD-X1-CARBON-GEN10",
  "priority": "high",
  "status": "pending"
}
```

### Update Alignment

```http
PUT /api/v1/alignments/61e8f3c9b3c1a4001f8b4570
Content-Type: application/json

{
  "status": "completed",
  "result": "Alignment completed successfully"
}
```

## Dashboard

### Get Dashboard Data

```http
GET /api/v1/dashboard
```
