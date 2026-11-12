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

const DataPlanePrincipalSchema = z.object({
  subject: z.string().min(1),
  principal: z.string().email(),
  organization_id: z.string().min(1),
  audience: z.string().min(1),
  mapping_source: z.literal('configured_principal_binding')
});
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

module.exports = {
  CONTRACTS_VERSION: '1.2.0',
  CANONICAL_SCHEMA_NAMES: Object.freeze(['ExecutionIntent','ExecutionGraph','CoreExecutionResult','EvidenceSummary','PolicyDecision','CostReference','ExecutionContext','ResultPacket','DataPlanePrincipal','SimulationEventsAppendRequest','SimulationEventsResponse','ResultIndexStoreRequest','ResultIndexResponse','ResultIndexListResponse']),
  ExecutionIntentSchema,NodeType,GraphNodeSchema,GraphEdgeSchema,ExecutionGraphSchema,EvidenceEntrySchema,EvidenceSummarySchema,
  CostReferenceSchema,ResultStatus,CoreExecutionResultSchema,PolicyDecisionSchema,ExecutionContextSchema,ResultPacketSchema,
  DataPlanePrincipalSchema,SimulationEventKind,SimulationEventAppendItemSchema,SimulationEventsAppendRequestSchema,SimulationEventSchema,SimulationEventsResponseSchema,
  ResultIndexLayerRecordSchema,ResultIndexExecutionProofSchema,ResultIndexExecutionMetadataSchema,ResultIndexExecutionContextSchema,ResultIndexSummarySchema,
  ResultIndexDocumentSchema,ResultIndexStoreRequestSchema,ResultIndexEntrySchema,ResultIndexResponseSchema,ResultIndexListResponseSchema,
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
        simulationEventsAppend: path.join(__dirname, 'data-plane/v1/simulation-events-append.schema.json'),
        simulationEventsResponse: path.join(__dirname, 'data-plane/v1/simulation-events-response.schema.json'),
        resultIndexStore: path.join(__dirname, 'data-plane/v1/result-index-store.schema.json'),
        resultIndexResponse: path.join(__dirname, 'data-plane/v1/result-index-response.schema.json'),
        resultIndexListResponse: path.join(__dirname, 'data-plane/v1/result-index-list-response.schema.json')
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
