import { DocumentEntity } from '../entities/document.entity';

export const DOCUMENT_CONSTANTS = {
  ZOD: {
    INVALID_INPUT: 'Invalid Input',
    INVALID_DOCUMENT_ID: 'Invalid Document ID',
    EXCEED_LIMIT: 'Exceed Input Limit',
  },
};

export const documentEntityKeys: Array<keyof DocumentEntity> = [
  'id',
  'title',
  'description',
  'fileName',
  'isActive',
  'isDeleted',
  'size',
  'mimeType',
  'userId',
  'createdAt',
  'updatedAt',
];
