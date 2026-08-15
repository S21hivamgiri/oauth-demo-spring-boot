# AUth0 + OAuth2 + OIDC + PKCE + RBAC — Local Demo

This is a minimal, real, runnable setup:

- **Backend**: Spring Boot, acts as an OAuth2 **Resource Server** — validates tokens, enforces roles
- **Frontend**: a single `index.html`, does the **PKCE** login flow directly against Auth0
- **Identity Provider**: Auth0 (free tier is enough)

## Architecture

```bash
frontend/index.html  --(PKCE login)-->  Auth0
frontend/index.html  --(Bearer token)-->  Spring Boot API (localhost:8080)
```

The frontend never sends a password to your backend. It never even sees password — that's handled entirely by Auth0's hosted login page. Your backend
only ever sees a signed JWT and decides what to do based on its claims.
