# Project definition
Ethos is an app that helps people create new habits by creating and managing contracts with their friends and using social pressure and forfeits to hold them accountable. 

# Project Structure
/api        - OpenAPI specification
/backend    - Java + Jetty server
/app        - React Native application
/docs       - project documentation

# Feature development flow
1. Update OpenAPI spec
2. Generate Orval client
3. Add Flyway migration (if needed)
4. Implement backend endpoint
5. Implement frontend using generated Orval client

# Tech stack and development guidelines:
## Backend Architecture (Java + Jetty)
The backend is structured into:
- DTOs: request/response objects matching OpenAPI schemas
- Handlers/Controllers: HTTP layer (Jetty endpoints)
- Services: business logic
- Datastore: database access (MariaDB)

Rules:
- DTOs must match OpenAPI schemas exactly
- Do not expose database entities directly in API responses
- Keep handlers thin; business logic belongs in services
- Backend must validate all incoming requests manually
- Frontend assumes backend responses match OpenAPI spec

## Database (MariaDB and Flyway)
### Schema Management
- Database schema is version-controlled using Flyway migrations
- Migration files are located in:
  `/backend/src/main/resources/db/migration`

- Each migration file:
  - Is immutable once committed
  - Uses the format: `V{number}__description.sql`

Rules:
- NEVER modify existing migration files
- ALWAYS create a new migration for schema changes
- Migrations must be deterministic and idempotent where possible

### Development guide
- Prefer simple schemas
- Avoid premature optimisation
- Use explicit columns (avoid JSON blobs for MVP)

### Data Access
- Use JDBC for database interaction
- Database access must be isolated in Datastore classes
- Do NOT access the database directly from handlers

## Frontend Architecture (React Native)
- Use TypeScript for all code
- All API calls MUST go through Orval-generated clients
- Do NOT use raw fetch directly in components

Rules:
- Handle loading and error states for all API calls

## Orval
- Orval generates:
  - TypeScript types from OpenAPI schemas
  - API client functions for all endpoints
- Generated code is located in: `/app/src/api`

Rules:
- Do not manually edit generated files
- Regenerate after any OpenAPI change
- Always use generated types instead of redefining interfaces

## OpenAPI - Source of Truth
- The OpenAPI specification (`/api/openapi.yaml`) is the single source of truth for:
  - All API endpoints
  - Request/response schemas

- Frontend types MUST be generated from OpenAPI using Orval
- Backend implementations MUST conform to the OpenAPI spec
- Do NOT define API shapes directly in Java or TypeScript