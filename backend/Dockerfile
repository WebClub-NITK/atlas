# Use Python base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fix line endings and permissions for entrypoint script AFTER copying all files
RUN sed -i 's/\r$//g' /app/code/entrypoint.sh && \
    chmod +x /app/code/entrypoint.sh

# Expose port
EXPOSE 8000

# Run the backend server
ENTRYPOINT [ "/app/code/entrypoint.sh" ]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]