import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { storagePut } from './storage';

// Configuration multer pour gérer l'upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB max
  },
  fileFilter: (req, file, cb: FileFilterCallback) => {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadPhotoHandler = upload.single('file');

export async function handlePhotoUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileKey = `photos/terrain/${timestamp}-${randomSuffix}.jpg`;

    // Upload vers S3
    const { url } = await storagePut(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url, fileKey });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
