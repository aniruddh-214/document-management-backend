
# 📄 Document Management Backend

A **Document Management System (DMS)** built using **NestJS**, providing secure and scalable document operations for three user roles: **Admin**, **Editor**, and **Viewer**. This backend includes **RBAC**, **JWT authentication**, **document uploading**, **ingestion simulation** (no external services), **pagination**, and a complete **developer-friendly setup** for local and Docker-based environments.

---

## ✅ Key Features

- 👤 **User Roles with RBAC**: `Admin`, `Editor`, `Viewer`
- 🔐 **JWT-based Authentication** (without Passport)
- 📄 **Document Upload & Management** for Admins & Editors
- 🔁 **Document Ingestion Simulation** using `setTimeout`
- 🧪 **Real DB Testing** with Jest
- 📚 **Swagger/OpenAPI Documentation** at `/docs`
- 🧵 **Seeder Script**: Generates 1000+ users, 100K documents, 50K ingestion records
- 📊 **Pagination** implemented for large datasets
- 🧱 **Common Entity Template**: Includes `id`, `deleted_at`, timestamps, etc.
- 🧹 **Weed & Seed** Strategy for clean DB seeding
- ⚙️ **TypeORM**, **Docker**, **Zod**, **bcryptjs**, custom guards, decorators

---

## 🔧 Tech Stack

| Layer          | Technology       |
|----------------|------------------|
| Framework      | NestJS           |
| Language       | TypeScript       |
| Database       | PostgreSQL       |
| ORM            | TypeORM          |
| Auth           | JWT (custom)     |
| Containerization| Docker + Compose|
| API Docs       | Swagger (OpenAPI)|
| Testing        | Jest             |
| Hashing        | bcryptjs         |
| Validation     | Zod              |

---

## 📁 Environment Variables

All environment variables are defined in `test/.env`.

> 📌 **Note**: Copy the content from `test/.env` and create a new `.env` at the root level. Adjust values as needed for your environment.

---

## ⚙️ Local Development Setup

1. **Create `.env`** at project root by copying from `test/.env`
2. **Create local PostgreSQL DB** (e.g. `document_db`)
3. **Update DB credentials** in your `.env`
4. **Run migrations**:

   ```bash
   pnpm migrate:run
   ```

5. **Seed the database** (users, documents, ingestions):

   ```bash
   pnpm database:seed
   ```

   * Default Admin Login:

     * Email: `admin@gmail.com`
     * Password: `Admin@123`

   * Other users:

     * Password: `User@123`
   * If you want to customize the seeder you can visit the src/scripts/main.ts

6. **Start development server**:

   ```bash
   pnpm start:dev
   ```

---

## 🔍 API Access

* **Swagger UI**
  Access: `http://localhost:<PORT>/docs`

* **Postman Collection**
  Files available in the `postman/` directory:

  * `DocumentManagement.postman_collection.json`
  * `DocumentManagement.postman_environment.json`

---

## 🧪 Testing Setup

> ⚠️ This project uses real DB operations during tests. update test/.env accordingly

1. **Setup test database and run migrations**:

   ```bash
   pnpm test:setup
   ```

2. **Run tests**:

   ```bash
   pnpm test
   ```

---

## 🐳 Running via Docker Compose

1. In `.env`, update:

   ```env
   DB_HOST=host.docker.internal
   ```

2. **Start Docker containers** in detached mode:

   ```bash
   docker compose up -d
   ```

3. **Stop Docker containers**:

   ```bash
   docker compose down
   ```

> ⚠️ Ensure that `.env` is correctly configured before running Docker.

---

## 🗃️ Data Model & Relationships

* **Base Entity**: Common fields like `id`, `deleted_at`, `created_at`, `updated_at`
* **User**:

  * Has one of three roles: `admin`, `editor`, `viewer`
  * One user → many documents
* **Document**:

  * Belongs to an admin/editor
  * One document → many ingestion records
* **Ingestion**:

  * Each ingestion is triggered by a user
  * Simulated with async `setTimeout`

---

## 🌱 Seeder Scripts

This project uses a **weed and seed strategy**:

* **Clear & repopulate** database using:

  ```bash
  pnpm database:seed
  ```

* **Run any individual TS script**:

  ```bash
  pnpm shell src/scripts/main.ts
  ```

> 📌 Seeder generates large datasets — useful for pagination and performance testing.

---

## 📂 Folder Structure (Tree)

To view the project structure on **Windows**, run from the root directory:

```cmd
tree /F > structure.txt
```

This will save the folder structure to `structure.txt`.

---

## 🔐 Role Capabilities

| Role   | Upload | Ingest | View |
| ------ | ------ | ------ | ---- |
| Admin  | ✅      | ✅      | ✅    |
| Editor | ✅      | ✅      | ✅    |
| Viewer | ❌      | ❌      | ✅    |

> Ingestion is available **only** to Admins and Editors via protected REST API routes.

---

## 🧠 Notes

* No service buses or microservices are used
* All ingestion simulation is done via `setTimeout` internally
* Project uses **custom decorators**, **guards**, and **DTOs** for clean, maintainable code
* Follows clean code architecture principles

---

## 📘 Scripts Summary

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm start:dev`       | Start development server                 |
| `pnpm migrate:run`     | Run DB migrations                        |
| `pnpm database:seed`   | Weed + seed users, documents, ingestions |
| `pnpm test:setup`      | Setup DB for tests                       |
| `pnpm test`            | Run all tests                            |
| `pnpm shell <file.ts>` | Run individual TypeScript file manually  |

