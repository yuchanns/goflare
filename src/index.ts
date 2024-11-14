import { Hono } from 'hono'
import { html } from 'hono/html'
import { HTTPException } from 'hono/http-exception'

type Bindings = {
  PATHS: {
    pkg: string
    repo: string
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
    const site = `https://pkg.go.dev/${pkg}`
    return html`<p><a href="${site}">${pkg}</a></p>`
  })}
</div>
</html>`)
})

app.get('/:pkg/*', (c) => {
  const pkg = c.req.param("pkg")
  const pc = c.env.PATHS.find(({ pkg: path }) => path == pkg)
  if (!pc) {
    throw new HTTPException(404, { message: "Unknown package" })
  }
  const u = new URL(c.req.url)
  const content_import = `${u.hostname}/${pc.pkg} git ${pc.repo}`
  const content_source = `${u.hostname}/${pc.pkg} ${pc.repo} ${pc.repo}/tree/main{/dir} ${pc.repo}/blob/main{/dir}/{file}#L{line}`
  const pkg_url = `https://pkg.go.dev/${u.hostname}/${u.pathname.slice(1)}`
  const content_refresh = `0; url=${pkg_url}`
  return c.html(html`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <meta name="go-import" content="${content_import}">
  <meta name="go-source" content="${content_source}">
  <title>${pc.pkg}</title>
</head>
<body>
<a href="${pkg_url}">Redirecting to documentation...</a>
</body>`)
})

export default app
