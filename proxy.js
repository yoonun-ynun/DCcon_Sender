import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 17384;
const HOST = 'localhost';

const UPSTREAM = new URL('https://yoonun.com');
const LOCAL_ORIGIN = `https://${HOST}:${PORT}`;

const KEY_PATH = path.join(__dirname, 'localhost-key.pem');
const CERT_PATH = path.join(__dirname, 'localhost.pem');

/**
 * mkcert 실행 파일을 찾는다.
 */
function findMkcert() {
    const candidates = [path.join(__dirname, 'mkcert.exe'), path.join(__dirname, 'mkcert')];

    const mkcertPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!mkcertPath) {
        throw new Error(
            [
                'mkcert 실행 파일을 찾을 수 없습니다.',
                'proxy.mjs와 같은 폴더에 mkcert.exe를 넣어주세요.',
            ].join('\n'),
        );
    }

    return mkcertPath;
}

/**
 * 인증서가 없으면 mkcert로 자동 생성한다.
 */
function createCertificateIfNeeded() {
    const hasKey = fs.existsSync(KEY_PATH);
    const hasCert = fs.existsSync(CERT_PATH);

    if (hasKey && hasCert) {
        console.log('기존 localhost 인증서를 사용합니다.');
        return;
    }

    const mkcertPath = findMkcert();

    console.log('Windows 시스템 인증서 저장소에 로컬 CA를 설치합니다.');

    execFileSync(mkcertPath, ['-install'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: {
            ...process.env,

            // Java cacerts에는 설치하지 않는다.
            TRUST_STORES: 'system',
        },
    });

    console.log('localhost 인증서를 생성합니다.');

    execFileSync(
        mkcertPath,
        ['-key-file', KEY_PATH, '-cert-file', CERT_PATH, 'localhost', '127.0.0.1', '::1'],
        {
            cwd: __dirname,
            stdio: 'inherit',
            env: {
                ...process.env,
                TRUST_STORES: 'system',
            },
        },
    );

    if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
        throw new Error('localhost 인증서 생성에 실패했습니다.');
    }
}

/**
 * yoonun.com 주소를 localhost 프록시 주소로 변환한다.
 */
function rewriteContent(value) {
    if (typeof value !== 'string') {
        return value;
    }

    const escapedLocalOrigin = LOCAL_ORIGIN.replaceAll('/', '\\/');

    return (
        value
            // 일반 HTTPS 주소
            .replaceAll('https://yoonun.com', LOCAL_ORIGIN)

            // HTTP 주소
            .replaceAll('http://yoonun.com', LOCAL_ORIGIN)

            // 프로토콜 상대 주소
            .replaceAll('//yoonun.com', `//${HOST}:${PORT}`)

            // JSON/JavaScript 안의 이스케이프된 주소
            .replaceAll('https:\\/\\/yoonun.com', escapedLocalOrigin)
            .replaceAll('http:\\/\\/yoonun.com', escapedLocalOrigin)

            // URL 인코딩된 주소
            .replaceAll('https%3A%2F%2Fyoonun.com', encodeURIComponent(LOCAL_ORIGIN))
            .replaceAll('https%3a%2f%2fyoonun.com', encodeURIComponent(LOCAL_ORIGIN))
    );
}

/**
 * Location 헤더의 리다이렉트 주소를 localhost로 변환한다.
 */
function rewriteLocation(location) {
    if (typeof location !== 'string') {
        return location;
    }

    try {
        const redirectUrl = new URL(location, UPSTREAM);

        if (redirectUrl.hostname !== UPSTREAM.hostname) {
            return location;
        }

        return LOCAL_ORIGIN + redirectUrl.pathname + redirectUrl.search + redirectUrl.hash;
    } catch {
        return rewriteContent(location);
    }
}

/**
 * 응답 본문을 압축 해제한다.
 */
function decompressBody(buffer, encoding) {
    switch (encoding?.toLowerCase()) {
        case 'gzip':
            return zlib.gunzipSync(buffer);

        case 'deflate':
            return zlib.inflateSync(buffer);

        case 'br':
            return zlib.brotliDecompressSync(buffer);

        default:
            return buffer;
    }
}

/**
 * 문자열 치환이 가능한 응답인지 판단한다.
 */
function isTextResponse(contentType) {
    const type = String(contentType ?? '').toLowerCase();

    return (
        type.startsWith('text/') ||
        type.includes('javascript') ||
        type.includes('json') ||
        type.includes('xml') ||
        type.includes('svg') ||
        type.includes('manifest')
    );
}

/**
 * 요청 헤더를 yoonun.com 기준으로 변환한다.
 */
function createUpstreamHeaders(req) {
    const headers = {
        ...req.headers,

        host: UPSTREAM.host,

        // 응답 본문 치환을 쉽게 하기 위해 압축을 요청하지 않는다.
        'accept-encoding': 'identity',

        'x-forwarded-host': req.headers.host ?? '',
        'x-forwarded-proto': 'https',
        'x-forwarded-for': req.socket.remoteAddress ?? '',
    };

    if (headers.origin) {
        headers.origin = UPSTREAM.origin;
    }

    if (typeof headers.referer === 'string') {
        headers.referer = headers.referer.replace(LOCAL_ORIGIN, UPSTREAM.origin);
    }

    delete headers.connection;
    delete headers['proxy-connection'];
    delete headers.upgrade;
    delete headers['sec-websocket-key'];
    delete headers['sec-websocket-version'];
    delete headers['sec-websocket-extensions'];

    return headers;
}

/**
 * 응답 헤더를 localhost 기준으로 변환한다.
 */
function createClientHeaders(req, proxyResponse) {
    const headers = {
        ...proxyResponse.headers,
    };

    // iframe 표시를 막는 보안 헤더 제거
    delete headers['content-security-policy'];
    delete headers['content-security-policy-report-only'];
    delete headers['x-frame-options'];

    // 본문을 다시 작성하므로 제거
    delete headers['content-length'];
    delete headers['transfer-encoding'];
    delete headers['content-encoding'];
    delete headers.connection;

    const requestOrigin = req.headers.origin;

    if (requestOrigin) {
        headers['access-control-allow-origin'] = requestOrigin;
        headers.vary = headers.vary ? `${headers.vary}, Origin` : 'Origin';
    } else {
        headers['access-control-allow-origin'] = '*';
    }

    headers['access-control-allow-credentials'] = 'true';

    if (typeof headers.location === 'string') {
        headers.location = rewriteLocation(headers.location);
    }

    if (typeof headers.refresh === 'string') {
        headers.refresh = rewriteContent(headers.refresh);
    }

    if (typeof headers['content-location'] === 'string') {
        headers['content-location'] = rewriteContent(headers['content-location']);
    }

    const setCookie = headers['set-cookie'];

    if (Array.isArray(setCookie)) {
        headers['set-cookie'] = setCookie.map((cookie) =>
            cookie
                // localhost에서는 Domain=yoonun.com 쿠키를 저장할 수 없다.
                .replace(/;\s*Domain=(?:\.?yoonun\.com)/gi, ''),
        );
    }

    return headers;
}

createCertificateIfNeeded();

const server = https.createServer(
    {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
    },

    (req, res) => {
        /*
         * CORS 사전 요청 처리
         */
        if (req.method === 'OPTIONS') {
            const requestOrigin = req.headers.origin ?? '*';

            res.writeHead(204, {
                'Access-Control-Allow-Origin': requestOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
                'Access-Control-Allow-Headers':
                    req.headers['access-control-request-headers'] ?? '*',
                'Access-Control-Max-Age': '86400',
            });

            res.end();
            return;
        }

        let targetUrl;

        try {
            targetUrl = new URL(req.url ?? '/', UPSTREAM);
        } catch {
            res.writeHead(400, {
                'Content-Type': 'application/json; charset=utf-8',
            });

            res.end(
                JSON.stringify({
                    error: '잘못된 요청 주소입니다.',
                }),
            );

            return;
        }

        const proxyRequest = https.request(
            {
                protocol: UPSTREAM.protocol,
                hostname: UPSTREAM.hostname,
                port: UPSTREAM.port || 443,

                path: targetUrl.pathname + targetUrl.search,

                method: req.method,
                headers: createUpstreamHeaders(req),
            },

            (proxyResponse) => {
                const responseHeaders = createClientHeaders(req, proxyResponse);

                const contentType = proxyResponse.headers['content-type'];

                /*
                 * 이미지, 영상, 폰트 등의 바이너리 파일은
                 * 본문을 수정하지 않고 그대로 전달한다.
                 */
                if (!isTextResponse(contentType)) {
                    res.writeHead(proxyResponse.statusCode ?? 502, responseHeaders);

                    proxyResponse.pipe(res);
                    return;
                }

                const chunks = [];

                proxyResponse.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                proxyResponse.on('end', () => {
                    try {
                        const compressedBody = Buffer.concat(chunks);

                        const encoding = proxyResponse.headers['content-encoding'];

                        const decodedBody = decompressBody(compressedBody, encoding);

                        const originalText = decodedBody.toString('utf8');

                        const rewrittenText = rewriteContent(originalText);

                        const rewrittenBody = Buffer.from(rewrittenText, 'utf8');

                        responseHeaders['content-length'] = String(rewrittenBody.length);

                        res.writeHead(proxyResponse.statusCode ?? 502, responseHeaders);

                        res.end(rewrittenBody);
                    } catch (error) {
                        console.error('응답 본문 변환 실패:', error);

                        if (!res.headersSent) {
                            res.writeHead(502, {
                                'Content-Type': 'application/json; charset=utf-8',
                            });
                        }

                        res.end(
                            JSON.stringify({
                                error: '응답 본문 변환에 실패했습니다.',
                                message: error instanceof Error ? error.message : String(error),
                            }),
                        );
                    }
                });

                proxyResponse.on('error', (error) => {
                    console.error('상위 서버 응답 오류:', error);

                    if (!res.destroyed) {
                        res.destroy(error);
                    }
                });
            },
        );

        proxyRequest.on('error', (error) => {
            console.error('프록시 요청 실패:', error);

            if (!res.headersSent) {
                res.writeHead(502, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': req.headers.origin ?? '*',
                });
            }

            res.end(
                JSON.stringify({
                    error: 'Bad Gateway',
                    message: error.message,
                }),
            );
        });

        // POST, PUT 등의 요청 본문을 그대로 전달
        req.pipe(proxyRequest);
    },
);

server.on('clientError', (error, socket) => {
    console.error('클라이언트 연결 오류:', error.message);

    if (socket.writable) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});

server.listen(PORT, HOST, () => {
    console.log('');
    console.log('====================================');
    console.log(`프록시 주소: ${LOCAL_ORIGIN}`);
    console.log(`대상 주소:   ${UPSTREAM.origin}`);
    console.log('====================================');
    console.log('');
});

process.on('SIGINT', () => {
    console.log('\n프록시 서버를 종료합니다.');

    server.close(() => {
        process.exit(0);
    });
});
