# Frontend build
FROM node:20 AS frontend
WORKDIR /frontend
COPY frontend/ .
RUN npm install && npm run build

# Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend /frontend/dist ./frontend/

# Copy config templates
COPY config/ ./config/

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose API port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV CONFIG_TEMPLATE_PATH=/app/config/config.template.toml
ENV DNS_CONFIG_PATH=/app/config/config.toml

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]