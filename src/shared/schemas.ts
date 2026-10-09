import { z } from 'zod';

export const sizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const viewportStringSchema = z
  .string()
  .regex(/^\d+x\d+$/, 'viewport must be <width>x<height>, e.g. 1440x900')
  .transform((value) => {
    const [w, h] = value.split('x');
    return {
      width: Number(w),
      height: Number(h),
    };
  })
  .pipe(sizeSchema);

export const thresholdSchema = z.coerce.number().min(0).max(1);
export const ratioSchema = z.coerce.number().min(0).max(1);

export const compareCliOptionsSchema = z
  .object({
    target: z.string().min(1, '--target is required'),
    actual: z.string().optional(),
    url: z.string().optional(),
    out: z.string().default('./pixelproof-report'),
    viewport: viewportStringSchema.optional(),
    threshold: thresholdSchema.default(0.1),
    includeAa: z.boolean().default(false),
    failAbove: ratioSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasActual = value.actual !== undefined && value.actual.length > 0;
    const hasUrl = value.url !== undefined && value.url.length > 0;
    if (hasActual === hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'exactly one of --actual or --url is required',
        path: ['actual'],
      });
    }
    if (value.viewport !== undefined && !hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--viewport is only valid with --url',
        path: ['viewport'],
      });
    }
  });

export type CompareCliOptions = z.infer<typeof compareCliOptionsSchema>;
