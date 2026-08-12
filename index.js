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

module.exports = {
  CONTRACTS_VERSION: '1.1.1',
  CANONICAL_SCHEMA_NAMES: Object.freeze(['ExecutionIntent','ExecutionGraph','CoreExecutionResult','EvidenceSummary','PolicyDecision','CostReference','ExecutionContext','ResultPacket']),
  ExecutionIntentSchema,NodeType,GraphNodeSchema,GraphEdgeSchema,ExecutionGraphSchema,EvidenceEntrySchema,EvidenceSummarySchema,
  CostReferenceSchema,ResultStatus,CoreExecutionResultSchema,PolicyDecisionSchema,ExecutionContextSchema,ResultPacketSchema,
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
  version: '1.1.1'
};
