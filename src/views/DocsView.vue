<script setup lang="ts">
import CodeBlock from '@/components/docs/CodeBlock.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { docsGroups, docsSections, findDocsSection } from '@/data/docs'
import type { DocsSection } from '@/types/docs'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Info,
  Lightbulb,
  ListTree,
  Search,
  TriangleAlert,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const activeId = ref(docsSections[0]!.id)
const activeTopicId = ref(docsSections[0]!.topics[0]!.id)
const search = ref('')
const mobileNavOpen = ref(false)
const articleRef = ref<HTMLElement | null>(null)
let topicObserver: IntersectionObserver | null = null

const activeSection = computed(() => findDocsSection(activeId.value) ?? docsSections[0]!)
const activeGroup = computed(
  () => docsGroups.find((group) => group.id === activeSection.value.groupId) ?? docsGroups[0]!,
)
const activeIndex = computed(() =>
  docsSections.findIndex((section) => section.id === activeId.value),
)
const relatedSections = computed(() =>
  (activeSection.value.relatedIds ?? [])
    .map((id) => findDocsSection(id))
    .filter((section): section is DocsSection => Boolean(section)),
)
const readingMinutes = computed(() => {
  const content = [
    ...activeSection.value.paragraphs,
    ...activeSection.value.topics.flatMap((topic) => [
      ...topic.paragraphs,
      ...(topic.points ?? []),
      ...(topic.examples ?? []).map((example) => example.code),
    ]),
  ].join('')
  return Math.max(4, Math.round(content.length / 420))
})

const filteredGroups = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return docsGroups

  return docsGroups
    .map((group) => ({
      ...group,
      sections: group.sections.filter((section) =>
        [
          section.title,
          section.shortTitle,
          section.description,
          ...section.paragraphs,
          ...section.topics.flatMap((topic) => [
            topic.title,
            ...topic.paragraphs,
            ...(topic.points ?? []),
          ]),
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      ),
    }))
    .filter((group) => group.sections.length > 0)
})

function selectSection(id: string) {
  activeId.value = id
  mobileNavOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function moveSection(offset: number) {
  const section = docsSections[activeIndex.value + offset]
  if (section) selectSection(section.id)
}

function scrollToTopic(topicId: string) {
  activeTopicId.value = topicId
  document
    .getElementById(`topic-${topicId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function connectTopicObserver() {
  topicObserver?.disconnect()
  if (!articleRef.value || typeof IntersectionObserver === 'undefined') return
  topicObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      const topicId = (visible?.target as HTMLElement | undefined)?.dataset.topic
      if (topicId) activeTopicId.value = topicId
    },
    { rootMargin: '-90px 0px -65% 0px', threshold: 0 },
  )
  articleRef.value.querySelectorAll<HTMLElement>('[data-topic]').forEach((element) => {
    topicObserver?.observe(element)
  })
}

watch(activeId, async () => {
  activeTopicId.value = activeSection.value.topics[0]?.id ?? ''
  await nextTick()
  connectTopicObserver()
})

onMounted(connectTopicObserver)
onBeforeUnmount(() => topicObserver?.disconnect())
</script>

<template>
  <div class="docs-page">
    <PageHeading
      eyebrow="TYPESCRIPT HANDBOOK · 中文"
      title="TypeScript 开发手册"
      :description="`${docsGroups.length} 个主题分组 · ${docsSections.length} 个完整章节 · 对应官方来源`"
    >
      <template #actions>
        <a
          class="official-link"
          href="https://www.typescriptlang.org/docs/"
          target="_blank"
          rel="noreferrer"
        >
          官方文档 <ExternalLink :size="14" />
        </a>
      </template>
    </PageHeading>

    <div class="docs-layout">
      <aside class="docs-sidebar">
        <label class="docs-search">
          <Search :size="16" />
          <input v-model="search" type="search" placeholder="搜索概念、语法或配置" />
        </label>

        <button class="mobile-nav-toggle" type="button" @click="mobileNavOpen = !mobileNavOpen">
          <ListTree :size="16" />
          {{ activeGroup.title }} · {{ activeSection.shortTitle }}
          <ChevronDown :size="16" :class="{ rotated: mobileNavOpen }" />
        </button>

        <nav :class="{ 'mobile-open': mobileNavOpen }" aria-label="文档目录">
          <section v-for="group in filteredGroups" :key="group.id" class="docs-nav-group">
            <h2>{{ group.title }}</h2>
            <button
              v-for="section in group.sections"
              :key="section.id"
              type="button"
              :class="{ active: section.id === activeSection.id }"
              @click="selectSection(section.id)"
            >
              <span>{{ String(docsSections.indexOf(section) + 1).padStart(2, '0') }}</span>
              {{ section.shortTitle }}
            </button>
          </section>
          <p v-if="!filteredGroups.length" class="no-docs-result">没有匹配的章节</p>
        </nav>

        <div class="docs-version">
          <BookOpen :size="16" />
          <span>TypeScript 5.x · 中文重写</span>
        </div>
      </aside>

      <article ref="articleRef" class="docs-article">
        <header class="article-header">
          <nav class="breadcrumbs" aria-label="面包屑">
            <span>手册</span><ChevronRight :size="12" /><span>{{ activeGroup.title }}</span>
          </nav>
          <h1>{{ activeSection.title }}</h1>
          <p>{{ activeSection.description }}</p>
          <div class="article-meta">
            <span><Clock3 :size="13" /> 约 {{ readingMinutes }} 分钟</span>
            <span><ListTree :size="13" /> {{ activeSection.topics.length }} 个主题</span>
            <span>{{ String(activeIndex + 1).padStart(2, '0') }} / {{ docsSections.length }}</span>
          </div>
        </header>

        <div class="article-content">
          <section class="chapter-overview">
            <span>本章概览</span>
            <p v-for="paragraph in activeSection.paragraphs" :key="paragraph">{{ paragraph }}</p>
          </section>

          <section
            v-for="(topic, topicIndex) in activeSection.topics"
            :id="`topic-${topic.id}`"
            :key="topic.id"
            :data-topic="topic.id"
            class="docs-topic"
          >
            <div class="topic-number">{{ String(topicIndex + 1).padStart(2, '0') }}</div>
            <div class="topic-copy">
              <h2>{{ topic.title }}</h2>
              <p v-for="paragraph in topic.paragraphs" :key="paragraph">{{ paragraph }}</p>

              <ul v-if="topic.points?.length" class="topic-points">
                <li v-for="point in topic.points" :key="point">
                  <CheckCircle2 :size="15" />{{ point }}
                </li>
              </ul>

              <CodeBlock
                v-for="example in topic.examples"
                :key="example.title"
                :title="example.title"
                :code="example.code"
                :language="example.language"
              />

              <aside
                v-if="topic.callout"
                class="topic-callout"
                :class="`callout-${topic.callout.kind}`"
              >
                <TriangleAlert v-if="topic.callout.kind === 'warning'" :size="18" />
                <Lightbulb v-else-if="topic.callout.kind === 'tip'" :size="18" />
                <Info v-else :size="18" />
                <div>
                  <strong>{{ topic.callout.title }}</strong>
                  <p>{{ topic.callout.content }}</p>
                </div>
              </aside>
            </div>
          </section>

          <section v-if="activeSection.notes?.length" class="chapter-checklist">
            <h2>本章检查清单</h2>
            <ul>
              <li v-for="note in activeSection.notes" :key="note">
                <CheckCircle2 :size="15" />{{ note }}
              </li>
            </ul>
          </section>

          <section class="official-source">
            <div>
              <span>OFFICIAL SOURCE</span>
              <strong>TypeScript 官方参考</strong>
            </div>
            <a :href="activeSection.sourceUrl" target="_blank" rel="noreferrer">
              阅读原文 <ExternalLink :size="14" />
            </a>
          </section>
        </div>

        <footer class="docs-footer">
          <button type="button" :disabled="activeIndex === 0" @click="moveSection(-1)">
            <ChevronLeft :size="17" />
            <span
              ><small>上一章</small
              >{{ docsSections[activeIndex - 1]?.shortTitle ?? '已经是第一章' }}</span
            >
          </button>
          <button
            type="button"
            :disabled="activeIndex === docsSections.length - 1"
            @click="moveSection(1)"
          >
            <span
              ><small>下一章</small
              >{{ docsSections[activeIndex + 1]?.shortTitle ?? '已经是最后一章' }}</span
            >
            <ChevronRight :size="17" />
          </button>
        </footer>
      </article>

      <aside class="page-toc">
        <section>
          <h2>本页内容</h2>
          <button
            v-for="topic in activeSection.topics"
            :key="topic.id"
            type="button"
            :class="{ active: activeTopicId === topic.id }"
            @click="scrollToTopic(topic.id)"
          >
            {{ topic.title }}
          </button>
        </section>
        <section v-if="relatedSections.length" class="related-docs">
          <h2>关联章节</h2>
          <button
            v-for="section in relatedSections"
            :key="section.id"
            type="button"
            @click="selectSection(section.id)"
          >
            {{ section.shortTitle }}<ChevronRight :size="13" />
          </button>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.docs-page {
  width: min(1500px, 100%);
  margin: 0 auto;
}

.official-link {
  display: inline-flex;
  height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  color: var(--green-dark);
  background: #ffffff;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.docs-layout {
  display: grid;
  align-items: start;
  grid-template-columns: 240px minmax(620px, 1fr) 210px;
  gap: 24px;
}

.docs-sidebar,
.page-toc {
  position: sticky;
  top: 18px;
  max-height: calc(100vh - 36px);
}

.docs-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.docs-search {
  display: flex;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.docs-search input {
  min-width: 0;
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 13px;
}

.docs-sidebar > nav {
  min-height: 0;
  margin-top: 12px;
  padding-right: 4px;
  overflow-y: auto;
}

.docs-nav-group + .docs-nav-group {
  margin-top: 17px;
}

.docs-nav-group h2,
.page-toc h2 {
  margin: 0 0 6px;
  color: #7b8a80;
  font:
    600 12px/1.4 'DM Mono',
    monospace;
  text-transform: uppercase;
}

.docs-nav-group > button {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 9px;
  padding: 0 9px;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-left: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
}

.docs-nav-group > button:hover {
  color: var(--ink);
  background: #e9eee9;
}

.docs-nav-group > button.active {
  color: var(--green-dark);
  background: #e0eee5;
  border-left-color: var(--green);
  font-weight: 600;
}

.docs-nav-group button span {
  color: #91a097;
  font:
    500 10px/1 'DM Mono',
    monospace;
}

.no-docs-result {
  padding: 24px 8px;
  color: var(--ink-soft);
  font-size: 13px;
}

.docs-version {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  padding: 12px 8px;
  color: var(--ink-soft);
  border-top: 1px solid var(--line);
  font-size: 11px;
}

.docs-version svg {
  color: var(--green);
}

.mobile-nav-toggle {
  display: none;
}

.docs-article {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.article-header {
  padding: 34px 44px 28px;
  background: #fafcfa;
  border-bottom: 1px solid var(--line);
}

.breadcrumbs,
.article-meta {
  display: flex;
  align-items: center;
}

.breadcrumbs {
  gap: 5px;
  color: #75847a;
  font-size: 10px;
}

.article-header h1 {
  margin: 12px 0 9px;
  color: var(--ink);
  font-size: 29px;
  line-height: 1.3;
  letter-spacing: 0;
}

.article-header > p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.7;
}

.article-meta {
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 16px;
  color: #75847a;
  font-size: 10px;
}

.article-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.article-content {
  padding: 32px 44px 44px;
}

.chapter-overview {
  margin-bottom: 38px;
  padding: 18px 20px;
  background: #f1f6f2;
  border-left: 3px solid var(--green);
  border-radius: 5px;
}

.chapter-overview > span {
  color: var(--green);
  font:
    600 9px/1.4 'DM Mono',
    monospace;
}

.chapter-overview p {
  margin: 8px 0 0;
  color: #3f4d44;
  font-size: 13px;
  line-height: 1.85;
}

.docs-topic {
  display: grid;
  scroll-margin-top: 24px;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 11px;
}

.docs-topic + .docs-topic {
  margin-top: 42px;
  padding-top: 38px;
  border-top: 1px solid #e3e8e3;
}

.topic-number {
  padding-top: 7px;
  color: #8b9a90;
  font:
    500 9px/1 'DM Mono',
    monospace;
}

.topic-copy h2 {
  margin: 0 0 13px;
  color: var(--ink);
  font-size: 21px;
  line-height: 1.4;
  letter-spacing: 0;
}

.topic-copy > p {
  margin: 0 0 14px;
  color: #405047;
  font-size: 13px;
  line-height: 1.9;
}

.topic-points,
.chapter-checklist ul {
  display: grid;
  gap: 9px;
  margin: 17px 0;
  padding: 0;
  list-style: none;
}

.topic-points li,
.chapter-checklist li {
  display: grid;
  align-items: start;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 7px;
  color: #46564c;
  font-size: 12px;
  line-height: 1.7;
}

.topic-points svg,
.chapter-checklist svg {
  margin-top: 2px;
  color: var(--green);
}

.topic-callout {
  display: grid;
  align-items: start;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 9px;
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid;
  border-radius: 6px;
}

.topic-callout strong {
  font-size: 12px;
}

.topic-callout p {
  margin: 5px 0 0;
  font-size: 11px;
  line-height: 1.7;
}

.callout-note {
  color: #355f4d;
  background: #edf5f0;
  border-color: #c7ddce;
}

.callout-tip {
  color: #71591d;
  background: #f9f3e3;
  border-color: #e8d7aa;
}

.callout-warning {
  color: #8d4638;
  background: #fdf0ed;
  border-color: #e8bdb4;
}

.chapter-checklist {
  margin-top: 42px;
  padding: 18px 20px;
  background: #fafbf9;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.chapter-checklist h2 {
  margin: 0;
  font-size: 14px;
}

.official-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.official-source div {
  display: grid;
  gap: 3px;
}

.official-source span {
  color: #809087;
  font:
    500 8px/1.4 'DM Mono',
    monospace;
}

.official-source strong {
  font-size: 12px;
}

.official-source a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--green-dark);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
}

.docs-footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 14px 20px;
  background: #fafbfa;
  border-top: 1px solid var(--line);
}

.docs-footer button {
  display: flex;
  min-width: 0;
  min-height: 43px;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
}

.docs-footer button:last-child {
  justify-content: flex-end;
  text-align: right;
}

.docs-footer button:hover:not(:disabled) {
  color: var(--ink);
  background: var(--surface-muted);
}

.docs-footer button:disabled {
  opacity: 0.34;
  cursor: not-allowed;
}

.docs-footer button span {
  display: grid;
  gap: 3px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docs-footer small {
  color: #8a9990;
  font-size: 8px;
  font-weight: 400;
}

.page-toc {
  display: grid;
  align-content: start;
  gap: 24px;
  padding-top: 3px;
}

.page-toc section {
  display: grid;
  gap: 2px;
  padding-left: 13px;
  border-left: 1px solid var(--line);
}

.page-toc button {
  display: flex;
  width: 100%;
  min-height: 31px;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 6px;
  color: #69776e;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
}

.page-toc button:hover,
.page-toc button.active {
  color: var(--green-dark);
  background: #e6efe9;
}

.related-docs button {
  color: var(--ink-soft);
}

@media (max-width: 1280px) {
  .docs-layout {
    grid-template-columns: 226px minmax(580px, 1fr);
  }

  .page-toc {
    display: none;
  }
}

@media (max-width: 900px) {
  .docs-layout {
    grid-template-columns: 1fr;
  }

  .docs-sidebar {
    position: static;
    max-height: none;
  }

  .mobile-nav-toggle {
    display: flex;
    width: 100%;
    height: 42px;
    align-items: center;
    gap: 8px;
    margin-top: 9px;
    padding: 0 11px;
    color: var(--ink);
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .mobile-nav-toggle svg:last-child {
    margin-left: auto;
    transition: transform 140ms ease;
  }

  .mobile-nav-toggle svg.rotated {
    transform: rotate(180deg);
  }

  .docs-sidebar > nav {
    display: none;
    max-height: 360px;
    padding: 12px;
    background: #ffffff;
    border: 1px solid var(--line);
    border-top: 0;
    border-radius: 0 0 6px 6px;
  }

  .docs-sidebar > nav.mobile-open {
    display: block;
  }

  .docs-version {
    display: none;
  }
}

@media (max-width: 580px) {
  .article-header,
  .article-content {
    padding-right: 19px;
    padding-left: 19px;
  }

  .article-header {
    padding-top: 25px;
  }

  .article-header h1 {
    font-size: 24px;
  }

  .docs-topic {
    grid-template-columns: 1fr;
  }

  .topic-number {
    padding: 0;
  }

  .topic-copy h2 {
    font-size: 19px;
  }

  .official-source {
    align-items: flex-start;
    flex-direction: column;
  }

  .docs-footer {
    padding: 10px;
  }
}
</style>
