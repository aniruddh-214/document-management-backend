import * as fs from 'fs';
import { extname, join } from 'path';

import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { diskStorage } from 'multer';

export const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.sub;

    // Build absolute path: projectRoot/uploads/userId
    const uploadPath = join(process.cwd(), 'uploads', userId);

    // Check if folder exists, if not create it
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err, '');
      }
      cb(null, uploadPath);
    });
  },

  filename: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}${ext}`);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only .pdf and .docx files are allowed'), false);
  }
};
