/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as fs from 'fs';
import { extname, join } from 'path';

import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { diskStorage } from 'multer';

export const multerDestination = (req, file, cb): void => {
  const userId = req.user.sub;
  const uploadPath = join(process.cwd(), 'uploads', userId);

  fs.mkdir(uploadPath, { recursive: true }, (err) => {
    if (err) {
      return cb(err, '');
    }
    cb(null, uploadPath);
  });
};

export const multerFilename = (req, file, cb): void => {
  const ext = extname(file.originalname).toLowerCase();
  cb(null, `${Date.now()}${ext}`);
};

export const multerStorage = diskStorage({
  destination: multerDestination,
  filename: multerFilename,
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
