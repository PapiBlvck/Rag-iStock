import { z } from 'zod';

export const SourceSchema = z.object({
  uri: z.string().url(),
  title: z.string(),
});

export const RagResponseSchema = z.object({
  text: z.string(),
  sources: z.array(SourceSchema),
  confidence: z.number().min(0).max(1),
});

export const HealthRecordSchema = z.object({
  animalId: z.string().optional(),
  diagnosis: z.string(),
  protocol: z.string(),
  diagnosisDate: z.date().or(z.string()),
});

export type Source = z.infer<typeof SourceSchema>;
export type RagResponse = z.infer<typeof RagResponseSchema>;
export type HealthRecord = z.infer<typeof HealthRecordSchema>;

