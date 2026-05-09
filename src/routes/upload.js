'use strict';

/**
 * Upload route
 *
 * POST /api/upload
 *   Accepts a single multipart file field named "file".
 *   Returns: { url, type, name, size }
 *
 * Limits:
 *   Images (jpeg/png/gif/webp): 8 MB
 *   Videos (mp4/webm/ogg):     64 MB
 *
 * Files are stored at public/uploads/<uuid>.<ext> and served statically.
 */

const path    = require('path');
const fs      = require('fs');
const express = require('express');
const multer  = require('multer');
const crypto  = require('crypto');
const logger  = require('../utils/logger');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed MIME types → extension
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/gif':  'gif',
  'image/webp': 'webp',
  'video/mp4':  'mp4',
  'video/webm': 'webm',
  'video/ogg':  'ogv',
};

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg']);

const MAX_IMAGE = 8  * 1024 * 1024;  //  8 MB
const MAX_VIDEO = 64 * 1024 * 1024;  // 64 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || 'bin';
    cb(null, `${crypto.randomUUID()}.${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
  }
};

// Use the larger video limit; we'll enforce per-type below
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO, files: 1 },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { mimetype, size, filename, originalname } = req.file;

  // Enforce per-type size cap
  if (IMAGE_TYPES.has(mimetype) && size > MAX_IMAGE) {
    fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
    return res.status(413).json({ error: 'Image must be ≤ 8 MB' });
  }

  const kind = IMAGE_TYPES.has(mimetype) ? 'image' : 'video';

  return res.status(201).json({
    url:  `/uploads/${filename}`,
    type: mimetype,
    kind,
    name: originalname.substring(0, 200),
    size,
  });
});

// Error handler for multer errors
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 64 MB for video, 8 MB for images)' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(415).json({ error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, OGG' });
    }
    return res.status(400).json({ error: err.message });
  }
  logger.error(`upload error: ${err.message}`);
  return res.status(500).json({ error: 'Upload failed' });
});

module.exports = router;
