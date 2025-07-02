export const DOCUMENT_SWAGGER_SCHEMA = {
  GET_ALL_DOCUMENTS: {
    summary: 'Get all documents',
    description:
      'Returns a paginated list of documents. Supports filters like title, mimeType, deletion status, and allows selecting specific fields. Accessible to authenticated users only.',
    tags: ['Document'],
    auth: true,

    query: {
      properties: {
        page: {
          type: 'string',
          example: '1',
          description: 'Page number (defaults to 1)',
        },
        limit: {
          type: 'string',
          example: '10',
          description: 'Number of documents per page (max 100, default 20)',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          example: 'desc',
          description: 'Sorting order (defaults to desc)',
        },
        select: {
          type: 'string',
          example: 'title,mimeType,size',
          description:
            'Comma-separated fields to return. Must be from: id, title, description, fileName, mimeType, size, userId, version, createdAt, deletedAt, updatedAt',
        },
        title: {
          type: 'string',
          example: 'Project Charter',
          description: 'Filter documents by title',
        },
        mimeType: {
          type: 'string',
          example: 'application/pdf',
          description: 'Filter by document MIME type',
        },
        isDeleted: {
          type: 'string',
          example: 'false',
          description:
            'Filter by deletion status (true/false as string, e.g. isDeleted=false)',
        },
      },
      required: ['page', 'limit', 'sortOrder', 'select'],
    },

    responses: [
      {
        status: 200,
        description: 'List of documents fetched successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                        example: '00000000-0000-0000-0000-000000000001',
                      },
                      title: {
                        type: 'string',
                        example: 'Sample Report',
                      },
                      description: {
                        type: 'string',
                        example: 'This is a sample document description.',
                      },
                      fileName: {
                        type: 'string',
                        example: 'document-sample.docx',
                      },
                      mimeType: {
                        type: 'string',
                        example:
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      },
                      size: {
                        type: 'number',
                        example: 20480,
                      },
                    },
                  },
                },
                totalCount: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 1 },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized - Invalid or expired token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
          },
        },
      },
    ],
  },

  UPLOAD_FILE: {
    summary: 'Upload a new document',
    description:
      'Allows users with `ADMIN` or `EDITOR` roles to upload a document. The file must be under 3MB.',
    tags: ['Document'],
    auth: true,
    roles: ['ADMIN', 'EDITOR'],
    fileUpload: { fieldName: 'document', required: true },

    body: {
      type: 'object',
      required: ['title'],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (max 3MB)',
        },
        title: {
          type: 'string',
          example: 'Project Plan',
          description: 'Title of the document',
        },
        description: {
          type: 'string',
          example: 'Detailed project plan document',
          description: 'Optional description of the document',
        },
      },
    },

    responses: [
      {
        status: 201,
        description: 'Document uploaded successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a19b8dca-6a53-4a84-a974-84992a4f32d0',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden - User lacks permission',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'You do not have permission' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
      {
        status: 400,
        description: 'Bad Request - File missing or invalid',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'File is required' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      },
    ],
  },

  UPDATE_FILE: {
    summary: 'Update a document by ID',
    description:
      'Allows **ADMIN** and **EDITOR** roles to update a document’s title, description, or file.\n\n' +
      '🔒 Only the document owner or an admin can perform this action.\n\n' +
      '📎 File size limit: 3MB.\n\n' +
      '⚠️ At least one of `title`, `description`, or `document` must be provided.',
    tags: ['Document'],
    auth: true,
    roles: ['editor', 'admin'],

    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Document ID to update',
        },
      },
      required: ['id'],
    },

    multipartBody: {
      required: [],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (optional, max 3MB)',
        },
        title: {
          type: 'string',
          description: 'Optional new title',
          example: 'Updated Project Title',
        },
        description: {
          type: 'string',
          description: 'Optional new description',
          example: 'Updated description',
        },
      },
      // Swagger UI hint: at least one of these should be provided (validation enforced in your service)
      anyOf: [
        { required: ['title'] },
        { required: ['description'] },
        { required: ['document'] },
      ],
    },

    responses: [
      {
        status: 200,
        description: 'Document updated successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Document Updated Successfully',
                },
              },
            },
            message: { type: 'string', example: 'Request successful' },
          },
        },
      },
      {
        status: 400,
        description: 'Bad Request – Validation failed or invalid file',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden – No access to this document',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have access to this document',
            },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
      {
        status: 404,
        description: 'Not Found – Document not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: { type: 'string', example: 'Document not found' },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
    ],
  },

  DOWNLOAD_DOCUMENT: {
    summary: 'Download a document by ID',
    description:
      'Allows authenticated users to download a document by its ID.\n\n' +
      '📁 The file will be returned as a direct download stream with correct content headers.\n\n' +
      '🔒 Requires valid JWT token.',
    tags: ['Document'],
    auth: true,

    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the document to download',
        },
      },
      required: ['id'],
    },

    responses: [
      {
        status: 200,
        description:
          'Document downloaded successfully. File will be streamed as an attachment.',
        headers: {
          'Content-Type': {
            description: 'MIME type of the file (e.g., application/pdf)',
            schema: { type: 'string' },
          },
          'Content-Disposition': {
            description:
              'Indicates file is an attachment and suggests filename',
            schema: { type: 'string' },
          },
        },
      },
      {
        status: 404,
        description: 'Not Found – Document with the given ID does not exist',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example:
                    'Document with id 3e1dc38b-d61b-4f86-926e-aba9ea09aa4a not found',
                },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 },
              },
            },
            path: { type: 'string', example: '/document/{id}/download' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized – Missing or invalid JWT token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    ],
  },
  GET_DOCUMENT_BY_ID: {
    summary: 'Get document metadata by ID',
    description:
      'Fetches metadata of a document using its unique ID.\n\n' +
      '🔐 Requires a valid JWT token.\n\n' +
      'Includes file info such as title, description, size, MIME type, and timestamps.',

    tags: ['Document'],
    auth: true,

    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier of the document',
          example: '{{documentId}}',
        },
      },
      required: ['id'],
    },

    responses: [
      {
        status: 200,
        description: 'Document metadata retrieved successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  example: 'Sample Document Title',
                },
                description: {
                  type: 'string',
                  example: 'A short summary of the document content',
                },
                fileName: {
                  type: 'string',
                  example: 'sample-document.pdf',
                },
                mimeType: {
                  type: 'string',
                  example: 'application/pdf',
                },
                size: {
                  type: 'number',
                  example: 123456,
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-01T00:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-01-02T00:00:00.000Z',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 404,
        description: 'Document not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Document with ID {{documentId}} not found',
                },
                error: { type: 'string', example: 'Not Found' },
                statusCode: { type: 'number', example: 404 },
              },
            },
            path: {
              type: 'string',
              example: '/document/{{documentId}}',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:00:00.000Z',
            },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized - JWT is missing or invalid',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Invalid or expired token',
                },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 },
              },
            },
            path: {
              type: 'string',
              example: '/document/{{documentId}}',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:00:00.000Z',
            },
          },
        },
      },
    ],
  },
  DELETE_DOCUMENT: {
    summary: 'Delete a document by ID',
    description:
      'Allows **ADMIN** and **EDITOR** roles to delete a document.\n\n' +
      '🔒 Only the document owner or an admin can delete the document.\n\n' +
      'This action performs a soft delete (marks the document as deleted).',
    tags: ['Document'],
    auth: true,
    roles: ['admin', 'editor'],

    params: {
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the document to delete',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Placeholder style
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'Document deleted successfully',
        type: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Document <document-id> deleted successfully',
                },
              },
            },
            message: {
              type: 'string',
              example: 'Request successful',
            },
          },
        },
      },
      {
        status: 404,
        description: 'Document not found',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example: 'Document not found',
            },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
    ],
  },
};
