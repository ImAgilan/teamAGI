/**
 * Cloudinary Configuration — TeamAGI
 *
 * FIX: If Cloudinary credentials are placeholder values or missing,
 * the old code crashed with "Unknown API key your_api_key_here" → 500 error.
 *
 * Now:
 *  - Checks credentials at startup
 *  - If NOT configured → uses multer memoryStorage (files stay in RAM)
 *    and posts without images still work perfectly
 *  - If configured     → uses CloudinaryStorage as normal
 *  - Logs a clear warning so the developer knows what to do
 */
const multer = require('multer');

// ── Detect if Cloudinary is properly configured ───────────────
const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME  || '';
const API_KEY     = process.env.CLOUDINARY_API_KEY     || '';
const API_SECRET  = process.env.CLOUDINARY_API_SECRET  || '';

const PLACEHOLDER_VALUES = [
  'your_cloud_name_here',
  'your_api_key_here',
  'your_api_secret_here',
  'your_cloudinary_cloud_name',
  'your_cloudinary_api_key',
  'your_cloudinary_api_secret',
  '',
];

const isCloudinaryConfigured =
  !PLACEHOLDER_VALUES.includes(CLOUD_NAME) &&
  !PLACEHOLDER_VALUES.includes(API_KEY) &&
  !PLACEHOLDER_VALUES.includes(API_SECRET);

// ── Setup based on whether Cloudinary is configured ───────────
let cloudinary = null;
let uploadAvatar, uploadCover, uploadPost;

if (isCloudinaryConfigured) {
  // ── Real Cloudinary storage ────────────────────────────────
  const cloudinaryLib = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinaryLib.config({
    cloud_name: CLOUD_NAME,
    api_key:    API_KEY,
    api_secret: API_SECRET,
  });

  cloudinary = cloudinaryLib;
  console.log('✅ Cloudinary configured — images will upload to cloud');

  const createStorage = (folder, resourceType = 'auto') =>
    new CloudinaryStorage({
      cloudinary: cloudinaryLib,
      params: {
        folder:           `teamagi/${folder}`,
        resource_type:    resourceType,
        allowed_formats:  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
        transformation:   folder === 'avatars'
          ? [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
          : [{ quality: 'auto', fetch_format: 'auto' }],
      },
    });

  uploadAvatar = multer({
    storage: createStorage('avatars', 'image'),
    limits:  { fileSize: 5  * 1024 * 1024 },  // 5 MB
    fileFilter: imageOnlyFilter,
  });

  uploadCover = multer({
    storage: createStorage('covers', 'image'),
    limits:  { fileSize: 10 * 1024 * 1024 },  // 10 MB
    fileFilter: imageOnlyFilter,
  });

  uploadPost = multer({
    storage: createStorage('posts', 'auto'),
    limits:  { fileSize: 50 * 1024 * 1024 },  // 50 MB
  });

} else {
  // ── Fallback: memory storage (no Cloudinary) ───────────────
  console.warn('\n⚠️  CLOUDINARY NOT CONFIGURED — using memory storage fallback');
  console.warn('   Image uploads will return a placeholder URL.');
  console.warn('   To enable real uploads, add your Cloudinary credentials to .env\n');

  // Store files in memory — we convert to data URL in the controller
  const memStorage = multer.memoryStorage();

  uploadAvatar = multer({ storage: memStorage, limits: { fileSize: 5  * 1024 * 1024 }, fileFilter: imageOnlyFilter });
  uploadCover  = multer({ storage: memStorage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageOnlyFilter });
  uploadPost   = multer({ storage: memStorage, limits: { fileSize: 10 * 1024 * 1024 } });
}

// ── File filter: images only ───────────────────────────────────
function imageOnlyFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only jpg, png, gif, webp allowed.`), false);
  }
}

// ── Delete file from Cloudinary ────────────────────────────────
const deleteFile = async (publicId) => {
  if (!publicId || !cloudinary) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// ── Helper: extract URL from uploaded file ─────────────────────
// Works for both Cloudinary storage (file.path) and memory storage (base64)
const getFileUrl = (file) => {
  if (!file) return null;

  // Cloudinary storage sets file.path to the secure_url
  if (file.path && file.path.startsWith('http')) {
    return { url: file.path, publicId: file.filename || '' };
  }

  // Memory storage: convert buffer to base64 data URL
  if (file.buffer) {
    const b64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${b64}`;
    return { url: dataUrl, publicId: '' };
  }

  return null;
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadCover,
  uploadPost,
  deleteFile,
  getFileUrl,
  isCloudinaryConfigured,
};
