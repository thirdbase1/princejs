import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
const ffprobePath = require('ffprobe-static');
import fs from 'fs';
import path from 'path';

// Set paths
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
// ffprobePath default export handles path property
if (ffprobePath && ffprobePath.path) {
    ffmpeg.setFfprobePath(ffprobePath.path);
} else {
    console.warn('ffprobe-static path not found, metadata extraction might fail.');
}

// 45MB to be safe for Telegram's 50MB limit, accounting for overhead and keyframe granularity
const CHUNK_SIZE = 45 * 1024 * 1024;

const getDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(duration || 0);
    });
  });
};

const getPartName = (baseName: string, partIndex: number, ext: string): string => {
    // Generate suffix: A, B, ..., Z, AA, AB...
    let suffix = '';
    let n = partIndex; // 0-based index

    do {
        const remainder = n % 26;
        suffix = String.fromCharCode(65 + remainder) + suffix;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);

    return `${baseName} - Part ${suffix}${ext}`;
};

export const splitVideo = async (filePath: string, maxSize: number = CHUNK_SIZE): Promise<string[]> => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size <= maxSize) {
        return [filePath];
    }

    const parts: string[] = [];
    // Clean base name for filename safety
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    const totalDuration = await getDuration(filePath);
    console.log(`Splitting ${baseName} (Duration: ${totalDuration}s, Size: ${stats.size})...`);

    let currentStart = 0;
    let partIndex = 0;

    // Safety loop limit
    const MAX_PARTS = 100;

    while (currentStart < totalDuration && partIndex < MAX_PARTS) {
        const partName = getPartName(baseName, partIndex, ext);
        const partPath = path.join(dir, partName);

        // Calculate duration estimate? No, rely on -fs.
        // ffmpeg -ss currentStart -i input -c copy -fs maxSize output

        console.log(`Processing part ${partIndex + 1} starting at ${currentStart}s...`);

        await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
            .setStartTime(currentStart)
            .outputOptions([
                '-c copy',
                `-fs ${maxSize}`,
                // accurate_seek for input seeking might be better but -ss before -i is fast seek (keyframes)
                // Since we use -c copy, we must use fast seek (or input seeking) to align with keyframes.
                // fluent-ffmpeg puts .setStartTime() before -i by default?
                // Actually .setStartTime() behavior depends.
                // It usually adds -ss before -i.
                // But for splitting, if we cut at non-keyframe, -c copy will snap to nearest keyframe.
                // This might cause overlap or gap.
                // But we measure the output duration to determine next start point, so gaps should be minimized (unless keyframes are sparse).
            ])
            .output(partPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });

        if (!fs.existsSync(partPath) || fs.statSync(partPath).size === 0) {
            console.warn(`Part ${partIndex + 1} is empty, stopping split.`);
            break;
        }

        parts.push(partPath);

        const partDuration = await getDuration(partPath);

        if (partDuration <= 0.5) {
            // Tiny part, likely EOF or error.
            // If it's the last part, it's fine.
            // Check if we are near end.
            if (currentStart + partDuration >= totalDuration - 1.0) {
                break;
            }
            console.warn(`Part ${partIndex + 1} too small (${partDuration}s), might be EOF.`);
            if (partDuration <= 0.1) break;
        }

        currentStart += partDuration;
        partIndex++;

        // Check if we reached end
        if (currentStart >= totalDuration - 0.5) break;
    }

    return parts;
  } catch (error) {
    console.error('Error splitting video:', error);
    throw error;
  }
};
