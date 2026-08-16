# Auth0 + OAuth2 + OIDC + PKCE + RBAC — Local Demo

This is a minimal, real, runnable setup:

- **Backend**: Spring Boot, acts as an OAuth2 **Resource Server** — validates tokens, enforces roles
- **Frontend**: a single `index.html`, does the **PKCE** login flow directly against Auth0
- **Identity Provider**: Auth0 (free tier is enough)

## Architecture

```bash
frontend/index.html  --(PKCE login)-->  Auth0
frontend/index.html  --(Bearer token)-->  Spring Boot API (localhost:8080)
```

The frontend never sends a password to your backend. It never even sees a password — that's handled entirely by Auth0's hosted login page. Your backend
only ever sees a signed JWT and decides what to do based on its claims.

## PKCE

PKCE stands for **Proof Key for Code Exchange**. It is a crucial security extension to the OAuth 2.0 authorisation code flow. It protects apps from code interception and injection attacks. It is required for public apps like mobile and single-page web apps that cannot safely store a secret key.

## Running Applications

```bash
python -m http.server 5500 -->  Auth0 registed callback (localhost:5050)
mvn spring-boot:run        -->  Spring Boot API (localhost:8080)
```

## PKCE flow

[Frontend/Browser] ──login──> [Auth0] ──token──> [Frontend] ──Bearer token──> [Spring Boot Backend]

### Steps

**Step 1**: PKCE — "Prove you're the one who started this"

Before redirecting to Auth0, the frontend does something clever:

- It generates a random secret string called a code verifier
--It hashes that secret → this hash is called the code challenge
- It sends Auth0 the challenge (hash), but keeps the verifier (original secret) locally

**Step 2**: Redirect to Auth0 — "Go login over there"

The frontend sends the browser to Auth0's login page, carrying:

- Your app's client ID
- The code challenge (the hash from Step 1)
- The redirect URI (where to come back to)

**Step 3**: Auth0 redirects back with a code

After login, Auth0 sends the browser back to your frontend with a short-lived authorisation code in the URL — like a claim ticket, not the actual token yet.

**Step 4**: Frontend exchanges the code for tokens

The frontend calls Auth0's /oauth/token endpoint directly, sending:

- The authorisation code
- The code verifier (the original secret from Step 1)

**Step 5**: Frontend calls YOUR backend, attaching the token

Now the frontend talks to your Spring Boot app for the first time — sending the access token as a "Bearer" credential:

**Step 6**: Backend verifies the token (this is what SecurityConfig.java does)

Your Spring Boot app never asked Auth0 "is this token real?" over the network. Instead, it does math locally:

- Signature check — Auth0 signed the token with its private key. Your backend fetches Auth0's public keys (JWTS) once, caches them, and verifies the signature matches. If anyone tampered with the token, this fails instantly.

- Issuer check (iss) — confirms it really came from your Auth0 tenant, not some random source.

- Audience check (aud) — this is the part I added manually in the code, because Spring doesn't do it by default. It confirms the token was issued specifically for your API, not some other app. This directly prevents the "confused deputy" attack we talked about earlier.

- Expiry check (exp) — rejects the token if it's expired.

**Step 7**: RBAC enforcement (this is the extractAuthorities part)

Remember — Auth0 injects a custom claim into the token, like:

The extractAuthorities method reads that claim and translates it into something Spring Security understands: ROLE_ADMIN.

**Step 8**: Get the returned data
All the hard security work already happened in the filter chain, before your business logic even starts.

**Happy flow:**

<img width="1920" height="879" alt="image" src="https://github.com/user-attachments/assets/937c5a40-30ef-4843-9701-9d6c6e84f559" />
<img width="1920" height="879" alt="image" src="https://github.com/user-attachments/assets/13e6891d-963a-449a-aca6-bfc94afe319a" />
<img width="1920" height="879" alt="image" src="https://github.com/user-attachments/assets/bbbe8a89-6dc3-4b0c-8a7a-7156975f10e5" />
<img width="1920" height="879" alt="image" src="https://github.com/user-attachments/assets/a438223f-aa2b-4916-b14d-0fab79a912ac" />

CSRF attack:
<img width="1920" height="879" alt="image" src="https://github.com/user-attachments/assets/f672e13f-79d6-46e3-a405-62f9723f50d6" />





