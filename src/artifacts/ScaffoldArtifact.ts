import { z } from "zod";

export const ScaffoldFileSchema = z.object({
  filePath: z.string().min(1),
  content: z.string(),
  language: z.string().optional(),
});

export type ScaffoldFile = Readonly<z.infer<typeof ScaffoldFileSchema>>;

export const ScaffoldArtifactSchema = z.object({
  scaffoldId: z.string().uuid(),
  files: z.array(ScaffoldFileSchema),
  framework: z.string().optional(),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type ScaffoldArtifact = Readonly<
  z.infer<typeof ScaffoldArtifactSchema>
>;
