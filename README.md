# Ethos

[![CI](https://github.com/EdwardLucas2/Ethos/actions/workflows/ci.yml/badge.svg)](https://github.com/EdwardLucas2/Ethos/actions/workflows/ci.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/af15a1d541e147938bf189884da161a1)](https://app.codacy.com/gh/EdwardLucas2/Ethos/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/af15a1d541e147938bf189884da161a1)](https://app.codacy.com/gh/EdwardLucas2/Ethos/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)

A mobile app for habit accountability. Users create contracts with friends, agree on a forfeit, and submit evidence each cycle to prove they followed through.

## Structure

| Directory  | What it is                                |
| ---------- | ----------------------------------------- |
| `app/`     | Expo React Native app                     |
| `auth/`    | Node.js auth server (SuperTokens wrapper) |
| `backend/` | Java 25 + Javalin REST API                |
| `docker/`  | Docker Compose configs                    |
| `docs/`    | Implementation docs                       |

## Running locally

```bash
# Start PostgreSQL + SuperTokens + auth server
docker compose -f docker/docker-compose.dev.yml up -d

# Backend (port 8080)
cd backend && ./run-dev.sh

# Frontend
cd app && npx expo start
```

## Running tests

```bash
# Backend — unit tests only
cd backend && mvn test

# Backend — full suite (unit + integration + e2e)
cd backend && mvn verify

# Auth server
cd auth && npm test

# Frontend
cd app && npx jest
```

## Docs

- [docs/TECHSTACK.md](docs/TECHSTACK.md) — tech stack and environment variables
- [docs/API.md](docs/API.md) — API endpoints
- [docs/DATAMODEL.md](docs/DATAMODEL.md) — database schema
- [docs/TESTS.md](docs/TESTS.md) — testing strategy
- [CLAUDE.md](CLAUDE.md) — dev conventions and architecture rules
