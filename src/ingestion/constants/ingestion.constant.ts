import { IngestionEntity } from '../entities/ingestion.entity';

export const ingestionEntityKeys: Array<keyof IngestionEntity> = [
  'id',
  'status',
  'logs',
  'errorMessage',
  'documentId',
  'userId',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

export const INGESTION_CONSTANTS = {
  ZOD: {
    INVALID_INPUT: 'Invalid input provided.',
    INVALID_STATUS: 'One or more statuses are invalid.',
    INVALID_DATE:
      'Date must be in ISO format (YYYY-MM-DD or full ISO datetime).',
    INVALID_INGESTION_ID: 'Ingestion ID must be a valid UUID.',
    INVALID_DOCUMENT_ID: 'Document ID must be a valid UUID.',
    INVALID_USER_ID: 'User ID must be a valid UUID.',
  },

  REQUEST: {
    VALIDATION_MESSAGES: {
      PAGE_INVALID: 'Page must be a number between 1 and MAX_SAFE_INTEGER.',
      LIMIT_INVALID: 'Limit must be a number between 1 and 100.',
      SORT_ORDER_INVALID: 'Sort order must be either ASC or DESC.',
    },
  },
};
