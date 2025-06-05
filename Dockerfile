# Multi-stage build for frontend (Node.js) and backend (Python/FastAPI)

# Stage 1: Frontend (Node.js for React/Next.js)
FROM node:20-slim AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 2: Backend (Python/FastAPI)
FROM python:3.10-slim AS backend
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Stage 3: Development (combined for devcontainer)
FROM python:3.10-slim AS development
WORKDIR /app
# Install Node.js and npm
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Install Node.js dependencies
COPY package*.json ./
RUN npm install
# Copy all project files
COPY . .
# Expose ports for frontend and backend
EXPOSE 3000 8000
