# Roundtablev1

> **Snapshot:** This repo is a frozen copy of [Roundtable](https://github.com/pedri60080/Roundtable) at commit `bd8b596` (state as of 6 June 2026). For ongoing development, use the main Roundtable repository.

**Abbreviation:** **RT** (also used in `_Docker files` and workspace scripts.)

Roundtable is a small team meeting & topic app. Related tooling lives in the Pedri `_workspace` repo (`_workspace/docker`, `_Docker files/README.md`).

This repo is a **dev-only clickable demo** and uses **simplified auth** (hardcoded `user123`) plus seeded test data.

## High-level architecture

- **Backend**: ASP.NET Core Web API (.NET 10), Clean Architecture with four projects. REST over JSON, camelCase. SQLite + EF Core for persistence.
- **Frontend**: Angular (standalone components, lazy-loaded routes). Angular Material. Proxies `/api/**` to the backend in development.
- **Run**: From the repo root, **`./start.sh`** starts the backend on `http://127.0.0.1:5001` and the frontend on `http://localhost:4202` (works in Git Bash on Windows; uses `netstat`/`taskkill` when `lsof` is not available).

### Docker (NAS)

From the Pedri repo root: `./_workspace/docker/build-rt.sh [version]`. Output: `_Docker files/Roundtable/` (NAS port **4303**). On the NAS: `./RT-load-and-up.sh` in the synced `_Docker files` folder.

---

## Solution structure

The .NET solution (`Roundtable.sln`) contains four projects. Dependency direction is **inward**: Domain ← Application ← Infrastructure ← Backend. The frontend lives in `src/Roundtable.Frontend` and is not part of the solution.

| Project | Role |
|--------|------|
| **Roundtable.Domain** | Entities and repository interfaces only. No project references. |
| **Roundtable.Application** | DTOs, service interfaces, service implementations (use cases). References Domain only. |
| **Roundtable.Infrastructure** | EF Core `AppDbContext`, repository implementations, seed data, `SeedService`. Implements Domain repositories and Application’s `ISeedService`. References Domain and Application. |
| **Roundtable.Backend** | Host: `Program.cs`, controllers, CORS, Swagger. References Application and Infrastructure. |

---

## Domain layer

**Entities (aggregates):**

- **Team** — Aggregate root. `Id` (string), `Name`, `Icon`, `Authorized`. Stored in `Teams`.
  - Team-level access settings: `IsMembersOnly`, `MembersCanCreateMeetings`, `MembersCanCreateTopics`
- **Meeting** — Aggregate root. `Id`, `TeamId`, `Date`, `Status` (`active` \| `archived`), `Title`, `Notes`, `CreatedAtUtc`. Stored in `Meetings`. Topics are children of this aggregate.
- **MeetingTopic** — Entity in Meeting aggregate. `Id`, `MeetingId`, `Title`, `Tags`, `Notes`, `ReferenceDocumentsJson` (JSON).
  - Ownership metadata (for edit/delete rules): `CreatedByUserGuid`, `CreatedByOrganisation`
  - Legacy FK: `OrganisationId` (optional). Stored in `MeetingTopics`; cascade delete from Meeting.
- **Organisation** — Reference data. `Id`, `Name`. Stored in `Organisations`.
- **User** — App user profile. `Guid`, `UserName`, `DisplayName`, `Organisation`. Stored in `Users`.
- **TeamUser** — Team membership. Composite key `(TeamId, UserGuid)`, `IsMember`, `MemberUntilUtc`. Stored in `TeamUsers`.

**Repository interfaces** (in Domain): `ITeamRepository`, `IOrganisationRepository`, `IMeetingRepository`, `IMeetingTopicRepository`. No implementations in Domain; implementations live in Infrastructure.

---

## Application layer

- **DTOs**: Used across API boundary (e.g. `MeetingDto`, `MeetingTopicDto`, `TeamDto`, `OrganisationDto`, `TopicWithMeetingDto`, `SeedResultDto`). Request types (e.g. `CreateMeetingRequest`) live here.
- **Services**: One service per aggregate/area — `ITeamService`/`TeamService`, `IOrganisationService`/`OrganisationService`, `IMeetingService`/`MeetingService`, `IMeetingTopicService`/`MeetingTopicService`.
  - Current user/profile: `IMeService`/`MeService`, `ICurrentUser` (dev impl in Backend)
  - Team membership admin: `ITeamUserAdminService`/`TeamUserAdminService`
  - Seeding: `ISeedService`/`SeedService` (implementation in Infrastructure)
- **Use cases**: Services depend only on Domain repository interfaces. They perform orchestration, map entities ↔ DTOs, and throw domain-style exceptions (e.g. `KeyNotFoundException`, `ArgumentException`) for the API layer to map to HTTP status codes.
- **Registration**: `DependencyInjection.AddApplication()` registers all application services (Scoped).

---

## Infrastructure layer

- **Persistence**: `AppDbContext` (EF Core) with `DbSet<>` for `Team`, `Meeting`, `Organisation`, `MeetingTopic`, `User`, `TeamUser`. Fluent API in `OnModelCreating` (table names, keys, lengths, FKs).
- **Repositories**: Concrete implementations of Domain repository interfaces (`TeamRepository`, `OrganisationRepository`, `MeetingRepository`, `MeetingTopicRepository`), using `AppDbContext`.
- **Seeding**: Seed classes (e.g. `TeamsSeed`, `OrganisationsSeed`, `MeetingsSeed`, `MeetingTopicsSeed`) and `SeedService` implementing `ISeedService`. Exposed via Backend’s `SeedController` for development/reset.
- **Registration**: `AddInfrastructure(IConfiguration)` registers `AppDbContext`, all repository implementations, and `SeedService` (Scoped).

---

## Backend (API host)

- **Startup**: `Program.cs` calls `AddApplication()` and `AddInfrastructure(config)`, then configures JSON (camelCase), Swagger, CORS, and controllers.
- **Controllers**: Thin; no business logic, no EF. They call application services, map exceptions to HTTP (e.g. 404, 400), return DTOs. Base route: `api/[controller]`.
  - **TeamsController** — Teams API.
  - **OrganisationsController** — Organisations API.
  - **MeetingsController** — List (optional `teamId`, `status`), Create, Delete, UpdateStatus (PATCH).
  - **MeetingTopicsController** — Meeting topics API.
  - **MeController** — Current user profile + onboarding.
  - **TeamUsersAdminController** — Team settings / membership admin.
  - **SeedController** — Seed/reset (uses `ISeedService`).
- **Minimal API**: `GET /api/config` returns `{ isDevelopment }` for environment check.
- **Port**: 5001 (from launchSettings / host config).

---

## Frontend

- **Stack**: Angular, standalone components, Angular Material, RxJS.
- **Routes**: Default `''` → `HomeComponent`; `team/:teamId` → `TeamComponent`; `team/:teamId/settings` → team settings page; wildcard redirects to `''`.
- **API**: In development, `proxy.conf.js` forwards `/api/**` to `http://localhost:5001`. Frontend uses relative `/api/...` URLs.
- **Port**: 4202 when started via `npm start -- --port 4202` (e.g. from `start.sh`).

### Key UX features
- **User onboarding** on first run (`user123` has no display name/org in seed): asks for display name + organisation (from the `Organisations` table).
- **Home page** groups **Your teams** (Admin/Member) and **Other teams**, with members-only teams disabled when you have no access.
- **Team settings** page lets admins manage:
  - members-only access
  - membership (6 months expiry, renew)
  - “members can add meetings” and “everyone can add topics” toggles
- **Topic ownership**:
  - topics show the owning organisation
  - edit/delete is only allowed for topics owned by your organisation (admins always can)

---

## Running the application

From the repository root:

```bash
./start.sh
```

This frees ports 4202 and 5001 if in use, then starts:

1. Backend: `src/Roundtable.Backend` — `dotnet run`
2. Frontend: `src/Roundtable.Frontend` — `npm start -- --port 4202`

- Backend: http://127.0.0.1:5001  
- Frontend: http://localhost:4202  
- Swagger: http://127.0.0.1:5001/swagger  

**Manual run:**

- Backend: `cd src/Roundtable.Backend && dotnet run`
- Frontend: `cd src/Roundtable.Frontend && npm install && npm start -- --port 4202`

---

## Conventions (for contributors)

- **New entity/aggregate**: Add entity in Domain; add repository interface in Domain if needed. Add/update DbContext, repository implementation, and optional seed in Infrastructure.
- **New use case**: Add or extend service interface and implementation in Application; use repository interfaces and DTOs; register in Application’s `DependencyInjection`.
- **New endpoint**: Add controller action in Backend that calls an application service; no business logic or EF in the controller.
- **Persistence/seeding**: Implement only in Infrastructure; register new repos/services in Infrastructure’s `DependencyInjection`.

---

## Development notes (demo auth)
- Current user is hardcoded to **`user123`** in Backend (`DevCurrentUser`).
- Admin teams are hardcoded (for demo).
- Use **“Reset test data”** in the UI to clear and re-seed the DB.
