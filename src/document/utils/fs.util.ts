import * as fs from 'fs';
import path from 'path';

export default class FSUtils {
  public static AbsoluteToRelativePath(absolutePath: string): string {
    return absolutePath.replace(process.cwd() + path.sep, '');
  }

  public static deleteFile(relativePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fullPath = path.join(process.cwd(), relativePath);
      fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          return reject(err);
        }
        resolve();
      });
    });
  }
}
