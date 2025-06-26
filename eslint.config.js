const { fixupConfigRules, fixupPluginRules } = require('@eslint/compat');

const _import = require('eslint-plugin-import');
const jsdoc = require('eslint-plugin-jsdoc');
const preferArrow = require('eslint-plugin-prefer-arrow');
const prettier = require('eslint-plugin-prettier');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');

const { FlatCompat } = require('@eslint/eslintrc');

// Create a new FlatCompat instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  // Apply rule fixes from the compat package
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'plugin:jsdoc/recommended',
      'plugin:prettier/recommended',
    ),
  ),

  {
    plugins: {
      // Fix up rules for the TypeScript ESLint plugin
      '@typescript-eslint': fixupPluginRules(typescriptEslintPlugin),
      // Fix up rules for the import plugin
      import: fixupPluginRules(_import),
      // Fix up rules for the JSDoc plugin
      jsdoc: fixupPluginRules(jsdoc),
      // Add rules for the prefer-arrow plugin
      'prefer-arrow': preferArrow,
      // Fix up rules for the Prettier plugin
      prettier: fixupPluginRules(prettier),
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },

    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },

    // Define linting rules
    rules: {
      // General ESLint rules
      eqeqeq: 'error', // Require === and !==
      curly: 'error', // Require curly braces for all control statements
      'no-console': 'warn', // Warn on console usage
      'no-control-regex': 'off', // Warn on console usage
      'no-debugger': 'warn', // Warn on debugger usage
      'no-alert': 'error', // Disallow alert, confirm, and prompt
      'no-eval': 'error', // Disallow eval()
      'no-implied-eval': 'error', // Disallow implied eval() through setTimeout, setInterval, etc.
      'no-restricted-globals': ['error', 'event'], // Disallow specific global variables
      'no-shadow': 'off', // Disallow variable declarations from shadowing variables in the outer scope. Note: you must disable the base rule as it can report incorrect errors
      'no-undef-init': 'error', // Disallow initializing variables to undefined
      'no-use-before-define': 'off', // Disable to avoid conflict with @typescript-eslint/no-use-before-define
      radix: 'error', // Enforce using the radix parameter with parseInt()
      // 'require-await': 'error', // Disallow async functions without await
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables in test files
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-return-await': 'warn', // Disallow unnecessary return await
      'prefer-const': 'error', // Prefer const over let for variables that are never reassigned
      'prefer-template': 'error', // Prefer template literals over string concatenation
      'prefer-arrow-callback': 'error', // Prefer arrow functions as callbacks
      'arrow-body-style': ['error', 'as-needed'], // Enforce using braces in arrow functions when needed

      // TypeScript-specific rules
      '@typescript-eslint/adjacent-overload-signatures': 'error', // Require function overloads to be adjacent
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
        },
      ],

      '@typescript-eslint/ban-ts-comment': 'error', // Disallow @ts-<directive> comments
      // '@typescript-eslint/ban-types': 'error', // Disallow certain types
      '@typescript-eslint/consistent-type-assertions': 'error', // Enforce consistent type assertions
      '@typescript-eslint/explicit-function-return-type': 'error', // Require explicit return types on functions
      '@typescript-eslint/explicit-module-boundary-types': 'error', // Require explicit return types on module boundaries
      // '@typescript-eslint/member-delimiter-style': 'error', // Enforce consistent member delimiter style in interfaces and type literals
      '@typescript-eslint/no-empty-function': 'error', // Disallow empty functions
      '@typescript-eslint/no-explicit-any': 'off', // Disallow the use of the 'any' type
      '@typescript-eslint/no-floating-promises': 'error', // Require promises to be handled appropriately
      '@typescript-eslint/no-for-in-array': 'error', // Disallow iterating over an array with a for-in loop
      '@typescript-eslint/no-inferrable-types': 'error', // Disallow explicit type declarations that can be inferred
      '@typescript-eslint/no-misused-new': 'error', // Disallow the misuse of the 'new' operator
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn on non-null assertions using the ! postfix operator
      '@typescript-eslint/no-parameter-properties': 'off', // Disable rule for parameter properties in constructors
      '@typescript-eslint/no-unnecessary-type-assertion': 'error', // Disallow unnecessary type assertions
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ], // Disallow unused variables, except those prefixed with _
      '@typescript-eslint/no-use-before-define': 'error', // Disallow using variables before they are defined
      '@typescript-eslint/no-var-requires': 'error', // Disallow require statements except in import statements
      '@typescript-eslint/prefer-for-of': 'error', // Prefer for-of loops over standard for loops
      '@typescript-eslint/prefer-function-type': 'error', // Prefer function types over interfaces with call signatures
      '@typescript-eslint/restrict-plus-operands': 'error', // Disallow using the '+' operator with non-numeric types
      '@typescript-eslint/unbound-method': 'error', // Enforce unbound methods to be bound

      // Import-specific rules
      'import/no-default-export': 'off', // Warn on default exports
      'import/no-extraneous-dependencies': 'error', // Disallow the use of extraneous dependencies
      'import/no-unresolved': 'off', // Ensure imports point to a file/module that can be resolved
      'import/namespace': 'off', // Disable this rule if it's causing issues with rxjs

      // Import order rule
      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],

      // JSDoc-specific rules
      // 'jsdoc/check-alignment': 'error', // Enforce proper alignment of JSDoc comments
      // 'jsdoc/check-indentation': 'error', // Enforce consistent indentation in JSDoc comments
      // 'jsdoc/require-jsdoc': [
      //   'error',
      //   {
      //     require: {
      //       FunctionDeclaration: true,
      //       MethodDefinition: true,
      //       ClassDeclaration: true,
      //       ArrowFunctionExpression: false,
      //       FunctionExpression: false,
      //     },
      //   },
      // ],

      // Prefer-arrow-specific rules
      'prefer-arrow/prefer-arrow-functions': [
        'error',
        {
          disallowPrototype: true, // Disallow prototype properties
          singleReturnOnly: false, // Allow single return statements
          classPropertiesAllowed: false, // Disallow class properties
        },
      ],

      // Prettier integration
      'prettier/prettier': 'error', // Ensure Prettier rules are enforced
    },
  },

  // Define overrides for specific files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'test/*'], // Apply these rules to test files
    rules: {
      // '@typescript-eslint/no-explicit-any': 'off', // Allow the use of 'any' type in test files
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables in test files
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
    },
  },
  {
    ignores: [
      // List of files and directories to ignore
      'node_modules/*', // Ignore the node_modules directory
      'dist/*', // Ignore the build directory
      'testDist/*', // Ignore the build directory
      '**/.*',
      'eslint.config.js',
      'test_reports',
      'jest.config.js',
      'src/**/*.spec.t*',
      'postman/*',
      'src/types',
      // Add more entries as needed
    ],
  },
];
