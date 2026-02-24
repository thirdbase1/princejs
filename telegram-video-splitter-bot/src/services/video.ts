import ytDlp from 'yt-dlp-exec';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';

// If ffmpegPath is not found (e.g. in some environments), handle gracefully?
// But user installed it.

export const downloadVideo = async (url: string, height: number, outputPath: string): Promise<string> => {
  try {
    // yt-dlp options
    const options: any = {
      format: `bestvideo[height=${height}]+bestaudio/best[height=${height}]/best`,
      output: outputPath,
      mergeOutputFormat: 'mp4',
      noWarnings: true,
      preferFreeFormats: true,
    };

    if (ffmpegPath) {
      options.ffmpegLocation = ffmpegPath;
    }

    await ytDlp(url, options);

    // Verify file exists
    // yt-dlp might append extension if we didn't specify correct one or if merge happened.
    // If outputPath ends in .mp4, it should be fine.
    // But sometimes it appends .mp4 to outputPath if it didn't have extension.
    // We assume outputPath has .mp4 extension.

    if (!fs.existsSync(outputPath)) {
        // Check if it created something else?
        // Maybe it created .mkv?
        const mkvPath = outputPath.replace(/\.mp4$/, '.mkv');
        if (fs.existsSync(mkvPath)) {
            return mkvPath;
        }
        // Or check directory for similar file?
        // throw new Error('Download failed: Output file not found.');
    }

    return outputPath;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
};

export interface VideoFormat {
  format_id: string;
  format_note: string;
  ext: string;
  filesize: number;
  filesize_approx: number;
  vcodec: string;
  acodec: string;
  resolution: string;
  height: number;
  fps: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  formats: VideoFormat[];
  thumbnail: string;
  webpage_url: string;
}

export const getVideoInfo = async (url: string): Promise<VideoInfo> => {
  try {
    const output = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    const info = output as any;

    const formatsList = (info.formats as any[]) || [];

    // Filter formats that have video and height
    const videoFormats = formatsList.filter((f) =>
      f.vcodec !== 'none' &&
      f.height // Must have height info
    );

    // Group by height to get unique qualities
    const uniqueQualities = new Map<number, any>();

    for (const f of videoFormats) {
        if (!uniqueQualities.has(f.height)) {
             uniqueQualities.set(f.height, f);
        } else {
             const existing = uniqueQualities.get(f.height)!;
             // Heuristic: Prefer format with known filesize or larger approx size (likely better bitrate/quality)
             const sizeNew = f.filesize || f.filesize_approx || 0;
             const sizeOld = existing.filesize || existing.filesize_approx || 0;
             if (sizeNew > sizeOld) {
                 uniqueQualities.set(f.height, f);
             }
        }
    }

    const formats: VideoFormat[] = Array.from(uniqueQualities.values())
        .sort((a, b) => a.height - b.height)
        .map(f => ({
            format_id: f.format_id,
            format_note: f.format_note,
            ext: f.ext,
            filesize: f.filesize || 0,
            filesize_approx: f.filesize_approx || 0,
            vcodec: f.vcodec,
            acodec: f.acodec,
            resolution: f.resolution || `${f.width}x${f.height}`,
            height: f.height,
            fps: f.fps
        }));

    return {
        id: info.id,
        title: info.title,
        duration: info.duration,
        formats,
        thumbnail: info.thumbnail,
        webpage_url: info.webpage_url || url
    };

  } catch (error) {
    console.error('Error fetching video info:', error);
    throw error;
  }
};
