import { z } from 'zod';

import { DatabaseSortingOrder } from '../../../common/enums/dbOrderSort.enum';
import ZodHelper from '../../../common/helpers/zod.helper';
import { USER_CONSTANTS } from '../../../user/constants/user.constant';
import {
  DOCUMENT_CONSTANTS,
  documentEntityKeys,
} from '../../constants/document.constant';
import { DocumentEntity } from '../../entities/document.entity';

const { INVALID_INPUT } = DOCUMENT_CONSTANTS.ZOD;

export const DocumentSchema = z.object({
  uploadDocument: z.object({
    body: z.object({
      title: z.string().min(1, { message: INVALID_INPUT }),
      description: z.string().min(1, { message: INVALID_INPUT }).optional(),
    }),
  }),
  updateDocument: z.object({
    param: z.object({
      id: z
        .string()
        .uuid({ message: DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID }),
    }),
    body: z.object({
      title: z.string().min(1, { message: INVALID_INPUT }).optional(),
      description: z.string().min(1, { message: INVALID_INPUT }).optional(),
    }),
  }),

  downloadDocument: z.object({
    param: z.object({
      id: z
        .string()
        .uuid({ message: DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID }),
    }),
  }),

  getDocument: z.object({
    param: z.object({
      id: z
        .string()
        .uuid({ message: DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID }),
    }),
  }),

  deleteDocument: z.object({
    param: z.object({
      id: z
        .string()
        .uuid({ message: DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID }),
    }),
  }),

  getAllDocuments: z.object({
    query: z.object({
      title: z
        .string()
        .trim()
        .min(1, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .max(255, { message: DOCUMENT_CONSTANTS.ZOD.EXCEED_LIMIT })
        .optional(),

      mimeType: z
        .string()
        .trim()
        .min(1, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .max(150, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .optional(),

      isActive: z
        .string()
        .min(1, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .transform((data): boolean | undefined =>
          ZodHelper.convertStringToBoolean(data),
        )
        .optional(),

      isDeleted: z
        .string()
        .min(1, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .transform((data): boolean | undefined =>
          ZodHelper.convertStringToBoolean(data),
        )
        .optional(),

      page: z
        .string()
        .min(1, { message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT })
        .optional()
        .transform((val) => Number(val || 1))
        .refine(
          (val) =>
            typeof val === 'number' &&
            val >= 1 &&
            val <= Number.MAX_SAFE_INTEGER,
          {
            message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.PAGE_INVALID,
          },
        ),
      limit: z
        .string()
        .min(1, {
          message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.INVALID_INPUT,
        })
        .optional()
        .transform((val) => Number(val || 20))
        .refine((val) => val >= 1 && val <= 100, {
          message: USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.LIMIT_INVALID,
        }),

      sortOrder: z
        .nativeEnum(DatabaseSortingOrder, {
          errorMap: () => ({
            message:
              USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.SORT_ORDER_INVALID,
          }),
        })
        .optional()
        .default(DatabaseSortingOrder.DESC),

      select: z
        .string()
        .optional()
        .transform((val) =>
          val ? val.split(',').map((v) => v.trim()) : undefined,
        )
        .refine(
          (fields): fields is Array<keyof DocumentEntity> =>
            !fields ||
            fields.every((f) =>
              documentEntityKeys.includes(f as keyof DocumentEntity),
            ),
          {
            message: DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT,
          },
        ),
    }),
  }),
});

export type UploadDocumentRequestBodyType = z.infer<
  typeof DocumentSchema.shape.uploadDocument.shape.body
>;

export type UpdateDocumentRequestParamType = z.infer<
  typeof DocumentSchema.shape.updateDocument.shape.param
>;

export type UpdateDocumentRequestBodyType = z.infer<
  typeof DocumentSchema.shape.updateDocument.shape.body
>;

export type DownloadDocumentRequestParamType = z.infer<
  typeof DocumentSchema.shape.downloadDocument.shape.param
>;

export type GetDocumentRequestParamType = z.infer<
  typeof DocumentSchema.shape.downloadDocument.shape.param
>;

export type DeleteDocumentRequestParamType = z.infer<
  typeof DocumentSchema.shape.downloadDocument.shape.param
>;

export type GetAllDocumentsRequestQueryType = z.infer<
  typeof DocumentSchema.shape.getAllDocuments.shape.query
>;
