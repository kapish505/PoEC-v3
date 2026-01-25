# ==================== STAGE 1: Frontend Build ====================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js as static export (requires 'output: export' in next.config.js)
# We enforce export mode by modifying config if needed, or relying on script
# NOTE: User should ensure next.config.js has output: 'export' or we use 'next build'
# which produces .next/standalone or .next/static.
# For simplicity with FastAPI serving, we prefer static export.
# Let's try to build static output.
RUN npm run build

# If 'output: export' is NOT set, we might need to rely on .next.
# But for single-container simply, we assume static export or standalone.
# Let's assume standard build and we copy .next to backend static?
# Actually, standard build requires Node.js runtime.
# So we will instruct user to enable 'output: export' or use a Node+Python image.
# FOR NOW: We assume 'npm run build' creates 'out' or '.next'.
# We will check if 'out' exists in next stage.

# ==================== STAGE 2: Backend Runtime ====================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including Node.js for snarkjs/ZK proofs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install snarkjs globally for ZK proofs
RUN npm install -g snarkjs

# Copy Backend Code
COPY backend ./backend
COPY contracts ./contracts
# Copy Agent Runtime ABI if needed
COPY agent-runtime/src/abis ./backend/app/abis

# Copy Frontend Build Artifacts (Static Export)
# 'npm run build' with output: 'export' creates 'out' directory
COPY --from=frontend-builder /app/frontend/out ./static

# Configs
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose API port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
