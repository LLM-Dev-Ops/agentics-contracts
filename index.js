/**
 * @agentics/contracts
 *
 * Authoritative contract layer for the Agentics platform.
 * This module provides programmatic access to all JSON Schema contracts
 * that govern request/response validation across the platform.
 *
 * IMPORTANT: These contracts are AUTHORITATIVE and ENFORCEABLE.
 * No service may bypass contract validation.
 */

const path = require('path');
const { z } = require('zod');

function isWellFormedUnicode(value) {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (!(nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff)) return false;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

const ExecutionIntentSchema = z.object({ id:z.string().min(1),caller:z.string().min(1),action:z.string().min(1),target:z.string().min(1),parameters:z.record(z.unknown()).default({}),metadata:z.record(z.unknown()).default({}),is_meta_simulation:z.boolean().default(false) });
const NodeType = z.enum(['execution_root','core','repo','agent']);
const GraphNodeSchema = z.object({id:z.string().min(1),type:NodeType,name:z.string().min(1),parent_id:z.string().nullable(),children_ids:z.array(z.string())});
const GraphEdgeSchema = z.object({from:z.string().min(1),to:z.string().min(1)});
const ExecutionGraphSchema = z.object({nodes:z.array(GraphNodeSchema),edges:z.array(GraphEdgeSchema),validated:z.boolean().default(false)});
const EvidenceEntrySchema = z.object({timestamp:z.string().datetime(),layer:z.string().min(1),action:z.string().min(1),detail:z.record(z.unknown())});
const EvidenceSummarySchema = z.object({execution_id:z.string().min(1),entries:z.array(EvidenceEntrySchema)});
const CostReferenceSchema = z.object({ref_id:z.string().min(1),computed_at:z.string().datetime()});
const ResultStatus = z.enum(['success','failure','partial']);
const CoreExecutionResultSchema = z.object({core_name:z.string().min(1),execution_id:z.string().min(1),status:ResultStatus,evidence:EvidenceSummarySchema,cost_ref:CostReferenceSchema.nullable(),outputs:z.record(z.unknown())});
const PolicyDecisionSchema = z.object({decision:z.enum(['allow','deny']),rationale:z.string(),rule_id:z.string().nullable(),evaluated_at:z.string().datetime()});
const ExecutionContextSchema = z.object({execution_id:z.string().min(1),parent_span_id:z.string().min(1),simulation_resolution:z.string().min(1),repo_name:z.string().min(1)});
const ResultPacketSchema = z.object({execution_id:z.string().min(1),repo_name:z.string().min(1),result:CoreExecutionResultSchema});

const principalBindingSemantics = 'Tenant-bound and identity-provider routes MUST accept exactly one Cloud Run IAM bearer credential from the selected transport-identity header. Duplicate, empty, or whitespace-padded transport credentials MUST fail closed before token decoding, principal binding, allowlist evaluation, or persistence access; X-Serverless-Authorization MAY remain separate from Authorization when the latter carries an end-user JWT. Providers MUST determine credential multiplicity from the raw wire-level header occurrences; normalized header maps that collapse duplicates are insufficient. The configured service audience MUST be a non-empty string without surrounding whitespace, and the exact validated value MUST be used for both token-audience matching and the emitted principal or caller audience. Malformed, empty, whitespace-only, whitespace-padded, or non-string audience configuration MUST fail closed at startup and request time before token decoding, principal binding, allowlist evaluation, or persistence access. The decoded Cloud Run IAM aud claim MUST be the configured non-empty audience string or a non-empty array of unique non-empty strings without surrounding whitespace containing the configured audience exactly once. Every audience entry MUST contain only Unicode scalar values; malformed, empty, whitespace-only, whitespace-padded, non-string, duplicate, or unpaired-surrogate audience entries MUST fail closed before principal binding, allowlist evaluation, or persistence access. The decoded Cloud Run IAM email claim MUST be a valid non-empty string email without surrounding whitespace and the subject claim MUST be a non-empty string without surrounding whitespace. Missing, malformed, empty, whitespace-only, whitespace-padded, or non-string principal claims MUST fail closed before normalization, principal binding, allowlist evaluation, or persistence access; email MAY be normalized to lowercase only after validation. Configured IAM principal bindings MUST map each case-insensitively unique principal email to exactly one non-empty string organization_id. Providers MUST reject duplicate raw JSON member names in principal-binding configuration before parsing; parser overwrite order MUST NOT select an organization binding. Identity-provider caller allowlists MUST contain non-empty, case-insensitively unique principal emails without surrounding whitespace. Duplicate canonical principals, malformed or whitespace-padded principal entries, and non-string or empty organization identifiers MUST fail closed at startup and request time instead of being overwritten or coerced. Configured service audiences, principal-binding keys and organization identifiers, and identity-provider caller principals MUST contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed at startup and request time before comparison, emission, principal binding, or persistence access.';
const transportSerializationSemantics = 'The selected Cloud Run IAM credential MUST use compact JWT serialization with exactly three non-empty, unpadded canonical base64url components. Every component MUST decode and re-encode to the exact original value before claim access; malformed, empty, padded, or alternate encodings MUST fail closed as unauthenticated before principal binding, allowlist evaluation, or persistence access. The protected-header and payload components MUST decode as valid UTF-8 without byte-order marks or replacement characters before JSON parsing or member access; malformed or byte-order-marked UTF-8 MUST fail closed as unauthenticated. The validated key identifier and subject MUST each contain only Unicode scalar values; unpaired UTF-16 surrogate escapes MUST fail closed before principal binding or persistence access.';
const transportProtectedHeaderSemantics = 'The decoded Cloud Run IAM JWT protected header MUST be a non-null JSON object using alg exactly RS256, typ exactly JWT, and a non-empty string kid without surrounding whitespace, and MUST NOT contain crit because no critical-header extensions are supported. Every top-level protected-header member name MUST occur exactly once; duplicate member names MUST fail closed instead of being resolved by parser overwrite order. Null, array, primitive, parser-invalid, duplicate-member, missing, malformed, non-string, whitespace-padded, alternate algorithm or token-type, and critical-extension headers MUST fail closed as unauthenticated before claim access, principal binding, allowlist evaluation, or persistence access.';
const transportPayloadSemantics = 'The decoded Cloud Run IAM JWT payload MUST be a non-null JSON object and MUST NOT be an array or primitive. Every top-level payload member name MUST occur exactly once; duplicate claim names MUST fail closed instead of being resolved by parser overwrite order. Null, array, primitive, and duplicate-member payloads MUST fail closed as unauthenticated before claim access, principal binding, allowlist evaluation, or persistence access; raw parser exceptions MUST NOT escape as service errors.';
const principalAuthoritySemantics = transportSerializationSemantics + ' ' + transportProtectedHeaderSemantics + ' ' + transportPayloadSemantics + ' ' + principalBindingSemantics;
const DataPlanePrincipalSchema = z.object({
  subject: z.string().min(1).refine((value) => value.trim() === value),
  principal: z.string().email().refine((value) => value.trim() === value),
  organization_id: z.string().min(1),
  audience: z.string().min(1),
  mapping_source: z.literal('configured_principal_binding')
}).describe(principalAuthoritySemantics);
const canonicalPersistedApiKeyHashSemantics = 'Every persisted API-key hash resolved from an active API-key row MUST already be exactly 64 lowercase ASCII hexadecimal characters. Missing, malformed, non-string, uppercase, whitespace-padded, or alternate values MUST fail closed immediately after the key row lock and before key activity evaluation, replay or delivery response emission, persistence mutation, or COMMIT; providers MUST NOT lowercase, normalize, trim, coerce, infer, or disclose persisted key hashes.';
const IdentityApiKeyHashSchema = z.string().regex(/^[a-f0-9]{64}$/).describe(
  canonicalPersistedApiKeyHashSemantics
);
const IdentityApiKeyLookupSchema = z.object({
  key_hash: IdentityApiKeyHashSchema
}).strict();
const canonicalIdentityScopeSemantics = 'Every configured, requested, and persisted identity scope MUST be a non-empty Unicode-scalar string already in exact NFKC normalization and MUST NOT contain Unicode White_Space property characters, Unicode C0/C1 control characters, Unicode General Category Cf format controls, Unicode noncharacter code points, Unicode private-use code points, Unicode variation selectors, Unicode default-ignorable code points, or Unicode combining marks. Canonically or compatibility-equivalent alternate spellings, whitespace-bearing values, control-bearing values, format-control-bearing values, noncharacter-bearing values, private-use-bearing values, variation-selector-bearing values, default-ignorable-bearing values, and combining-mark-bearing values MUST fail closed before identity verification, entitlement evaluation, API-key creation, response emission, or persistence access; providers MUST NOT normalize, trim, or sanitize caller, configuration, or persisted scope values.';
const IdentityScopeSchema = z.string().min(1).refine(isWellFormedUnicode).refine(
  (scope) => scope.normalize('NFKC') === scope,
  { message: 'Scopes must use exact NFKC normalization' }
).refine(
  (scope) => !/[\u0000-\u001F\u007F-\u009F]/u.test(scope),
  { message: 'Scopes must not contain Unicode C0 or C1 control characters' }
).refine(
  (scope) => !/\p{White_Space}/u.test(scope),
  { message: 'Scopes must not contain Unicode whitespace characters' }
).refine(
  (scope) => !/\p{Cf}/u.test(scope),
  { message: 'Scopes must not contain Unicode format controls' }
).refine(
  (scope) => !/\p{Noncharacter_Code_Point}/u.test(scope),
  { message: 'Scopes must not contain Unicode noncharacter code points' }
).refine(
  (scope) => !/\p{Co}/u.test(scope),
  { message: 'Scopes must not contain Unicode private-use code points' }
).refine(
  (scope) => !/\p{Variation_Selector}/u.test(scope),
  { message: 'Scopes must not contain Unicode variation selectors' }
).refine(
  (scope) => !/\p{Default_Ignorable_Code_Point}/u.test(scope),
  { message: 'Scopes must not contain Unicode default-ignorable code points' }
).refine(
  (scope) => !/\p{M}/u.test(scope),
  { message: 'Scopes must not contain Unicode combining marks' }
).describe(canonicalIdentityScopeSemantics);
const IdentityScopeListSchema = z.array(IdentityScopeSchema).min(1).refine(
  (scopes) => new Set(scopes).size === scopes.length,
  { message: 'Scopes must be unique' }
);
const canonicalMetadataValue = (value) =>
  value.normalize('NFC') === value &&
  value.trim() === value &&
  !/[\u0000-\u001F\u007F-\u009F]/u.test(value) &&
  !/[\u2028\u2029]/u.test(value) &&
  !/\p{Cf}/u.test(value) &&
  !/\p{Noncharacter_Code_Point}/u.test(value) &&
  !/\p{Co}/u.test(value) &&
  !/[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u.test(value) &&
  isWellFormedUnicode(value);
const canonicalIdentityOrganizationSemantics = 'Every persisted organization_id resolved from an API key, entitlement, active membership, or completed CLI session MUST be a non-empty, at-most-255-character, exact NFC-normalized Unicode-scalar string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Malformed or noncanonical organization identifiers from an API-key row MUST fail closed immediately after that row lock and before key activity evaluation or entitlement access. Malformed or noncanonical active-membership or completed-session organization identifiers MUST fail closed immediately after their row lock and before CLI session access, membership access, tenant-quota or API-key access, response emission, persistence mutation, or COMMIT; providers MUST NOT normalize, trim, sanitize, coerce, or disclose them.';
const IdentityOrganizationIdSchema = z.string().min(1).max(255).refine(canonicalMetadataValue).describe(canonicalIdentityOrganizationSemantics);
const canonicalPersistedMembershipEmailSemantics = 'Every persisted email resolved from an active identity membership MUST be a valid non-empty, at-most-320-character, exact lowercase NFC-normalized Unicode-scalar email string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Malformed or noncanonical membership email values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT lowercase, normalize, trim, sanitize, coerce, or disclose them.';
const IdentityMembershipEmailSchema = z.string().min(1).max(320).email().refine(canonicalMetadataValue).refine(
  (value) => value.toLowerCase() === value,
  { message: 'Persisted membership emails must already be lowercase' }
).describe(canonicalPersistedMembershipEmailSemantics);
const canonicalPersistedMembershipPaymentStatusSemantics = 'Every persisted payment_status resolved from an active identity membership MUST be exactly one of paid, unpaid, trial, or internal. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const IdentityMembershipPaymentStatusSchema = z.enum(['paid','unpaid','trial','internal']).describe(
  canonicalPersistedMembershipPaymentStatusSemantics
);
const canonicalPersistedMembershipRoleSemantics = 'Every persisted role resolved from an active identity membership MUST be exactly owner. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the membership row lock and before CLI session, tenant-quota, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const IdentityMembershipRoleSchema = z.literal('owner').describe(
  canonicalPersistedMembershipRoleSemantics
);
const canonicalPersistedApiKeyNameSemantics = 'Every persisted API-key name resolved from an active API-key row MUST already be a non-empty, at-most-255-character, exact NFC-normalized Unicode-scalar string without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format or bidirectional controls, Unicode noncharacter code points, or Unicode private-use code points. Missing, malformed, non-string, or noncanonical names MUST fail closed immediately after the key row lock and before key activity evaluation, replay or delivery response emission, persistence mutation, or COMMIT; providers MUST NOT normalize, trim, sanitize, coerce, infer, or disclose persisted key names.';
const IdentityApiKeyNameSchema = z.string().min(1).max(255).refine(canonicalMetadataValue).describe(
  canonicalPersistedApiKeyNameSemantics
);
const canonicalPersistedApiKeyIdSemantics = 'Every persisted API-key identifier resolved from an active key row or completed CLI session MUST already be an exact lowercase canonical RFC 4122 UUID. Malformed, uppercase, non-string, empty, or alternate identifiers MUST fail closed immediately after the relevant row lock and before key-activity evaluation, membership or entitlement access, response emission, persistence mutation, or COMMIT; providers MUST NOT lowercase, normalize, coerce, infer, or disclose them.';
const IdentityApiKeyIdSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
).describe(canonicalPersistedApiKeyIdSemantics);
const canonicalPersistedCliSessionStatusSemantics = 'Every persisted CLI session status resolved for authorization or polling MUST be exactly pending or completed. Missing, malformed, non-string, or alternate values MUST fail closed immediately after the session row lock and before session-expiry evaluation, tenant-quota, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, or disclose them.';
const IdentityCliSessionStatusSchema = z.enum(['pending','completed']).describe(
  canonicalPersistedCliSessionStatusSemantics
);
const canonicalPersistedCliSessionCodeSemantics = 'Every persisted CLI session_code resolved from a row lock MUST already be exactly eight uppercase ASCII letters or digits. Missing, malformed, non-string, lowercase, whitespace-padded, or alternate values MUST fail closed immediately after the session row lock and before status, session-expiry, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST NOT uppercase, normalize, trim, coerce, infer, or disclose persisted session codes.';
const IdentityCliSessionCodeSchema = z.string().regex(/^[A-Z0-9]{8}$/).describe(
  canonicalPersistedCliSessionCodeSemantics
);
const canonicalPersistedCliAuthorizingIdentitySemantics = 'Every completed CLI session authorized_issuer MUST be the exact configured canonical HTTPS end-user JWT issuer and authorized_subject MUST be a non-empty Unicode-scalar string without surrounding whitespace. Missing, malformed, non-string, whitespace-padded, noncanonical, or configuration-mismatched values MUST fail closed immediately after the session row lock and before session-expiry evaluation, membership, API-key, delivery-state, response, persistence-mutation, or COMMIT access; providers MUST validate one exact verifier-configuration snapshot and MUST NOT normalize, trim, coerce, infer, or disclose persisted authorizing identity values.';
const IdentityEndUserIssuerSchema = z.string().min(1).refine((value) => {
  if (value.trim() !== value || !isWellFormedUnicode(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.toString() === value &&
      url.username === '' && url.password === '' && url.search === '' && url.hash === '';
  } catch {
    return false;
  }
}).describe(canonicalPersistedCliAuthorizingIdentitySemantics);
const IdentityEndUserSubjectSchema = z.string().min(1)
  .refine((value) => value.trim() === value)
  .refine(isWellFormedUnicode)
  .describe(canonicalPersistedCliAuthorizingIdentitySemantics);
const activeApiKeyScopeSemantics = "An active API key response MUST contain a non-empty unique scope list that remains a subset of the provider's current allowlist; empty, malformed, duplicate, or retired scopes MUST fail closed and MUST NOT resolve as an active key.";
const activeLookupTransactionSemantics = 'API-key and entitlement lookup MUST row-lock the matching key in a serializable transaction before evaluating active, revocation, expiry, or current-scope state. Expiry MUST be evaluated with a non-transaction-start persistence wall clock after the lock and rechecked after response validation immediately before COMMIT; unknown, inactive, concurrently revoked, expired, or invalid-scope keys MUST fail closed without disclosure. Entitlement lookup MUST also row-lock the resolved organization entitlement before response validation.';
const IdentityApiKeyResponseSchema = z.object({
  key_id: IdentityApiKeyIdSchema,
  organization_id: IdentityOrganizationIdSchema,
  name: IdentityApiKeyNameSchema,
  scopes: IdentityScopeListSchema.describe(activeApiKeyScopeSemantics),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  last_used_at: z.string().datetime().nullable()
}).strict().describe(activeLookupTransactionSemantics);
const losslessEntitlementSemantics = 'Entitlement limits MUST be non-negative safe JSON integers no greater than 9007199254740991; providers MUST fail closed instead of rounding larger persisted BIGINT values.';
const apiKeyLimitSemantics = 'Maximum concurrently active, unrevoked, unexpired API keys permitted for the organization. Key creation MUST be denied when the current count is greater than or equal to this limit. After acquiring the per-tenant key-creation serialization lock, the provider MUST row-lock the resolved organization entitlement before reading max_api_keys or counting active keys; a concurrent entitlement change MUST block, retry, or fail serialization instead of permitting a decision from an unlocked stale limit. The active-key count MUST evaluate expiry after acquiring the per-tenant key-creation serialization lock, using a non-transaction-start persistence wall clock in the same transaction; transaction-start timestamps and service-process clock comparisons are forbidden. The limit and active count MUST remain lossless across persistence, aggregation and JSON serialization for the full safe-integer range. This value MUST be a non-negative safe JSON integer no greater than 9007199254740991; providers MUST fail closed instead of rounding a larger persisted BIGINT value.';
const entitlementActiveKeySemantics = "Entitlement lookup MUST resolve only for an active, unrevoked, unexpired API key whose persisted scopes remain a non-empty unique subset of the provider's current allowlist. Empty, malformed, duplicate, unsupported, or retired scopes MUST fail closed with the same non-disclosing response as an unknown or inactive key.";
const entitlementTenantBindingSemantics = "The row-locked entitlement organization_id MUST exactly equal the canonical organization_id of the row-locked active API key used to authorize the lookup. A missing, malformed, non-string, noncanonical, or mismatched entitlement tenant binding MUST fail closed immediately after the entitlement row lock and before plan or limit evaluation, active-key revalidation, response emission, or COMMIT; providers MUST NOT normalize, substitute, infer, or disclose a different tenant binding.";
const IdentityEntitlementResponseSchema = z.object({
  organization_id: IdentityOrganizationIdSchema,
  plan: z.enum(['free','developer','team','enterprise']),
  max_requests: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(losslessEntitlementSemantics),
  max_tokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(losslessEntitlementSemantics),
  max_api_keys: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(apiKeyLimitSemantics)
}).strict().describe(entitlementActiveKeySemantics + ' ' + activeLookupTransactionSemantics + ' ' + entitlementTenantBindingSemantics);
const identityScopeConfigurationSemantics = 'Provider identity scope configuration MUST define non-empty allowed and default scope lists containing non-empty strings without Unicode White_Space property characters, Unicode C0/C1 control characters, Unicode General Category Cf format controls, Unicode noncharacter code points, Unicode private-use code points, Unicode variation selectors, Unicode default-ignorable code points, or Unicode combining marks, unique within each list, with every default scope present in the allowed list. Malformed, duplicate, empty, whitespace-bearing, control-bearing, format-control-bearing, noncharacter-bearing, private-use-bearing, variation-selector-bearing, default-ignorable-bearing, combining-mark-bearing, non-NFKC, or unsupported configured scopes MUST fail closed at startup and request time instead of being normalized, trimmed, sanitized, or deduplicated. Every configured scope MUST contain only Unicode scalar values and already use exact NFKC normalization; unpaired UTF-16 surrogate escapes, canonically or compatibility-equivalent alternate spellings, whitespace-bearing values, control-bearing values, format-control-bearing values, noncharacter-bearing values, private-use-bearing values, variation-selector-bearing values, default-ignorable-bearing values, and combining-mark-bearing values MUST fail closed at startup and request time before session creation or persistence access.';
const cliMetadataUnicodeSemantics = 'CLI session metadata fields cli_name, cli_version, hostname, and key_name MUST contain only Unicode scalar values. Unpaired UTF-16 surrogate escapes MUST fail closed before identity verification, provisional session insertion, API-key insertion, session mutation, or persistence access; providers MUST NOT rely on lossy UTF-8 replacement during persistence or replay comparison.';
const canonicalCliMetadataSemantics = 'CLI metadata values MUST be non-empty NFC-normalized strings without surrounding whitespace, Unicode C0/C1 control characters, Unicode line or paragraph separators, Unicode format controls, Unicode noncharacter code points, or Unicode private-use code points. Empty, non-NFC, whitespace-only, whitespace-padded, control-bearing, separator-bearing, format-control-bearing, noncharacter-bearing, or private-use-bearing values MUST fail closed before identity verification, provisional session insertion, API-key insertion, session mutation, or persistence access; providers MUST NOT normalize, trim, or sanitize caller input.';
const canonicalCliMetadata = canonicalMetadataValue;
const IdentityCliSessionCreateSchema = z.object({
  cli_name: z.string().min(1).max(255).refine(canonicalCliMetadata).describe(canonicalCliMetadataSemantics).optional(),
  cli_version: z.string().min(1).max(255).refine(canonicalCliMetadata).describe(canonicalCliMetadataSemantics).optional(),
  hostname: z.string().min(1).max(255).refine(canonicalCliMetadata).describe(canonicalCliMetadataSemantics).optional(),
  scopes: IdentityScopeListSchema.optional()
}).strict().describe(identityScopeConfigurationSemantics + ' ' + cliMetadataUnicodeSemantics);
const sessionCreateAtomicitySemantics = 'CLI session creation MUST insert the provisional session and validate the complete create response inside one serializable transaction before COMMIT. Response construction or validation failure MUST roll back the provisional session so an error cannot leave a durable orphaned session.';
const sessionCreateFreshExpirySemantics = 'After provisional insertion has acquired storage constraints, the provider MUST refresh expires_at from a non-transaction-start persistence wall clock, construct and validate the response from that refreshed expiry, and recheck that the session remains unexpired immediately before COMMIT. A session that expires during creation MUST roll back instead of returning an already-expired session with a fresh lifetime claim.';
const sessionVerificationUrlConfigurationSemantics = 'The configured CLI verification URL MUST be an exact canonically serialized HTTPS URL without surrounding whitespace, username, password, query, or fragment. Parsing and serializing MUST reproduce the exact configured string. Providers MUST validate one exact snapshot at startup and request time before persistence access or provisional session insertion and MUST use that snapshot to construct verification_url by adding only the generated session code. Malformed, non-canonical, explicit-default-port, dot-segment, credential-bearing, query-bearing, fragment-bearing, or non-string configuration MUST fail closed as identity_configuration_error.';
const IdentityCliSessionCreatedSchema = z.object({
  session_code: IdentityCliSessionCodeSchema,
  device_code: z.string().regex(/^[a-f0-9]{64}$/),
  verification_url: z.string().url(),
  expires_at: z.string().datetime(),
  expires_in_seconds: z.literal(600),
  poll_interval_seconds: z.literal(5)
}).strict().describe(sessionCreateAtomicitySemantics + ' ' + sessionCreateFreshExpirySemantics + ' ' + sessionVerificationUrlConfigurationSemantics);
const sessionExpirySemantics = 'Session expiry MUST be evaluated after the session row lock is acquired, using a non-transaction-start persistence wall clock in the same transaction for authorization and polling; transaction-start timestamps and service-process clock comparisons are forbidden.';
const apiKeyExpirySemantics = 'API-key expiry MUST be evaluated after the referenced key row lock is acquired, using a non-transaction-start persistence wall clock in the same serializable transaction; transaction-start timestamps and service-process clock comparisons are forbidden.';
const replayIdentityOrderSemantics = 'Completed-session replay MUST compare the persisted authorizing issuer, subject, and organization to the verified active membership immediately after the session row lock and before evaluating session expiry or accessing the referenced API key; a mismatch MUST fail closed without disclosing session expiry or key state.';
const authorizationReplayRequestSemantics = 'A completed authorization replay that supplies key_name or scopes MUST match the row-locked referenced key; scopes are compared as an unordered unique set. Any conflicting replay MUST fail closed before the success response, while omitted optional fields remain idempotent.';
const authorizationReplayFinalKeyActivitySemantics = 'After constructing and validating a completed authorization replay response, the provider MUST re-evaluate the row-locked referenced key with a non-transaction-start persistence wall clock immediately before COMMIT. A key that expires before commit MUST prevent the replay response and roll back the transaction.';
const deliveryStateSemantics = 'Completed-session delivery state MUST be unambiguous: before first delivery encrypted_api_key is present and key_delivered_at is null; after delivery encrypted_api_key is null and key_delivered_at is non-null. Any other combination MUST fail closed before referenced-key access, plaintext disclosure, erasure, or a completed response.';
const completedPollKeyActivitySemantics = "Every completed-session poll, including polls after the one-time delivery copy has been erased, MUST row-lock and revalidate the referenced tenant key as active, unrevoked, unexpired, and carrying a non-empty unique scope list within the provider's current allowlist before returning completed tenant or membership data. Missing, cross-tenant, revoked, expired, malformed-scope, or retired-scope key references MUST fail closed without a completed response.";
const uniqueDeliveryMembershipSemantics = 'At every completed poll, the original authorizing issuer and subject MUST resolve to exactly one row-locked active membership in the persisted organization. Zero or multiple matching memberships MUST fail closed before delivery-state evaluation, referenced-key access, completed metadata, plaintext disclosure, erasure, or COMMIT.';
const completedPollMembershipBindingSemantics = "At every completed poll, the row-locked active membership issuer, subject, and organization_id MUST exactly equal the completed session's canonical authorized_issuer, authorized_subject, and organization_id. A missing, malformed, non-string, noncanonical, or mismatched completed-poll membership binding MUST fail closed immediately after the membership row lock and before delivery-state evaluation, referenced-key access, completed metadata, plaintext disclosure, erasure, or COMMIT; providers MUST NOT normalize, substitute, infer, or disclose a different identity or tenant binding.";
const completedPollApiKeyBindingSemantics = "At every completed poll, the row-locked referenced API key key_id and organization_id MUST exactly equal the completed session's canonical key_id and organization_id. A missing, malformed, non-string, noncanonical, or mismatched completed-poll API-key binding MUST fail closed immediately after the key row lock and before key activity revalidation, completed metadata, plaintext disclosure, erasure, or COMMIT; providers MUST NOT normalize, substitute, infer, or disclose a different key or tenant binding.";
const persistedCliDeliveryTimestampSemantics = 'Every non-null persisted key_delivered_at resolved from a completed CLI session row lock MUST already be a valid finite canonical UTC RFC 3339 timestamp with second or millisecond precision. Missing, malformed, non-Date, non-string, offset, noncanonical, or impossible timestamp values MUST fail closed immediately after the session row lock and before membership, API-key, delivery-state, completed metadata, plaintext disclosure, persistence mutation, or COMMIT access; providers MUST NOT normalize, coerce, infer, substitute, or disclose invalid delivery timestamps.';
const persistedCliDeliveryEnvelopeTypeSemantics = 'Every non-null persisted encrypted_api_key resolved from a completed CLI session row lock MUST already be a string. Malformed or non-string values MUST fail closed immediately after the session row lock and before membership, API-key, delivery-state, completed metadata, plaintext disclosure, persistence mutation, or COMMIT access; providers MUST NOT coerce, infer, substitute, or disclose invalid delivery envelopes.';
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
const IdentityCliSessionAuthorizeSchema = z.object({
  session_code: IdentityCliSessionCodeSchema,
  key_name: z.string().min(1).max(255).refine(canonicalCliMetadata).describe(canonicalCliMetadataSemantics).optional(),
  scopes: IdentityScopeListSchema.optional()
}).strict().describe(
  endUserJwtLifetimeSemantics + ' ' + cliMetadataUnicodeSemantics + " CLI session authorization MUST be performed by an active tenant membership with role owner, resolved from the verified issuer and subject; caller-supplied tenant ownership is forbidden. The verified issuer and subject MUST resolve to exactly one active tenant membership before CLI session access; zero or multiple active memberships MUST fail closed instead of selecting an arbitrary organization. The provider MUST revalidate the row-locked session's persisted requested scopes as a non-empty unique subset of the current allowlist before API-key creation; malformed, duplicate, empty, unsupported, or retired persisted scopes MUST fail closed. " + authorizationReplayRequestSemantics + ' ' + sessionExpirySemantics + ' ' + authorizationPrecommitSemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics + ' ' + sessionEncryptionConfigurationSemantics
);
const IdentityCliSessionAuthorizedSchema = z.object({
  success: z.literal(true),
  organization_id: IdentityOrganizationIdSchema,
  key_id: IdentityApiKeyIdSchema
}).strict().describe(
  'When replaying a completed CLI session, the provider MUST require the same verified issuer and subject that originally authorized the session, then return key_id only after row-locking an active, unrevoked, unexpired API key owned by the same authenticated organization whose persisted scopes remain a non-empty unique subset of the current allowlist; missing or mismatched authorizing identity, cross-tenant, malformed, empty, duplicate, retired-scope, revoked, or expired key references MUST fail closed. ' + replayIdentityOrderSemantics + ' ' + authorizationReplayRequestSemantics + ' ' + authorizationReplayFinalKeyActivitySemantics + ' ' + apiKeyExpirySemantics + ' ' + authorizationPrecommitSemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics
);
const IdentityCliSessionPollSchema = z.union([
  z.object({ status: z.enum(['pending','authorized']) }).strict(),
  z.object({
    status: z.literal('completed'),
    api_key: z.string().min(1).optional(),
    email: IdentityMembershipEmailSchema,
    payment_status: IdentityMembershipPaymentStatusSchema,
    organization_id: IdentityOrganizationIdSchema,
    role: IdentityMembershipRoleSchema
  }).strict().describe(
    'A completed CLI session MUST deliver api_key only while the original authorizing membership remains active and bound to the same organization and the issued key remains active, unrevoked, unexpired, with persisted scopes that remain a non-empty unique subset of the current allowlist. Membership and key state MUST be row-locked in the same serializable delivery transaction. ' + uniqueDeliveryMembershipSemantics + ' ' + completedPollMembershipBindingSemantics + ' ' + deliveryStateSemantics + ' ' + completedPollKeyActivitySemantics + ' ' + completedPollFinalKeyActivitySemantics + ' ' + apiKeyExpirySemantics + ' Malformed, empty, duplicate, or retired key scopes MUST fail closed before delivery or erasure. The encrypted delivery copy MUST be authenticated with associated data binding the session_code, organization_id, and key_id; swapping the ciphertext or any binding field between sessions MUST fail closed before plaintext delivery or erasure. The decrypted api_key MUST hash to the referenced active key_id before delivery or erasure. ' + deliveryPlaintextSemantics + ' ' + persistedCliDeliveryEnvelopeTypeSemantics + ' ' + deliveryEnvelopePresenceSemantics + ' ' + canonicalDeliveryEnvelopeSemantics + ' ' + deliveryResponseSemantics + ' API-key delivery is one-time. ' + sessionExpirySemantics + ' ' + finalSessionExpirySemantics + ' ' + postWriteSessionExpirySemantics + ' ' + sessionEncryptionConfigurationSemantics
  )
]);
const SimulationEventKind = z.enum([
  'created','started','step_started','step_completed','log','metric',
  'artifact','validation','completed','failed','cancelled'
]);
const SimulationEventAppendItemSchema = z.object({
  kind: SimulationEventKind,
  payload: z.unknown()
});
const SimulationEventsAppendRequestSchema = z.object({
  simulation_id: z.string().uuid(),
  idempotency_key: z.string().min(1).max(255),
  events: z.array(SimulationEventAppendItemSchema).min(1).max(100)
}).strict();
const SimulationEventSchema = z.object({
  id: z.string().regex(/^\d+$/),
  simulation_id: z.string().uuid(),
  seq: z.number().int().positive(),
  ts: z.string().datetime(),
  kind: SimulationEventKind,
  payload: z.unknown()
});
const SimulationEventsResponseSchema = z.object({
  organization_id: z.string().min(1),
  replayed: z.boolean(),
  events: z.array(SimulationEventSchema)
});
const ResultIndexLayerRecordSchema = z.object({
  layer_name:z.string().min(1),status:z.enum(['passed','failed','skipped']),duration_ms:z.number().nonnegative(),
  assertions_passed:z.number().int().nonnegative(),assertions_failed:z.number().int().nonnegative(),error:z.string().optional()
});
const ResultIndexExecutionProofSchema = z.object({proof_hash:z.string().min(1),layerRecords:z.array(ResultIndexLayerRecordSchema),generated_at:z.string().min(1)});
const ResultIndexExecutionMetadataSchema = z.object({
  execution_id:z.string().min(1),proof_hash:z.string().min(1),layers_executed:z.array(z.string()),schema_version:z.string().min(1),
  environment:z.string().min(1),started_at:z.string().min(1),completed_at:z.string().min(1),duration_ms:z.number().nonnegative()
});
const ResultIndexExecutionContextSchema = z.object({
  repo_name:z.string().min(1),environment:z.string().min(1),triggered_by:z.string().optional(),branch:z.string().optional(),commit_sha:z.string().optional()
});
const ResultIndexSummarySchema = z.object({
  assertions_passed:z.number().int().nonnegative(),assertions_failed:z.number().int().nonnegative(),
  total_layers:z.number().int().nonnegative(),mandatory_layers_complete:z.boolean()
}).passthrough();
const ResultIndexDocumentSchema = z.object({
  run_id:z.string().min(1),scenario_id:z.string().min(1),execution_id:z.string().min(1),simulation_id:z.string().min(1),
  parent_span_id:z.string().min(1),simulation_resolution:z.string().min(1),repo_name:z.string().min(1),environment:z.string().min(1),status:z.string().min(1),
  execution_metadata:ResultIndexExecutionMetadataSchema,executionProof:ResultIndexExecutionProofSchema,
  execution_context:ResultIndexExecutionContextSchema.optional(),result_summary:ResultIndexSummarySchema,
  correlation_id:z.string().nullable(),timestamps:z.object({started_at:z.string().min(1),completed_at:z.string().min(1),duration_ms:z.number().nonnegative()}).optional()
}).strict();
const ResultIndexStoreRequestSchema = z.object({idempotency_key:z.string().min(1).max(255),result:ResultIndexDocumentSchema}).strict();
const ResultIndexEntrySchema = z.object({id:z.string().regex(/^\d+$/),stored_at:z.string().datetime(),result:ResultIndexDocumentSchema});
const ResultIndexResponseSchema = z.object({organization_id:z.string().min(1),replayed:z.boolean(),entry:ResultIndexEntrySchema});
const ResultIndexListResponseSchema = z.object({organization_id:z.string().min(1),results:z.array(ResultIndexEntrySchema),next_after_id:z.string().regex(/^\d+$/).nullable()});
const ResultIndexScenarioSchema = z.object({
  scenario_id:z.string().min(1).max(255),total_runs:z.number().int().nonnegative(),successful_runs:z.number().int().nonnegative(),
  failed_runs:z.number().int().nonnegative(),last_run_at:z.string().datetime().nullable(),avg_duration_ms:z.number().nonnegative().nullable()
});
const ResultIndexScenarioResponseSchema = z.object({organization_id:z.string().min(1),scenario:ResultIndexScenarioSchema});
const ResultIndexPeriod = z.enum(['24h','7d','30d']);
const ResultIndexEnvironmentSummarySchema = z.object({
  environment:z.string().min(1).max(255),period:z.object({name:ResultIndexPeriod,since:z.string().datetime(),until:z.string().datetime()}),
  total_runs:z.number().int().nonnegative(),successful:z.number().int().nonnegative(),failed:z.number().int().nonnegative(),
  success_rate:z.number().min(0).max(1),avg_duration_ms:z.number().nonnegative().nullable(),last_run_at:z.string().datetime().nullable()
});
const ResultIndexSummaryResponseSchema = z.object({organization_id:z.string().min(1),summary:ResultIndexEnvironmentSummarySchema});
const PositiveDecimalString = z.string().regex(/^[0-9]+(\.[0-9]{1,6})?$/).refine(value => Number(value) > 0, 'amount must be positive');
const SignedDecimalString = z.string().regex(/^-?[0-9]+(\.[0-9]{1,6})?$/);
const UsageLedgerEntryAppendRequestSchema = z.object({
  idempotency_key:z.string().min(1).max(255),entry_type:z.enum(['grant','debit']),amount:PositiveDecimalString,
  correlation_id:z.string().min(1).max(255),user_id:z.string().min(1).max(255).optional(),service:z.string().min(1).max(255).optional(),
  run_id:z.string().min(1).max(255).optional(),metadata:z.record(z.string(),z.unknown()).optional()
}).strict();
const UsageLedgerEntrySchema = z.object({
  id:z.string().regex(/^\d+$/),entry_type:z.enum(['grant','debit','reservation_consume']),amount:SignedDecimalString,
  balance_after:SignedDecimalString,correlation_id:z.string().min(1),user_id:z.string().nullable(),service:z.string().nullable(),
  run_id:z.string().nullable(),metadata:z.record(z.string(),z.unknown()),created_at:z.string().datetime()
});
const UsageLedgerEntryResponseSchema = z.object({organization_id:z.string().min(1),replayed:z.boolean(),entry:UsageLedgerEntrySchema});
const UsageLedgerBalanceResponseSchema = z.object({
  organization_id:z.string().min(1),current_balance:SignedDecimalString,reserved_amount:PositiveDecimalString.or(z.literal('0.000000')),
  available_balance:SignedDecimalString,as_of:z.string().datetime()
});
const UsageLedgerReservationCreateRequestSchema = z.object({
  idempotency_key:z.string().min(1).max(255),amount:PositiveDecimalString,ttl_seconds:z.number().int().min(1).max(86400),
  correlation_id:z.string().min(1).max(255),user_id:z.string().min(1).max(255).optional(),service:z.string().min(1).max(255).optional(),
  run_id:z.string().min(1).max(255).optional(),metadata:z.record(z.string(),z.unknown()).optional()
}).strict();
const UsageLedgerReservationActionRequestSchema = z.object({
  idempotency_key:z.string().min(1).max(255),correlation_id:z.string().min(1).max(255)
}).strict();
const UsageLedgerReservationSchema = z.object({
  id:z.string().uuid(),amount:PositiveDecimalString,status:z.enum(['active','consumed','cancelled','expired']),correlation_id:z.string().min(1),
  user_id:z.string().nullable(),service:z.string().nullable(),run_id:z.string().nullable(),metadata:z.record(z.string(),z.unknown()),
  expires_at:z.string().datetime(),created_at:z.string().datetime(),updated_at:z.string().datetime()
});
const UsageLedgerReservationResponseSchema = z.object({organization_id:z.string().min(1),replayed:z.boolean(),reservation:UsageLedgerReservationSchema});

module.exports = {
  CONTRACTS_VERSION: '1.2.0',
  CANONICAL_SCHEMA_NAMES: Object.freeze(['ExecutionIntent','ExecutionGraph','CoreExecutionResult','EvidenceSummary','PolicyDecision','CostReference','ExecutionContext','ResultPacket','DataPlanePrincipal','IdentityApiKeyLookup','IdentityApiKeyResponse','IdentityEntitlementResponse','IdentityCliSessionCreate','IdentityCliSessionCreated','IdentityCliSessionAuthorize','IdentityCliSessionAuthorized','IdentityCliSessionPoll','SimulationEventsAppendRequest','SimulationEventsResponse','ResultIndexStoreRequest','ResultIndexResponse','ResultIndexListResponse','ResultIndexScenarioResponse','ResultIndexSummaryResponse','UsageLedgerEntryAppendRequest','UsageLedgerEntryResponse','UsageLedgerBalanceResponse','UsageLedgerReservationCreateRequest','UsageLedgerReservationActionRequest','UsageLedgerReservationResponse']),
  ExecutionIntentSchema,NodeType,GraphNodeSchema,GraphEdgeSchema,ExecutionGraphSchema,EvidenceEntrySchema,EvidenceSummarySchema,
  CostReferenceSchema,ResultStatus,CoreExecutionResultSchema,PolicyDecisionSchema,ExecutionContextSchema,ResultPacketSchema,
  DataPlanePrincipalSchema,IdentityApiKeyLookupSchema,IdentityApiKeyHashSchema,IdentityApiKeyIdSchema,IdentityApiKeyNameSchema,IdentityCliSessionStatusSchema,IdentityCliSessionCodeSchema,IdentityEndUserIssuerSchema,IdentityEndUserSubjectSchema,IdentityOrganizationIdSchema,IdentityMembershipEmailSchema,IdentityMembershipPaymentStatusSchema,IdentityMembershipRoleSchema,IdentityApiKeyResponseSchema,IdentityEntitlementResponseSchema,
  IdentityCliSessionCreateSchema,IdentityCliSessionCreatedSchema,IdentityCliSessionAuthorizeSchema,IdentityCliSessionAuthorizedSchema,IdentityCliSessionPollSchema,
  SimulationEventKind,SimulationEventAppendItemSchema,SimulationEventsAppendRequestSchema,SimulationEventSchema,SimulationEventsResponseSchema,
  ResultIndexLayerRecordSchema,ResultIndexExecutionProofSchema,ResultIndexExecutionMetadataSchema,ResultIndexExecutionContextSchema,ResultIndexSummarySchema,
  ResultIndexDocumentSchema,ResultIndexStoreRequestSchema,ResultIndexEntrySchema,ResultIndexResponseSchema,ResultIndexListResponseSchema,
  ResultIndexScenarioSchema,ResultIndexScenarioResponseSchema,ResultIndexPeriod,ResultIndexEnvironmentSummarySchema,ResultIndexSummaryResponseSchema,
  UsageLedgerEntryAppendRequestSchema,UsageLedgerEntrySchema,UsageLedgerEntryResponseSchema,UsageLedgerBalanceResponseSchema,
  UsageLedgerReservationCreateRequestSchema,UsageLedgerReservationActionRequestSchema,UsageLedgerReservationSchema,UsageLedgerReservationResponseSchema,
  /**
   * Schema path registry organized by domain, version, and schema name.
   * Each path points to the authoritative JSON Schema file.
   */
  schemas: {
    execution: {
      v1: {
        executionGraph: path.join(__dirname, 'execution/v1/execution-graph.schema.json'),
        executionMetadata: path.join(__dirname, 'execution/v1/execution-metadata.schema.json'),
        telemetryEnvelope: path.join(__dirname, 'execution/v1/telemetry-envelope.schema.json')
      }
    },
    simulation: {
      v1: {
        request: path.join(__dirname, 'simulation/v1/request.schema.json'),
        response: path.join(__dirname, 'simulation/v1/response.schema.json'),
        errors: path.join(__dirname, 'simulation/v1/errors.schema.json')
      }
    },
    intent: {
      v1: {
        request: path.join(__dirname, 'intent/v1/request.schema.json')
      }
    },
    exporters: {
      v1: {
        request: path.join(__dirname, 'exporters/v1/request.schema.json')
      }
    },
    diligence: {
      v1: {
        request: path.join(__dirname, 'diligence/v1/request.schema.json')
      }
    },
    roi: {
      v1: {
        request: path.join(__dirname, 'roi/v1/request.schema.json')
      }
    },
    governance: {
      v1: {
        policy: path.join(__dirname, 'governance/v1/policy.schema.json')
      }
    },
    lifecycle: {
      v1: {
        simulationLifecycle: path.join(__dirname, 'lifecycle/v1/simulation-lifecycle.schema.json'),
        deploymentLifecycle: path.join(__dirname, 'lifecycle/v1/deployment-lifecycle.schema.json'),
        policyLifecycle: path.join(__dirname, 'lifecycle/v1/policy-lifecycle.schema.json'),
        roiLifecycle: path.join(__dirname, 'lifecycle/v1/roi-lifecycle.schema.json'),
        erpLifecycle: path.join(__dirname, 'lifecycle/v1/erp-lifecycle.schema.json')
      }
    },
    dataPlane: {
      v1: {
        principal: path.join(__dirname, 'data-plane/v1/principal.schema.json'),
        identityApiKeyLookup: path.join(__dirname, 'data-plane/v1/identity-api-key-lookup.schema.json'),
        identityApiKeyResponse: path.join(__dirname, 'data-plane/v1/identity-api-key-response.schema.json'),
        identityEntitlementResponse: path.join(__dirname, 'data-plane/v1/identity-entitlement-response.schema.json'),
        identityCliSessionCreate: path.join(__dirname, 'data-plane/v1/identity-cli-session-create.schema.json'),
        identityCliSessionCreated: path.join(__dirname, 'data-plane/v1/identity-cli-session-created.schema.json'),
        identityCliSessionAuthorize: path.join(__dirname, 'data-plane/v1/identity-cli-session-authorize.schema.json'),
        identityCliSessionAuthorized: path.join(__dirname, 'data-plane/v1/identity-cli-session-authorized.schema.json'),
        identityCliSessionPoll: path.join(__dirname, 'data-plane/v1/identity-cli-session-poll.schema.json'),
        simulationEventsAppend: path.join(__dirname, 'data-plane/v1/simulation-events-append.schema.json'),
        simulationEventsResponse: path.join(__dirname, 'data-plane/v1/simulation-events-response.schema.json'),
        resultIndexStore: path.join(__dirname, 'data-plane/v1/result-index-store.schema.json'),
        resultIndexResponse: path.join(__dirname, 'data-plane/v1/result-index-response.schema.json'),
        resultIndexListResponse: path.join(__dirname, 'data-plane/v1/result-index-list-response.schema.json'),
        resultIndexScenarioResponse: path.join(__dirname, 'data-plane/v1/result-index-scenario-response.schema.json'),
        resultIndexSummaryResponse: path.join(__dirname, 'data-plane/v1/result-index-summary-response.schema.json'),
        usageLedgerEntryAppend: path.join(__dirname, 'data-plane/v1/usage-ledger-entry-append.schema.json'),
        usageLedgerEntryResponse: path.join(__dirname, 'data-plane/v1/usage-ledger-entry-response.schema.json'),
        usageLedgerBalanceResponse: path.join(__dirname, 'data-plane/v1/usage-ledger-balance-response.schema.json'),
        usageLedgerReservationCreate: path.join(__dirname, 'data-plane/v1/usage-ledger-reservation-create.schema.json'),
        usageLedgerReservationAction: path.join(__dirname, 'data-plane/v1/usage-ledger-reservation-action.schema.json'),
        usageLedgerReservationResponse: path.join(__dirname, 'data-plane/v1/usage-ledger-reservation-response.schema.json')
      }
    }
  },

  /**
   * Retrieve a schema path by domain, version, and name.
   *
   * @param {string} domain - The contract domain (e.g., 'execution', 'simulation')
   * @param {string} version - The version (e.g., 'v1')
   * @param {string} name - The schema name (e.g., 'request', 'response')
   * @returns {string|undefined} The absolute path to the schema file, or undefined if not found
   *
   * @example
   * const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
   * const schema = require(schemaPath);
   */
  getSchema(domain, version, name) {
    return this.schemas[domain]?.[version]?.[name];
  },

  /**
   * List all available domains.
   * @returns {string[]} Array of domain names
   */
  getDomains() {
    return Object.keys(this.schemas);
  },

  /**
   * List all versions for a given domain.
   * @param {string} domain - The contract domain
   * @returns {string[]} Array of version strings
   */
  getVersions(domain) {
    return Object.keys(this.schemas[domain] || {});
  },

  /**
   * List all schema names for a given domain and version.
   * @param {string} domain - The contract domain
   * @param {string} version - The version
   * @returns {string[]} Array of schema names
   */
  getSchemaNames(domain, version) {
    return Object.keys(this.schemas[domain]?.[version] || {});
  },

  /**
   * Package version - follows semver.
   * Breaking changes require major version bump.
   */
  version: '1.2.0'
};

// Keep these explicit property assignments: Node's ESM-to-CommonJS bridge uses
// static export detection, while the object above remains the canonical CJS API.
// This lets ESM consumers import the same canonical schemas without a wrapper.
module.exports.CONTRACTS_VERSION = module.exports.CONTRACTS_VERSION;
module.exports.CANONICAL_SCHEMA_NAMES = module.exports.CANONICAL_SCHEMA_NAMES;
module.exports.ExecutionIntentSchema = module.exports.ExecutionIntentSchema;
module.exports.NodeType = module.exports.NodeType;
module.exports.GraphNodeSchema = module.exports.GraphNodeSchema;
module.exports.GraphEdgeSchema = module.exports.GraphEdgeSchema;
module.exports.ExecutionGraphSchema = module.exports.ExecutionGraphSchema;
module.exports.EvidenceEntrySchema = module.exports.EvidenceEntrySchema;
module.exports.EvidenceSummarySchema = module.exports.EvidenceSummarySchema;
module.exports.CostReferenceSchema = module.exports.CostReferenceSchema;
module.exports.ResultStatus = module.exports.ResultStatus;
module.exports.CoreExecutionResultSchema = module.exports.CoreExecutionResultSchema;
module.exports.PolicyDecisionSchema = module.exports.PolicyDecisionSchema;
module.exports.ExecutionContextSchema = module.exports.ExecutionContextSchema;
module.exports.ResultPacketSchema = module.exports.ResultPacketSchema;
module.exports.DataPlanePrincipalSchema = module.exports.DataPlanePrincipalSchema;
module.exports.IdentityApiKeyLookupSchema = module.exports.IdentityApiKeyLookupSchema;
module.exports.IdentityApiKeyHashSchema = module.exports.IdentityApiKeyHashSchema;
module.exports.IdentityApiKeyIdSchema = module.exports.IdentityApiKeyIdSchema;
module.exports.IdentityApiKeyNameSchema = module.exports.IdentityApiKeyNameSchema;
module.exports.IdentityCliSessionStatusSchema = module.exports.IdentityCliSessionStatusSchema;
module.exports.IdentityCliSessionCodeSchema = module.exports.IdentityCliSessionCodeSchema;
module.exports.IdentityEndUserIssuerSchema = module.exports.IdentityEndUserIssuerSchema;
module.exports.IdentityEndUserSubjectSchema = module.exports.IdentityEndUserSubjectSchema;
module.exports.IdentityOrganizationIdSchema = module.exports.IdentityOrganizationIdSchema;
module.exports.IdentityMembershipEmailSchema = module.exports.IdentityMembershipEmailSchema;
module.exports.IdentityMembershipPaymentStatusSchema = module.exports.IdentityMembershipPaymentStatusSchema;
module.exports.IdentityMembershipRoleSchema = module.exports.IdentityMembershipRoleSchema;
module.exports.IdentityApiKeyResponseSchema = module.exports.IdentityApiKeyResponseSchema;
module.exports.IdentityEntitlementResponseSchema = module.exports.IdentityEntitlementResponseSchema;
module.exports.IdentityCliSessionCreateSchema = module.exports.IdentityCliSessionCreateSchema;
module.exports.IdentityCliSessionCreatedSchema = module.exports.IdentityCliSessionCreatedSchema;
module.exports.IdentityCliSessionAuthorizeSchema = module.exports.IdentityCliSessionAuthorizeSchema;
module.exports.IdentityCliSessionAuthorizedSchema = module.exports.IdentityCliSessionAuthorizedSchema;
module.exports.IdentityCliSessionPollSchema = module.exports.IdentityCliSessionPollSchema;
module.exports.SimulationEventKind = module.exports.SimulationEventKind;
module.exports.SimulationEventAppendItemSchema = module.exports.SimulationEventAppendItemSchema;
module.exports.SimulationEventsAppendRequestSchema = module.exports.SimulationEventsAppendRequestSchema;
module.exports.SimulationEventSchema = module.exports.SimulationEventSchema;
module.exports.SimulationEventsResponseSchema = module.exports.SimulationEventsResponseSchema;
module.exports.ResultIndexLayerRecordSchema = module.exports.ResultIndexLayerRecordSchema;
module.exports.ResultIndexExecutionProofSchema = module.exports.ResultIndexExecutionProofSchema;
module.exports.ResultIndexExecutionMetadataSchema = module.exports.ResultIndexExecutionMetadataSchema;
module.exports.ResultIndexExecutionContextSchema = module.exports.ResultIndexExecutionContextSchema;
module.exports.ResultIndexSummarySchema = module.exports.ResultIndexSummarySchema;
module.exports.ResultIndexDocumentSchema = module.exports.ResultIndexDocumentSchema;
module.exports.ResultIndexStoreRequestSchema = module.exports.ResultIndexStoreRequestSchema;
module.exports.ResultIndexEntrySchema = module.exports.ResultIndexEntrySchema;
module.exports.ResultIndexResponseSchema = module.exports.ResultIndexResponseSchema;
module.exports.ResultIndexListResponseSchema = module.exports.ResultIndexListResponseSchema;
module.exports.ResultIndexScenarioSchema = module.exports.ResultIndexScenarioSchema;
module.exports.ResultIndexScenarioResponseSchema = module.exports.ResultIndexScenarioResponseSchema;
module.exports.ResultIndexPeriod = module.exports.ResultIndexPeriod;
module.exports.ResultIndexEnvironmentSummarySchema = module.exports.ResultIndexEnvironmentSummarySchema;
module.exports.ResultIndexSummaryResponseSchema = module.exports.ResultIndexSummaryResponseSchema;
module.exports.UsageLedgerEntryAppendRequestSchema = module.exports.UsageLedgerEntryAppendRequestSchema;
module.exports.UsageLedgerEntrySchema = module.exports.UsageLedgerEntrySchema;
module.exports.UsageLedgerEntryResponseSchema = module.exports.UsageLedgerEntryResponseSchema;
module.exports.UsageLedgerBalanceResponseSchema = module.exports.UsageLedgerBalanceResponseSchema;
module.exports.UsageLedgerReservationCreateRequestSchema = module.exports.UsageLedgerReservationCreateRequestSchema;
module.exports.UsageLedgerReservationActionRequestSchema = module.exports.UsageLedgerReservationActionRequestSchema;
module.exports.UsageLedgerReservationSchema = module.exports.UsageLedgerReservationSchema;
module.exports.UsageLedgerReservationResponseSchema = module.exports.UsageLedgerReservationResponseSchema;
