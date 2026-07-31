<script setup lang="ts">
import PageHeading from '@/components/ui/PageHeading.vue'
import { buildInfo } from '@/config/buildInfo'
import {
  Boxes,
  CalendarClock,
  ExternalLink,
  Github,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'

const author = {
  name: 'sxlisme',
  url: 'https://github.com/sxlisme',
}
const repository = {
  name: 'sxlisme/ts-live-lab',
  url: 'https://github.com/sxlisme/ts-live-lab',
}

const dependencyGroups = [...new Set(buildInfo.dependencies.map((item) => item.category))].map(
  (category) => ({
    category,
    dependencies: buildInfo.dependencies.filter((item) => item.category === category),
  }),
)

const formattedBuildTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
}).format(new Date(buildInfo.builtAt))
</script>

<template>
  <div class="about-page">
    <PageHeading
      eyebrow="ABOUT"
      title="关于 TypeRoom"
      description="应用版本、构建时间与核心依赖清单。"
    />

    <div class="about-layout">
      <section class="build-panel panel" aria-labelledby="build-info-title">
        <header class="build-heading">
          <span class="build-icon"><PackageCheck :size="21" /></span>
          <div>
            <h2 id="build-info-title">构建信息</h2>
            <p>当前运行版本</p>
          </div>
          <span class="version-badge">v{{ buildInfo.version }}</span>
        </header>

        <dl class="build-details">
          <div>
            <dt><PackageCheck :size="15" />应用版本</dt>
            <dd>v{{ buildInfo.version }}</dd>
          </div>
          <div>
            <dt><CalendarClock :size="15" />本次构建</dt>
            <dd><time :datetime="buildInfo.builtAt">{{ formattedBuildTime }}</time></dd>
          </div>
          <div>
            <dt><ShieldCheck :size="15" />代码运行</dt>
            <dd>浏览器隔离沙箱</dd>
          </div>
          <div>
            <dt><UserRound :size="15" />作者</dt>
            <dd>
              <a :href="author.url" target="_blank" rel="noreferrer">
                {{ author.name }}<ExternalLink :size="12" />
              </a>
            </dd>
          </div>
          <div>
            <dt><Github :size="15" />GitHub 仓库</dt>
            <dd>
              <a :href="repository.url" target="_blank" rel="noreferrer">
                {{ repository.name }}<ExternalLink :size="12" />
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section class="dependencies-panel panel" aria-labelledby="dependencies-title">
        <header class="dependencies-heading">
          <div>
            <span class="section-label">TECH STACK</span>
            <h2 id="dependencies-title">技术依赖</h2>
          </div>
          <span class="dependency-count"><Boxes :size="15" />{{ buildInfo.dependencies.length }} 项</span>
        </header>

        <div class="dependency-groups">
          <section v-for="group in dependencyGroups" :key="group.category" class="dependency-group">
            <h3>{{ group.category }}</h3>
            <div class="dependency-list">
              <div v-for="item in group.dependencies" :key="item.packageName" class="dependency-row">
                <div class="dependency-name">
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.role }}</span>
                </div>
                <code>{{ item.packageName }}</code>
                <span class="dependency-version">{{ item.version }}</span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.about-layout {
  display: grid;
  align-items: start;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 22px;
}

.build-panel,
.dependencies-panel {
  overflow: hidden;
}

.build-heading,
.dependencies-heading,
.dependency-row,
.dependency-count,
.build-details dt {
  display: flex;
  align-items: center;
}

.build-heading {
  position: relative;
  gap: 11px;
  padding: 22px;
  border-bottom: 1px solid var(--line);
}

.build-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  color: var(--green-dark);
  background: #dff1e7;
  border-radius: 6px;
}

h2,
h3,
p,
dl,
dd {
  margin: 0;
}

.build-heading h2,
.dependencies-heading h2 {
  font-size: 16px;
  line-height: 1.3;
}

.build-heading p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 11px;
}

.version-badge {
  margin-left: auto;
  padding: 5px 7px;
  color: var(--green-dark);
  background: #e7f4ec;
  border: 1px solid #c5dfcf;
  border-radius: 4px;
  font: 600 11px/1 'DM Mono', monospace;
}

.build-details {
  padding: 8px 22px 14px;
}

.build-details > div {
  padding: 15px 0;
  border-bottom: 1px solid var(--line);
}

.build-details > div:last-child {
  border-bottom: 0;
}

.build-details dt {
  gap: 7px;
  color: var(--ink-soft);
  font-size: 11px;
}

.build-details dt svg {
  color: var(--green);
}

.build-details dd {
  margin-top: 7px;
  color: var(--ink);
  font: 600 12px/1.6 'DM Mono', monospace;
  overflow-wrap: anywhere;
}

.build-details dd a {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  color: var(--green-dark);
  text-decoration: none;
}

.build-details dd a:hover {
  text-decoration: underline;
}

.build-details dd a svg {
  flex: 0 0 auto;
}

.dependencies-heading {
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--line);
}

.section-label {
  display: block;
  margin-bottom: 3px;
  color: var(--green);
  font: 500 9px/1.4 'DM Mono', monospace;
}

.dependency-count {
  flex: 0 0 auto;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 11px;
}

.dependency-groups {
  padding: 4px 22px 18px;
}

.dependency-group {
  padding-top: 18px;
}

.dependency-group h3 {
  margin-bottom: 7px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
}

.dependency-list {
  border-top: 1px solid var(--line);
}

.dependency-row {
  min-width: 0;
  min-height: 54px;
  gap: 16px;
  border-bottom: 1px solid var(--line);
}

.dependency-name {
  display: grid;
  min-width: 145px;
  gap: 2px;
}

.dependency-name strong {
  font-size: 12px;
}

.dependency-name span {
  color: var(--ink-soft);
  font-size: 10px;
}

.dependency-row code {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--ink-soft);
  font: 500 10px/1.4 'DM Mono', monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dependency-version {
  min-width: 62px;
  color: var(--ink);
  font: 600 11px/1.4 'DM Mono', monospace;
  text-align: right;
}

@media (max-width: 940px) {
  .about-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .build-heading,
  .dependencies-heading {
    padding-right: 16px;
    padding-left: 16px;
  }

  .build-details,
  .dependency-groups {
    padding-right: 16px;
    padding-left: 16px;
  }

  .dependency-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 5px 12px;
    padding: 11px 0;
  }

  .dependency-name {
    min-width: 0;
  }

  .dependency-row code {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .dependency-version {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
