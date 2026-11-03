# Security headers and Content Security Policy

Vercel applies the following headers to every response:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

The existing cache rules remain separate and unchanged for HTML, feeds/search
documents, and immutable static assets.

## CSP decision

An enforced Content Security Policy is outside this change. Fluid still emits
inline boot and configuration scripts, while Waline and analytics load
third-party resources. A report-only CSP is also deliberately omitted: there
is no reporting endpoint configured, so it would create browser policy noise
without a reviewable feedback loop.

The removed local Live2D assets and crash script do not need to be allowed by
this header set. In particular, Live2D no longer creates a need for
`unsafe-eval`; a future CSP migration can therefore introduce nonces or hashes
without that exception.
