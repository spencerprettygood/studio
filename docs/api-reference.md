# roFl Platform API Reference

Complete API documentation for the roFl Platform.

## Base URL

```
Production: https://api.rofl-platform.com
Development: http://localhost:3000
```

## Authentication

All API endpoints (except health check) require authentication via Firebase Auth tokens.

### Headers Required

```http
Authorization: Bearer <firebase_id_token>
X-CSRF-Token: <csrf_token>
Content-Type: application/json
```

### Getting Tokens

1. **Firebase ID Token**: Obtained after user authentication
2. **CSRF Token**: Get from `/api/csrf-token` endpoint

```javascript
// Example authentication
const idToken = await user.getIdToken();
const csrfResponse = await fetch('/api/csrf-token');
const { token: csrfToken } = await csrfResponse.json();

const response = await fetch('/api/prompts', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  }
});
```

## Rate Limiting

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| General API | 300 requests | 1 minute |
| Write Operations | 100 requests | 1 minute |
| AI Operations | 50 requests | 1 hour |
| Auth Attempts | 5 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 2024-01-15T10:30:00Z
Retry-After: 60
```

## Endpoints

### Authentication

#### Get CSRF Token

```http
GET /api/csrf-token
```

**Response:**
```json
{
  "token": "abc123..."
}
```

### Prompts

#### List Prompts

```http
GET /api/prompts?page=1&limit=10&category=Marketing&sort=updatedAt&order=desc
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 10 | Items per page (1-100) |
| `category` | string | - | Filter by category |
| `search` | string | - | Search in name/description |
| `sort` | enum | updatedAt | Sort field: `createdAt`, `updatedAt`, `name` |
| `order` | enum | desc | Sort order: `asc`, `desc` |

**Response:**
```json
{
  "prompts": [
    {
      "id": "prompt_123",
      "name": "Marketing Email Template",
      "description": "Professional email template for marketing campaigns",
      "template": "Write a {{tone}} email about {{product}} for {{audience}}",
      "tags": ["marketing", "email", "template"],
      "category": "Marketing",
      "public": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "must be between 1 and 100"
    }
  ]
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retryAfter": "2024-01-15T10:31:00Z"
}
```

#### Create Prompt

```http
POST /api/prompts
```

**Request Body:**
```json
{
  "name": "Marketing Email Template",
  "description": "Professional email template for marketing campaigns",
  "template": "Write a {{tone}} email about {{product}} for {{audience}}",
  "tags": ["marketing", "email", "template"],
  "category": "Marketing",
  "public": false
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | 3-100 characters |
| `description` | string | ✅ | 10-500 characters |
| `template` | string | ✅ | 10-5000 characters |
| `tags` | string[] | ✅ | 1-10 tags, each 1-50 chars |
| `category` | string | ❌ | Max 50 characters |
| `public` | boolean | ❌ | Default: false |

**Response:**
```json
{
  "id": "prompt_124",
  "name": "Marketing Email Template",
  "description": "Professional email template for marketing campaigns",
  "template": "Write a {{tone}} email about {{product}} for {{audience}}",
  "tags": ["marketing", "email", "template"],
  "category": "Marketing",
  "public": false,
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

#### Get Prompt

```http
GET /api/prompts/{id}
```

**Response:**
```json
{
  "id": "prompt_123",
  "name": "Marketing Email Template",
  "description": "Professional email template for marketing campaigns",
  "template": "Write a {{tone}} email about {{product}} for {{audience}}",
  "tags": ["marketing", "email", "template"],
  "category": "Marketing",
  "public": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### Update Prompt

```http
PUT /api/prompts/{id}
```

**Request Body:** (partial updates allowed)
```json
{
  "name": "Updated Marketing Email Template",
  "description": "Enhanced professional email template",
  "tags": ["marketing", "email", "template", "updated"]
}
```

**Response:**
```json
{
  "id": "prompt_123",
  "name": "Updated Marketing Email Template",
  "description": "Enhanced professional email template",
  "template": "Write a {{tone}} email about {{product}} for {{audience}}",
  "tags": ["marketing", "email", "template", "updated"],
  "category": "Marketing",
  "public": false,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

#### Delete Prompt

```http
DELETE /api/prompts/{id}
```

**Response:**
```json
{
  "success": true
}
```

### AI Operations

#### Optimize Prompt

```http
POST /api/ai/optimize
```

**Request Body:**
```json
{
  "prompt": "Write something about AI",
  "context": "Marketing content",
  "goals": ["clarity", "engagement"]
}
```

**Response:**
```json
{
  "original": "Write something about AI",
  "optimized": "Create engaging marketing content that explains artificial intelligence benefits for businesses, focusing on practical applications and ROI.",
  "improvements": [
    {
      "type": "clarity",
      "description": "Added specific context and target audience"
    },
    {
      "type": "structure",
      "description": "Defined clear objectives and deliverables"
    }
  ],
  "score": 8.5
}
```

#### Categorize Prompts

```http
POST /api/ai/categorize
```

**Request Body:**
```json
{
  "promptIds": ["prompt_123", "prompt_124", "prompt_125"]
}
```

**Response:**
```json
{
  "categories": [
    {
      "name": "Marketing Content",
      "description": "Prompts for creating marketing materials",
      "promptIds": ["prompt_123", "prompt_124"],
      "confidence": 0.95
    },
    {
      "name": "Technical Writing",
      "description": "Prompts for technical documentation",
      "promptIds": ["prompt_125"],
      "confidence": 0.87
    }
  ]
}
```

### Health Check

#### System Health

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": true,
    "environment": true,
    "memory": true
  },
  "details": {
    "uptime": 86400,
    "memory": {
      "heapUsed": "45 MB",
      "heapTotal": "67 MB",
      "external": "12 MB"
    }
  }
}
```

## Error Handling

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-15T12:00:00Z",
  "requestId": "req_123456"
}
```

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data, validation errors |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | CSRF token invalid, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists, version mismatch |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_TOKEN` | Auth token invalid or expired | Refresh token |
| `CSRF_TOKEN_INVALID` | CSRF token missing or invalid | Get new CSRF token |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | Input validation failed | Check field requirements |
| `RESOURCE_NOT_FOUND` | Requested resource not found | Verify resource ID |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | Check access rights |

## SDKs and Examples

### JavaScript/TypeScript

```typescript
class RoFlAPI {
  private baseURL: string;
  private idToken: string;
  private csrfToken: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async authenticate(idToken: string) {
    this.idToken = idToken;
    
    // Get CSRF token
    const response = await fetch(`${this.baseURL}/api/csrf-token`);
    const { token } = await response.json();
    this.csrfToken = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.idToken}`,
      'X-CSRF-Token': this.csrfToken,
      'Content-Type': 'application/json'
    };
  }

  async getPrompts(params?: GetPromptsParams): Promise<PromptsResponse> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    const response = await fetch(`${this.baseURL}/api/prompts${queryString}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new APIError(await response.json());
    }
    
    return response.json();
  }

  async createPrompt(data: CreatePromptData): Promise<Prompt> {
    const response = await fetch(`${this.baseURL}/api/prompts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new APIError(await response.json());
    }
    
    return response.json();
  }
}

// Usage
const api = new RoFlAPI('https://api.rofl-platform.com');
await api.authenticate(firebaseIdToken);

const prompts = await api.getPrompts({
  page: 1,
  limit: 20,
  category: 'Marketing'
});
```

### cURL Examples

```bash
# Get CSRF token
CSRF_TOKEN=$(curl -s https://api.rofl-platform.com/api/csrf-token | jq -r '.token')

# List prompts
curl -H "Authorization: Bearer $ID_TOKEN" \
     -H "X-CSRF-Token: $CSRF_TOKEN" \
     "https://api.rofl-platform.com/api/prompts?page=1&limit=10"

# Create prompt
curl -X POST \
     -H "Authorization: Bearer $ID_TOKEN" \
     -H "X-CSRF-Token: $CSRF_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Prompt",
       "description": "A test prompt for API documentation",
       "template": "Write a {{type}} about {{topic}}",
       "tags": ["test", "api"]
     }' \
     "https://api.rofl-platform.com/api/prompts"
```

## Webhooks

### Event Types

| Event | Description |
|-------|-------------|
| `prompt.created` | New prompt created |
| `prompt.updated` | Prompt modified |
| `prompt.deleted` | Prompt deleted |
| `user.signed_up` | New user registration |

### Webhook Payload

```json
{
  "event": "prompt.created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "promptId": "prompt_123",
    "userId": "user_456",
    "prompt": { /* full prompt object */ }
  },
  "signature": "sha256=..."
}
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Prompt CRUD operations
- AI optimization and categorization
- Rate limiting and security features

---

For support, contact: api-support@rofl-platform.com