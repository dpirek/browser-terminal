const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');
const COMMAND_TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const normalizedPath = path.normalize(decodeURIComponent(requestPath)).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Internal server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleConsoleRequest(req, res) {
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk;
    if (rawBody.length > 1024 * 1024) {
      req.destroy();
    }
  });

  req.on('end', () => {
    let body;

    try {
      body = JSON.parse(rawBody || '{}');
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid JSON body.' });
      return;
    }

    const command = typeof body.command === 'string' ? body.command.trim() : '';
    if (!command) {
      sendJson(res, 400, { error: 'Command is required.' });
      return;
    }

    const child = spawn(command, { shell: true });
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let timedOut = false;
    let responseSent = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 200);
    }, COMMAND_TIMEOUT_MS);

    function appendChunk(target, chunk) {
      if (outputBytes >= MAX_OUTPUT_BYTES) {
        return target;
      }

      const text = chunk.toString();
      const nextBytes = Buffer.byteLength(text);
      outputBytes += nextBytes;

      if (outputBytes > MAX_OUTPUT_BYTES) {
        const allowed = nextBytes - (outputBytes - MAX_OUTPUT_BYTES);
        return `${target}${text.slice(0, Math.max(0, allowed))}`;
      }

      return `${target}${text}`;
    }

    function sendResponse(code, signal) {
      if (responseSent) {
        return;
      }

      responseSent = true;
      clearTimeout(timer);

      let output = `${stdout}${stderr}`;
      if (timedOut) {
        output += `\n[Process stopped after ${COMMAND_TIMEOUT_MS / 1000}s timeout]`;
      } else if (code !== 0) {
        output += `\n[Process exited with code ${code}${signal ? `, signal ${signal}` : ''}]`;
      }

      sendJson(res, 200, { output });
    }

    child.stdout.on('data', (chunk) => {
      stdout = appendChunk(stdout, chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr = appendChunk(stderr, chunk);
    });

    child.on('error', (error) => {
      if (responseSent) {
        return;
      }
      responseSent = true;
      clearTimeout(timer);
      sendJson(res, 200, { output: `Failed to run command: ${error.message}` });
    });

    child.on('close', (code, signal) => {
      sendResponse(code, signal);
    });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/api/console') {
    if (req.method === 'POST') {
      handleConsoleRequest(req, res);
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed. Use POST /api/console.' });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
