import { z } from "zod";

export const PlanStepSchema = z.object({
  stepId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  dependencies: z.array(z.string().uuid()),
  estimatedComplexity: z.enum(["low", "medium", "high"]).optional(),
});

export type PlanStep = Readonly<z.infer<typeof PlanStepSchema>>;

export const PlanOutputSchema = z.object({
  planId: z.string().uuid(),
  originalRequest: z.string().min(1),
  steps: z.array(PlanStepSchema),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type PlanOutput = Readonly<z.infer<typeof PlanOutputSchema>>;
