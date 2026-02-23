import { z } from "zod";

export const SimulationResultSchema = z.object({
  simulationId: z.string().uuid(),
  runId: z.string().uuid(),
  outcome: z.enum(["pass", "fail", "inconclusive"]),
  confidenceScore: z.number().min(0).max(1),
  findings: z.array(z.string()),
  metrics: z.record(z.string(), z.unknown()).optional(),
  completedAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type SimulationResult = Readonly<
  z.infer<typeof SimulationResultSchema>
>;
