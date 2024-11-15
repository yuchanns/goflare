import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { HTTPException } from 'hono/http-exception'
import { marked } from 'marked'

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
  return `<div class="code ${lang}"><pre><code>${text}</code></pre></div>`
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
body {
  font-family: 'Cantarell,sans-serif';
  font-size: 120%;
  max-width: 40em;
  margin: 0 auto;
  padding: 0 1em 1em 1em;
  line-height: 1.6;
}

header {
  text-align: center;
}

a{
  text-decoration: underline;
  font-weight: bold;
  cursor: pointer;
  color: inherit;
}

a:visited {
  color: inherit;
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
body {
  font-family: 'Cantarell,sans-serif';
  font-size: 120%;
  max-width: 40em;
  margin: 0 auto;
  padding: 0 1em 1em 1em;
  line-height: 1.6;
}

header {
  text-align: center;
}

a{
  text-decoration: underline;
  font-weight: bold;
  cursor: pointer;
  color: inherit;
}

a:visited {
  color: inherit;
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
${raw(await marked.parse(readme, { renderer: mdrender }))}
</div>
<a href="${pkg_url}">Head to documentation.</a>
</html>`)
})

export default app
