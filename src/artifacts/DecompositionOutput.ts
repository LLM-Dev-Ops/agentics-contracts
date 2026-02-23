import { z } from "zod";

export const SubTaskSchema = z.object({
  subTaskId: z.string().uuid(),
  description: z.string().min(1),
  dependencies: z.array(z.string().uuid()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SubTask = Readonly<z.infer<typeof SubTaskSchema>>;

export const DecompositionOutputSchema = z.object({
  decompositionId: z.string().uuid(),
  originalRequest: z.string().min(1),
  subTasks: z.array(SubTaskSchema),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type DecompositionOutput = Readonly<
  z.infer<typeof DecompositionOutputSchema>
>;
