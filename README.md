<div align="center">

<h1>vue-streamdown</h1>

<p>A Vue 3 port of <a href="https://github.com/vercel/streamdown">streamdown</a> — a drop-in alternative to <code>vue-markdown</code>, built for AI-powered streaming.</p>

[![npm version](https://img.shields.io/npm/v/vue-streamdown?color=blue)](https://www.npmjs.com/package/vue-streamdown)
[![npm downloads](https://img.shields.io/npm/dm/vue-streamdown)](https://www.npmjs.com/package/vue-streamdown)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![License](https://img.shields.io/npm/l/vue-streamdown)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)](https://www.typescriptlang.org/)

</div>

---

## Overview

Streaming Markdown from LLMs creates unique rendering challenges: incomplete code fences, partial tables, and unterminated blocks can all break a naive renderer. `vue-streamdown` handles all of this gracefully — the same battle-tested approach as Vercel's `streamdown`, now for the Vue ecosystem.

**Works with any AI streaming API**: Vercel AI SDK, OpenAI, Anthropic, or raw SSE streams.

---

## Features

- ⚡ **Streaming-optimized** — gracefully handles partial/incomplete Markdown from LLMs
- 🎨 **Syntax highlighting** — beautiful code blocks via [Shiki](https://shiki.style/)
- 📊 **GitHub Flavored Markdown** — tables, task lists, strikethrough
- 📈 **Mermaid diagrams** — render flowcharts, sequence diagrams, and more
- 🔢 **Math rendering** — LaTeX equations via KaTeX
- 🌐 **CJK support** — proper word-wrapping for Chinese/Japanese/Korean
- 🛡️ **Security-first** — built-in HTML sanitization via `rehype-sanitize` + `rehype-harden`
- 🎯 **Animated cursor** — blinking block/circle caret during streaming
- 🔗 **Link safety** — external link confirmation modal
- 🌙 **Dark mode** — respects shadcn/ui CSS variables
- 💪 **Fully typed** — complete TypeScript support with Composition API

---

## Preview

### Streaming with animated caret

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Here is a Fibonacci sequence in Python:            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ python                          [⎘] [↓]     │   │
│  │ 1  def fib(n):                              │   │
│  │ 2      if n <= 1:                           │   │
│  │ 3          return n                         │   │
│  │ 4      return fib(n-1) + fib(n-2) ▋        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Table with copy/download controls

```
┌──────────────────────────────────────────────────────────┐
│  Framework   │  Stars  │  License          [⎘] [↓] [⛶]  │
│──────────────┼─────────┼────────────────────────────────  │
│  Vue 3       │  48k    │  MIT                            │
│  React       │  226k   │  MIT                            │
│  Svelte      │  80k    │  MIT                            │
└──────────────────────────────────────────────────────────┘
```

### Mermaid diagram rendering

```
┌────────────────────────────────────────────────────────────┐
│  mermaid                           [↓▾] [⎘] [⛶] [🔍±]    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Client ──► API Server ──► Database           │  │
│  │            ▲                          │              │  │
│  │            └──────────────────────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
npm install vue-streamdown
# or
pnpm add vue-streamdown
# or
yarn add vue-streamdown
```

### Tailwind CSS setup

`vue-streamdown` uses Tailwind CSS utility classes. Add the following `@source` directive to your global CSS so Tailwind can detect them:

```css
/* globals.css */
@source "../node_modules/vue-streamdown/dist/*.js";
```

Adjust the relative path based on where your CSS file lives relative to `node_modules`.

### CSS Custom Properties (shadcn/ui design tokens)

Components use shadcn/ui CSS variables. If you already use shadcn/ui these are set automatically. Otherwise, add the following minimal set to your global CSS:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --sidebar: oklch(0.985 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(0.269 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --sidebar: oklch(0.205 0 0);
  --radius: 0.625rem;
}
```

---

## Usage

### Basic usage

```vue
<script setup lang="ts">
import { Streamdown } from 'vue-streamdown'
</script>

<template>
  <Streamdown :model-value="markdownText" />
</template>
```

> **Note:** Unlike the React version, content is passed via the `model-value` prop — not as slot content.

---

### Streaming with Vercel AI SDK

```vue
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import { Streamdown } from 'vue-streamdown'

const { messages, status } = useChat()
</script>

<template>
  <div v-for="message in messages" :key="message.id">
    <template v-for="part in message.parts" :key="part.type">
      <Streamdown
        v-if="part.type === 'text'"
        :model-value="part.text"
        :is-animating="status === 'streaming'"
        animated
        caret="block"
      />
    </template>
  </div>
</template>
```

---

### Streaming with raw fetch / SSE

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Streamdown } from 'vue-streamdown'

const content = ref('')
const isStreaming = ref(false)

async function chat(prompt: string) {
  isStreaming.value = true
  content.value = ''

  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    content.value += decoder.decode(value)
  }

  isStreaming.value = false
}
</script>

<template>
  <button @click="chat('Explain quicksort with code')">Ask AI</button>

  <Streamdown
    :model-value="content"
    :is-animating="isStreaming"
    mode="streaming"
    caret="block"
    animated
  />
</template>
```

---

### With syntax highlighting (Shiki)

Install the code plugin:

```bash
npm install @streamdown/code
```

```vue
<script setup lang="ts">
import { Streamdown } from 'vue-streamdown'
import { createCodePlugin } from '@streamdown/code'

const codePlugin = createCodePlugin()
</script>

<template>
  <Streamdown
    :model-value="markdown"
    :plugins="{ code: codePlugin }"
  />
</template>
```

---

### With Mermaid diagrams

Install the mermaid plugin:

```bash
npm install @streamdown/mermaid
```

```vue
<script setup lang="ts">
import { Streamdown } from 'vue-streamdown'
import { createMermaidPlugin } from '@streamdown/mermaid'

const mermaidPlugin = createMermaidPlugin()
</script>

<template>
  <Streamdown
    :model-value="markdown"
    :plugins="{ mermaid: mermaidPlugin }"
  />
</template>
```

---

### With math (KaTeX)

Install the math plugin and KaTeX CSS:

```bash
npm install @streamdown/math katex
```

```vue
<script setup lang="ts">
import { Streamdown } from 'vue-streamdown'
import { createMathPlugin } from '@streamdown/math'
import 'katex/dist/katex.min.css'

const mathPlugin = createMathPlugin()
</script>

<template>
  <Streamdown
    :model-value="markdown"
    :plugins="{ math: mathPlugin }"
  />
</template>
```

---

### All plugins together

```vue
<script setup lang="ts">
import { Streamdown } from 'vue-streamdown'
import { createCodePlugin } from '@streamdown/code'
import { createMermaidPlugin } from '@streamdown/mermaid'
import { createMathPlugin } from '@streamdown/math'
import 'katex/dist/katex.min.css'

const plugins = {
  code: createCodePlugin(),
  mermaid: createMermaidPlugin(),
  math: createMathPlugin(),
}
</script>

<template>
  <Streamdown
    :model-value="content"
    :is-animating="isStreaming"
    :plugins="plugins"
    mode="streaming"
    caret="block"
    animated
  />
</template>
```

---

### Custom translations (i18n)

```vue
<template>
  <Streamdown
    :model-value="markdown"
    :translations="{
      copyCode: '코드 복사',
      copied: '복사됨',
      viewFullscreen: '전체 화면',
      exitFullscreen: '닫기',
      downloadFile: '파일 다운로드',
    }"
  />
</template>
```

---

### Tailwind CSS prefix support

```vue
<template>
  <!-- All internal Tailwind classes will be prefixed: tw:flex, tw:text-sm, etc. -->
  <Streamdown :model-value="markdown" prefix="tw" />
</template>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model-value` | `string` | `""` | Markdown content to render |
| `mode` | `"streaming" \| "static"` | `"streaming"` | Rendering mode |
| `is-animating` | `boolean` | `false` | Whether the stream is active |
| `animated` | `boolean \| AnimateOptions` | — | Enable token-by-token animation |
| `caret` | `"block" \| "circle"` | — | Blinking cursor style during streaming |
| `controls` | `boolean \| ControlsConfig` | `true` | Show code/table/mermaid action buttons |
| `line-numbers` | `boolean` | `true` | Show line numbers in code blocks |
| `shiki-theme` | `[ThemeInput, ThemeInput]` | `["github-light", "github-dark"]` | Shiki light/dark themes |
| `plugins` | `PluginConfig` | — | code / mermaid / math / cjk plugins |
| `remark-plugins` | `Pluggable[]` | — | Custom remark plugins |
| `rehype-plugins` | `Pluggable[]` | — | Custom rehype plugins |
| `components` | `Components` | — | Override hast → Vue component map |
| `translations` | `Partial<StreamdownTranslations>` | — | Override UI strings |
| `icons` | `Partial<IconMap>` | — | Override toolbar icons |
| `prefix` | `string` | — | Tailwind CSS class prefix |
| `link-safety` | `LinkSafetyConfig` | `{ enabled: true }` | External link confirmation |
| `mermaid` | `MermaidOptions` | — | Mermaid global config |
| `dir` | `"auto" \| "ltr" \| "rtl"` | — | Text direction (auto = per-block detection) |
| `parse-incomplete-markdown` | `boolean` | `true` | Use remend for streaming-safe parsing |
| `normalize-html-indentation` | `boolean` | `false` | Prevent indented HTML being treated as code |
| `allowed-tags` | `Record<string, string[]>` | — | Custom HTML tags to allow through sanitization |
| `literal-tag-content` | `string[]` | — | Tags whose children are treated as plain text |
| `remend` | `RemendOptions` | — | Options passed to remend |
| `on-animation-start` | `() => void` | — | Called when streaming starts |
| `on-animation-end` | `() => void` | — | Called when streaming ends |

---

## Composables (for custom child components)

If you build custom components that need to access the streamdown context:

```ts
import {
  useStreamdownContext,  // shikiTheme, controls, isAnimating, etc.
  useTranslations,       // UI strings
  useIcons,              // toolbar icons
  useCn,                 // prefix-aware cn()
  usePlugins,            // full plugin config
  useCodePlugin,         // code plugin
  useMermaidPlugin,      // mermaid plugin
  useIsBlockIncomplete,  // whether current block is mid-stream
  useIsBlockCode,        // whether <code> is inside a <pre>
  useCodeBlock,          // { code: ComputedRef<string> } for copy/download
  useAnimate,            // animate plugin instance
} from 'vue-streamdown'
```

---

## Comparison with streamdown (React)

| Feature | `streamdown` (React) | `vue-streamdown` (Vue 3) |
|---------|----------------------|--------------------------|
| Streaming-safe parsing | ✅ | ✅ |
| Syntax highlighting (Shiki) | ✅ | ✅ |
| Mermaid diagrams | ✅ | ✅ |
| Math (KaTeX) | ✅ | ✅ |
| CJK support | ✅ | ✅ |
| Animated cursor | ✅ | ✅ |
| Link safety modal | ✅ | ✅ |
| Dark mode | ✅ | ✅ |
| Tailwind prefix | ✅ | ✅ |
| TypeScript | ✅ | ✅ |
| Composition API / hooks | React hooks | Vue composables |
| SSR | ✅ (Next.js) | ✅ (Nuxt) |

---

## License

Apache-2.0 — based on [streamdown](https://github.com/vercel/streamdown) by Vercel.
