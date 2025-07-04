// src/document/configs/multer.config.spec.ts
import * as fs from 'fs';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { fileFilter, multerDestination, multerFilename } from './multer.config';

jest.mock('fs');

describe('multerStorage', () => {
  const mockReq = { user: { sub: 'user123' } } as any;
  const mockFile = { originalname: 'test.pdf' } as Express.Multer.File;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('destination', () => {
    it('should create upload folder and call cb with path', (done) => {
      (fs.mkdir as unknown as jest.Mock).mockImplementation(
        (uploadPath, opts, cb) => cb(null),
      );

      const cb = jest.fn((err, folderPath) => {
        expect(err).toBeNull();

        // Fix for Windows: normalize slashes
        const normalized = folderPath.replace(/\\/g, '/');
        expect(normalized).toContain('uploads/user123');

        done();
      });

      multerDestination(mockReq, mockFile, cb);
    });

    it('should return error if mkdir fails', (done) => {
      const error = new Error('mkdir failed');
      (fs.mkdir as unknown as jest.Mock).mockImplementation(
        (path, options, cb) => cb(error),
      );

      const cb = jest.fn((err, path) => {
        expect(err).toBe(error);
        expect(path).toBe('');
        done();
      });

      multerDestination(mockReq, mockFile, cb);
    });
  });

  describe('filename', () => {
    it('should generate filename with timestamp and extension', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const cb = jest.fn();
      multerFilename(mockReq, mockFile, cb);

      const ext = extname(mockFile.originalname);
      expect(cb).toHaveBeenCalledWith(null, `${now}${ext}`);
    });
  });
});

describe('fileFilter', () => {
  const pdfFile = { mimetype: 'application/pdf' } as Express.Multer.File;
  const docxFile = {
    mimetype:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  } as Express.Multer.File;
  const invalidFile = { mimetype: 'image/png' } as Express.Multer.File;

  it('should accept PDF', () => {
    const cb = jest.fn();
    fileFilter({} as any, pdfFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should accept DOCX', () => {
    const cb = jest.fn();
    fileFilter({} as any, docxFile, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('should reject unsupported files', () => {
    const cb = jest.fn();
    fileFilter({} as any, invalidFile, cb);

    const [err, accepted] = cb.mock.calls[0];
    expect(err).toBeInstanceOf(BadRequestException);
    expect(accepted).toBe(false);
  });
});
