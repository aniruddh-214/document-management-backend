/* istanbul ignore file */

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface SchemaLike {
  properties: Record<string, any>;
  required?: string[];
  anyOf?: any[]; // Support for JSON schema anyOf
}

interface SwaggerResponseOption {
  status: number;
  description?: string;
  type?: Type<any> | object;
  headers?: Record<string, { description: string; schema?: object }>;
}

interface SwaggerDocOptions {
  summary?: string;
  description?: string;
  tags?: string[];
  auth?: boolean;
  roles?: string[];
  deprecated?: boolean;

  params?: Type<any> | object | SchemaLike;
  query?: Type<any> | object | SchemaLike;
  headers?: Record<string, { description: string; required?: boolean }>;

  /**
   * Use this for normal JSON bodies (application/json)
   */
  body?: Type<any> | object;

  /**
   * Use this for multipart/form-data bodies with file uploads
   * - required: list of required property names in the form
   * - properties: schema properties for the form fields (files must be `type: string, format: binary`)
   * - anyOf: optional JSON Schema anyOf to hint "at least one field required" or other constraints
   */
  multipartBody?: {
    required: string[];
    properties: Record<string, any>;
    anyOf?: any[];
  };

  fileUpload?: {
    fieldName: string;
    required?: boolean;
  };

  consumes?: string[]; // explicitly set consumes if needed (default handled internally)

  responses?: SwaggerResponseOption[];
}

const isSchemaLike = (obj: any): obj is SchemaLike =>
  obj &&
  typeof obj === 'object' &&
  'properties' in obj &&
  typeof obj.properties === 'object';

export const SwaggerDoc = (options: SwaggerDocOptions): MethodDecorator => {
  const decorators: MethodDecorator[] = [];

  // 1) Tags
  if (options.tags && options.tags.length) {
    decorators.push(ApiTags(...options.tags));
  }

  // 2) Combine description + roles into one string
  const combinedDescription = [
    options.description,
    options.roles?.length ? `Roles: ${options.roles.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  // 3) Operation metadata
  decorators.push(
    ApiOperation({
      summary: options.summary || '',
      description: combinedDescription,
      deprecated: options.deprecated,
    }),
  );

  // 4) Auth - add bearer token if needed
  if (options.auth) {
    decorators.push(ApiBearerAuth());
  }

  // 5) Params (path)
  if (options.params) {
    if (typeof options.params === 'function') {
      throw new Error(
        'For params as class type, please provide param names explicitly in SchemaLike object',
      );
    } else if (isSchemaLike(options.params)) {
      for (const [paramName, schema] of Object.entries(
        options.params.properties,
      )) {
        decorators.push(
          ApiParam({
            name: paramName,
            required:
              Array.isArray(options.params.required) &&
              options.params.required.includes(paramName),
            schema,
          }),
        );
      }
    }
  }

  // 6) Query params
  if (options.query) {
    if (typeof options.query === 'function') {
      decorators.push(ApiQuery({ type: options.query }));
    } else if (isSchemaLike(options.query)) {
      for (const [queryName, schema] of Object.entries(
        options.query.properties,
      )) {
        decorators.push(
          ApiQuery({
            name: queryName,
            required:
              Array.isArray(options.query.required) &&
              options.query.required.includes(queryName),
            schema,
          }),
        );
      }
    }
  }

  // 7) Headers
  if (options.headers) {
    for (const [headerName, headerInfo] of Object.entries(options.headers)) {
      decorators.push(
        ApiHeader({
          name: headerName,
          description: headerInfo.description,
          required: headerInfo.required ?? false,
        }),
      );
    }
  }

  // 8) Body & Multipart handling
  if (options.multipartBody) {
    // Multipart/form-data body with files and fields
    decorators.push(ApiConsumes('multipart/form-data'));

    const schema: any = {
      type: 'object',
      properties: options.multipartBody.properties,
      required: options.multipartBody.required,
    };

    if (options.multipartBody.anyOf) {
      schema.anyOf = options.multipartBody.anyOf;
    }

    decorators.push(ApiBody({ schema }));
  } else if (options.body) {
    // Normal JSON body
    if (typeof options.body === 'function') {
      decorators.push(ApiBody({ type: options.body }));
    } else {
      decorators.push(ApiBody({ schema: options.body }));
    }
  }

  // 9) File upload shorthand support (if used separately)
  if (options.fileUpload) {
    decorators.push(ApiConsumes('multipart/form-data'));
    decorators.push(
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            [options.fileUpload.fieldName]: {
              type: 'string',
              format: 'binary',
            },
          },
          required: options.fileUpload.required
            ? [options.fileUpload.fieldName]
            : [],
        },
      }),
    );
  }

  // 10) Consumes (overrides default if provided)
  if (options.consumes && options.consumes.length > 0) {
    for (const contentType of options.consumes) {
      decorators.push(ApiConsumes(contentType));
    }
  }

  // 11) Responses
  if (options.responses && options.responses.length > 0) {
    for (const resp of options.responses) {
      const apiRespOptions: any = {
        status: resp.status,
        description: resp.description ?? '',
      };
      if (resp.type) {
        if (typeof resp.type === 'function') {
          apiRespOptions.type = resp.type;
        } else {
          apiRespOptions.schema = resp.type;
        }
      }
      if (resp.headers) {
        apiRespOptions.headers = resp.headers;
      }
      decorators.push(ApiResponse(apiRespOptions));
    }
  } else {
    // Default 200 response fallback
    decorators.push(
      ApiResponse({ status: 200, description: 'Successful response' }),
    );
  }

  return applyDecorators(...decorators);
};
