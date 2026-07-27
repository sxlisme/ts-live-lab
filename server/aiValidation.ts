import { z } from 'zod'

export const modelIdSchema = z
  .string()
  .trim()
  .min(1, '模型 ID 不能为空。')
  .max(120, '模型 ID 不能超过 120 个字符。')
  .refine(
    (value) =>
      ![...value].some((character) => {
        const code = character.charCodeAt(0)
        return code <= 31 || code === 127
      }),
    '模型 ID 不能包含控制字符。',
  )

export const snippetNameRequestSchema = z.object({
  model: modelIdSchema,
  baseUrl: z.string().min(1).max(500).optional(),
  language: z.enum(['typescript', 'javascript']),
  code: z.string().min(1, '请先填写代码。').max(8_000),
})
