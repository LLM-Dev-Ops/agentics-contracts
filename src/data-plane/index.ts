import { z } from "zod";

export const DataPlanePrincipalSchema = z.object({
  subject: z.string().min(1),
  principal: z.string().email(),
  organization_id: z.string().min(1),
  audience: z.string().min(1),
  mapping_source: z.literal("configured_principal_binding"),
});
export type DataPlanePrincipal = z.infer<typeof DataPlanePrincipalSchema>;

export const SimulationEventKind = z.enum([
  "created",
  "started",
  "step_started",
  "step_completed",
  "log",
  "metric",
  "artifact",
  "validation",
  "completed",
  "failed",
  "cancelled",
]);
export type SimulationEventKindValue = z.infer<typeof SimulationEventKind>;

export const SimulationEventAppendItemSchema = z.object({
  kind: SimulationEventKind,
  payload: z.unknown(),
});
export type SimulationEventAppendItem = z.infer<typeof SimulationEventAppendItemSchema>;

export const SimulationEventsAppendRequestSchema = z.object({
  simulation_id: z.string().uuid(),
  idempotency_key: z.string().min(1).max(255),
  events: z.array(SimulationEventAppendItemSchema).min(1).max(100),
}).strict();
export type SimulationEventsAppendRequest = z.infer<typeof SimulationEventsAppendRequestSchema>;

export const SimulationEventSchema = z.object({
  id: z.string().regex(/^\d+$/),
  simulation_id: z.string().uuid(),
  seq: z.number().int().positive(),
  ts: z.string().datetime(),
  kind: SimulationEventKind,
  payload: z.unknown(),
});
export type SimulationEvent = z.infer<typeof SimulationEventSchema>;

export const SimulationEventsResponseSchema = z.object({
  organization_id: z.string().min(1),
  replayed: z.boolean(),
  events: z.array(SimulationEventSchema),
});
export type SimulationEventsResponse = z.infer<typeof SimulationEventsResponseSchema>;

export const ResultIndexLayerRecordSchema = z.object({
  layer_name: z.string().min(1),
  status: z.enum(["passed", "failed", "skipped"]),
  duration_ms: z.number().nonnegative(),
  assertions_passed: z.number().int().nonnegative(),
  assertions_failed: z.number().int().nonnegative(),
  error: z.string().optional(),
});

export const ResultIndexExecutionProofSchema = z.object({
  proof_hash: z.string().min(1),
  layerRecords: z.array(ResultIndexLayerRecordSchema),
  generated_at: z.string().min(1),
});

export const ResultIndexExecutionMetadataSchema = z.object({
  execution_id: z.string().min(1),
  proof_hash: z.string().min(1),
  layers_executed: z.array(z.string()),
  schema_version: z.string().min(1),
  environment: z.string().min(1),
  started_at: z.string().min(1),
  completed_at: z.string().min(1),
  duration_ms: z.number().nonnegative(),
});

export const ResultIndexExecutionContextSchema = z.object({
  repo_name: z.string().min(1),
  environment: z.string().min(1),
  triggered_by: z.string().optional(),
  branch: z.string().optional(),
  commit_sha: z.string().optional(),
});

export const ResultIndexSummarySchema = z.object({
  assertions_passed: z.number().int().nonnegative(),
  assertions_failed: z.number().int().nonnegative(),
  total_layers: z.number().int().nonnegative(),
  mandatory_layers_complete: z.boolean(),
}).passthrough();

// Lossless authority shape for the existing results-index ingestion contract.
// Organization scope is deliberately absent: it is injected by the provider
// after Cloud Run IAM authentication and principal binding.
export const ResultIndexDocumentSchema = z.object({
  run_id: z.string().min(1),
  scenario_id: z.string().min(1),
  execution_id: z.string().min(1),
  simulation_id: z.string().min(1),
  parent_span_id: z.string().min(1),
  simulation_resolution: z.string().min(1),
  repo_name: z.string().min(1),
  environment: z.string().min(1),
  status: z.string().min(1),
  execution_metadata: ResultIndexExecutionMetadataSchema,
  executionProof: ResultIndexExecutionProofSchema,
  execution_context: ResultIndexExecutionContextSchema.optional(),
  result_summary: ResultIndexSummarySchema,
  correlation_id: z.string().nullable(),
  timestamps: z.object({
    started_at: z.string().min(1),
    completed_at: z.string().min(1),
    duration_ms: z.number().nonnegative(),
  }).optional(),
}).strict();
export type ResultIndexDocument = z.infer<typeof ResultIndexDocumentSchema>;

export const ResultIndexStoreRequestSchema = z.object({
  idempotency_key: z.string().min(1).max(255),
  result: ResultIndexDocumentSchema,
}).strict();
export type ResultIndexStoreRequest = z.infer<typeof ResultIndexStoreRequestSchema>;

export const ResultIndexEntrySchema = z.object({
  id: z.string().regex(/^\d+$/),
  stored_at: z.string().datetime(),
  result: ResultIndexDocumentSchema,
});
export type ResultIndexEntry = z.infer<typeof ResultIndexEntrySchema>;

export const ResultIndexResponseSchema = z.object({
  organization_id: z.string().min(1),
  replayed: z.boolean(),
  entry: ResultIndexEntrySchema,
});
export type ResultIndexResponse = z.infer<typeof ResultIndexResponseSchema>;

export const ResultIndexListResponseSchema = z.object({
  organization_id: z.string().min(1),
  results: z.array(ResultIndexEntrySchema),
  next_after_id: z.string().regex(/^\d+$/).nullable(),
});
export type ResultIndexListResponse = z.infer<typeof ResultIndexListResponseSchema>;
