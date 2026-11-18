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
ajv.addKeyword({
  keyword: 'x-unicode-normalization',
  schemaType: 'string',
  type: 'string',
  validate: (form, value) => ['NFC', 'NFKC'].includes(form) && value.normalize(form) === value,
});
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
const canonicalIdentityScopeSemantics = 'Every configured, requested, and persisted identity scope MUST be a non-empty Unicode-scalar string already in exact NFKC normalization and MUST NOT contain Unicode White_Space property characters, Unicode C0/C1 control characters, Unicode General Category Cf format controls, Unicode noncharacter code points, Unicode private-use code points, Unicode variation selectors, Unicode default-ignorable code points, or Unicode combining marks. Canonically or compatibility-equivalent alternate spellings, whitespace-bearing values, control-bearing values, format-control-bearing values, noncharacter-bearing values, private-use-bearing values, variation-selector-bearing values, default-ignorable-bearing values, and combining-mark-bearing values MUST fail closed before identity verification, entitlement evaluation, API-key creation, response emission, or persistence access; providers MUST NOT normalize, trim, or sanitize caller, configuration, or persisted scope values.';
const canonicalIdentityOrganizationSemantics = 'Every persisted organization_id resolved from an API key, entitlement, active membership, or completed CLI session MUST be a non-empty, at-most-255-character, exact NFC-normalized Unicode-scalar string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Malformed or noncanonical organization identifiers from an API-key row MUST fail closed immediately after that row lock and before key activity evaluation or entitlement access. Malformed or noncanonical active-membership or completed-session organization identifiers MUST fail closed immediately after their row lock and before CLI session access, membership access, tenant-quota or API-key access, response emission, persistence mutation, or COMMIT; providers MUST NOT normalize, trim, sanitize, coerce, or disclose them.';
const canonicalPersistedMembershipEmailSemantics = 'Every persisted email resolved from an active identity membership MUST be a valid non-empty, at-most-320-character, exact lowercase NFC-normalized Unicode-scalar email string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Malformed or noncanonical membership email values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT lowercase, normalize, trim, sanitize, coerce, or disclose them.';
const canonicalPersistedMembershipPaymentStatusSemantics = 'Every persisted payment_status resolved from an active identity membership MUST be exactly one of paid, unpaid, trial, or internal. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const canonicalPersistedMembershipRoleSemantics = 'Every persisted role resolved from an active identity membership MUST be exactly owner. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const activeMembershipIdentityBindingSemantics = 'The row-locked active membership issuer and subject MUST exactly equal the verified end-user issuer and subject used to authorize the membership lookup. A missing, malformed, non-string, noncanonical, or mismatched membership identity binding MUST fail closed immediately after the membership row lock and before CLI-session, tenant-quota, API-key, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, substitute, infer, or disclose a different identity binding.';
const canonicalPersistedApiKeyNameSemantics = 'Every persisted API-key name resolved from an active API-key row MUST already be a non-empty, at-most-255-character, exact NFC-normalized Unicode-scalar string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Missing, malformed, non-string, or noncanonical names MUST fail closed immediately after the key row lock and before key activity evaluation, replay or delivery response emission, persistence mutation, or COMMIT; providers MUST NOT normalize, trim, sanitize, coerce, infer, or disclose persisted key names.';
const canonicalPersistedApiKeyIdSemantics = 'Every persisted API-key identifier resolved from an active key row or completed CLI session MUST already be an exact lowercase canonical RFC 4122 UUID. Malformed, uppercase, non-string, empty, or alternate identifiers MUST fail closed immediately after the relevant row lock and before key-activity evaluation, membership or entitlement access, response emission, persistence mutation, or COMMIT; providers MUST NOT lowercase, normalize, coerce, infer, or disclose them.';
const canonicalPersistedApiKeyHashSemantics = 'Every persisted API-key hash resolved from an active API-key row MUST already be exactly 64 lowercase ASCII hexadecimal characters. Missing, malformed, non-string, uppercase, whitespace-padded, or alternate values MUST fail closed immediately after the key row lock and before key activity evaluation, replay or delivery response emission, persistence mutation, or COMMIT; providers MUST NOT lowercase, normalize, trim, coerce, infer, or disclose persisted key hashes.';
const canonicalPersistedCliSessionStatusSemantics = 'Every persisted CLI session status resolved for authorization or polling MUST be exactly pending or completed. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the session row lock and before session-expiry evaluation, tenant-quota, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const canonicalPersistedCliSessionCodeSemantics = 'Every persisted CLI session_code resolved from a row lock MUST already be exactly eight uppercase ASCII letters or digits. Missing, malformed, non-string, lowercase, whitespace-padded, or alternate values MUST fail closed immediately after the session row lock and before status, session-expiry, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT uppercase, normalize, trim, coerce, infer, or disclose persisted session codes.';
const canonicalPersistedCliAuthorizingIdentitySemantics = 'Every completed CLI session authorized_issuer MUST be the exact configured canonical HTTPS end-user JWT issuer and authorized_subject MUST be a non-empty Unicode-scalar string without surrounding whitespace. Missing, malformed, non-string, whitespace-padded, noncanonical, or configuration-mismatched values MUST fail closed immediately after the session row lock and before session-expiry evaluation, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST validate one exact verifier-configuration snapshot and MUST NOT normalize, trim, coerce, infer, or disclose persisted authorizing identity values.';
const activeLookupTransactionSemantics = 'API-key and entitlement lookup MUST row-lock the matching key in a serializable transaction before evaluating active, revocation, expiry, or current-scope state. Expiry MUST be evaluated with a non-transaction-start persistence wall clock after the lock and rechecked after response validation immediately before COMMIT; unknown, inactive, concurrently revoked, expired, or invalid-scope keys MUST fail closed without disclosure. Entitlement lookup MUST also row-lock the resolved organization entitlement before response validation.';
const apiKeyResponseSchema = schemas.find(({ file }) => file.endsWith('identity-api-key-response.schema.json'))?.schema;
const cliSessionAuthorizedSchema = schemas.find(({ file }) => file.endsWith('identity-cli-session-authorized.schema.json'))?.schema;
const apiKeyLookupSchema = schemas.find(({ file }) => file.endsWith('identity-api-key-lookup.schema.json'))?.schema;
const cliSessionAuthorizeSchema = schemas.find(({ file }) => file.endsWith('identity-cli-session-authorize.schema.json'))?.schema;
const cliSessionPollSchema = schemas.find(({ file }) => file.endsWith('identity-cli-session-poll.schema.json'))?.schema;
if (apiKeyLookupSchema?.properties?.key_hash?.description !== canonicalPersistedApiKeyHashSemantics ||
    cliSessionAuthorizeSchema?.['x-persisted-api-key-hash'] !== canonicalPersistedApiKeyHashSemantics ||
    cliSessionPollSchema?.['x-persisted-api-key-hash'] !== canonicalPersistedApiKeyHashSemantics ||
    contracts.IdentityApiKeyLookupSchema.shape.key_hash.description !== canonicalPersistedApiKeyHashSemantics ||
    contracts.IdentityApiKeyHashSchema.description !== canonicalPersistedApiKeyHashSemantics) {
  throw new Error('identity contracts lack canonical persisted API-key hash semantics');
}
for (const key_hash of ['A'.repeat(64), ` ${'a'.repeat(64)}`]) {
  requireInvalid('identity-api-key-lookup', { key_hash });
  requireRuntimeInvalid(
    contracts.IdentityApiKeyHashSchema,
    key_hash,
    'identity-api-key-hash malformed persisted hash',
  );
}
if (apiKeyResponseSchema?.properties?.key_id?.description !== canonicalPersistedApiKeyIdSemantics ||
    cliSessionAuthorizedSchema?.properties?.key_id?.description !== canonicalPersistedApiKeyIdSemantics ||
    contracts.IdentityApiKeyResponseSchema.shape.key_id.description !== canonicalPersistedApiKeyIdSemantics ||
    contracts.IdentityCliSessionAuthorizedSchema.shape.key_id.description !== canonicalPersistedApiKeyIdSemantics ||
    contracts.IdentityApiKeyIdSchema.description !== canonicalPersistedApiKeyIdSemantics) {
  throw new Error('identity contracts lack canonical persisted API-key identifier semantics');
}
for (const key_id of ['not-a-canonical-uuid', 'C433A3FA-1D07-4E56-BF30-B9019C7F1415']) {
  const malformedKeyResponse = {
    ...duplicateScopeResponse,
    key_id,
    scopes: ['simulation:run'],
  };
  requireInvalid('identity-api-key-response', malformedKeyResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    malformedKeyResponse,
    'identity-api-key-response malformed persisted key id',
  );
  requireInvalid('identity-cli-session-authorized', {
    success: true,
    organization_id: organizationId,
    key_id,
  });
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizedSchema,
    { success: true, organization_id: organizationId, key_id },
    'identity-cli-session-authorized malformed persisted key id',
  );
}
if (apiKeyResponseSchema?.properties?.scopes?.description !== activeApiKeyScopeSemantics) {
  throw new Error('identity-api-key-response lacks active allowlist scope semantics');
}
if (contracts.IdentityApiKeyResponseSchema.shape.scopes.description !== activeApiKeyScopeSemantics) {
  throw new Error('identity-api-key-response runtime validator drifted from active allowlist scope semantics');
}
if (apiKeyResponseSchema?.properties?.organization_id?.description !== canonicalIdentityOrganizationSemantics ||
    apiKeyResponseSchema?.properties?.organization_id?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityApiKeyResponseSchema.shape.organization_id.description !== canonicalIdentityOrganizationSemantics ||
    contracts.IdentityOrganizationIdSchema.description !== canonicalIdentityOrganizationSemantics) {
  throw new Error('identity-api-key-response lacks canonical persisted organization semantics');
}
for (const persistedOrganizationId of ['org\u0000admin', 'org\uD800admin', ' org-admin']) {
  const malformedOrganizationResponse = {
    ...duplicateScopeResponse,
    organization_id: persistedOrganizationId,
    scopes: ['simulation:run'],
  };
  requireInvalid('identity-api-key-response', malformedOrganizationResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    malformedOrganizationResponse,
    'identity-api-key-response malformed persisted organization',
  );
}
requireRuntimeInvalid(
  contracts.IdentityApiKeyResponseSchema,
  { ...duplicateScopeResponse, organization_id: 'org-e\u0301', scopes: ['simulation:run'] },
  'identity-api-key-response non-NFC persisted organization',
);
if (apiKeyResponseSchema?.properties?.name?.description !== canonicalPersistedApiKeyNameSemantics ||
    apiKeyResponseSchema?.properties?.name?.['x-unicode-normalization'] !== 'NFC' ||
    cliSessionAuthorizeSchema?.['x-persisted-api-key-name'] !== canonicalPersistedApiKeyNameSemantics ||
    cliSessionPollSchema?.['x-persisted-api-key-name'] !== canonicalPersistedApiKeyNameSemantics ||
    contracts.IdentityApiKeyResponseSchema.shape.name.description !== canonicalPersistedApiKeyNameSemantics ||
    contracts.IdentityApiKeyNameSchema.description !== canonicalPersistedApiKeyNameSemantics) {
  throw new Error('identity-api-key-response lacks canonical persisted key-name semantics');
}
for (const name of ['cli\u0000admin', 'cli\uD800admin', ' cli']) {
  const malformedNameResponse = { ...duplicateScopeResponse, name, scopes: ['simulation:run'] };
  requireInvalid('identity-api-key-response', malformedNameResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    malformedNameResponse,
    'identity-api-key-response malformed persisted name',
  );
}
if (apiKeyResponseSchema?.properties?.scopes?.items?.description !== canonicalIdentityScopeSemantics ||
    apiKeyResponseSchema?.properties?.scopes?.items?.['x-unicode-normalization'] !== 'NFKC' ||
    contracts.IdentityApiKeyResponseSchema.shape.scopes.element.description !== canonicalIdentityScopeSemantics) {
  throw new Error('identity-api-key-response lacks canonical identity-scope semantics');
}
for (const scope of ['simulation:e\u0301xecute', 'simulation:A\u030Angstrom']) {
  const nonNfkcScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', nonNfkcScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    nonNfkcScopeResponse,
    'identity-api-key-response non-NFKC scope',
  );
}
for (const scope of ['simulation:\uFF52un', 'simulation:\uFF45xecute']) {
  const nonNfkcScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', nonNfkcScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    nonNfkcScopeResponse,
    'identity-api-key-response compatibility-equivalent non-NFKC scope',
  );
}
for (const scope of ['simulation:\u0000run', 'simulation:\u0085run']) {
  const controlBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', controlBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    controlBearingScopeResponse,
    'identity-api-key-response control-bearing scope',
  );
}
for (const scope of ['simulation:\u00A0run', 'simulation:\u2003run', 'simulation:\u2028run', 'simulation:\u2029run']) {
  const whitespaceBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', whitespaceBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    whitespaceBearingScopeResponse,
    'identity-api-key-response whitespace-bearing scope',
  );
}
for (const scope of ['simulation:\u200Brun', 'simulation:\u2060run']) {
  const formatControlBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', formatControlBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    formatControlBearingScopeResponse,
    'identity-api-key-response format-control-bearing scope',
  );
}
for (const scope of ['simulation:\uFDD0run', 'simulation:\u{1FFFE}run']) {
  const noncharacterBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', noncharacterBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    noncharacterBearingScopeResponse,
    'identity-api-key-response noncharacter-bearing scope',
  );
}
for (const scope of ['simulation:\uE000run', 'simulation:\u{F0000}run']) {
  const privateUseBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', privateUseBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    privateUseBearingScopeResponse,
    'identity-api-key-response private-use-bearing scope',
  );
}
for (const scope of ['simulation:\uFE0Frun', 'simulation:\u{E0100}run']) {
  const variationSelectorBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', variationSelectorBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    variationSelectorBearingScopeResponse,
    'identity-api-key-response variation-selector-bearing scope',
  );
}
for (const scope of ['simulation:\u034Frun', 'simulation:\u115Frun']) {
  const defaultIgnorableBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', defaultIgnorableBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    defaultIgnorableBearingScopeResponse,
    'identity-api-key-response default-ignorable-bearing scope',
  );
}
for (const scope of ['simulation:run\u0338', 'simulation:run\u20E3']) {
  const combiningMarkBearingScopeResponse = { ...duplicateScopeResponse, scopes: [scope] };
  requireInvalid('identity-api-key-response', combiningMarkBearingScopeResponse);
  requireRuntimeInvalid(
    contracts.IdentityApiKeyResponseSchema,
    combiningMarkBearingScopeResponse,
    'identity-api-key-response combining-mark-bearing scope',
  );
}
if (apiKeyResponseSchema?.description !== activeLookupTransactionSemantics ||
    contracts.IdentityApiKeyResponseSchema.description !== activeLookupTransactionSemantics) {
  throw new Error('identity-api-key-response lacks serialized active-key lookup semantics');
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
const apiKeyLimitSemantics = 'Maximum concurrently active, unrevoked, unexpired API keys permitted for the organization. Key creation MUST be denied when the current count is greater than or equal to this limit. After acquiring the per-tenant key-creation serialization lock, the provider MUST row-lock the resolved organization entitlement before reading max_api_keys or counting active keys; a concurrent entitlement change MUST block, retry, or fail serialization instead of permitting a decision from an unlocked stale limit. The active-key count MUST evaluate expiry after acquiring the per-tenant key-creation serialization lock, using a non-transaction-start persistence wall clock in the same transaction; transaction-start timestamps and service-process clock comparisons are forbidden. The limit and active count MUST remain lossless across persistence, aggregation and JSON serialization for the full safe-integer range. This value MUST be a non-negative safe JSON integer no greater than 9007199254740991; providers MUST fail closed instead of rounding a larger persisted BIGINT value.';
const entitlementAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-entitlement-response.schema.json'
)?.schema;
if (entitlementAuthority?.properties?.organization_id?.description !== canonicalIdentityOrganizationSemantics ||
    entitlementAuthority?.properties?.organization_id?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityEntitlementResponseSchema.shape.organization_id.description !== canonicalIdentityOrganizationSemantics) {
  throw new Error('identity-entitlement-response lacks canonical persisted organization semantics');
}
for (const persistedOrganizationId of ['org\u0000admin', 'org\uD800admin', ' org-admin']) {
  const malformedOrganizationEntitlement = {
    organization_id: persistedOrganizationId,
    plan: 'developer',
    max_requests: 10000,
    max_tokens: 1000000,
    max_api_keys: 10,
  };
  requireInvalid('identity-entitlement-response', malformedOrganizationEntitlement);
  requireRuntimeInvalid(
    contracts.IdentityEntitlementResponseSchema,
    malformedOrganizationEntitlement,
    'identity-entitlement-response malformed persisted organization',
  );
}
requireRuntimeInvalid(
  contracts.IdentityEntitlementResponseSchema,
  {
    organization_id: 'org-e\u0301',
    plan: 'developer',
    max_requests: 10000,
    max_tokens: 1000000,
    max_api_keys: 10,
  },
  'identity-entitlement-response non-NFC persisted organization',
);
const entitlementActiveKeySemantics = "Entitlement lookup MUST resolve only for an active, unrevoked, unexpired API key whose persisted scopes remain a non-empty unique subset of the provider's current allowlist. Empty, malformed, duplicate, unsupported, or retired scopes MUST fail closed with the same non-disclosing response as an unknown or inactive key.";
const entitlementTenantBindingSemantics = "The row-locked entitlement organization_id MUST exactly equal the canonical organization_id of the row-locked active API key used to authorize the lookup. A missing, malformed, non-string, noncanonical, or mismatched entitlement tenant binding MUST fail closed immediately after the entitlement row lock and before plan or limit evaluation, active-key revalidation, response emission, or COMMIT; providers MUST NOT normalize, substitute, infer, or disclose a different tenant binding.";
if (entitlementAuthority?.description !== entitlementActiveKeySemantics + ' ' + activeLookupTransactionSemantics) {
  throw new Error('identity-entitlement-response lacks active-key scope binding semantics');
}
if (entitlementAuthority?.['x-entitlement-tenant-binding'] !== entitlementTenantBindingSemantics) {
  throw new Error('identity-entitlement-response lacks exact entitlement tenant-binding semantics');
}
if (contracts.IdentityEntitlementResponseSchema.description !== entitlementActiveKeySemantics + ' ' + activeLookupTransactionSemantics + ' ' + entitlementTenantBindingSemantics) {
  throw new Error('identity-entitlement-response runtime validator drifted from active-key scope binding semantics');
}
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
const principalBindingSemantics = 'Tenant-bound and identity-provider routes MUST accept exactly one Cloud Run IAM bearer credential from the selected transport-identity header. Duplicate, empty, or whitespace-padded transport credentials MUST fail closed before token decoding, principal binding, allowlist evaluation, or persistence access; X-Serverless-Authorization MAY remain separate from Authorization when the latter carries an end-user JWT. Providers MUST determine credential multiplicity from the raw wire-level header occurrences; normalized header maps that collapse duplicates are insufficient. The configured service audience MUST be a non-empty string without surrounding whitespace, and the exact validated value MUST be used for both token-audience matching and the emitted principal or caller audience. Malformed, empty, whitespace-only, whitespace-padded, or non-string audience configuration MUST fail closed at startup and request time before token decoding, principal binding, allowlist evaluation, or persistence access. The decoded Cloud Run IAM aud claim MUST be the configured non-empty audience string or a non-empty array of unique non-empty strings without surrounding whitespace containing the configured audience exactly once. Every audience entry MUST contain only Unicode scalar values; malformed, empty, whitespace-only, whitespace-padded, non-string, duplicate, or unpaired-surrogate audience entries MUST fail closed before principal binding, allowlist evaluation, or persistence access. The decoded Cloud Run IAM email claim MUST be a valid non-empty string email without surrounding whitespace and the subject claim MUST be a non-empty string without surrounding whitespace. Missing, malformed, empty, whitespace-only, whitespace-padded, or non-string principal claims MUST fail closed before normalization, principal binding, allowlist evaluation, or persistence access; email MAY be normalized to lowercase only after validation. Configured IAM principal bindings MUST map each case-insensitively unique principal email to exactly one non-empty string organization_id. Providers MUST reject duplicate raw JSON member names in principal-binding configuration before parsing; parser overwrite order MUST NOT select an organization binding. Identity-provider caller allowlists MUST contain non-empty, case-insensitively unique principal emails without surrounding whitespace. Duplicate canonical principals, malformed or whitespace-padded principal entries, and non-string or empty organization identifiers MUST fail closed at startup and request time instead of being overwritten or coerced. Configured service audiences, principal-binding keys and organization identifiers, and identity-provider caller principals MUST contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed at startup and request time before comparison, emission, principal binding, or persistence access.';
const transportSerializationSemantics = 'The selected Cloud Run IAM credential MUST use compact JWT serialization with exactly three non-empty, unpadded canonical base64url components. Every component MUST decode and re-encode to the exact original value before claim access; malformed, empty, padded, or alternate encodings MUST fail closed as unauthenticated before principal binding, allowlist evaluation, or persistence access. The protected-header and payload components MUST decode as valid UTF-8 without byte-order marks or replacement characters before JSON parsing or member access; malformed or byte-order-marked UTF-8 MUST fail closed as unauthenticated. The validated key identifier and subject MUST each contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed before principal binding or persistence access.';
const transportProtectedHeaderSemantics = 'The decoded Cloud Run IAM JWT protected header MUST be a non-null JSON object using alg exactly RS256, typ exactly JWT, and a non-empty string kid without surrounding whitespace, and MUST NOT contain crit because no critical-header extensions are supported. Every top-level protected-header member name MUST occur exactly once; duplicate member names MUST fail closed instead of being resolved by parser overwrite order. Null, array, primitive, parser-invalid, duplicate-member, missing, malformed, non-string, whitespace-padded, alternate algorithm or token-type, and critical-extension headers MUST fail closed as unauthenticated before claim access, principal binding, allowlist evaluation, or persistence access.';
const transportPayloadSemantics = 'The decoded Cloud Run IAM JWT payload MUST be a non-null JSON object and MUST NOT be an array or primitive. Every top-level payload member name MUST occur exactly once; duplicate claim names MUST fail closed instead of being resolved by parser overwrite order. Null, array, primitive, and duplicate-member payloads MUST fail closed as unauthenticated before claim access, principal binding, allowlist evaluation, or persistence access; raw parser exceptions MUST NOT escape as service errors.';
const principalAuthoritySemantics = transportSerializationSemantics + ' ' + transportProtectedHeaderSemantics + ' ' + transportPayloadSemantics + ' ' + principalBindingSemantics;
const principalAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/principal.schema.json'
)?.schema;
if (principalAuthority?.description !== principalAuthoritySemantics) {
  throw new Error('principal contract lacks unambiguous principal-to-tenant binding semantics');
}
if (contracts.DataPlanePrincipalSchema.description !== principalAuthoritySemantics) {
  throw new Error('principal runtime validator drifted from principal-to-tenant binding semantics');
}
const sessionExpirySemantics = 'Session expiry MUST be evaluated after the session row lock is acquired, using a non-transaction-start persistence wall clock in the same transaction for authorization and polling; transaction-start timestamps and service-process clock comparisons are forbidden.';
const apiKeyExpirySemantics = 'API-key expiry MUST be evaluated after the referenced key row lock is acquired, using a non-transaction-start persistence wall clock in the same serializable transaction; transaction-start timestamps and service-process clock comparisons are forbidden.';
const replayIdentityOrderSemantics = 'Completed-session replay MUST compare the persisted authorizing issuer, subject, and organization to the verified active membership immediately after the session row lock and before evaluating session expiry or accessing the referenced API key; a mismatch MUST fail closed without disclosing session expiry or key state.';
const authorizationReplayRequestSemantics = 'A completed authorization replay that supplies key_name or scopes MUST match the row-locked referenced key; scopes are compared as an unordered unique set. Any conflicting replay MUST fail closed before the success response, while omitted optional fields remain idempotent.';
const authorizationReplayFinalKeyActivitySemantics = 'After constructing and validating a completed authorization replay response, the provider MUST re-evaluate the row-locked referenced key with a non-transaction-start persistence wall clock immediately before COMMIT. A key that expires before commit MUST prevent the replay response and roll back the transaction.';
const deliveryStateSemantics = 'Completed-session delivery state MUST be unambiguous: before first delivery encrypted_api_key is present and key_delivered_at is null; after delivery encrypted_api_key is null and key_delivered_at is non-null. Any other combination MUST fail closed before referenced-key access, plaintext disclosure, erasure, or a completed response.';
const completedPollKeyActivitySemantics = "Every completed-session poll, including polls after the one-time delivery copy has been erased, MUST row-lock and revalidate the referenced tenant key as active, unrevoked, unexpired, and carrying a non-empty unique scope list within the provider's current allowlist before returning completed tenant or membership data. Missing, cross-tenant, revoked, expired, malformed-scope, or retired-scope key references MUST fail closed without a completed response.";
const uniqueDeliveryMembershipSemantics = 'At every completed poll, the original authorizing issuer and subject MUST resolve to exactly one row-locked active membership in the persisted organization. Zero or multiple matching memberships MUST fail closed before delivery-state evaluation, referenced-key access, completed metadata, plaintext disclosure, erasure, or COMMIT.';
const completedPollFinalKeyActivitySemantics = 'After completed-response validation and any provisional delivery-copy erasure, the provider MUST re-evaluate the row-locked referenced key with a non-transaction-start persistence wall clock immediately before COMMIT. A key that expires before commit MUST roll back erasure and prevent completed metadata or plaintext disclosure.';
const deliveryResponseSemantics = 'The provider MUST validate the complete completed-session response against this authority before erasing the encrypted delivery copy or committing the delivery transaction; response-validation failure MUST roll back without erasure.';
const sessionEncryptionConfigurationSemantics = 'The CLI session encryption key MUST be the canonical base64 encoding of exactly 32 bytes. Providers MUST validate one exact key snapshot at startup and request time before provisional API-key insertion, session mutation, plaintext delivery, or delivery-copy erasure; malformed, non-canonical, or wrong-length values MUST fail closed as a provider configuration error.';
const deliveryPlaintextSemantics = 'When encrypted_api_key is present, it MUST decrypt to a non-empty api_key that is included in the prospective completed response and hashes to the row-locked referenced key before completed metadata, plaintext delivery, erasure, or COMMIT; an empty plaintext MUST fail closed and MUST NOT be treated as an absent or already-delivered copy.';
const deliveryEnvelopePresenceSemantics = 'Presence of encrypted_api_key MUST be determined by nullness, not string truthiness. A present value MUST be a non-empty encrypted envelope and MUST be decrypted and validated; an empty string MUST fail closed before referenced-key access, completed metadata, plaintext delivery, erasure, or COMMIT and MUST NOT be treated as absent or already delivered.';
const canonicalDeliveryEnvelopeSemantics = 'A present encrypted_api_key MUST contain exactly three non-empty, unpadded canonical base64url components for IV, authentication tag, and ciphertext. Providers MUST reject malformed or alternate encodings by decoding and comparing each canonical re-encoding before decryption, referenced-key access, completed metadata, plaintext delivery, erasure, or COMMIT.';
const authorizationPrecommitSemantics = 'Before inserting an API key or completing a CLI session, the provider MUST validate both the complete authorization response and the prospective completed-poll delivery response against their authorities using the row-locked membership and generated key data; validation failure MUST roll back without key insertion or session mutation.';
const finalSessionExpirySemantics = 'After acquiring every relevant blocking membership, session, tenant-quota, and referenced-key lock, the provider MUST re-evaluate session expiry with a non-transaction-start persistence wall clock immediately before authorization commit, replay response, plaintext delivery, or delivery-copy erasure; expiry MUST roll back without key insertion, session mutation, disclosure, or erasure.';
const postWriteSessionExpirySemantics = 'After response validation and any provisional API-key insertion, session completion, or delivery-copy erasure, the provider MUST re-evaluate session expiry with a non-transaction-start persistence wall clock immediately before COMMIT; expiry MUST roll back every provisional change and prevent response or plaintext disclosure. A check performed only before those writes is insufficient.';
const endUserJwtProtectedHeaderSemantics = 'The end-user JWT MUST use compact serialization with exactly three non-empty, unpadded canonical base64url components. Every component MUST decode and re-encode to the exact original value before JWKS lookup, membership access, or persistence access; malformed, padded, or alternate encodings MUST fail closed. The protected-header and payload components MUST decode as valid UTF-8 without byte-order marks or replacement characters before JSON parsing, JWKS lookup, membership access, or persistence access; malformed or byte-order-marked UTF-8 MUST fail closed. The validated key identifier and subject MUST each contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed before JWKS lookup, membership access, or persistence access. The protected JWT header MUST use ES256, carry typ exactly JWT, carry a non-empty string key identifier without surrounding whitespace, and MUST NOT contain crit because the provider supports no JOSE critical-header extensions. The selected key identifier MUST resolve to exactly one key in the configured JWKS response; duplicate key identifiers MUST fail closed before membership or persistence access instead of selecting the first matching key. Every top-level protected-header and payload member name MUST occur exactly once. Duplicate raw JSON member names MUST fail closed before JWKS lookup, membership access, or persistence access instead of being resolved by parser overwrite order. A missing, malformed, non-string, whitespace-padded, or alternate typ value MUST fail closed before JWKS lookup, membership access, or persistence access instead of being normalized or ignored. A missing, malformed, non-string, empty, or whitespace-padded key identifier and any present crit header MUST fail closed before JWKS lookup, membership access, or persistence access instead of being normalized or ignored.';
const endUserJwtConfigurationSemantics = 'The configured end-user JWT issuer and JWKS URI MUST be exact canonically serialized HTTPS URLs without surrounding whitespace: parsing and serializing either URL MUST reproduce the exact configured string. Neither URL may contain a username, password, or fragment, and the issuer may not contain a query. Alternate serializations, explicit default ports, path dot segments, credential-bearing URLs, fragments, and query-bearing issuers MUST fail closed before JWKS lookup, membership access, or persistence access. The configured audience MUST be a non-empty string without surrounding whitespace and MUST contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed at startup and request time before JWKS lookup, membership access, or persistence access. Providers MUST validate this configuration at startup and request time before JWKS lookup, membership access, or persistence access, and MUST use one exact validated snapshot for signature verification, claim matching, and the returned issuer. Malformed, empty, whitespace-only, whitespace-padded, non-canonical, credential-bearing, fragment-bearing, query-bearing issuer, or non-string configuration MUST fail closed as a provider configuration error rather than an invalid user credential.';
const endUserJwtEmailSemantics = 'The optional email claim, when present, MUST be a valid non-empty email string without surrounding whitespace and MUST be normalized to lowercase only after validation. A malformed, empty, whitespace-padded, or non-string email claim MUST fail closed before membership or persistence access instead of being treated as absent.';
const endUserJwtLifetimeSemantics = endUserJwtProtectedHeaderSemantics + ' ' + endUserJwtConfigurationSemantics + ' CLI authorization MUST accept exactly one Authorization credential containing a non-empty Bearer JWT without surrounding token whitespace; missing, duplicate, empty, or whitespace-padded credentials MUST fail closed before identity verification, membership access, or persistence access. Providers MUST determine Authorization multiplicity from the raw wire-level header occurrences; normalized header maps that collapse duplicates are insufficient. The end-user JWT used for CLI authorization MUST be signature-verified and contain the configured issuer and audience, a non-empty string subject without surrounding whitespace, and a valid numeric expiration claim. Missing, malformed, empty, whitespace-padded, or non-string subject claims and missing, malformed, or expired expiration MUST fail closed before membership or persistence access; a correctly signed token without exp is not an authorized identity. The aud claim MUST be either the configured non-empty audience string or a non-empty array of unique non-empty strings without surrounding whitespace containing the configured audience exactly once. Every audience entry and any present azp MUST contain only Unicode scalar values; malformed, empty, whitespace-only, whitespace-padded, duplicate, or unpaired-surrogate audience values MUST fail closed before membership or persistence access. When aud contains multiple values, azp MUST be present and exactly match the configured audience; whenever azp is present it MUST match that audience. Missing or mismatched authorized-party binding MUST fail closed before membership or persistence access. ' + endUserJwtEmailSemantics;
const cliMetadataUnicodeSemantics = 'CLI session metadata fields cli_name, cli_version, hostname, and key_name MUST contain only Unicode scalar values. Unpaired UTF-16 surrogate escapes MUST fail closed before identity verification, provisional session insertion, API-key insertion, session mutation, or persistence access; providers MUST NOT rely on lossy UTF-8 replacement during persistence or replay comparison.';
const canonicalCliMetadataSemantics = 'CLI metadata values MUST be non-empty NFC-normalized strings without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format controls, Unicode noncharacter code points, or Unicode private-use code points. Empty, non-NFC, whitespace-only, whitespace-padded, control-bearing, separator-bearing, format-control-bearing, noncharacter-bearing, or private-use-bearing values MUST fail closed before identity verification, provisional session insertion, API-key insertion, session mutation, or persistence access; providers MUST NOT normalize, trim, or sanitize caller input.';
const ownerAuthorizationSemantics = endUserJwtLifetimeSemantics + ' ' + cliMetadataUnicodeSemantics + " CLI session authorization MUST be performed by an active tenant membership with role owner, resolved from the verified issuer and subject; caller-supplied tenant ownership is forbidden. The verified issuer and subject MUST resolve to exactly one active tenant membership before CLI session access; zero or multiple active memberships MUST fail closed instead of selecting an arbitrary organization. The provider MUST revalidate the row-locked session's persisted requested scopes as a non-empty unique subset of the current allowlist before API-key creation; malformed, duplicate, empty, unsupported, or retired persisted scopes MUST fail closed. " + authorizationReplayRequestSemantics + ' ' + sessionExpirySemantics + ' ' + authorizationPrecommitSemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics + ' ' + sessionEncryptionConfigurationSemantics;
const authorizeAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-authorize.schema.json'
)?.schema;
if (authorizeAuthority?.description !== ownerAuthorizationSemantics) {
  throw new Error('identity-cli-session-authorize lacks authoritative owner-role semantics');
}
if (contracts.IdentityCliSessionAuthorizeSchema.description !== ownerAuthorizationSemantics) {
  throw new Error('identity-cli-session-authorize runtime validator drifted from owner-role semantics');
}
if (authorizeAuthority?.['x-persisted-membership-email'] !== canonicalPersistedMembershipEmailSemantics ||
    contracts.IdentityMembershipEmailSchema.description !== canonicalPersistedMembershipEmailSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical persisted membership email semantics');
}
if (authorizeAuthority?.['x-persisted-membership-payment-status'] !== canonicalPersistedMembershipPaymentStatusSemantics ||
    contracts.IdentityMembershipPaymentStatusSchema.description !== canonicalPersistedMembershipPaymentStatusSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical persisted membership payment-status semantics');
}
if (authorizeAuthority?.['x-persisted-membership-role'] !== canonicalPersistedMembershipRoleSemantics ||
    contracts.IdentityMembershipRoleSchema.description !== canonicalPersistedMembershipRoleSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical persisted membership-role semantics');
}
if (authorizeAuthority?.['x-active-membership-identity-binding'] !== activeMembershipIdentityBindingSemantics) {
  throw new Error('identity-cli-session-authorize lacks exact active-membership identity binding semantics');
}
if (!contracts.IdentityMembershipRoleSchema.safeParse('owner').success) {
  throw new Error('persisted membership-role authority rejected owner');
}
for (const persistedMembershipRole of ['member', 'Owner', ' owner', 'owner ', '', 1, null]) {
  requireRuntimeInvalid(
    contracts.IdentityMembershipRoleSchema,
    persistedMembershipRole,
    'identity membership malformed persisted role',
  );
}
if (authorizeAuthority?.['x-persisted-cli-session-status'] !== canonicalPersistedCliSessionStatusSemantics ||
    contracts.IdentityCliSessionStatusSchema.description !== canonicalPersistedCliSessionStatusSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical persisted session-status semantics');
}
if (authorizeAuthority?.['x-persisted-cli-session-code'] !== canonicalPersistedCliSessionCodeSemantics ||
    authorizeAuthority?.properties?.session_code?.description !== canonicalPersistedCliSessionCodeSemantics ||
    contracts.IdentityCliSessionCodeSchema.description !== canonicalPersistedCliSessionCodeSemantics ||
    contracts.IdentityCliSessionAuthorizeSchema.shape.session_code.description !== canonicalPersistedCliSessionCodeSemantics ||
    contracts.IdentityCliSessionCreatedSchema.shape.session_code.description !== canonicalPersistedCliSessionCodeSemantics) {
  throw new Error('identity CLI session contracts lack canonical persisted session-code semantics');
}
if (!contracts.IdentityCliSessionCodeSchema.safeParse('ABCD1234').success) {
  throw new Error('persisted CLI session-code authority rejected a canonical value');
}
for (const persistedSessionCode of ['abcd1234', ' ABCD1234', 'ABCD1234 ', 'ABC-1234', '', 1, null]) {
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCodeSchema,
    persistedSessionCode,
    'identity-cli-session malformed persisted session code',
  );
}
if (authorizeAuthority?.['x-persisted-cli-authorizing-identity'] !== canonicalPersistedCliAuthorizingIdentitySemantics ||
    contracts.IdentityEndUserIssuerSchema.description !== canonicalPersistedCliAuthorizingIdentitySemantics ||
    contracts.IdentityEndUserSubjectSchema.description !== canonicalPersistedCliAuthorizingIdentitySemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical persisted authorizing-identity semantics');
}
if (!contracts.IdentityEndUserIssuerSchema.safeParse('https://identity.test/auth/v1').success ||
    !contracts.IdentityEndUserSubjectSchema.safeParse('user-1').success) {
  throw new Error('persisted CLI authorizing-identity authority rejected canonical values');
}
for (const persistedIssuer of [' https://identity.test/auth/v1', 'https://identity.test:443/auth/v1', 'http://identity.test/auth/v1', 1, null]) {
  requireRuntimeInvalid(
    contracts.IdentityEndUserIssuerSchema,
    persistedIssuer,
    'identity-cli-session malformed persisted issuer',
  );
}
for (const persistedSubject of ['', ' user-1', 'user-1 ', '\uD800', 1, null]) {
  requireRuntimeInvalid(
    contracts.IdentityEndUserSubjectSchema,
    persistedSubject,
    'identity-cli-session malformed persisted subject',
  );
}
for (const persistedSessionStatus of ['pending', 'completed']) {
  if (!contracts.IdentityCliSessionStatusSchema.safeParse(persistedSessionStatus).success) {
    throw new Error('persisted CLI session status authority rejected a canonical state');
  }
}
for (const persistedSessionStatus of ['authorized', '', 1, null]) {
  requireRuntimeInvalid(
    contracts.IdentityCliSessionStatusSchema,
    persistedSessionStatus,
    'identity-cli-session malformed persisted status',
  );
}
const authorizationReplaySemantics = 'When replaying a completed CLI session, the provider MUST require the same verified issuer and subject that originally authorized the session, then return key_id only after row-locking an active, unrevoked, unexpired API key owned by the same authenticated organization whose persisted scopes remain a non-empty unique subset of the current allowlist; missing or mismatched authorizing identity, cross-tenant, malformed, empty, duplicate, retired-scope, revoked, or expired key references MUST fail closed. ' + replayIdentityOrderSemantics + ' ' + authorizationReplayRequestSemantics + ' ' + authorizationReplayFinalKeyActivitySemantics + ' ' + apiKeyExpirySemantics + ' ' + authorizationPrecommitSemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics;
const authorizedAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-authorized.schema.json'
)?.schema;
if (authorizedAuthority?.description !== authorizationReplaySemantics) {
  throw new Error('identity-cli-session-authorized lacks tenant-bound replay semantics');
}
if (contracts.IdentityCliSessionAuthorizedSchema.description !== authorizationReplaySemantics) {
  throw new Error('identity-cli-session-authorized runtime validator drifted from tenant-bound replay semantics');
}
if (authorizedAuthority?.properties?.organization_id?.description !== canonicalIdentityOrganizationSemantics ||
    authorizedAuthority?.properties?.organization_id?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityCliSessionAuthorizedSchema.shape.organization_id.description !== canonicalIdentityOrganizationSemantics) {
  throw new Error('identity-cli-session-authorized lacks canonical persisted membership organization semantics');
}
for (const persistedOrganizationId of ['org\u0000admin', 'org\uD800admin', ' org-admin']) {
  const malformedAuthorizationResponse = {
    success: true,
    organization_id: persistedOrganizationId,
    key_id: '11111111-1111-4111-8111-111111111111',
  };
  requireInvalid('identity-cli-session-authorized', malformedAuthorizationResponse);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizedSchema,
    malformedAuthorizationResponse,
    'identity-cli-session-authorized malformed persisted organization',
  );
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
for (const scope of ['simulation:e\u0301xecute', 'simulation:A\u030Angstrom']) {
  const nonNfkcScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', nonNfkcScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    nonNfkcScopeCreate,
    'identity-cli-session-create non-NFKC scope',
  );
}
for (const scope of ['simulation:\uFF52un', 'simulation:\uFF45xecute']) {
  const nonNfkcScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', nonNfkcScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    nonNfkcScopeCreate,
    'identity-cli-session-create compatibility-equivalent non-NFKC scope',
  );
}
for (const scope of ['simulation:\u0000run', 'simulation:\u0085run']) {
  const controlBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', controlBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    controlBearingScopeCreate,
    'identity-cli-session-create control-bearing scope',
  );
}
for (const scope of ['simulation:\u00A0run', 'simulation:\u2003run', 'simulation:\u2028run', 'simulation:\u2029run']) {
  const whitespaceBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', whitespaceBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    whitespaceBearingScopeCreate,
    'identity-cli-session-create whitespace-bearing scope',
  );
}
for (const scope of ['simulation:\u200Brun', 'simulation:\u2060run']) {
  const formatControlBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', formatControlBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    formatControlBearingScopeCreate,
    'identity-cli-session-create format-control-bearing scope',
  );
}
for (const scope of ['simulation:\uFDD0run', 'simulation:\u{1FFFE}run']) {
  const noncharacterBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', noncharacterBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    noncharacterBearingScopeCreate,
    'identity-cli-session-create noncharacter-bearing scope',
  );
}
for (const scope of ['simulation:\uE000run', 'simulation:\u{F0000}run']) {
  const privateUseBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', privateUseBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    privateUseBearingScopeCreate,
    'identity-cli-session-create private-use-bearing scope',
  );
}
for (const scope of ['simulation:\uFE0Frun', 'simulation:\u{E0100}run']) {
  const variationSelectorBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', variationSelectorBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    variationSelectorBearingScopeCreate,
    'identity-cli-session-create variation-selector-bearing scope',
  );
}
for (const scope of ['simulation:\u034Frun', 'simulation:\u115Frun']) {
  const defaultIgnorableBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', defaultIgnorableBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    defaultIgnorableBearingScopeCreate,
    'identity-cli-session-create default-ignorable-bearing scope',
  );
}
for (const scope of ['simulation:run\u0338', 'simulation:run\u20E3']) {
  const combiningMarkBearingScopeCreate = { scopes: [scope] };
  requireInvalid('identity-cli-session-create', combiningMarkBearingScopeCreate);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    combiningMarkBearingScopeCreate,
    'identity-cli-session-create combining-mark-bearing scope',
  );
}
for (const field of ['cli_name', 'cli_version', 'hostname']) {
  const malformedMetadata = { [field]: '\uD800' };
  requireInvalid('identity-cli-session-create', malformedMetadata);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionCreateSchema,
    malformedMetadata,
    `identity-cli-session-create malformed ${field}`,
  );
  for (const value of [' ', ` padded-${field}`, `padded-${field} `]) {
    const noncanonicalMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', noncanonicalMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      noncanonicalMetadata,
      `identity-cli-session-create noncanonical ${field}`,
    );
  }
  for (const value of [`control\u0000${field}`, `control\n${field}`]) {
    const controlBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', controlBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      controlBearingMetadata,
      `identity-cli-session-create control-bearing ${field}`,
    );
  }
  for (const value of [`control\u0085${field}`, `control\u009B${field}`]) {
    const c1ControlBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', c1ControlBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      c1ControlBearingMetadata,
      `identity-cli-session-create C1-control-bearing ${field}`,
    );
  }
  for (const value of [`separator\u2028${field}`, `separator\u2029${field}`]) {
    const separatorBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', separatorBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      separatorBearingMetadata,
      `identity-cli-session-create separator-bearing ${field}`,
    );
  }
  for (const value of [`format\u200B${field}`, `format\u2060${field}`]) {
    const formatControlBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', formatControlBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      formatControlBearingMetadata,
      `identity-cli-session-create format-control-bearing ${field}`,
    );
  }
  for (const value of [`noncharacter\uFDD0${field}`, `noncharacter\uFFFF${field}`]) {
    const noncharacterBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', noncharacterBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      noncharacterBearingMetadata,
      `identity-cli-session-create noncharacter-bearing ${field}`,
    );
  }
  for (const value of [`private-use\uE000${field}`, `private-use\uF8FF${field}`]) {
    const privateUseBearingMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', privateUseBearingMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      privateUseBearingMetadata,
      `identity-cli-session-create private-use-bearing ${field}`,
    );
  }
  for (const value of [`decomposed-e\u0301-${field}`, `decomposed-A\u030A-${field}`]) {
    const nonNfcMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', nonNfcMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      nonNfcMetadata,
      `identity-cli-session-create non-NFC ${field}`,
    );
  }
  for (const value of [`bidi\u202E${field}`, `bidi\u2066${field}`]) {
    const bidirectionalControlMetadata = { [field]: value };
    requireInvalid('identity-cli-session-create', bidirectionalControlMetadata);
    requireRuntimeInvalid(
      contracts.IdentityCliSessionCreateSchema,
      bidirectionalControlMetadata,
      `identity-cli-session-create bidirectional-control ${field}`,
    );
  }
}
const identityScopeConfigurationSemantics = 'Provider identity scope configuration MUST define non-empty allowed and default scope lists containing non-empty strings without Unicode White_Space property characters, Unicode C0/C1 control characters, Unicode General Category Cf format controls, Unicode noncharacter code points, Unicode private-use code points, Unicode variation selectors, Unicode default-ignorable code points, or Unicode combining marks, unique within each list, with every default scope present in the allowed list. Malformed, duplicate, empty, whitespace-bearing, control-bearing, format-control-bearing, noncharacter-bearing, private-use-bearing, variation-selector-bearing, default-ignorable-bearing, combining-mark-bearing, non-NFKC, or unsupported configured scopes MUST fail closed at startup and request time instead of being normalized, trimmed, sanitized, or deduplicated. Every configured scope MUST contain only Unicode scalar values and already use exact NFKC normalization; unpaired UTF-16 surrogate escapes, canonically or compatibility-equivalent alternate spellings, whitespace-bearing values, control-bearing values, format-control-bearing values, noncharacter-bearing values, private-use-bearing values, variation-selector-bearing values, default-ignorable-bearing values, and combining-mark-bearing values MUST fail closed at startup and request time before session creation or persistence access.';
const createAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-create.schema.json'
)?.schema;
if (createAuthority?.description !== identityScopeConfigurationSemantics + ' ' + cliMetadataUnicodeSemantics) {
  throw new Error('identity-cli-session-create lacks strict scope configuration semantics');
}
if (contracts.IdentityCliSessionCreateSchema.description !== identityScopeConfigurationSemantics + ' ' + cliMetadataUnicodeSemantics) {
  throw new Error('identity-cli-session-create runtime validator drifted from scope configuration semantics');
}
if (createAuthority?.properties?.scopes?.items?.description !== canonicalIdentityScopeSemantics ||
    createAuthority?.properties?.scopes?.items?.['x-unicode-normalization'] !== 'NFKC' ||
    contracts.IdentityCliSessionCreateSchema.shape.scopes.unwrap().element.description !== canonicalIdentityScopeSemantics) {
  throw new Error('identity-cli-session-create lacks canonical identity-scope semantics');
}
for (const field of ['cli_name', 'cli_version', 'hostname']) {
  if (createAuthority?.properties?.[field]?.description !== canonicalCliMetadataSemantics ||
      createAuthority?.properties?.[field]?.['x-unicode-normalization'] !== 'NFC' ||
      contracts.IdentityCliSessionCreateSchema.shape[field].unwrap().description !== canonicalCliMetadataSemantics) {
    throw new Error(`identity-cli-session-create lacks canonical ${field} semantics`);
  }
}
const sessionCreateAtomicitySemantics = 'CLI session creation MUST insert the provisional session and validate the complete create response inside one serializable transaction before COMMIT. Response construction or validation failure MUST roll back the provisional session so an error cannot leave a durable orphaned session.';
const sessionCreateFreshExpirySemantics = 'After provisional insertion has acquired storage constraints, the provider MUST refresh expires_at from a non-transaction-start persistence wall clock, construct and validate the response from that refreshed expiry, and recheck that the session remains unexpired immediately before COMMIT. A session that expires during creation MUST roll back instead of returning an already-expired session with a fresh lifetime claim.';
const sessionVerificationUrlConfigurationSemantics = 'The configured CLI verification URL MUST be an exact canonically serialized HTTPS URL without surrounding whitespace, username, password, query, or fragment. Parsing and serializing MUST reproduce the exact configured string. Providers MUST validate one exact snapshot at startup and request time before persistence access or provisional session insertion and MUST use that snapshot to construct verification_url by adding only the generated session code. Malformed, non-canonical, explicit-default-port, dot-segment, credential-bearing, query-bearing, fragment-bearing, or non-string configuration MUST fail closed as identity_configuration_error.';
const createdAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-created.schema.json'
)?.schema;
if (createdAuthority?.description !== sessionCreateAtomicitySemantics + ' ' + sessionCreateFreshExpirySemantics + ' ' + sessionVerificationUrlConfigurationSemantics) {
  throw new Error('identity-cli-session-created lacks atomic fresh-expiry and canonical verification URL semantics');
}
if (contracts.IdentityCliSessionCreatedSchema.description !== sessionCreateAtomicitySemantics + ' ' + sessionCreateFreshExpirySemantics + ' ' + sessionVerificationUrlConfigurationSemantics) {
  throw new Error('identity-cli-session-created runtime validator drifted from atomic fresh-expiry and canonical verification URL semantics');
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
for (const scope of ['simulation:e\u0301xecute', 'simulation:A\u030Angstrom']) {
  const nonNfkcScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', nonNfkcScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    nonNfkcScopeAuthorization,
    'identity-cli-session-authorize non-NFKC scope',
  );
}
for (const scope of ['simulation:\uFF52un', 'simulation:\uFF45xecute']) {
  const nonNfkcScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', nonNfkcScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    nonNfkcScopeAuthorization,
    'identity-cli-session-authorize compatibility-equivalent non-NFKC scope',
  );
}
for (const scope of ['simulation:\u0000run', 'simulation:\u0085run']) {
  const controlBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', controlBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    controlBearingScopeAuthorization,
    'identity-cli-session-authorize control-bearing scope',
  );
}
for (const scope of ['simulation:\u00A0run', 'simulation:\u2003run', 'simulation:\u2028run', 'simulation:\u2029run']) {
  const whitespaceBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', whitespaceBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    whitespaceBearingScopeAuthorization,
    'identity-cli-session-authorize whitespace-bearing scope',
  );
}
for (const scope of ['simulation:\u200Brun', 'simulation:\u2060run']) {
  const formatControlBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', formatControlBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    formatControlBearingScopeAuthorization,
    'identity-cli-session-authorize format-control-bearing scope',
  );
}
for (const scope of ['simulation:\uFDD0run', 'simulation:\u{1FFFE}run']) {
  const noncharacterBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', noncharacterBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    noncharacterBearingScopeAuthorization,
    'identity-cli-session-authorize noncharacter-bearing scope',
  );
}
for (const scope of ['simulation:\uE000run', 'simulation:\u{F0000}run']) {
  const privateUseBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', privateUseBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    privateUseBearingScopeAuthorization,
    'identity-cli-session-authorize private-use-bearing scope',
  );
}
for (const scope of ['simulation:\uFE0Frun', 'simulation:\u{E0100}run']) {
  const variationSelectorBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', variationSelectorBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    variationSelectorBearingScopeAuthorization,
    'identity-cli-session-authorize variation-selector-bearing scope',
  );
}
for (const scope of ['simulation:\u034Frun', 'simulation:\u115Frun']) {
  const defaultIgnorableBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', defaultIgnorableBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    defaultIgnorableBearingScopeAuthorization,
    'identity-cli-session-authorize default-ignorable-bearing scope',
  );
}
for (const scope of ['simulation:run\u0338', 'simulation:run\u20E3']) {
  const combiningMarkBearingScopeAuthorization = { session_code: 'ABCD1234', scopes: [scope] };
  requireInvalid('identity-cli-session-authorize', combiningMarkBearingScopeAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    combiningMarkBearingScopeAuthorization,
    'identity-cli-session-authorize combining-mark-bearing scope',
  );
}
if (authorizeAuthority?.properties?.scopes?.items?.description !== canonicalIdentityScopeSemantics ||
    authorizeAuthority?.properties?.scopes?.items?.['x-unicode-normalization'] !== 'NFKC' ||
    contracts.IdentityCliSessionAuthorizeSchema.shape.scopes.unwrap().element.description !== canonicalIdentityScopeSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical identity-scope semantics');
}
const malformedKeyNameAuthorization = { session_code: 'ABCD1234', key_name: '\uD800' };
requireInvalid('identity-cli-session-authorize', malformedKeyNameAuthorization);
requireRuntimeInvalid(
  contracts.IdentityCliSessionAuthorizeSchema,
  malformedKeyNameAuthorization,
  'identity-cli-session-authorize malformed key_name',
);
if (authorizeAuthority?.properties?.key_name?.description !== canonicalCliMetadataSemantics ||
    authorizeAuthority?.properties?.key_name?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityCliSessionAuthorizeSchema.shape.key_name.unwrap().description !== canonicalCliMetadataSemantics) {
  throw new Error('identity-cli-session-authorize lacks canonical key_name semantics');
}
for (const key_name of [' ', ' CLI Key', 'CLI Key ']) {
  const noncanonicalKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', noncanonicalKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    noncanonicalKeyNameAuthorization,
    'identity-cli-session-authorize noncanonical key_name',
  );
}
for (const key_name of ['CLI\u0000Key', 'CLI\nKey']) {
  const controlBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', controlBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    controlBearingKeyNameAuthorization,
    'identity-cli-session-authorize control-bearing key_name',
  );
}
for (const key_name of ['CLI\u0085Key', 'CLI\u009BKey']) {
  const c1ControlBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', c1ControlBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    c1ControlBearingKeyNameAuthorization,
    'identity-cli-session-authorize C1-control-bearing key_name',
  );
}
for (const key_name of ['CLI\u2028Key', 'CLI\u2029Key']) {
  const separatorBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', separatorBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    separatorBearingKeyNameAuthorization,
    'identity-cli-session-authorize separator-bearing key_name',
  );
}
for (const key_name of ['CLI\u200BKey', 'CLI\u2060Key']) {
  const formatControlBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', formatControlBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    formatControlBearingKeyNameAuthorization,
    'identity-cli-session-authorize format-control-bearing key_name',
  );
}
for (const key_name of ['CLI\uFDD0Key', 'CLI\uFFFFKey']) {
  const noncharacterBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', noncharacterBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    noncharacterBearingKeyNameAuthorization,
    'identity-cli-session-authorize noncharacter-bearing key_name',
  );
}
for (const key_name of ['CLI\uE000Key', 'CLI\uF8FFKey']) {
  const privateUseBearingKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', privateUseBearingKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    privateUseBearingKeyNameAuthorization,
    'identity-cli-session-authorize private-use-bearing key_name',
  );
}
for (const key_name of ['CLI e\u0301 Key', 'CLI A\u030A Key']) {
  const nonNfcKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', nonNfcKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    nonNfcKeyNameAuthorization,
    'identity-cli-session-authorize non-NFC key_name',
  );
}
for (const key_name of ['CLI\u202EKey', 'CLI\u2066Key']) {
  const bidirectionalControlKeyNameAuthorization = { session_code: 'ABCD1234', key_name };
  requireInvalid('identity-cli-session-authorize', bidirectionalControlKeyNameAuthorization);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionAuthorizeSchema,
    bidirectionalControlKeyNameAuthorization,
    'identity-cli-session-authorize bidirectional-control key_name',
  );
}
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
for (const persistedMembershipEmail of ['Owner@example.com', 'owner@example.com ', 'owner\u0000@example.com']) {
  const malformedPollResponse = {
    status: 'completed',
    email: persistedMembershipEmail,
    payment_status: 'paid',
    organization_id: organizationId,
    role: 'owner',
  };
  requireInvalid('identity-cli-session-poll', malformedPollResponse);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionPollSchema,
    malformedPollResponse,
    'identity-cli-session-poll malformed persisted membership email',
  );
}
for (const persistedPaymentStatus of ['overdue', '', 1, null]) {
  const malformedPollResponse = {
    status: 'completed',
    email: 'owner@example.com',
    payment_status: persistedPaymentStatus,
    organization_id: organizationId,
    role: 'owner',
  };
  requireInvalid('identity-cli-session-poll', malformedPollResponse);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionPollSchema,
    malformedPollResponse,
    'identity-cli-session-poll malformed persisted membership payment status',
  );
}
for (const persistedOrganizationId of ['org\u0000admin', 'org\uD800admin', ' org-admin']) {
  const malformedPollResponse = {
    status: 'completed',
    email: 'owner@example.com',
    payment_status: 'paid',
    organization_id: persistedOrganizationId,
    role: 'owner',
  };
  requireInvalid('identity-cli-session-poll', malformedPollResponse);
  requireRuntimeInvalid(
    contracts.IdentityCliSessionPollSchema,
    malformedPollResponse,
    'identity-cli-session-poll malformed persisted organization',
  );
}
const deliveryBindingSemantics = 'A completed CLI session MUST deliver api_key only while the original authorizing membership remains active and bound to the same organization and the issued key remains active, unrevoked, unexpired, with persisted scopes that remain a non-empty unique subset of the current allowlist. Membership and key state MUST be row-locked in the same serializable delivery transaction. ' + uniqueDeliveryMembershipSemantics + ' ' + deliveryStateSemantics + ' ' + completedPollKeyActivitySemantics + ' ' + completedPollFinalKeyActivitySemantics + ' ' + apiKeyExpirySemantics + ' Malformed, empty, duplicate, or retired key scopes MUST fail closed before delivery or erasure. The encrypted delivery copy MUST be authenticated with associated data binding the session_code, organization_id, and key_id; swapping the ciphertext or any binding field between sessions MUST fail closed before plaintext delivery or erasure. The decrypted api_key MUST hash to the referenced active key_id before delivery or erasure. ' + deliveryPlaintextSemantics + ' ' + deliveryEnvelopePresenceSemantics + ' ' + canonicalDeliveryEnvelopeSemantics + ' ' + deliveryResponseSemantics + ' API-key delivery is one-time. ' + sessionExpirySemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics + ' ' + sessionEncryptionConfigurationSemantics;
const pollAuthority = schemas.find(({ schema }) =>
  schema.$id === 'https://agentics.org/contracts/data-plane/v1/identity-cli-session-poll.schema.json'
)?.schema;
if (pollAuthority?.oneOf?.[1]?.description !== deliveryBindingSemantics) {
  throw new Error('identity-cli-session-poll lacks delivery-time tenant and key binding semantics');
}
if (contracts.IdentityCliSessionPollSchema.options?.[1]?.description !== deliveryBindingSemantics) {
  throw new Error('identity-cli-session-poll runtime validator drifted from delivery binding semantics');
}
if (pollAuthority?.oneOf?.[1]?.properties?.organization_id?.description !== canonicalIdentityOrganizationSemantics ||
    pollAuthority?.oneOf?.[1]?.properties?.organization_id?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityCliSessionPollSchema.options?.[1]?.shape?.organization_id?.description !== canonicalIdentityOrganizationSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted session organization semantics');
}
if (pollAuthority?.['x-persisted-membership-email'] !== canonicalPersistedMembershipEmailSemantics ||
    pollAuthority?.oneOf?.[1]?.properties?.email?.description !== canonicalPersistedMembershipEmailSemantics ||
    pollAuthority?.oneOf?.[1]?.properties?.email?.['x-unicode-normalization'] !== 'NFC' ||
    contracts.IdentityCliSessionPollSchema.options?.[1]?.shape?.email?.description !== canonicalPersistedMembershipEmailSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted membership email semantics');
}
if (pollAuthority?.['x-persisted-membership-payment-status'] !== canonicalPersistedMembershipPaymentStatusSemantics ||
    pollAuthority?.oneOf?.[1]?.properties?.payment_status?.description !== canonicalPersistedMembershipPaymentStatusSemantics ||
    contracts.IdentityCliSessionPollSchema.options?.[1]?.shape?.payment_status?.description !== canonicalPersistedMembershipPaymentStatusSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted membership payment-status semantics');
}
if (pollAuthority?.['x-persisted-membership-role'] !== canonicalPersistedMembershipRoleSemantics ||
    pollAuthority?.oneOf?.[1]?.properties?.role?.description !== canonicalPersistedMembershipRoleSemantics ||
    contracts.IdentityCliSessionPollSchema.options?.[1]?.shape?.role?.description !== canonicalPersistedMembershipRoleSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted membership-role semantics');
}
if (pollAuthority?.['x-persisted-cli-session-status'] !== canonicalPersistedCliSessionStatusSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted session-status semantics');
}
if (pollAuthority?.['x-persisted-cli-session-code'] !== canonicalPersistedCliSessionCodeSemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted session-code semantics');
}
if (pollAuthority?.['x-persisted-cli-authorizing-identity'] !== canonicalPersistedCliAuthorizingIdentitySemantics) {
  throw new Error('identity-cli-session-poll lacks canonical persisted authorizing-identity semantics');
}

console.log(`validated ${files.length} authoritative schemas`);
