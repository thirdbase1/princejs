# Telegram Video Splitter Bot

A powerful and efficient Telegram bot built with Node.js that downloads videos from popular platforms (YouTube, TikTok, Instagram, etc.) and automatically splits them into <50MB parts if necessary, ensuring seamless sharing on Telegram.

## Features

- 📥 **Universal Download**: Supports any public video URL via `yt-dlp`.
- 🎛 **Quality Selection**: Choose from available resolutions (144p to 4K) with estimated file sizes.
- ✂️ **Smart Splitting**: Automatically splits large videos (>50MB) into 45MB chunks without re-encoding (fast & quality preserving).
- 🚀 **High Performance**: Asynchronous architecture supporting concurrent downloads.
- 🐳 **Docker Ready**: Easy deployment using Docker.

## Installation

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/telegram-video-splitter-bot.git
    cd telegram-video-splitter-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and add your Telegram Bot Token.
    ```bash
    cp .env.example .env
    # Edit .env and set BOT_TOKEN
    ```

4.  **Run the bot:**
    ```bash
    npm run dev
    # or for production build
    npm run build
    npm start
    ```

### Docker Deployment

1.  **Build the image:**
    ```bash
    docker build -t video-splitter-bot .
    ```

2.  **Run container:**
    ```bash
    docker run -d --env-file .env --name splitter-bot video-splitter-bot
    ```

## Usage

1.  Start the bot with `/start`.
2.  Send a video link (e.g., YouTube URL).
3.  Wait for the bot to fetch available qualities.
4.  Click on the desired quality button.
5.  The bot will download and send the video (split if needed).

## Technology Stack

- **Node.js**: Runtime environment.
- **Grammy**: Modern Telegram Bot Framework.
- **yt-dlp**: Powerful video downloader.
- **FFmpeg**: Video processing and splitting.
- **TypeScript**: Type-safe development.

## License

MIT
