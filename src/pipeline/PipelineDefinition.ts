import { z } from "zod";

export const RetryPolicySchema = z.object({
  maxRetries: z.number().int().nonnegative(),
  backoffMs: z.number().int().positive(),
  backoffMultiplier: z.number().positive().default(1),
});

export type RetryPolicy = Readonly<z.infer<typeof RetryPolicySchema>>;

export const StepDefinitionSchema = z.object({
  stepId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  upstreamDependencies: z.array(z.string().uuid()),
  retryPolicy: RetryPolicySchema.optional(),
  timeoutMs: z.number().int().positive().optional(),
  schemaVersion: z.literal("1.0.0"),
});

export type StepDefinition = Readonly<z.infer<typeof StepDefinitionSchema>>;

export const PipelineDefinitionSchema = z.object({
  pipelineId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(StepDefinitionSchema),
  schemaVersion: z.literal("1.0.0"),
});

export type PipelineDefinition = Readonly<
  z.infer<typeof PipelineDefinitionSchema>
>;
