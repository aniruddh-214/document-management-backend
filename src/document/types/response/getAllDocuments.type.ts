import { DocumentEntity } from '../../entities/document.entity';

export type GetAllDocumentsResponseType = {
  data: DocumentEntity[];
  totalCount: number;
  totalPages: number;
};
