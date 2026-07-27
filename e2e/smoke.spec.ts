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

  await expect(page.locator('.console-body')).toContainText('执行超过 15 秒', {
    timeout: 22_000,
  })
  await expect(page.getByRole('heading', { name: 'TS / JS 运行台' })).toBeVisible()
})

test('requires login, then saves, reopens, updates, and deletes a code snippet', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: '保存片段', exact: true }).click()

  const authDialog = page.getByRole('dialog', { name: '登录 TypeRoom' })
  await expect(authDialog).toBeVisible()
  await authDialog.getByRole('tab', { name: '注册' }).click()
  const username = `snippet_${testInfo.project.name.startsWith('mobile') ? 'm' : 'd'}_${Date.now().toString(36)}`
  await page.getByRole('dialog', { name: '创建账号' }).getByLabel('用户名').fill(username)
  await page
    .getByRole('dialog', { name: '创建账号' })
    .getByLabel('密码', { exact: true })
    .fill('password123')
  await page.getByRole('dialog', { name: '创建账号' }).getByLabel('确认密码').fill('password123')
  await page
    .getByRole('dialog', { name: '创建账号' })
    .getByRole('button', { name: '注册并登录' })
    .click()

  const dialog = page.getByRole('dialog', { name: '保存代码片段' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('片段名称').fill('Result 类型练习')
  await dialog.getByRole('button', { name: '保存片段', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('片段已保存')

  await page.getByRole('link', { name: '查看已保存片段' }).click()
  await expect(page.getByRole('heading', { name: '代码片段' })).toBeVisible()
  await expect(page.locator('.snippet-list')).toContainText('Result 类型练习')
  await expect(page.locator('.snippet-list')).toContainText('创建于')

  await page.locator('.snippet-content').click()
  await expect(page.getByText('Result 类型练习', { exact: true })).toBeVisible()
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.insertText('console.log("updated")')
  await page.getByRole('button', { name: '更新片段', exact: true }).click()
  await page
    .getByRole('dialog', { name: '更新代码片段' })
    .getByRole('button', { name: '保存更新' })
    .click()

  await page.getByRole('link', { name: '查看已保存片段' }).click()
  await expect(page.locator('.snippet-list')).toContainText('updated')
  page.once('dialog', (confirmation) => confirmation.accept())
  await page.getByRole('button', { name: '删除 Result 类型练习' }).click()
  await expect(page.getByRole('heading', { name: '还没有保存代码片段' })).toBeVisible()

  if (testInfo.project.name.includes('mobile')) {
    await page.getByRole('button', { name: '打开导航' }).click()
  }
  const logoutButton = page.getByRole('button', { name: '退出登录' })
  page.once('dialog', (confirmation) => confirmation.dismiss())
  await logoutButton.click()
  await expect(logoutButton).toBeVisible()

  page.once('dialog', (confirmation) => confirmation.accept())
  await logoutButton.click()
  await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
})

test('generates a snippet name when AI is configured', async ({ page }) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'user-1', username: 'AIUser', createdAt: new Date().toISOString() },
      }),
    }),
  )
  await page.route('**/api/snippets', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ snippets: [] }),
    }),
  )
  await page.route('**/api/ai/status', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        serverConfigured: true,
        allowClientKey: false,
        allowClientBaseUrl: false,
        defaultModel: 'test-model',
        defaultBaseUrl: 'https://api.example.com',
      }),
    }),
  )
  await page.route('**/api/ai/snippet-name', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ name: '联合类型结果处理' }),
    }),
  )

  await page.goto('/')
  await page.getByRole('button', { name: '保存片段', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '保存代码片段' })
  await dialog.getByRole('button', { name: 'AI 命名' }).click()
  await expect(dialog.getByLabel('片段名称')).toHaveValue('联合类型结果处理')
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
