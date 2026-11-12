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
