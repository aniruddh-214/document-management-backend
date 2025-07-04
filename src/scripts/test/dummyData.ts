import { randomUUID } from 'crypto';
import UserRoleEnum from '../../common/enums/role.enum';
import LoggerService from '../../common/utils/logging/loggerService';
import { DocumentEntity } from '../../document/entities/document.entity';
import UserEntity from '../../user/entities/user.entity';

export const MOCK_LOGGER_SERVICE: jest.Mocked<LoggerService> = {
  // Internal or required properties (mocked with dummies)
  _requestId: 'mock-request-id',

  _getLogInfo: jest.fn(),

  // Log methods
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
  logBegin: jest.fn(),
  logEnd: jest.fn(),
} as unknown as jest.Mocked<LoggerService>;

export const TEST_USER: Partial<UserEntity> = {
  fullName: 'Test User',
  email: 'test@mail.com',
  password: 'Test@1234',
  role: UserRoleEnum.VIEWER,
};

export const TEST_DOCUMENT = (
  userId: string = randomUUID(),
): Partial<DocumentEntity> => {
  const file = `${Date.now()}.pdf`;
  return {
    title: 'Test Document',
    description: 'Any Description',
    fileName: file,
    filePath: `uploads/${randomUUID()}/${file}`,
    size: 12505,
    mimeType: `application/pdf`,
    userId: userId,
  };
};
