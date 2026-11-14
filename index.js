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

const principalBindingSemantics = 'Configured IAM principal bindings MUST map each case-insensitively unique principal email to exactly one non-empty string organization_id. Identity-provider caller allowlists MUST contain non-empty, case-insensitively unique principal emails without surrounding whitespace. Duplicate canonical principals, malformed or whitespace-padded principal entries, and non-string or empty organization identifiers MUST fail closed at startup and request time instead of being overwritten or coerced.';
const DataPlanePrincipalSchema = z.object({
  subject: z.string().min(1),
  principal: z.string().email(),
  organization_id: z.string().min(1),
  audience: z.string().min(1),
  mapping_source: z.literal('configured_principal_binding')
}).describe(principalBindingSemantics);
const IdentityApiKeyLookupSchema = z.object({
  key_hash: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();
const IdentityScopeListSchema = z.array(z.string().min(1)).min(1).refine(
  (scopes) => new Set(scopes).size === scopes.length,
  { message: 'Scopes must be unique' }
);
const activeApiKeyScopeSemantics = "An active API key response MUST contain a non-empty unique scope list that remains a subset of the provider's current allowlist; empty, malformed, duplicate, or retired scopes MUST fail closed and MUST NOT resolve as an active key.";
const IdentityApiKeyResponseSchema = z.object({
  key_id: z.string().uuid(),
  organization_id: z.string().min(1),
  name: z.string().min(1),
  scopes: IdentityScopeListSchema.describe(activeApiKeyScopeSemantics),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  last_used_at: z.string().datetime().nullable()
}).strict();
const losslessEntitlementSemantics = 'Entitlement limits MUST be non-negative safe JSON integers no greater than 9007199254740991; providers MUST fail closed instead of rounding larger persisted BIGINT values.';
const apiKeyLimitSemantics = 'Maximum concurrently active, unrevoked, unexpired API keys permitted for the organization. Key creation MUST be denied when the current count is greater than or equal to this limit. The active-key count MUST evaluate expiry after acquiring the per-tenant key-creation serialization lock, using a non-transaction-start persistence wall clock in the same transaction; transaction-start timestamps and service-process clock comparisons are forbidden. The limit and active count MUST remain lossless across persistence, aggregation and JSON serialization for the full safe-integer range. This value MUST be a non-negative safe JSON integer no greater than 9007199254740991; providers MUST fail closed instead of rounding a larger persisted BIGINT value.';
const IdentityEntitlementResponseSchema = z.object({
  organization_id: z.string().min(1),
  plan: z.enum(['free','developer','team','enterprise']),
  max_requests: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(losslessEntitlementSemantics),
  max_tokens: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(losslessEntitlementSemantics),
  max_api_keys: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).describe(apiKeyLimitSemantics)
}).strict();
const identityScopeConfigurationSemantics = 'Provider identity scope configuration MUST define non-empty allowed and default scope lists containing non-empty strings without surrounding whitespace, unique within each list, with every default scope present in the allowed list. Malformed, duplicate, empty, whitespace-padded, or unsupported configured scopes MUST fail closed at startup and request time instead of being normalized or deduplicated.';
const IdentityCliSessionCreateSchema = z.object({
  cli_name: z.string().min(1).max(255).optional(),
  cli_version: z.string().min(1).max(255).optional(),
  hostname: z.string().min(1).max(255).optional(),
  scopes: IdentityScopeListSchema.optional()
}).strict().describe(identityScopeConfigurationSemantics);
const IdentityCliSessionCreatedSchema = z.object({
  session_code: z.string().regex(/^[A-Z0-9]{8}$/),
  device_code: z.string().regex(/^[a-f0-9]{64}$/),
  verification_url: z.string().url(),
  expires_at: z.string().datetime(),
  expires_in_seconds: z.literal(600),
  poll_interval_seconds: z.literal(5)
}).strict();
const sessionExpirySemantics = 'Session expiry MUST be evaluated after the session row lock is acquired, using a non-transaction-start persistence wall clock in the same transaction for authorization and polling; transaction-start timestamps and service-process clock comparisons are forbidden.';
const apiKeyExpirySemantics = 'API-key expiry MUST be evaluated after the referenced key row lock is acquired, using a non-transaction-start persistence wall clock in the same serializable transaction; transaction-start timestamps and service-process clock comparisons are forbidden.';
const IdentityCliSessionAuthorizeSchema = z.object({
  session_code: z.string().regex(/^[A-Z0-9]{8}$/),
  key_name: z.string().min(1).max(255).optional(),
  scopes: IdentityScopeListSchema.optional()
}).strict().describe(
  "CLI session authorization MUST be performed by an active tenant membership with role owner, resolved from the verified issuer and subject; caller-supplied tenant ownership is forbidden. The provider MUST revalidate the row-locked session's persisted requested scopes as a non-empty unique subset of the current allowlist before API-key creation; malformed, duplicate, empty, unsupported, or retired persisted scopes MUST fail closed. " + sessionExpirySemantics
);
const IdentityCliSessionAuthorizedSchema = z.object({
  success: z.literal(true),
  organization_id: z.string().min(1),
  key_id: z.string().uuid()
}).strict().describe(
  'When replaying a completed CLI session, the provider MUST require the same verified issuer and subject that originally authorized the session, then return key_id only after row-locking an active, unrevoked, unexpired API key owned by the same authenticated organization whose persisted scopes remain a non-empty unique subset of the current allowlist; missing or mismatched authorizing identity, cross-tenant, malformed, empty, duplicate, retired-scope, revoked, or expired key references MUST fail closed. ' + apiKeyExpirySemantics
);
const IdentityCliSessionPollSchema = z.union([
  z.object({ status: z.enum(['pending','authorized']) }).strict(),
  z.object({
    status: z.literal('completed'),
    api_key: z.string().min(1).optional(),
    email: z.string().email(),
    payment_status: z.enum(['paid','unpaid','trial','internal']),
    organization_id: z.string().min(1),
    role: z.literal('owner')
  }).strict().describe(
    'A completed CLI session MUST deliver api_key only while the original authorizing membership remains active and bound to the same organization and the issued key remains active, unrevoked, unexpired, with persisted scopes that remain a non-empty unique subset of the current allowlist. Membership and key state MUST be row-locked in the same serializable delivery transaction. ' + apiKeyExpirySemantics + ' Malformed, empty, duplicate, or retired key scopes MUST fail closed before delivery or erasure. The decrypted api_key MUST hash to the referenced active key_id before delivery or erasure. API-key delivery is one-time. ' + sessionExpirySemantics
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
  DataPlanePrincipalSchema,IdentityApiKeyLookupSchema,IdentityApiKeyResponseSchema,IdentityEntitlementResponseSchema,
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
