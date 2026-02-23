import { z } from "zod";

export const ERPDeploymentArtifactSchema = z.object({
  deploymentId: z.string().uuid(),
  targetSystem: z.string().min(1),
  modules: z.array(z.string().min(1)),
  configuration: z.record(z.string(), z.unknown()),
  environment: z.enum(["development", "staging", "production"]),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type ERPDeploymentArtifact = Readonly<
  z.infer<typeof ERPDeploymentArtifactSchema>
>;
