import { z } from "zod";

export const StepCompletedEventSchema = z.object({
  eventId: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
  stepName: z.string().min(1),
  output: z.unknown(),
  completedAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type StepCompletedEvent = Readonly<
  z.infer<typeof StepCompletedEventSchema>
>;

export const ExecutionPersistedEventSchema = z.object({
  eventId: z.string().uuid(),
  runId: z.string().uuid(),
  persistedAt: z.string().datetime(),
  storageLocation: z.string().min(1),
  schemaVersion: z.literal("1.0.0"),
});

export type ExecutionPersistedEvent = Readonly<
  z.infer<typeof ExecutionPersistedEventSchema>
>;

export const ExecutionFailureEventSchema = z.object({
  eventId: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string().uuid().optional(),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    recoverable: z.boolean(),
  }),
  failedAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type ExecutionFailureEvent = Readonly<
  z.infer<typeof ExecutionFailureEventSchema>
>;
