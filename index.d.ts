/**
 * @agentics/contracts
 *
 * TypeScript declarations for the authoritative contract layer
 * of the Agentics platform.
 */

import type { z } from 'zod';
export const CONTRACTS_VERSION: '1.2.0';
export const CANONICAL_SCHEMA_NAMES: readonly string[];
export interface ExecutionIntent { id:string;caller:string;action:string;target:string;parameters:Record<string,unknown>;metadata:Record<string,unknown>;is_meta_simulation:boolean }
export const ExecutionIntentSchema: z.ZodType<ExecutionIntent>;
export type NodeType = 'execution_root'|'core'|'repo'|'agent'; export const NodeType: z.ZodType<NodeType>;
export interface GraphNode { id:string;type:NodeType;name:string;parent_id:string|null;children_ids:string[] } export const GraphNodeSchema:z.ZodType<GraphNode>;
export interface GraphEdge { from:string;to:string } export const GraphEdgeSchema:z.ZodType<GraphEdge>;
export interface ExecutionGraph { nodes:GraphNode[];edges:GraphEdge[];validated:boolean } export const ExecutionGraphSchema:z.ZodType<ExecutionGraph>;
export const EvidenceEntrySchema: z.ZodTypeAny; export type EvidenceEntry = z.infer<typeof EvidenceEntrySchema>;
export const EvidenceSummarySchema: z.ZodTypeAny; export type EvidenceSummary = z.infer<typeof EvidenceSummarySchema>;
export const CostReferenceSchema: z.ZodTypeAny; export type CostReference = z.infer<typeof CostReferenceSchema>;
export const ResultStatus: z.ZodTypeAny; export type ResultStatus = z.infer<typeof ResultStatus>;
export const CoreExecutionResultSchema: z.ZodTypeAny; export type CoreExecutionResult = z.infer<typeof CoreExecutionResultSchema>;
export const PolicyDecisionSchema: z.ZodTypeAny; export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
export const ExecutionContextSchema: z.ZodTypeAny; export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;
export const ResultPacketSchema: z.ZodTypeAny; export type ResultPacket = z.infer<typeof ResultPacketSchema>;
export interface DataPlanePrincipal { subject:string;principal:string;organization_id:string;audience:string;mapping_source:'configured_principal_binding' }
export const DataPlanePrincipalSchema: z.ZodType<DataPlanePrincipal>;
export interface IdentityApiKeyLookup { key_hash:string }
export const IdentityApiKeyLookupSchema: z.ZodType<IdentityApiKeyLookup>;
export interface IdentityApiKeyResponse { key_id:string;organization_id:string;name:string;scopes:string[];created_at:string;expires_at:string|null;last_used_at:string|null }
export const IdentityApiKeyResponseSchema: z.ZodType<IdentityApiKeyResponse>;
export interface IdentityEntitlementResponse { organization_id:string;plan:'free'|'developer'|'team'|'enterprise';max_requests:number;max_tokens:number;max_api_keys:number }
export const IdentityEntitlementResponseSchema: z.ZodType<IdentityEntitlementResponse>;
export interface IdentityCliSessionCreate { cli_name?:string;cli_version?:string;hostname?:string;scopes?:string[] }
export const IdentityCliSessionCreateSchema: z.ZodType<IdentityCliSessionCreate>;
export interface IdentityCliSessionCreated { session_code:string;device_code:string;verification_url:string;expires_at:string;expires_in_seconds:600;poll_interval_seconds:5 }
export const IdentityCliSessionCreatedSchema: z.ZodType<IdentityCliSessionCreated>;
export interface IdentityCliSessionAuthorize { session_code:string;key_name?:string;scopes?:string[] }
export const IdentityCliSessionAuthorizeSchema: z.ZodType<IdentityCliSessionAuthorize>;
export interface IdentityCliSessionAuthorized { success:true;organization_id:string;key_id:string }
export const IdentityCliSessionAuthorizedSchema: z.ZodType<IdentityCliSessionAuthorized>;
export type IdentityCliSessionPoll = {status:'pending'|'authorized'}|{status:'completed';api_key?:string;email:string;payment_status:'paid'|'unpaid'|'trial'|'internal';organization_id:string;role:'owner'};
export const IdentityCliSessionPollSchema: z.ZodType<IdentityCliSessionPoll>;
export type SimulationEventKindValue = 'created'|'started'|'step_started'|'step_completed'|'log'|'metric'|'artifact'|'validation'|'completed'|'failed'|'cancelled';
export const SimulationEventKind: z.ZodType<SimulationEventKindValue>;
export interface SimulationEventAppendItem { kind:SimulationEventKindValue;payload:unknown }
export const SimulationEventAppendItemSchema: z.ZodType<SimulationEventAppendItem>;
export interface SimulationEventsAppendRequest { simulation_id:string;idempotency_key:string;events:SimulationEventAppendItem[] }
export const SimulationEventsAppendRequestSchema: z.ZodType<SimulationEventsAppendRequest>;
export interface SimulationEvent { id:string;simulation_id:string;seq:number;ts:string;kind:SimulationEventKindValue;payload:unknown }
export const SimulationEventSchema: z.ZodType<SimulationEvent>;
export interface SimulationEventsResponse { organization_id:string;replayed:boolean;events:SimulationEvent[] }
export const SimulationEventsResponseSchema: z.ZodType<SimulationEventsResponse>;
export interface ResultIndexLayerRecord { layer_name:string;status:'passed'|'failed'|'skipped';duration_ms:number;assertions_passed:number;assertions_failed:number;error?:string }
export const ResultIndexLayerRecordSchema: z.ZodType<ResultIndexLayerRecord>;
export interface ResultIndexExecutionProof { proof_hash:string;layerRecords:ResultIndexLayerRecord[];generated_at:string }
export const ResultIndexExecutionProofSchema: z.ZodType<ResultIndexExecutionProof>;
export interface ResultIndexExecutionMetadata { execution_id:string;proof_hash:string;layers_executed:string[];schema_version:string;environment:string;started_at:string;completed_at:string;duration_ms:number }
export const ResultIndexExecutionMetadataSchema: z.ZodType<ResultIndexExecutionMetadata>;
export interface ResultIndexExecutionContext { repo_name:string;environment:string;triggered_by?:string;branch?:string;commit_sha?:string }
export const ResultIndexExecutionContextSchema: z.ZodType<ResultIndexExecutionContext>;
export interface ResultIndexSummary { assertions_passed:number;assertions_failed:number;total_layers:number;mandatory_layers_complete:boolean;[key:string]:unknown }
export const ResultIndexSummarySchema: z.ZodType<ResultIndexSummary>;
export interface ResultIndexDocument { run_id:string;scenario_id:string;execution_id:string;simulation_id:string;parent_span_id:string;simulation_resolution:string;repo_name:string;environment:string;status:string;execution_metadata:ResultIndexExecutionMetadata;executionProof:ResultIndexExecutionProof;execution_context?:ResultIndexExecutionContext;result_summary:ResultIndexSummary;correlation_id:string|null;timestamps?:{started_at:string;completed_at:string;duration_ms:number} }
export const ResultIndexDocumentSchema: z.ZodType<ResultIndexDocument>;
export interface ResultIndexStoreRequest { idempotency_key:string;result:ResultIndexDocument }
export const ResultIndexStoreRequestSchema: z.ZodType<ResultIndexStoreRequest>;
export interface ResultIndexEntry { id:string;stored_at:string;result:ResultIndexDocument }
export const ResultIndexEntrySchema: z.ZodType<ResultIndexEntry>;
export interface ResultIndexResponse { organization_id:string;replayed:boolean;entry:ResultIndexEntry }
export const ResultIndexResponseSchema: z.ZodType<ResultIndexResponse>;
export interface ResultIndexListResponse { organization_id:string;results:ResultIndexEntry[];next_after_id:string|null }
export const ResultIndexListResponseSchema: z.ZodType<ResultIndexListResponse>;
export interface ResultIndexScenario { scenario_id:string;total_runs:number;successful_runs:number;failed_runs:number;last_run_at:string|null;avg_duration_ms:number|null }
export const ResultIndexScenarioSchema: z.ZodType<ResultIndexScenario>;
export interface ResultIndexScenarioResponse { organization_id:string;scenario:ResultIndexScenario }
export const ResultIndexScenarioResponseSchema: z.ZodType<ResultIndexScenarioResponse>;
export type ResultIndexPeriodValue = '24h'|'7d'|'30d';
export const ResultIndexPeriod: z.ZodType<ResultIndexPeriodValue>;
export interface ResultIndexEnvironmentSummary { environment:string;period:{name:ResultIndexPeriodValue;since:string;until:string};total_runs:number;successful:number;failed:number;success_rate:number;avg_duration_ms:number|null;last_run_at:string|null }
export const ResultIndexEnvironmentSummarySchema: z.ZodType<ResultIndexEnvironmentSummary>;
export interface ResultIndexSummaryResponse { organization_id:string;summary:ResultIndexEnvironmentSummary }
export const ResultIndexSummaryResponseSchema: z.ZodType<ResultIndexSummaryResponse>;
export interface UsageLedgerEntryAppendRequest { idempotency_key:string;entry_type:'grant'|'debit';amount:string;correlation_id:string;user_id?:string;service?:string;run_id?:string;metadata?:Record<string,unknown> }
export const UsageLedgerEntryAppendRequestSchema: z.ZodType<UsageLedgerEntryAppendRequest>;
export interface UsageLedgerEntry { id:string;entry_type:'grant'|'debit'|'reservation_consume';amount:string;balance_after:string;correlation_id:string;user_id:string|null;service:string|null;run_id:string|null;metadata:Record<string,unknown>;created_at:string }
export const UsageLedgerEntrySchema: z.ZodType<UsageLedgerEntry>;
export interface UsageLedgerEntryResponse { organization_id:string;replayed:boolean;entry:UsageLedgerEntry }
export const UsageLedgerEntryResponseSchema: z.ZodType<UsageLedgerEntryResponse>;
export interface UsageLedgerBalanceResponse { organization_id:string;current_balance:string;reserved_amount:string;available_balance:string;as_of:string }
export const UsageLedgerBalanceResponseSchema: z.ZodType<UsageLedgerBalanceResponse>;
export interface UsageLedgerReservationCreateRequest { idempotency_key:string;amount:string;ttl_seconds:number;correlation_id:string;user_id?:string;service?:string;run_id?:string;metadata?:Record<string,unknown> }
export const UsageLedgerReservationCreateRequestSchema: z.ZodType<UsageLedgerReservationCreateRequest>;
export interface UsageLedgerReservationActionRequest { idempotency_key:string;correlation_id:string }
export const UsageLedgerReservationActionRequestSchema: z.ZodType<UsageLedgerReservationActionRequest>;
export interface UsageLedgerReservation { id:string;amount:string;status:'active'|'consumed'|'cancelled'|'expired';correlation_id:string;user_id:string|null;service:string|null;run_id:string|null;metadata:Record<string,unknown>;expires_at:string;created_at:string;updated_at:string }
export const UsageLedgerReservationSchema: z.ZodType<UsageLedgerReservation>;
export interface UsageLedgerReservationResponse { organization_id:string;replayed:boolean;reservation:UsageLedgerReservation }
export const UsageLedgerReservationResponseSchema: z.ZodType<UsageLedgerReservationResponse>;

declare module '@agentics/contracts' {
  /**
   * Schema version registry structure
   */
  interface SchemaVersion {
    [schemaName: string]: string;
  }

  /**
   * Domain registry structure containing versioned schemas
   */
  interface DomainSchemas {
    [version: string]: SchemaVersion;
  }

  /**
   * Execution domain schemas
   */
  interface ExecutionSchemas {
    v1: {
      executionGraph: string;
      executionMetadata: string;
      telemetryEnvelope: string;
    };
  }

  /**
   * Simulation domain schemas
   */
  interface SimulationSchemas {
    v1: {
      request: string;
      response: string;
      errors: string;
    };
  }

  /**
   * Intent domain schemas
   */
  interface IntentSchemas {
    v1: {
      request: string;
    };
  }

  /**
   * Exporters domain schemas
   */
  interface ExportersSchemas {
    v1: {
      request: string;
    };
  }

  /**
   * Diligence domain schemas
   */
  interface DiligenceSchemas {
    v1: {
      request: string;
    };
  }

  /**
   * ROI domain schemas
   */
  interface RoiSchemas {
    v1: {
      request: string;
    };
  }

  /**
   * Governance domain schemas
   */
  interface GovernanceSchemas {
    v1: {
      policy: string;
    };
  }

  /**
   * Lifecycle domain schemas
   */
  interface LifecycleSchemas {
    v1: {
      simulationLifecycle: string;
      deploymentLifecycle: string;
      policyLifecycle: string;
      roiLifecycle: string;
      erpLifecycle: string;
    };
  }

  interface DataPlaneSchemas {
    v1: {
      principal: string;
      identityApiKeyLookup: string;
      identityApiKeyResponse: string;
      identityEntitlementResponse: string;
      identityCliSessionCreate: string;
      identityCliSessionCreated: string;
      identityCliSessionAuthorize: string;
      identityCliSessionAuthorized: string;
      identityCliSessionPoll: string;
      simulationEventsAppend: string;
      simulationEventsResponse: string;
      resultIndexStore: string;
      resultIndexResponse: string;
      resultIndexListResponse: string;
      resultIndexScenarioResponse: string;
      resultIndexSummaryResponse: string;
      usageLedgerEntryAppend: string;
      usageLedgerEntryResponse: string;
      usageLedgerBalanceResponse: string;
      usageLedgerReservationCreate: string;
      usageLedgerReservationAction: string;
      usageLedgerReservationResponse: string;
    };
  }

  /**
   * Complete schema registry type
   */
  interface Schemas {
    execution: ExecutionSchemas;
    simulation: SimulationSchemas;
    intent: IntentSchemas;
    exporters: ExportersSchemas;
    diligence: DiligenceSchemas;
    roi: RoiSchemas;
    governance: GovernanceSchemas;
    lifecycle: LifecycleSchemas;
    dataPlane: DataPlaneSchemas;
  }

  /**
   * Valid domain names
   */
  type Domain = keyof Schemas;

  /**
   * Valid version strings
   */
  type Version = 'v1';

  /**
   * The contracts module interface
   */
  interface ContractsModule {
    /**
     * Registry of all schema paths organized by domain, version, and name
     */
    schemas: Schemas;

    /**
     * Retrieve a schema path by domain, version, and name
     * @param domain - The contract domain (e.g., 'execution', 'simulation')
     * @param version - The version (e.g., 'v1')
     * @param name - The schema name (e.g., 'request', 'response')
     * @returns The absolute path to the schema file, or undefined if not found
     */
    getSchema(domain: string, version: string, name: string): string | undefined;

    /**
     * List all available domains
     * @returns Array of domain names
     */
    getDomains(): Domain[];

    /**
     * List all versions for a given domain
     * @param domain - The contract domain
     * @returns Array of version strings
     */
    getVersions(domain: Domain): Version[];

    /**
     * List all schema names for a given domain and version
     * @param domain - The contract domain
     * @param version - The version
     * @returns Array of schema names
     */
    getSchemaNames(domain: Domain, version: Version): string[];

    /**
     * Package version following semver
     */
    version: string;
  }

  const contracts: ContractsModule;
  export = contracts;
}
