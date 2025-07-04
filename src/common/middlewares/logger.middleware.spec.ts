import { LoggerMiddleware } from './logger.middleware';
import LoggerService from '../../common/utils/logging/loggerService';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
  });

  it('should attach logger to request and call logEnd on response finish', () => {
    const mockLogEnd = jest.fn();
    // Mock LoggerService constructor and instance method
    jest
      .spyOn(LoggerService.prototype, 'logEnd')
      .mockImplementation(mockLogEnd);

    const req: any = {};
    const res: any = {
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate calling the finish event callback
          setTimeout(callback, 0);
        }
      }),
    };
    const next = jest.fn();

    middleware.use(req, res, next);

    // Logger should be attached to req
    expect(req.logger).toBeInstanceOf(LoggerService);

    // next() should be called immediately
    expect(next).toHaveBeenCalled();

    // wait a tick to allow the 'finish' event callback to run
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(mockLogEnd).toHaveBeenCalledWith({
          action: 'request has been end',
        });
        resolve();
      }, 10);
    });
  });
});
