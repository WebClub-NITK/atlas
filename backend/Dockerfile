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

# Copy entrypoint
COPY code/entrypoint.sh /app/code/entrypoint.sh
RUN sed -i 's/\r$//g' /app/code/entrypoint.sh
RUN chmod +x /app/code/entrypoint.sh

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Run the backend server
ENTRYPOINT [ "/app/code/entrypoint.sh" ]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]