import { Buffer } from 'node:buffer'
import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .refine((value) => [...value].length >= 3, '用户名至少需要 3 个字符。')
  .refine((value) => [...value].length <= 24, '用户名不能超过 24 个字符。')
  .refine((value) => /^[\p{L}\p{N}_-]+$/u.test(value), '用户名只能包含文字、数字、下划线或短横线。')

export const passwordSchema = z
  .string()
  .min(8, '密码至少需要 8 个字符。')
  .max(72, '密码不能超过 72 个字符。')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, '密码的 UTF-8 长度不能超过 72 字节。')

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export function normalizeUsername(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('en-US')
}
