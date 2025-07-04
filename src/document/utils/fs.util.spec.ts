import FSUtils from './fs.util';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

describe('FSUtils', () => {
  describe('AbsoluteToRelativePath', () => {
    it('should convert absolute path to relative path', () => {
      const cwd = process.cwd() + path.sep;
      const absolutePath = cwd + 'some/dir/file.txt';

      const relativePath = FSUtils.AbsoluteToRelativePath(absolutePath);

      expect(relativePath).toBe('some/dir/file.txt');
    });

    it('should return unchanged string if path does not start with cwd', () => {
      const absolutePath = '/other/path/file.txt';

      const relativePath = FSUtils.AbsoluteToRelativePath(absolutePath);

      expect(relativePath).toBe(absolutePath);
    });
  });

  describe('deleteFile', () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(process, 'cwd').mockReturnValue(originalCwd);
    });

    it('should resolve when fs.unlink succeeds', async () => {
      (fs.unlink as unknown as jest.Mock).mockImplementation((path, cb) =>
        cb(null),
      );

      await expect(
        FSUtils.deleteFile('some/file.txt'),
      ).resolves.toBeUndefined();

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(originalCwd, 'some/file.txt'),
        expect.any(Function),
      );
    });

    it('should resolve when fs.unlink returns ENOENT error (file not found)', async () => {
      const enoentError = Object.assign(new Error('Not found'), {
        code: 'ENOENT',
      });

      (fs.unlink as unknown as jest.Mock).mockImplementation((path, cb) =>
        cb(enoentError),
      );

      await expect(
        FSUtils.deleteFile('some/missing-file.txt'),
      ).resolves.toBeUndefined();

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(originalCwd, 'some/missing-file.txt'),
        expect.any(Function),
      );
    });

    it('should reject on other errors from fs.unlink', async () => {
      const otherError = new Error('Other failure');

      (fs.unlink as unknown as jest.Mock).mockImplementation((path, cb) =>
        cb(otherError),
      );

      await expect(FSUtils.deleteFile('some/file.txt')).rejects.toThrow(
        'Other failure',
      );

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join(originalCwd, 'some/file.txt'),
        expect.any(Function),
      );
    });
  });
});
