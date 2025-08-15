# roFl Platform - AI Prompt Management System

> Transform unstructured AI conversations into an intelligent, searchable knowledge management system that increases AI productivity by 10x.

[![CI/CD Pipeline](https://github.com/your-org/rofl-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/rofl-platform/actions/workflows/ci.yml)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=rofl-platform&metric=security_rating)](https://sonarcloud.io/dashboard?id=rofl-platform)
[![Coverage](https://codecov.io/gh/your-org/rofl-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/rofl-platform)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Quick Start

### One-Command Deployment

```bash
# Clone and deploy
git clone https://github.com/your-org/rofl-platform.git
cd rofl-platform
./scripts/deploy.sh
```

### Prerequisites

- **Node.js** 18+ 
- **Docker** 20+ (for containerized deployment)
- **Firebase** project with Firestore enabled
- **Google AI** API key for Gemini

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- 🧠 **Intelligent Prompt Capture** - Import from ChatGPT, Claude, Gemini
- 🏷️ **AI-Powered Organization** - Auto-categorization with 85% accuracy
- 💬 **Conversational Interface** - Natural language prompt creation
- 🗺️ **Visual Knowledge Mapping** - Interactive mind maps
- ⚡ **Prompt Optimization Engine** - A/B testing framework
- 👥 **Team Collaboration** - Workspace management with permissions
- 🏪 **Marketplace Ecosystem** - Publish and discover prompts

### Technical Features
- 🔐 **Production Security** - CSRF protection, rate limiting, input sanitization
- 🧪 **Comprehensive Testing** - 90%+ code coverage, E2E tests
- 📊 **Real-time Analytics** - Performance monitoring and insights
- 🚀 **Auto-scaling** - Containerized deployment ready
- 🔄 **CI/CD Pipeline** - Automated testing, security scanning, deployment

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS | Server-side rendering, type safety, styling |
| **Backend** | Next.js API Routes, Firebase Functions | RESTful API, serverless compute |
| **Database** | Firestore, Vector Database | Document storage, semantic search |
| **Authentication** | Firebase Auth | Secure user management |
| **AI/ML** | Google Gemini, Vertex AI | Prompt optimization, categorization |
| **Testing** | Vitest, Playwright, MSW | Unit, integration, E2E testing |
| **DevOps** | Docker, GitHub Actions | Containerization, CI/CD |

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rofl-platform.git
   cd rofl-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.production .env.local
   # Edit .env.local with your configurations
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Check health status**
   ```bash
   curl http://localhost:3000/api/health
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | ✅ | - |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | ✅ | - |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ | - |
| `GEMINI_API_KEY` | Google AI API key | ✅ | - |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase admin project ID | ✅ | - |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase admin client email | ✅ | - |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase admin private key | ✅ | - |
| `REDIS_URL` | Redis connection URL | ❌ | In-memory fallback |
| `SENTRY_DSN` | Error monitoring DSN | ❌ | Console logging |

### Firebase Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication

2. **Configure Authentication**
   - Enable Email/Password provider
   - Enable Google OAuth provider
   - Add your domain to authorized domains

3. **Set up Firestore Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Generate service account key**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Add credentials to environment variables

## 🧪 Development

### Code Quality Standards

- **TypeScript** - Strict mode enabled
- **ESLint** - Security rules enforced
- **Prettier** - Consistent code formatting
- **Conventional Commits** - Standardized commit messages

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
```

## 🧪 Testing

Our comprehensive testing strategy ensures reliability and performance:

### Test Coverage Requirements

- **Unit Tests**: 90%+ coverage required
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user paths automated

### Running Tests

```bash
# Unit and integration tests
npm run test:coverage

# E2E tests
npx playwright test

# Security tests
npm audit
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured

### One-Command Deployment

```bash
./scripts/deploy.sh production
```

### Health Monitoring

The application includes comprehensive health monitoring:

- **Health Check Endpoint**: `/api/health`
- **Performance Metrics**: Response times, error rates
- **Security Monitoring**: Failed auth attempts, rate limiting

## 📚 API Documentation

### Authentication

All API endpoints require authentication via Firebase Auth tokens.

### Core Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/prompts` | GET | List user prompts | 300/min |
| `/api/prompts` | POST | Create new prompt | 100/min |
| `/api/prompts/:id` | PUT | Update prompt | 100/min |
| `/api/prompts/:id` | DELETE | Delete prompt | 100/min |
| `/api/health` | GET | Health check | No limit |

## 🔒 Security

### Security Measures Implemented

- **Authentication**: Firebase Auth with session management
- **Authorization**: Row-level security in Firestore
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: Distributed rate limiting
- **Input Validation**: Zod schema validation
- **Security Headers**: HSTS, CSP, XSS protection

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Server-side validation required
3. **Use HTTPS** - SSL/TLS encryption mandatory
4. **Regular updates** - Keep dependencies current

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS

---

**Ready to transform your AI workflow? Get started now!** 🚀
