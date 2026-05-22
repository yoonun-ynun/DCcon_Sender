import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

/**
 * @param {string[]} urls
 * @return {Promise<boolean | {file: File, ext: string}>}
 */
export async function getDoubleImage(urls) {
    const promises = [];
    urls.forEach((url) => {
        promises.push(fetch(`http://localhost:3000/api/img?u=${encodeURIComponent(url)}`));
    });
    /**@type{Response[]} */
    const result = await Promise.all(promises);

    /**@type { {file: File, ext: string}[] } */
    const files = [];
    for (const res of result) {
        if (!res.ok) return false;
        const ext = res.headers.get('Content-Type').split('/')[1] ?? 'png';
        const image = new File([await res.blob()], 'main_image.' + ext);
        files.push({ file: image, ext: ext });
    }

    let type = 0;
    const length = files.length;
    files.forEach((file, index) => {
        if (file.ext === 'gif') {
            type = type | (1 << index);
        }
    });
    if (type === 0) {
        return await concatPNG(files.map((file) => file.file));
    } else {
        return await concatGIF(
            files.map((file) => file.file),
            type,
            length,
        );
    }
}

/**
 * @param {File []} files
 * @return Promise<{file: File, ext: string}>
 */
async function concatPNG(files) {
    const size = 200;

    /**@type { {input: Buffer, left: number, top: number}[] } */
    const images = [];
    for (let i = 0; i < files.length; i++) {
        const buffer = await sharp(Buffer.from(await files[i].arrayBuffer()))
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
        images.push({
            input: buffer,
            left: size * i,
            top: 0,
        });
    }

    const result = await sharp({
        create: {
            width: size * files.length,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(images)
        .png()
        .toBuffer();
    return {
        file: new File([result], 'main_image.png'),
        ext: 'png',
    };
}

/**
 * @param { File[] } files
 * @param {number} type
 * @param {number} length
 * @return {Promise<{file: File, ext: string}>}
 */
async function concatGIF(files, type, length) {
    const size = 200;
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dccon-merge-'));

    try {
        /**
         * @type {{ path: string, ext: 'gif' | 'png', duration: number | null }[]}
         */
        const inputs = [];

        for (let i = 0; i < files.length; i++) {
            const isGif = (type & (1 << i)) !== 0;
            const ext = isGif ? 'gif' : 'png';
            const filePath = path.join(tmpDir, `input_${i}.${ext}`);

            const buffer = Buffer.from(await files[i].arrayBuffer());
            await fs.writeFile(filePath, buffer);

            inputs.push({
                path: filePath,
                ext,
                duration: null,
            });
        }

        // GIF 길이만 측정
        for (const input of inputs) {
            if (input.ext === 'gif') {
                input.duration = await getDurationSeconds(input.path);
            }
        }

        const gifDurations = inputs
            .filter((input) => input.ext === 'gif')
            .map((input) => input.duration)
            .filter((duration) => typeof duration === 'number' && Number.isFinite(duration));

        if (gifDurations.length === 0) {
            throw new Error('concatGIF called without gif input');
        }

        const maxDuration = Math.max(...gifDurations);
        const inputArgs = [];

        for (const input of inputs) {
            if (input.ext === 'png') {
                // PNG는 정지 이미지니까 계속 유지
                inputArgs.push('-loop', '1');
            } else if (input.duration !== null && input.duration + 0.02 < maxDuration) {
                // 가장 긴 GIF보다 짧은 GIF만 반복
                inputArgs.push('-stream_loop', '-1');
            }

            inputArgs.push('-i', input.path);
        }

        const normalizeFilters = inputs
            .map((_, i) => {
                return (
                    `[${i}:v]` +
                    `fps=15,` +
                    `scale=${size}:${size}:force_original_aspect_ratio=decrease:flags=lanczos,` +
                    `pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,` +
                    `format=rgba,` +
                    `setsar=1` +
                    `[v${i}]`
                );
            })
            .join(';');

        const stackInputs = inputs.map((_, i) => `[v${i}]`).join('');

        const filter =
            `${normalizeFilters};` +
            `${stackInputs}hstack=inputs=${length}:shortest=1,split[s0][s1];` +
            `[s0]palettegen=reserve_transparent=1[p];` +
            `[s1][p]paletteuse=alpha_threshold=128`;

        const result = await runFfmpegToBuffer([
            '-hide_banner',
            '-loglevel',
            'error',
            ...inputArgs,
            '-filter_complex',
            filter,
            '-f',
            'gif',
            'pipe:1',
        ]);

        return {
            file: new File([result], 'main_image.gif', {
                type: 'image/gif',
            }),
            ext: 'gif',
        };
    } finally {
        await fs.rm(tmpDir, {
            recursive: true,
            force: true,
        });
    }
}

/**
 * @param {string} filePath
 * @return {Promise<number>}
 */
async function getDurationSeconds(filePath) {
    const stdout = await runProcessToString('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=duration',
        '-of',
        'json',
        filePath,
    ]);

    const data = JSON.parse(stdout);

    const formatDuration = Number(data?.format?.duration);
    if (Number.isFinite(formatDuration)) {
        return formatDuration;
    }

    const streamDuration = Number(data?.streams?.[0]?.duration);
    if (Number.isFinite(streamDuration)) {
        return streamDuration;
    }

    throw new Error(`Cannot read gif duration: ${filePath}`);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @return {Promise<string>}
 */
function runProcessToString(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', reject);

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`${command} failed with code ${code}\n${stderr}`));
            }
        });
    });
}

/**
 * @param {string[]} args
 * @return {Promise<Buffer>}
 */
function runFfmpegToBuffer(args) {
    return new Promise((resolve, reject) => {
        const child = spawn('ffmpeg', args);

        const chunks = [];
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            chunks.push(chunk);
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', reject);

        child.on('close', (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(`ffmpeg failed with code ${code}\n${stderr}`));
            }
        });
    });
}
