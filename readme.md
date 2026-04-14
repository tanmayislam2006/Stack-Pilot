
# 🚀 StackPilot

### Mini Cloud Deployment Platform (SaaS)

StackPilot is a **developer-focused deployment platform** that allows users to deploy, manage, and monitor applications using Docker — similar in concept to platforms like Heroku and Railway, but built from scratch to demonstrate real-world **backend engineering, DevOps, and system design skills**.

---

# 🧠 Overview

StackPilot enables users to:

* Deploy applications from Git repositories
* Run and manage Docker containers
* Monitor application status and logs
* Simulate CI/CD workflows
* Manage services through a clean dashboard

---

# 🎯 Key Features

## 👤 User Features

* Register/Login (via Clerk)
* Create and manage services
* Deploy applications from GitHub repositories
* Start / Stop / Restart services
* View container logs
* Access deployed apps via server URL

---

## 🛡️ Admin Features

* View all users
* Block / Unblock users
* Control platform access

---

## 🐳 Deployment Engine

* Docker-based application deployment
* Dynamic port allocation
* Container lifecycle management
* Backend-controlled infrastructure

---

## 🔄 CI/CD Simulation

* GitHub webhook integration
* Auto-redeploy on code push
* Build → Restart pipeline

---

## 📊 Dashboard

* Service status tracking:

  * 🟢 Running
  * 🟡 Building
  * 🔴 Stopped / Error
* Logs viewer (terminal-style)
* Real-time service control

---

# 🏗️ Architecture

```text
Frontend (Next)
        ↓
Auth Layer (Better Auth)
        ↓
Backend API (NestJS)
        ↓
Service Layer (Business Logic)
        ↓
Docker Engine (child_process)
        ↓
VPS Server (Linux)
        ↓
Nginx (Reverse Proxy)
```

---

# 🧩 Tech Stack

## Frontend

* Next
* Tailwind CSS

## Backend

* NestJS

## Infrastructure

* Docker
* VPS (Linux server)
* Nginx

## DevOps

* GitHub Actions (CI/CD)
* GitHub Webhooks

---

# 🔐 Authentication & Authorization

Authentication is handled via **Better Auth**, while authorization is managed internally.

### User Model

```json
{
  "clerkId": "user_xxx",
  "email": "user@example.com",
  "role": "user | admin",
  "status": "active | blocked"
}
```

### Security Rules

* Blocked users cannot access APIs
* Role-based route protection
* JWT verification via express middleware

---

# 📦 Core Data Model

### Service Model

```json
{
  "name": "my-app",
  "repoUrl": "https://github.com/...",
  "status": "idle | building | running | stopped | error",
  "containerId": "docker_container_id",
  "port": 3001,
  "createdBy": "userId",
  "createdAt": "timestamp"
}
```

---

# 🚀 Deployment Flow

```text
User clicks "Deploy"
        ↓
Backend clones repository
        ↓
Docker image is built
        ↓
Container is started
        ↓
Port is assigned
        ↓
Database is updated
        ↓
Service becomes accessible
```

---

# 🐳 Docker Integration

Docker is controlled via backend using Node.js (`child_process`).

### Supported Operations:

* Build image
* Run container
* Stop container
* Fetch logs

---

# 🌐 Service Access

### Development:

```
http://server-ip:PORT
```

### Production (via Nginx):

```
https://app.stackpilot.com → container
```

---

# 🔄 CI/CD Workflow

Using GitHub Actions:

```text
Push to GitHub
        ↓
CI/CD triggers
        ↓
Build Docker image
        ↓
SSH into VPS
        ↓
Restart container
```

---

# 📡 API Endpoints

## Service

* `POST /services`
* `GET /services`
* `GET /services/:id`
* `DELETE /services/:id`

## Deployment

* `POST /deploy/:serviceId`
* `POST /stop/:serviceId`
* `GET /logs/:serviceId`

## Admin

* `GET /admin/users`
* `PATCH /admin/block/:id`

---

# 🔐 Security Considerations

* Passwordless auth via Clerk
* Input validation for repository URLs
* Prevention of command injection
* Role-based access control
* Docker isolation per service

---

# ⚙️ System Design Highlights

* Separation of concerns (Controller → Service → Infrastructure)
* Database as the source of truth
* Stateless backend architecture
* Asynchronous deployment pipeline
* Scalable container-based system

---

# 🚧 Future Improvements

* Domain-based routing per service
* Load balancing (multi-container scaling)
* Real-time logs (WebSocket streaming)
* Kubernetes integration
* Resource limits per container

---

# 🧠 What This Project Demonstrates

This project showcases:

* Real-world backend architecture
* Docker-based deployment systems
* CI/CD pipeline understanding
* VPS-based production deployment
* Role-based access control
* System design thinking

---

