import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import contracts from '../index.js';

const roots = [
  'execution',
  'simulation',
  'intent',
  'exporters',
  'diligence',
  'roi',
  'governance',
  'lifecycle',
  'data-plane',
];

async function schemasUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? schemasUnder(path) : path.endsWith('.schema.json') ? [path] : [];
  }));
  return files.flat();
}

// Preserve the repository's existing draft-07 compatibility posture: these
// schemas predate Ajv's strictRequired rules, but formats are now validated.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const files = (await Promise.all(roots.map(schemasUnder))).flat().sort();
const schemas = await Promise.all(files.map(async (file) => ({
  file,
  schema: JSON.parse(await readFile(file, 'utf8')),
})));

// Register every authority contract before compilation so versioned schemas can
// reuse definitions by absolute $id without weakening validation or duplicating
// the canonical result packet shape.
for (const { schema } of schemas) ajv.addSchema(schema);

for (const { file, schema } of schemas) {
  if (!ajv.getSchema(schema.$id)) throw new Error(`schema ${file} did not register`);
  console.log(`schema ${file} is valid`);
}

function requireValid(schemaName, value) {
  const validate = ajv.getSchema(`https://agentics.org/contracts/data-plane/v1/${schemaName}.schema.json`);
  if (!validate?.(value)) throw new Error(`${schemaName} rejected authority fixture: ${ajv.errorsText(validate?.errors)}`);
}

function requireInvalid(schemaName, value) {
  const validate = ajv.getSchema(`https://agentics.org/contracts/data-plane/v1/${schemaName}.schema.json`);
  if (validate?.(value)) throw new Error(`${schemaName} accepted forbidden authority fixture`);
}

function requireRuntimeInvalid(schema, value, name) {
  if (schema.safeParse(value).success) {
    throw new Error(`${name} runtime validator accepted forbidden authority fixture`);
  }
}

const organizationId = 'tenant-a';
requireValid('identity-api-key-lookup', { key_hash: 'a'.repeat(64) });
requireInvalid('identity-api-key-lookup', { api_key: 'ag_live_secret' });
requireInvalid('identity-api-key-lookup', { key_hash: 'a'.repeat(64), organization_id: organizationId });
requireValid('identity-api-key-response', {
  key_id: 'c433a3fa-1d07-4e56-bf30-b9019c7f1415', organization_id: organizationId,
  name: 'cli', scopes: ['simulation:run'], created_at: '2026-11-12T00:00:00.000Z',
  expires_at: null, last_used_at: null,
});
requireInvalid('identity-api-key-response', {
  key_id: 'c433a3fa-1d07-4e56-bf30-b9019c7f1415', organization_id: organizationId,
  name: 'cli', scopes: [], created_at: '2026-11-12T00:00:00.000Z', expires_at: null,
  last_used_at: null, key_hash: 'a'.repeat(64),
});
const duplicateScopeResponse = {
  key_id: 'c433a3fa-1d07-4e56-bf30-b9019c7f1415', organization_id: organizationId,
  name: 'cli', scopes: ['simulation:run', 'simulation:run'],
  created_at: '2026-11-12T00:00:00.000Z', expires_at: null, last_used_at: null,
};
requireInvalid('identity-api-key-response', duplicateScopeResponse);
requireRuntimeInvalid(contracts.IdentityApiKeyResponseSchema, duplicateScopeResponse, 'identity-api-key-response');
requireValid('identity-entitlement-response', {
  organization_id: organizationId, plan: 'developer', max_requests: 10000,
  max_tokens: 1000000, max_api_keys: 10,
});
const apiKeyLimitSemantics = 'Maximum concurrently active, unrevoked, unexpired API keys permitted for the organization. Key creation MUST be denied when the current count is greater than or equal to this limit.';
const entitlementAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-entitlement-response.schema.json'
)?.schema;
if (entitlementAuthority?.properties?.max_api_keys?.description !== apiKeyLimitSemantics) {
  throw new Error('identity-entitlement-response lacks authoritative max_api_keys enforcement semantics');
}
if (contracts.IdentityEntitlementResponseSchema.shape.max_api_keys.description !== apiKeyLimitSemantics) {
  throw new Error('identity-entitlement-response runtime validator drifted from max_api_keys semantics');
}
requireInvalid('identity-cli-session-authorize', {
  session_code: 'ABCD1234', organization_id: organizationId,
});
const duplicateScopeCreate = {
  scopes: ['simulation:run', 'simulation:run'],
};
requireInvalid('identity-cli-session-create', duplicateScopeCreate);
requireRuntimeInvalid(
  contracts.IdentityCliSessionCreateSchema,
  duplicateScopeCreate,
  'identity-cli-session-create',
);
const duplicateScopeAuthorization = {
  session_code: 'ABCD1234', scopes: ['simulation:run', 'simulation:run'],
};
requireInvalid('identity-cli-session-authorize', duplicateScopeAuthorization);
requireRuntimeInvalid(
  contracts.IdentityCliSessionAuthorizeSchema,
  duplicateScopeAuthorization,
  'identity-cli-session-authorize',
);
requireValid('identity-cli-session-poll', { status: 'pending' });
requireValid('identity-cli-session-poll', {
  status: 'completed', email: 'owner@example.com', payment_status: 'paid',
  organization_id: organizationId, role: 'owner', api_key: 'ag_live_one_time',
});

console.log(`validated ${files.length} authoritative schemas`);
