import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { HTTPException } from 'hono/http-exception'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

marked.use(markedHighlight({
  emptyLangClass: 'hljs',
  langPrefix: 'hljs language-',
  highlight(code, lang, info) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}))

const mdrender = new marked.Renderer()

mdrender.blockquote = ({ tokens }) => {
  const contents = []
  for (const token of tokens) {
    if (token.type == "paragraph") {
      contents.push(`<p><em>${token.raw}</em></p>`)
    } else {
      contents.push(marked.parseInline(token.raw))
    }
  }
  return `<blockquote>${contents.join()}</blockquote>`
}

mdrender.code = ({ text, lang }) => {
  if (!lang || lang == "") {
    lang = "plaintext"
  }
  return `<div class="highlight"><pre><code class="language-${lang}">${text}</code></pre></div>`
}

type Bindings = {
  PATHS: {
    pkg: string
    repo: string
    readme: string
  }[]
  AVATAR: string
  DESC: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  const u = new URL(c.req.url)
  return c.html(html`<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>${u.hostname} Go Packages</title>
<style>
:root {
    --border-bottom-color: #737373;
    --font-family: Cantarell,sans-serif;
}

body {
    font-family: var(--font-family);
    font-size: 120%;
    max-width: 40em;
    margin: 0 auto;
    padding: 0 1em 1em 1em;
    line-height: 1.6;
}

header {
    text-align: center;
}

a.action {
    cursor: pointer;
    font-style: italic;
    font-size: 80%;
}

a.title {
    text-decoration: underline;
    font-weight: bold;
    cursor: pointer;
}

a.button {
    text-decoration: none;
    cursor: pointer;
}

a.title {
    text-decoration: none;
    color: #000000;
}

a.title:visited {
    color: #000000;
}

a:not(.button, .action, .title):visited {
    color: #902000;
}

a:not(.button, .action, .title) {
    color: #902000;
}
</style>
</head>
<header><h1> ${u.hostname}</h1></header>
<p>
<img style="float: right; width: 9em; margin-left: 1em; border-radius: 15px;" src="${c.env.AVATAR}" />
${c.env.DESC}
</p>
<hr>
<div>
${c.env.PATHS.map(({ pkg: path }) => {
    const pkg = `${u.hostname}/${path}`
    return html`<p><a href="${`https://` + pkg}">${pkg}</a></p>`
  })}
</div>
</html>`)
})

app.get('/:pkg/*', async (c) => {
  const pkg = c.req.param("pkg")
  const pc = c.env.PATHS.find(({ pkg: path }) => path == pkg)
  if (!pc) {
    throw new HTTPException(404, { message: "Unknown package" })
  }
  const u = new URL(c.req.url)
  const content_import = `${u.hostname}/${pc.pkg} git ${pc.repo}`
  const content_source = `${u.hostname}/${pc.pkg} ${pc.repo} ${pc.repo}/tree/main{/dir} ${pc.repo}/blob/main{/dir}/{file}#L{line}`
  const pkg_url = `https://pkg.go.dev/${u.hostname}/${u.pathname.slice(1)}`
  let readme = ""
  try {
    if (pc.readme != "") {
      readme = await (await fetch(pc.readme)).text()
    }
  } catch (e) {
    console.error(e)
  }
  return c.html(html`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <meta name="go-import" content="${content_import}">
  <meta name="go-source" content="${content_source}">
  <title>${pc.pkg}</title>
<style>
:root {
    --border-bottom-color: #737373;
    --font-family: Cantarell,sans-serif;
}

body {
    font-family: var(--font-family);
    font-size: 120%;
    max-width: 40em;
    margin: 0 auto;
    padding: 0 1em 1em 1em;
    line-height: 1.6;
}

header {
    text-align: center;
}

a.action {
    cursor: pointer;
    font-style: italic;
    font-size: 80%;
}

a.title {
    text-decoration: underline;
    font-weight: bold;
    cursor: pointer;
}

a.button {
    text-decoration: none;
    cursor: pointer;
}

a.title {
    text-decoration: none;
    color: #000000;
}

a.title:visited {
    color: #000000;
}

a:not(.button, .action, .title):visited {
    color: #902000;
}

a:not(.button, .action, .title) {
    color: #902000;
}
table {
    margin: auto;
}

th, td {
    padding: 8px;
    text-align: left;
}

input[type=submit] {
    text-decoration: none;
    cursor: pointer;
    border: none;
    background: transparent;
    font-family: var(--font-family);
    font-size: 100%;
}

input[type=text] {
    border: none;
    border-bottom: 1px inset var(--border-bottom-color);
    outline: none;
    font-family: var(--font-family);
    font-size: 120%;
}

input[type=password] {
    border: none;
    border-bottom: 1px inset var(--border-bottom-color);
    outline: none;
    font-family: var(--font-family);
    font-size: 120%;
}

.highlight {
    padding-left: calc(10% - 2em);
    font-size: 100%;
    line-height: 1.25;
}

ul {
    list-style-type: disc;
    margin-top: 1.25em;
    margin-top: 1.25em;
    padding-left: 1.625em;
}

ul > li::marker {
    color: var(--border-bottom-color);
}

pre {
    margin: 0;
}

pre > code {
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    position: relative;
    font-family: monospace;
    line-height: 1.25;
}

code:not([class^="language-"])::before {
    content: "\`";
}

code:not([class^="language-"])::after {
    content: "\`";
}

code:not([class^="language-"]) {
    font-weight: 600;
    font-family: var(--font-family);
}

.radio-group {
  max-width: 650px;
  text-align: center;
  font-family: var(--font-family);
}

.radio-label {
  display: inline-block;
  cursor: pointer;
}

.radio-text {
  font-size: 80%;
  color: var(--border-bottom-color);
}

.summary > h2 {
  font-size: 1em;
  font-weight: normal;
}

figure > figcaption {
  font-size: 80%;
  color: var(--border-bottom-color);
  text-align: center;
}

/* Background */
.hljs { 
    background-color: #f0f0f0; 
    color: inherit;
}

/* Line highlighting */
.hljs-line { display: flex; }
.hljs-line.highlighted { background-color: #d8d8d8; }

/* Line numbers */
.hljs-ln-numbers {
    white-space: pre;
    -webkit-user-select: none;
    user-select: none;
    margin-right: 0.4em;
    padding: 0 0.4em 0 0.4em;
    color: #7f7f7f;
    vertical-align: top;
    border: 0;
}

.hljs-ln-code {
    vertical-align: top;
    padding: 0;
    margin: 0;
    border: 0;
}

/* Keywords */
.hljs-keyword,
.hljs-built_in,
.hljs-selector-tag,
.hljs-section,
.hljs-name {
    color: #007020;
    font-weight: bold;
}

.hljs-keyword.hljs-pseudo {
    color: #007020;
    font-weight: normal;
}

.hljs-type {
    color: #902000;
}

/* Names and identifiers */
.hljs-title,
.hljs-class .hljs-title {
    color: #0e84b5;
    font-weight: bold;
}

.hljs-function .hljs-title {
    color: inherit;
}

.hljs-attr,
.hljs-attribute {
    color: #0e84b5;
    font-weight: bold;
}

.hljs-variable {
    color: inherit;
}

.hljs-tag {
    color: #062873;
    font-weight: bold;
}

.hljs-meta {
    color: #555;
    font-weight: bold;
}

.hljs-doctag {
    color: #d55537;
    font-weight: bold;
}

/* Literals and strings */
.hljs-string {
    color: inherit;
}

.hljs-string.hljs-doc {
    font-style: italic;
}

.hljs-string.hljs-escape {
    font-weight: bold;
}

.hljs-template-variable,
.hljs-subst {
    color: #70a0d0;
}

.hljs-regexp {
    color: #235388;
}

.hljs-symbol {
    color: #517918;
}

/* Numbers */
.hljs-number,
.hljs-literal {
    color: #40a070;
}

/* Operators */
.hljs-operator {
    color: #666;
}

.hljs-operator.hljs-word {
    color: #007020;
    font-weight: bold;
}

/* Comments */
.hljs-comment,
.hljs-quote {
    color: #60a0b0;
    font-style: italic;
}

.hljs-comment.hljs-special {
    color: #60a0b0;
    background-color: #fff0f0;
}

.hljs-meta,
.hljs-meta-keyword {
    color: #007020;
}

/* Diff and version control */
.hljs-deletion {
    color: #a00000;
}

.hljs-addition {
    color: #00a000;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}

/* Generic styles */
.hljs-error {
    color: #f00;
}

.hljs-title.hljs-heading {
    color: #000080;
    font-weight: bold;
}

.hljs-title.hljs-subheading {
    color: #800080;
    font-weight: bold;
}

.hljs-link {
    text-decoration: underline;
}

/* Additional highlight.js specific classes */
.hljs-params {
    color: inherit;
}

.hljs-bullet {
    color: inherit;
}

.hljs-code {
    color: inherit;
}

.hljs-formula {
    color: inherit;
}
</style>
</head>
<header><h1> ${pc.pkg}</h1></header>
<p>
<img style="float: right; width: 9em; margin-left: 1em; border-radius: 15px;" src="${c.env.AVATAR}" />
${c.env.DESC}
</p>
<hr>
<div>
${raw(await marked.parse(readme, { renderer: mdrender }))}
</div>
<a href="${pkg_url}">Head to documentation.</a>
</html>`)
})

export default app
