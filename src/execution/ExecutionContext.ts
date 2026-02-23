import { z } from "zod";

export const ExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "failed",
  "completed",
]);

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ExecutionTimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type ExecutionTimestamps = Readonly<
  z.infer<typeof ExecutionTimestampsSchema>
>;

export const ExecutionContextSchema = z.object({
  runId: z.string().uuid(),
  originalRequest: z.string(),
  stepOutputs: z.record(z.string(), z.unknown()),
  artifacts: z.record(z.string(), z.unknown()),
  status: ExecutionStatusSchema,
  timestamps: ExecutionTimestampsSchema,
  schemaVersion: z.literal("1.0.0"),
});

export type ExecutionContext = Readonly<
  z.infer<typeof ExecutionContextSchema>
>;
