
# 📄 Document Management Backend

A clean, modular NestJS backend built with TypeORM, JWT authentication, role-based access control, Zod validation, file uploads, simulated ingestion workflows, and full test coverage.

![CI](https://github.com/aniruddh-214/document-management-backend/actions/workflows/build_test_and_coverage.yml/badge.svg)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)

---

## 🚀 Features

- 🔐 JWT Auth with role-based access (Admin, Editor, Viewer)
- 🧾 Document CRUD with file upload (using Streams & Multer)
- ⚙️ Ingestion job simulation (mocked with `setTimeout`)
- ✅ Zod-powered request validation
- 📚 Swagger API docs (`/docs`)
- 🧪 Unit testing with 100% coverage (reports generated dynamically)
- 🐳 Docker + Docker Compose ready
- ⚙️ CI/CD with GitHub Actions
- 📁 Environment-based configuration (`.env`, test/.env)

---

## 📐 Entity Relationship Diagram

```

┌────────┐       1       ┌────────────┐       1       ┌──────────────┐
│  User  ├──────────────►│  Document  ├──────────────►│  Ingestion   │
└────────┘               └────────────┘               └──────────────┘

User owns multiple Documents.
Each Document can have multiple Ingestion jobs.
Each Ingestion job also links back to the triggering User.

````

---

## 🧱 Project Structure

```plaintext
src/
├── auth/        → Handles login, registration, JWT logic
├── user/        → Manages user roles and permissions
├── document/    → CRUD for documents and file uploads
├── ingestion/   → Simulates ingestion with setTimeout logic
├── common/      → Reusable enums, base entities, utils
│   ├── entities/
│   ├── enums/
│   └── utils/
├── main.ts      → Application bootstrap
test/
├── .env         → Reference .env for test/dev setup
test_reports/
├── coverage/    → Jest HTML + LCOV coverage output
````

---

## 📚 Swagger API Docs

All routes are documented and testable using Swagger:

📍 `http://localhost:3000/docs`

---

## 🧪 Testing

* 💯 **100% Unit Test Coverage** using [Jest](https://jestjs.io/)
* **Coverage reports** exported to `test_reports/coverage/`
* LCOV + HTML formats supported

### 🧪 Run Tests Locally

```bash
pnpm test
pnpm test:cov
```

### 🧪 Coverage Report Preview

After running `pnpm test:cov`, open:

```
test_reports/coverage/lcov-report/index.html
```

---

## ⚙️ GitHub Actions CI/CD

GitHub Actions automatically runs tests and verifies 100% test coverage on every PR or push.

### `.github/workflows/ci.yml`

```yaml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm test:cov
```

📁 `test_reports/` is created dynamically and can be uploaded as a GitHub artifact or viewed locally.

---

## 🐳 Docker Setup

### 1️⃣ Create `.env`

```env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=document_db
JWT_SECRET=your_secret_key
PORT=3000
```

> ✅ Use `host.docker.internal` to access host DB from Docker containers (works on Mac, Windows, Linux)

---

### 2️⃣ Docker Compose Commands

Start everything:

```bash
docker-compose up --build -d
```

Stop & clean up:

```bash
docker-compose down
```

Clean volumes + networks:

```bash
docker-compose down -v --remove-orphans
```

---

### 🛠️ Sample `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: document_backend
    ports:
      - '3000:3000'
    env_file:
      - .env
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    container_name: document_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: document_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧭 REST vs GraphQL

We chose **REST API** for these reasons:

* Simpler CRUD implementation
* Easy to manage authentication, roles, and security
* Efficient and cache-friendly
* Lower operational complexity for the current scope

> GraphQL may be introduced later for advanced querying/filtering.

---

## 🔮 Future Roadmap

* 🧠 Add Redis-based caching
* 🚦 Implement global rate limiting (e.g. `@nestjs/throttler`)
* 🔐 Add OAuth integrations (Google, GitHub, etc.)
* 📨 Introduce service bus (e.g., RabbitMQ or Kafka)
* ⚙️ Convert to microservices with dedicated workers for ingestion

---


