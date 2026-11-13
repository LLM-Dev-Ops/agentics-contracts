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
const activeApiKeyScopeSemantics = "An active API key response MUST contain a non-empty unique scope list that remains a subset of the provider's current allowlist; empty, malformed, duplicate, or retired scopes MUST fail closed and MUST NOT resolve as an active key.";
const apiKeyResponseSchema = schemas.find(({ file }) => file.endsWith('identity-api-key-response.schema.json'))?.schema;
if (apiKeyResponseSchema?.properties?.scopes?.description !== activeApiKeyScopeSemantics) {
  throw new Error('identity-api-key-response lacks active allowlist scope semantics');
}
if (contracts.IdentityApiKeyResponseSchema.shape.scopes.description !== activeApiKeyScopeSemantics) {
  throw new Error('identity-api-key-response runtime validator drifted from active allowlist scope semantics');
}
requireValid('identity-entitlement-response', {
  organization_id: organizationId, plan: 'developer', max_requests: 10000,
  max_tokens: 1000000, max_api_keys: 10,
});
const losslessEntitlementSemantics = 'Entitlement limits MUST be non-negative safe JSON integers no greater than 9007199254740991; providers MUST fail closed instead of rounding larger persisted BIGINT values.';
const unsafeEntitlement = {
  organization_id: organizationId, plan: 'enterprise', max_requests: 9007199254740992,
  max_tokens: 1000000, max_api_keys: 10,
};
requireInvalid('identity-entitlement-response', unsafeEntitlement);
requireRuntimeInvalid(
  contracts.IdentityEntitlementResponseSchema,
  unsafeEntitlement,
  'identity-entitlement-response',
);
const unsafeApiKeyLimit = {
  organization_id: organizationId, plan: 'enterprise', max_requests: 10000,
  max_tokens: 1000000, max_api_keys: 9007199254740992,
};
requireInvalid('identity-entitlement-response', unsafeApiKeyLimit);
requireRuntimeInvalid(
  contracts.IdentityEntitlementResponseSchema,
  unsafeApiKeyLimit,
  'identity-entitlement-response max_api_keys',
);
const apiKeyLimitSemantics = 'Maximum concurrently active, unrevoked, unexpired API keys permitted for the organization. Key creation MUST be denied when the current count is greater than or equal to this limit. This value MUST be a non-negative safe JSON integer no greater than 9007199254740991; providers MUST fail closed instead of rounding a larger persisted BIGINT value.';
const entitlementAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-entitlement-response.schema.json'
)?.schema;
for (const field of ['max_requests', 'max_tokens']) {
  if (entitlementAuthority?.properties?.[field]?.maximum !== Number.MAX_SAFE_INTEGER ||
      entitlementAuthority?.properties?.[field]?.description !== losslessEntitlementSemantics) {
    throw new Error(`identity-entitlement-response lacks lossless ${field} semantics`);
  }
  if (contracts.IdentityEntitlementResponseSchema.shape[field].description !== losslessEntitlementSemantics) {
    throw new Error(`identity-entitlement-response runtime validator drifted from lossless ${field} semantics`);
  }
}
if (entitlementAuthority?.properties?.max_api_keys?.maximum !== Number.MAX_SAFE_INTEGER ||
    entitlementAuthority?.properties?.max_api_keys?.description !== apiKeyLimitSemantics) {
  throw new Error('identity-entitlement-response lacks authoritative max_api_keys enforcement semantics');
}
if (contracts.IdentityEntitlementResponseSchema.shape.max_api_keys.description !== apiKeyLimitSemantics) {
  throw new Error('identity-entitlement-response runtime validator drifted from max_api_keys semantics');
}
requireInvalid('identity-cli-session-authorize', {
  session_code: 'ABCD1234', organization_id: organizationId,
});
const principalBindingSemantics = 'Configured IAM principal bindings MUST map each case-insensitively unique principal email to exactly one non-empty string organization_id. Identity-provider caller allowlists MUST contain non-empty, case-insensitively unique principal emails without surrounding whitespace. Duplicate canonical principals, malformed or whitespace-padded principal entries, and non-string or empty organization identifiers MUST fail closed at startup and request time instead of being overwritten or coerced.';
const principalAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/principal.schema.json'
)?.schema;
if (principalAuthority?.description !== principalBindingSemantics) {
  throw new Error('principal contract lacks unambiguous principal-to-tenant binding semantics');
}
if (contracts.DataPlanePrincipalSchema.description !== principalBindingSemantics) {
  throw new Error('principal runtime validator drifted from principal-to-tenant binding semantics');
}
const sessionExpirySemantics = 'Session expiry MUST be evaluated after the session row lock is acquired, using a non-transaction-start persistence wall clock in the same transaction for authorization and polling; transaction-start timestamps and service-process clock comparisons are forbidden.';
const ownerAuthorizationSemantics = "CLI session authorization MUST be performed by an active tenant membership with role owner, resolved from the verified issuer and subject; caller-supplied tenant ownership is forbidden. The provider MUST revalidate the row-locked session's persisted requested scopes as a non-empty unique subset of the current allowlist before API-key creation; malformed, duplicate, empty, unsupported, or retired persisted scopes MUST fail closed. " + sessionExpirySemantics;
const authorizeAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-authorize.schema.json'
)?.schema;
if (authorizeAuthority?.description !== ownerAuthorizationSemantics) {
  throw new Error('identity-cli-session-authorize lacks authoritative owner-role semantics');
}
if (contracts.IdentityCliSessionAuthorizeSchema.description !== ownerAuthorizationSemantics) {
  throw new Error('identity-cli-session-authorize runtime validator drifted from owner-role semantics');
}
const authorizationReplaySemantics = 'When replaying a completed CLI session, the provider MUST return key_id only after row-locking an active, unrevoked, unexpired API key owned by the same authenticated organization; missing, cross-tenant, revoked, or expired key references MUST fail closed.';
const authorizedAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-authorized.schema.json'
)?.schema;
if (authorizedAuthority?.description !== authorizationReplaySemantics) {
  throw new Error('identity-cli-session-authorized lacks tenant-bound replay semantics');
}
if (contracts.IdentityCliSessionAuthorizedSchema.description !== authorizationReplaySemantics) {
  throw new Error('identity-cli-session-authorized runtime validator drifted from tenant-bound replay semantics');
}
const duplicateScopeCreate = {
  scopes: ['simulation:run', 'simulation:run'],
};
requireInvalid('identity-cli-session-create', duplicateScopeCreate);
requireRuntimeInvalid(
  contracts.IdentityCliSessionCreateSchema,
  duplicateScopeCreate,
  'identity-cli-session-create',
);
const emptyScopeCreate = { scopes: [] };
requireInvalid('identity-cli-session-create', emptyScopeCreate);
requireRuntimeInvalid(
  contracts.IdentityCliSessionCreateSchema,
  emptyScopeCreate,
  'identity-cli-session-create empty scopes',
);
const identityScopeConfigurationSemantics = 'Provider identity scope configuration MUST define non-empty allowed and default scope lists containing non-empty strings without surrounding whitespace, unique within each list, with every default scope present in the allowed list. Malformed, duplicate, empty, whitespace-padded, or unsupported configured scopes MUST fail closed at startup and request time instead of being normalized or deduplicated.';
const createAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-create.schema.json'
)?.schema;
if (createAuthority?.description !== identityScopeConfigurationSemantics) {
  throw new Error('identity-cli-session-create lacks strict scope configuration semantics');
}
if (contracts.IdentityCliSessionCreateSchema.description !== identityScopeConfigurationSemantics) {
  throw new Error('identity-cli-session-create runtime validator drifted from scope configuration semantics');
}
const duplicateScopeAuthorization = {
  session_code: 'ABCD1234', scopes: ['simulation:run', 'simulation:run'],
};
requireInvalid('identity-cli-session-authorize', duplicateScopeAuthorization);
requireRuntimeInvalid(
  contracts.IdentityCliSessionAuthorizeSchema,
  duplicateScopeAuthorization,
  'identity-cli-session-authorize',
);
const emptyScopeAuthorization = { session_code: 'ABCD1234', scopes: [] };
requireInvalid('identity-cli-session-authorize', emptyScopeAuthorization);
requireRuntimeInvalid(
  contracts.IdentityCliSessionAuthorizeSchema,
  emptyScopeAuthorization,
  'identity-cli-session-authorize empty scopes',
);
const emptyScopeResponse = {
  key_id: '11111111-1111-4111-8111-111111111111',
  organization_id: organizationId,
  name: 'empty-scope-key',
  scopes: [],
  created_at: '2026-11-13T00:00:00.000Z',
  expires_at: null,
  last_used_at: null,
};
requireInvalid('identity-api-key-response', emptyScopeResponse);
requireRuntimeInvalid(
  contracts.IdentityApiKeyResponseSchema,
  emptyScopeResponse,
  'identity-api-key-response empty scopes',
);
requireValid('identity-cli-session-poll', { status: 'pending' });
requireValid('identity-cli-session-poll', {
  status: 'completed', email: 'owner@example.com', payment_status: 'paid',
  organization_id: organizationId, role: 'owner', api_key: 'ag_live_one_time',
});
const deliveryBindingSemantics = 'A completed CLI session MUST deliver api_key only while the original authorizing membership remains active and bound to the same organization and the issued key remains active, unrevoked, and unexpired. Membership and key state MUST be row-locked in the same serializable delivery transaction. The decrypted api_key MUST hash to the referenced active key_id before delivery or erasure. API-key delivery is one-time. ' + sessionExpirySemantics;
const pollAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-poll.schema.json'
)?.schema;
if (pollAuthority?.oneOf?.[1]?.description !== deliveryBindingSemantics) {
  throw new Error('identity-cli-session-poll lacks delivery-time tenant and key binding semantics');
}
if (contracts.IdentityCliSessionPollSchema.options?.[1]?.description !== deliveryBindingSemantics) {
  throw new Error('identity-cli-session-poll runtime validator drifted from delivery binding semantics');
}

console.log(`validated ${files.length} authoritative schemas`);
