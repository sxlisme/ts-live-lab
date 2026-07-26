import { z } from 'zod'

export const modelIdSchema = z
  .string()
  .trim()
  .min(1, '模型 ID 不能为空。')
  .max(120, '模型 ID 不能超过 120 个字符。')
  .refine(
    (value) => ![...value].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    }),
    '模型 ID 不能包含控制字符。',
  )
