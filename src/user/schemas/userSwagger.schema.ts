export const USER_SWAGGER_SCHEMA = {
  GET_ALL_USERS: {
    summary: 'Get all users',
    description:
      'Returns a paginated list of users. Accessible only to admin users.\n\n' +
      'Supports filters (name, email, role), pagination, and field selection.',
    tags: ['User'],
    auth: true,

    query: {
      required: [],
      properties: {
        fullName: {
          type: 'string',
          description: 'Filter by user full name',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          description: 'Filter by email address',
          example: 'user@example.com',
        },
        role: {
          type: 'string',
          description:
            'Comma-separated roles to filter users by. Only non-admin roles allowed.',
          example: 'editor,viewer',
        },
        isDeleted: {
          type: 'boolean',
          description: 'Include soft-deleted users',
          example: false,
        },
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Page number for pagination (default: 1)',
          example: 1,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Number of users per page (default: 20)',
          example: 10,
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order for results (default: desc)',
          example: 'desc',
        },
        select: {
          type: 'string',
          description:
            'Comma-separated list of fields to return (e.g., id,email,createdAt)',
          example: 'id,email,role',
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'List of users fetched successfully',
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
                      id: { type: 'string', format: 'uuid' },
                      fullName: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      role: { type: 'string', example: 'editor' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      deletedAt: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true,
                      },
                    },
                  },
                },
                totalCount: { type: 'number', example: 2 },
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
        description: 'Unauthorized – Token missing or invalid',
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
      {
        status: 403,
        description: 'Forbidden – User lacks admin privileges',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have permission',
            },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
    ],
  },
  GET_USER_BY_ID: {
    summary: 'Get User by ID',
    description:
      'Fetch details of a single user by their ID (Admin access only)',
    tags: ['User'],
    auth: true,
    roles: ['admin'],

    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '00000000-0000-0000-0000-000000000000',
          description: 'User ID (UUID format)',
        },
      },
      required: ['id'],
    },

    responses: [
      {
        status: 200,
        description: 'User details successfully fetched',
        type: {
          type: 'object',
          properties: {
            version: { type: 'number', example: 1 },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T00:00:00.000Z',
            },
            deletedAt: { type: 'string', nullable: true, example: null },
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', example: 'viewer' },
          },
        },
      },
      {
        status: 400,
        description: 'Validation failed (e.g. invalid UUID)',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Invalid User ID' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized - Missing or invalid token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Authorization token not found',
            },
          },
        },
      },
      {
        status: 404,
        description: 'User not found by provided ID',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example: 'User not found by provided ID',
            },
          },
        },
      },
    ],
  },

  UPDATE_USER_ROLE: {
    summary: 'Update User Role',
    description:
      'Allows admin to update a user’s role to either editor or viewer.',
    tags: ['User'],
    auth: true,
    roles: ['admin'],

    // URL Param
    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '00000000-0000-0000-0000-000000000000',
          description: 'User ID to update (UUID)',
        },
      },
      required: ['id'],
    },

    // Body
    body: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['editor', 'viewer'],
          example: 'editor',
          description: 'New role to assign to the user',
        },
      },
      required: ['role'],
    },

    // Possible Responses
    responses: [
      {
        status: 200,
        description: 'User role updated successfully',
        type: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'New user role: editor',
            },
          },
        },
      },
      {
        status: 400,
        description: 'Validation failed (e.g., invalid role)',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized - missing or invalid token',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Authorization token not found',
            },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden - insufficient permissions',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have permission',
            },
          },
        },
      },
      {
        status: 404,
        description: 'User not found or admin user cannot be updated',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example: 'User with id ... not found or cannot update admin user',
            },
          },
        },
      },
    ],
  },
  DELETE_USER_BY_ID: {
    summary: 'Delete User by ID',
    description:
      'Allows an admin to delete a user by their unique ID. Admin users cannot be deleted.',
    tags: ['User'],
    auth: true,
    roles: ['admin'],

    // URL Param
    params: {
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '00000000-0000-0000-0000-000000000000',
          description: 'User ID to delete (UUID)',
        },
      },
      required: ['id'],
    },

    // Responses
    responses: [
      {
        status: 200,
        description: 'User deleted successfully',
        type: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example:
                'User with id 00000000-0000-0000-0000-000000000000 has been deleted successfully',
            },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden - insufficient permissions',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'You do not have permission' },
          },
        },
      },
      {
        status: 404,
        description:
          'User not found, already deleted, or cannot delete an admin user',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: {
              type: 'string',
              example:
                'User with ID 00000000-0000-0000-0000-000000000000 not found, already deleted, or is an admin',
            },
          },
        },
      },
    ],
  },
  GET_USER_DOCUMENTS: {
    summary: 'Get all documents for current user',
    description:
      'Fetches a paginated list of documents uploaded by the authenticated user.\n\n' +
      'Supports filtering, field selection, and pagination. Only users with Admin or Editor roles are authorized.',
    tags: ['User'],
    auth: true,

    query: {
      required: [],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'User ID (optional, admin only)',
          example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        title: {
          type: 'string',
          description: 'Filter by document title',
          example: 'Sample Document',
        },
        mimeType: {
          type: 'string',
          description: 'Filter by MIME type (e.g., application/pdf)',
          example: 'application/pdf',
        },
        isDeleted: {
          type: 'boolean',
          description: 'Filter deleted documents',
          example: false,
        },
        page: {
          type: 'integer',
          description: 'Page number for pagination',
          example: 1,
          minimum: 1,
        },
        limit: {
          type: 'integer',
          description: 'Number of documents per page',
          example: 10,
          minimum: 1,
          maximum: 100,
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sorting order of results',
          example: 'desc',
        },
        select: {
          type: 'string',
          description:
            'Comma-separated fields to return. Example: "id,title,fileName"',
          example: 'id,title,fileName,createdAt',
        },
      },
    },

    responses: [
      {
        status: 200,
        description: 'Documents fetched successfully',
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
                      id: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      fileName: { type: 'string' },
                      filePath: { type: 'string' },
                      mimeType: { type: 'string' },
                      size: { type: 'number' },
                    },
                  },
                },
                totalCount: { type: 'number', example: 2 },
                totalPages: { type: 'number', example: 1 },
              },
            },
            message: { type: 'string', example: 'Request successful' },
          },
        },
      },
      {
        status: 400,
        description: 'Bad request – validation failed',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: {
              type: 'object',
              properties: {
                statusCode: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Validation failed' },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      validation: { type: 'string', example: 'uuid' },
                      code: { type: 'string', example: 'invalid_string' },
                      message: { type: 'string', example: 'Invalid User ID' },
                      path: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['id'],
                      },
                    },
                  },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/user/me/documents' },
          },
        },
      },
      {
        status: 403,
        description: 'Forbidden – No permission',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: {
              type: 'string',
              example: 'You do not have permission',
            },
            error: { type: 'string', example: 'Forbidden' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/user/me/documents' },
          },
        },
      },
      {
        status: 401,
        description: 'Unauthorized – Token missing or invalid',
        type: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: {
              type: 'string',
              example: 'Invalid or expired token',
            },
            error: { type: 'string', example: 'Unauthorized' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', example: '/user/me/documents' },
          },
        },
      },
    ],
  },
};
