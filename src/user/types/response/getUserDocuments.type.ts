import { DocumentEntity } from '../../../document/entities/document.entity';

export type GetUserDocumentsResponseType = {
  data: DocumentEntity[];
  totalCount: number;
  totalPages: number;
};
