# Technical Architecture - Medical Translator Platform

## System Overview

The Medical Translator is a production-grade, full-stack web application designed to break language barriers in healthcare settings. It enables real-time, bidirectional communication between doctors and patients speaking different languages.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React SPA (Single HTML File)                            │   │
│  │  - Auth Context & State Management                       │   │
│  │  - Socket.IO Client (Real-time)                          │   │
│  │  - Web Audio API (Recording)                             │   │
│  │  - Tailwind CSS (Styling)                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────┬────────────────────────────┘
                   │                  │
             HTTPS │            WebSocket
                   │                  │
┌──────────────────┴──────────────────┴────────────────────────────┐
│                     Application Layer                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Express.js API Server                                   │    │
│  │  ├─ Routes (Auth, Conversations, Messages, Search)       │    │
│  │  ├─ Middleware (Auth, Validation, Error Handling)        │    │
│  │  ├─ Services (Translation, AI, Storage)                  │    │
│  │  └─ Socket.IO Server (Real-time Events)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────┬───────────────┬───────────────┬────────────────────────┘
           │               │               │
     ┌─────┴─────┐   ┌────┴────┐   ┌─────┴──────┐
     │           │   │         │   │            │
┌────▼────┐  ┌───▼────┐  ┌────▼─────┐  ┌───────▼────┐
│PostgreSQL│  │Anthropic│  │ Google   │  │   Audio    │
│ Database │  │ Claude  │  │Translation│  │  Storage   │
│ (Prisma) │  │   API   │  │    API    │  │  (Base64)  │
└──────────┘  └─────────┘  └───────────┘  └────────────┘
```

## Technology Stack

### Frontend
- **Framework:** React 18 (Vanilla, no build step)
- **Language:** JavaScript (ES6+) with Babel transpilation
- **Styling:** Tailwind CSS v3
- **State Management:** React Context API + Hooks
- **Real-time:** Socket.IO Client v4
- **Audio:** Web Audio API + MediaRecorder
- **Fonts:** Plus Jakarta Sans, IBM Plex Mono

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database ORM:** Prisma v5
- **Real-time:** Socket.IO v4
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Logging:** Winston
- **Security:** Helmet, CORS, Rate Limiting

### Database
- **Primary:** PostgreSQL 14+
- **Schema Management:** Prisma Migrations
- **Indexing:** Strategic indexes on frequently queried fields

### External Services
- **AI Summarization:** Anthropic Claude API (Sonnet 4)
- **Translation:** Google Cloud Translation API v2
- **Deployment:** Vercel / VPS
- **Database Hosting:** Supabase / AWS RDS

## Data Models

### User
```typescript
{
  id: UUID
  email: String (unique, indexed)
  password: String (hashed with bcrypt)
  name: String
  role: Enum (DOCTOR, PATIENT)
  language: String (ISO 639-1 code)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Conversation
```typescript
{
  id: UUID
  doctorId: UUID (foreign key, indexed)
  patientId: UUID (foreign key, indexed)
  doctorLanguage: String
  patientLanguage: String
  status: Enum (ACTIVE, ARCHIVED, COMPLETED)
  createdAt: DateTime (indexed)
  updatedAt: DateTime
}
```

### Message
```typescript
{
  id: UUID
  conversationId: UUID (foreign key, indexed)
  senderId: UUID (foreign key, indexed)
  senderRole: Enum (DOCTOR, PATIENT)
  content: Text
  translatedContent: Text (nullable)
  type: Enum (TEXT, AUDIO)
  audioUrl: String (nullable)
  audioData: Text (Base64, nullable)
  audioDuration: Float (nullable)
  createdAt: DateTime (indexed)
}
```

### Summary
```typescript
{
  id: UUID
  conversationId: UUID (unique, foreign key)
  content: Text
  symptoms: String[] (Array)
  diagnoses: String[] (Array)
  medications: String[] (Array)
  followUpActions: String[] (Array)
  generatedAt: DateTime
  updatedAt: DateTime
}
```

### RefreshToken
```typescript
{
  id: UUID
  userId: UUID (foreign key, indexed)
  token: String (unique, indexed)
  expiresAt: DateTime
  createdAt: DateTime
}
```

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login and get JWT | No |
| POST | `/refresh` | Refresh access token | No |
| GET | `/me` | Get current user | Yes |
| POST | `/logout` | Logout (invalidate token) | Yes |

### Conversations (`/api/conversations`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user conversations | Yes |
| POST | `/` | Create new conversation | Yes |
| GET | `/:id` | Get conversation details | Yes |
| GET | `/:id/messages` | Get conversation messages | Yes |
| DELETE | `/:id` | Delete conversation | Yes |

### Messages (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Send message (auto-translates) | Yes |
| GET | `/:id` | Get specific message | Yes |

### Search (`/api/search`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/?q=query&conversationId=id` | Search messages | Yes |

### Summaries (`/api/summaries`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:conversationId` | Generate AI summary | Yes |
| GET | `/:conversationId` | Get existing summary | Yes |

## WebSocket Events

### Client → Server
```typescript
// Join conversation room
socket.emit('join_conversation', {
  conversationId: string,
  userId: string,
  role: 'DOCTOR' | 'PATIENT'
})

// Send message
socket.emit('send_message', {
  conversationId: string,
  content: string,
  type: 'TEXT' | 'AUDIO',
  audioData?: string
})

// Typing indicator
socket.emit('typing', {
  conversationId: string
})
```

### Server → Client
```typescript
// New message received
socket.on('message_created', (message: Message) => {})

// Translation completed
socket.on('message_translated', {
  messageId: string,
  translation: string
})

// User typing notification
socket.on('user_typing', {
  userId: string,
  role: 'DOCTOR' | 'PATIENT'
})

// Error occurred
socket.on('error', {
  message: string
})
```

## Security Implementation

### Authentication & Authorization
- **JWT Tokens:** 1-hour access tokens, 7-day refresh tokens
- **Password Hashing:** bcrypt with salt rounds = 10
- **Token Storage:** Refresh tokens in database with expiry
- **Role-Based Access:** Middleware checks user role for protected routes

### API Security
- **Helmet:** Security headers (XSS, clickjacking protection)
- **CORS:** Whitelist specific origins
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Input Validation:** express-validator on all endpoints
- **SQL Injection:** Protected via Prisma ORM parameterized queries

### Data Protection
- **HTTPS:** All production traffic encrypted
- **Sensitive Data:** Passwords never stored in plain text
- **Audit Logging:** All critical actions logged with Winston
- **Error Handling:** No sensitive data in error responses

## Real-Time Communication Flow

```
1. User opens conversation
   ↓
2. Frontend connects to Socket.IO server with JWT
   ↓
3. Server authenticates connection
   ↓
4. Client joins conversation room
   ↓
5. User types/speaks message
   ↓
6. Frontend sends message via Socket.IO
   ↓
7. Backend receives, validates, saves to database
   ↓
8. Backend calls Translation API
   ↓
9. Backend broadcasts message to conversation room
   ↓
10. All clients in room receive message instantly
```

## Translation Service Flow

```
User Message (Spanish)
    ↓
"Tengo dolor de cabeza"
    ↓
Translation Service
    ↓
Google Cloud Translation API
    ↓
Translated Text (English)
    ↓
"I have a headache"
    ↓
Stored in Database
    ↓
Displayed to Other User
```

## AI Summarization Flow

```
User clicks "AI Summary"
    ↓
Fetch all conversation messages
    ↓
Format messages with roles
    ↓
Send to Claude API with prompt
    ↓
Claude analyzes conversation
    ↓
Extract medical information:
  - Symptoms
  - Diagnoses
  - Medications
  - Follow-up actions
    ↓
Store summary in database
    ↓
Display to user
```

## Performance Optimizations

### Database
- **Indexing:** Strategic indexes on `userId`, `conversationId`, `createdAt`
- **Connection Pooling:** Prisma connection pool (default: 10)
- **Query Optimization:** Eager loading with Prisma `include`
- **Pagination:** Limit queries with `take` and `skip`

### API
- **Response Compression:** gzip compression middleware
- **Caching:** Consider Redis for frequently accessed data
- **Rate Limiting:** Prevent abuse and ensure fair usage
- **Database Queries:** Use `select` to fetch only required fields

### Frontend
- **Code Splitting:** Load components lazily if needed
- **Debouncing:** Search inputs debounced to reduce API calls
- **Optimistic Updates:** Update UI before API confirmation
- **WebSocket Reconnection:** Automatic reconnection on disconnect

### Real-Time
- **Room-Based Broadcasting:** Messages only sent to relevant users
- **Heartbeat:** Periodic ping/pong to keep connections alive
- **Graceful Degradation:** Fall back to HTTP polling if WebSocket fails

## Scalability Considerations

### Horizontal Scaling
- **Stateless API:** No server-side session storage
- **Load Balancing:** Nginx or AWS ELB for traffic distribution
- **Socket.IO Adapter:** Use Redis adapter for multi-server WebSocket

### Vertical Scaling
- **Database:** Upgrade to larger PostgreSQL instance
- **API Server:** Increase CPU/RAM allocation
- **Caching Layer:** Add Redis for session and data caching

### Future Enhancements
- **CDN:** CloudFront/Cloudflare for static assets
- **Message Queue:** RabbitMQ/SQS for asynchronous processing
- **Microservices:** Separate translation and AI services
- **Read Replicas:** PostgreSQL read replicas for queries

## Monitoring & Observability

### Logging
- **Winston:** Structured JSON logging
- **Log Levels:** Debug, Info, Warn, Error
- **Log Aggregation:** Papertrail, Loggly, or ELK stack

### Error Tracking
- **Sentry:** Real-time error tracking and alerts
- **Error Context:** Include user ID, request ID, stack traces

### Performance Monitoring
- **APM:** New Relic or Datadog
- **Metrics:** Response times, error rates, throughput
- **Database:** Query performance monitoring

### Health Checks
- **Endpoint:** `/health` returns server status
- **Database:** Check PostgreSQL connection
- **External APIs:** Verify Anthropic and Google APIs

## Testing Strategy

### Unit Tests
- Service functions (translation, AI)
- Utility functions
- Middleware logic

### Integration Tests
- API endpoints with test database
- Socket.IO event handlers
- Database operations

### End-to-End Tests
- Complete user flows
- Login → Create conversation → Send messages
- AI summary generation

### Performance Tests
- Load testing with Artillery or k6
- Stress testing WebSocket connections
- Database query performance

## Deployment Strategies

### Development
- Local PostgreSQL database
- Environment variables in `.env`
- Hot reload with nodemon/ts-node-dev

### Staging
- Supabase database (dev instance)
- Vercel preview deployments
- Test API keys

### Production
- Managed PostgreSQL (RDS/Supabase Pro)
- Vercel production deployment
- Production API keys with quotas
- CDN for frontend assets
- SSL/TLS certificates

## Compliance & Regulations

### HIPAA Considerations
- **Encryption:** Data encrypted at rest and in transit
- **Access Control:** Role-based access, audit logs
- **Data Retention:** Configurable retention policies
- **BAA:** Business Associate Agreements with vendors

### GDPR Compliance
- **Data Minimization:** Only collect necessary data
- **Right to Erasure:** User can delete their account
- **Data Portability:** Export conversation history
- **Consent:** Clear consent for data processing

## Cost Estimation

### Monthly Operating Costs (1000 active users)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Anthropic API | Pay-as-you-go | $50-200 |
| Google Translation | Pay-as-you-go | $20-100 |
| Domain & SSL | - | $15 |
| **Total** | | **$130-360/month** |

### Scaling Costs (10,000 users)
- Database: $100-200
- API Hosting: $50-100
- AI Services: $500-1000
- **Total:** $650-1300/month

## Maintenance & Support

### Regular Tasks
- **Daily:** Monitor logs and error rates
- **Weekly:** Review API usage and costs
- **Monthly:** Database backups, security updates
- **Quarterly:** Performance audits, dependency updates

### Support Channels
- GitHub Issues for bugs
- Email support for users
- Slack/Discord for developer community

---

## Conclusion

This architecture prioritizes:
1. **Reliability:** Robust error handling, graceful degradation
2. **Scalability:** Stateless design, horizontal scaling ready
3. **Security:** Industry-standard authentication and encryption
4. **Performance:** Optimized queries, real-time communication
5. **Maintainability:** Clean code, comprehensive documentation

The system is production-ready and can scale from hundreds to thousands of concurrent users with minimal modifications.
