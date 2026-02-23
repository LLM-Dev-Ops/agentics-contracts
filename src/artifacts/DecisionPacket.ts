import { z } from "zod";

export const RiskAnalysisSchema = z.object({
  overallRiskLevel: z.enum(["low", "medium", "high", "critical"]),
  factors: z.array(
    z.object({
      factor: z.string().min(1),
      severity: z.enum(["low", "medium", "high", "critical"]),
      mitigation: z.string().optional(),
    })
  ),
});

export type RiskAnalysis = Readonly<z.infer<typeof RiskAnalysisSchema>>;

export const ROIProjectionSchema = z.object({
  estimatedValue: z.number(),
  currency: z.string().default("USD"),
  timeframeMonths: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
});

export type ROIProjection = Readonly<z.infer<typeof ROIProjectionSchema>>;

export const DeploymentImpactSchema = z.object({
  affectedSystems: z.array(z.string()),
  downtime: z.enum(["none", "minimal", "moderate", "significant"]),
  rollbackStrategy: z.string(),
  requiredApprovals: z.array(z.string()),
});

export type DeploymentImpact = Readonly<
  z.infer<typeof DeploymentImpactSchema>
>;

export const ArtifactReferenceSchema = z.object({
  artifactId: z.string().uuid(),
  artifactType: z.string().min(1),
  uri: z.string().optional(),
});

export type ArtifactReference = Readonly<
  z.infer<typeof ArtifactReferenceSchema>
>;

export const DecisionPacketSchema = z.object({
  packetId: z.string().uuid(),
  executiveSummary: z.string().min(1),
  riskAnalysis: RiskAnalysisSchema,
  roiProjection: ROIProjectionSchema,
  deploymentImpact: DeploymentImpactSchema,
  simulationConfidenceScore: z.number().min(0).max(1),
  artifactReferences: z.array(ArtifactReferenceSchema),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});

export type DecisionPacket = Readonly<
  z.infer<typeof DecisionPacketSchema>
>;
