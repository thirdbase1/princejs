# Use a lightweight Node.js image
FROM node:22-slim

# Install system dependencies
# yt-dlp often requires Python 3. FFmpeg is provided via static package but system ffmpeg is good backup.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create downloads directory
RUN mkdir -p downloads

# Environment variables should be passed at runtime
# ENV BOT_TOKEN=...

# Start the bot
CMD ["npm", "start"]
