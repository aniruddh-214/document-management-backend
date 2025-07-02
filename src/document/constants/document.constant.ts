import { DocumentEntity } from '../entities/document.entity';

export const DOCUMENT_CONSTANTS = {
  ZOD: {
    INVALID_INPUT: 'Invalid Input',
    INVALID_USER_ID: 'Invalid User ID',
    INVALID_DOCUMENT_ID: 'Invalid Document ID',
    EXCEED_LIMIT: 'Exceed Input Limit',
  },
};

export const documentEntityKeys: Array<keyof DocumentEntity> = [
  'id',
  'title',
  'description',
  'fileName',
  'size',
  'mimeType',
  'userId',
  'version',
  'createdAt',
  'deletedAt',
  'updatedAt',
];
