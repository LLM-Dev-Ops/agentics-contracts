/**
 * @agentics/contracts
 *
 * TypeScript declarations for the authoritative contract layer
 * of the Agentics platform.
 */

import type { z } from 'zod';
export const CONTRACTS_VERSION: '1.1.2';
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
