import type { PreviewSource } from '@/types/preview'

export const defaultWebPreview: PreviewSource = {
  html: `<main class="task-board">
  <header>
    <div>
      <span class="eyebrow">WEEKLY PLAN</span>
      <h1>产品迭代</h1>
    </div>
    <strong id="count">3 项</strong>
  </header>

  <ul id="tasks">
    <li><button aria-label="完成任务"></button><span>整理用户反馈</span><small>09:30</small></li>
    <li><button aria-label="完成任务"></button><span>更新设计规范</span><small>13:00</small></li>
    <li><button aria-label="完成任务"></button><span>发布测试版本</span><small>16:30</small></li>
  </ul>

  <button id="add-task" class="add-task">+ 添加任务</button>
</main>`,
  css: `* { box-sizing: border-box; }
body {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  color: #17201b;
  background: #eef2ed;
  font-family: system-ui, sans-serif;
}
.task-board {
  width: min(440px, 100%);
  padding: 26px;
  background: white;
  border: 1px solid #d5ddd7;
  border-radius: 8px;
  box-shadow: 0 14px 35px rgba(23, 32, 27, .09);
}
header { display: flex; align-items: center; justify-content: space-between; }
.eyebrow { color: #1d6b4f; font: 700 10px/1 monospace; }
h1 { margin: 6px 0 0; font-size: 26px; }
header strong { padding: 7px 9px; color: #15513c; background: #e0f0e7; border-radius: 5px; font-size: 12px; }
ul { display: grid; gap: 8px; margin: 24px 0 18px; padding: 0; list-style: none; }
li { display: grid; min-height: 48px; align-items: center; grid-template-columns: 25px 1fr auto; gap: 9px; padding: 0 12px; background: #f7f9f6; border: 1px solid #e1e6e2; border-radius: 6px; }
li button { width: 18px; height: 18px; padding: 0; background: white; border: 2px solid #87a394; border-radius: 50%; cursor: pointer; }
li.done span { color: #879289; text-decoration: line-through; }
li.done button { background: #1d6b4f; box-shadow: inset 0 0 0 3px white; }
li small { color: #7d8981; font: 11px/1 monospace; }
.add-task { width: 100%; height: 41px; color: white; background: #1d6b4f; border: 0; border-radius: 6px; cursor: pointer; font-weight: 700; }
.add-task:hover { background: #15513c; }`,
  javascript: `const list = document.querySelector('#tasks')
const count = document.querySelector('#count')

list.addEventListener('click', event => {
  if (event.target.matches('button')) event.target.closest('li').classList.toggle('done')
})

document.querySelector('#add-task').addEventListener('click', () => {
  const item = document.createElement('li')
  item.innerHTML = '<button aria-label="完成任务"></button><span>新的任务</span><small>待安排</small>'
  list.append(item)
  count.textContent = list.children.length + ' 项'
  console.log('已添加任务', list.children.length)
})`,
}
