#!/usr/bin/env node
/**
 * Fixes duplicate operationId values in OpenAPI schema.
 * Django Ninja generates the same operationId for GET and HEAD methods,
 * which causes TypeScript errors when generating types.
 *
 * Usage: node scripts/fix-openapi-schema.mjs api-schema.json
 */

import { readFileSync, writeFileSync } from 'fs';

const schemaPath = process.argv[2] || 'api-schema.json';

console.log(`Fixing OpenAPI schema: ${schemaPath}`);

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const seenOperationIds = new Set();

for (const [path, methods] of Object.entries(schema.paths || {})) {
  for (const [method, operation] of Object.entries(methods)) {
    if (operation && typeof operation === 'object' && operation.operationId) {
      const originalId = operation.operationId;

      if (seenOperationIds.has(originalId)) {
        // Append method to make unique
        const newId = `${originalId}_${method}`;
        console.log(`  Renaming duplicate: ${originalId} -> ${newId}`);
        operation.operationId = newId;
      }

      seenOperationIds.add(operation.operationId);
    }
  }
}

writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
console.log('Done!');
