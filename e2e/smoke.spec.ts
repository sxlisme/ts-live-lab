import { expect, test } from '@playwright/test'

test('runs TypeScript and streams output', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TS / JS 运行台' })).toBeVisible()
  await expect(page.locator('.console-body')).toContainText('TypeScript: 100', { timeout: 15_000 })
  await page.screenshot({ path: testInfo.outputPath('playground.png'), fullPage: true })
})

test('terminates an infinite loop without freezing the page', async ({ page }) => {
  await page.goto('/')
  await page.locator('.auto-run-control').click()
  await expect(page.locator('.auto-run-control input')).not.toBeChecked()

  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.insertText('while (true) {}')
  await page.locator('.run-button').click()

  await expect(page.locator('.console-body')).toContainText('执行超过 2 秒', { timeout: 8_000 })
  await expect(page.getByRole('heading', { name: 'TS / JS 运行台' })).toBeVisible()
})

test('renders an isolated Web preview and terminates preview loops', async ({ page }) => {
  await page.goto('/web-preview')
  await expect(page.getByRole('heading', { name: 'HTML / CSS / JS 快速预览' })).toBeVisible()
  await expect(page.locator('.preview-state')).toContainText('预览就绪', { timeout: 8_000 })
  await expect(
    page.locator('.preview-frame').contentFrame().getByRole('heading', { name: '产品迭代' }),
  ).toBeVisible()

  await page.getByRole('tab', { name: 'JavaScript' }).click()
  await page.locator('.auto-preview-control').click()
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.insertText('while (true) {}')
  await page.getByRole('button', { name: '刷新预览' }).click()

  await expect(page.locator('.preview-console')).toContainText('已终止可能的死循环', {
    timeout: 8_000,
  })
  await expect(page.getByRole('heading', { name: 'HTML / CSS / JS 快速预览' })).toBeVisible()
})

test('navigates through practice, docs, and settings', async ({ page }, testInfo) => {
  await page.goto('/practice')
  await expect(page.getByRole('heading', { name: 'TypeScript 面试练习' })).toBeVisible()
  await expect(page.locator('.question-list button')).toHaveCount(50)
  await page.waitForTimeout(200)
  await page.screenshot({ path: testInfo.outputPath('practice.png'), fullPage: true })

  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: '打开导航' }).click()
  }
  await page.getByRole('link', { name: 'TS 文档' }).click()
  await expect(page.getByRole('heading', { name: 'TypeScript 开发手册' })).toBeVisible()
  await page.waitForTimeout(200)
  await page.screenshot({ path: testInfo.outputPath('docs.png'), fullPage: true })

  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: '打开导航' }).click()
  }
  await page.getByRole('link', { name: 'AI 配置' }).click()
  await expect(page.getByRole('heading', { name: 'AI 提供商配置' })).toBeVisible()
  const baseUrlInput = page.getByLabel('上游地址')
  await expect(baseUrlInput).toBeVisible()
  await expect(baseUrlInput).toBeEnabled()
  await baseUrlInput.fill('https://gateway.example.com/anthropic')
  await page.getByLabel('模型 ID').fill('third-party/model-v2')
  await page.getByRole('button', { name: '保存配置' }).click()
  await expect(page.locator('.form-notice')).toContainText('配置已保存')
  await page.waitForTimeout(200)
  await page.screenshot({ path: testInfo.outputPath('settings.png'), fullPage: true })
})
