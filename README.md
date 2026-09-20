# Stat Buddy 2.0

Stat Buddy is a responsive React and TypeScript classroom-tracking prototype for Azure Static Web Apps. Microsoft Entra ID authenticates teachers; authenticated Azure Functions enforce school/class access and write to Azure Cosmos DB for NoSQL.

> **Prototype warning:** do not enter real pupil data until the school has approved the DPIA, privacy notice, retention period, access model, data-processing agreements and operational procedures. Azure hosting alone does not make a system UK GDPR compliant.

## Architecture

`React + TypeScript → Azure Static Web Apps / Entra ID → authenticated Azure Functions → repository layer → Cosmos DB`

The browser never receives a database key. Every API operation derives the signed-in teacher from `x-ms-client-principal`, resolves their access record on the server, validates the requested class against it, and derives `schoolId` from the authorised class. Browser-supplied school IDs are ignored.

## Fix for the sign-in problem

The previous project was plain HTML/JavaScript and its catch-all auth route could prevent the landing/sign-in sequence from completing. This version:

- uses `/.auth/login/aad?post_login_redirect_uri=/`;
- permits the public React landing route;
- requires the built-in `authenticated` role for `/api/*`;
- checks Teacher/School Admin roles and authorised class IDs again in Cosmos DB inside every Function;
- displays the app only after `/api/bootstrap` succeeds.

The Chrome console message `Permissions policy violation: unload is not allowed` is normally emitted by a browser content script and is not a Stat Buddy authentication failure.

## Local development

Requirements: Node 22+, Azure Functions Core Tools 4 and Static Web Apps CLI.

```bash
npm ci
npm --prefix api ci
cp api/local.settings.example.json api/local.settings.json
```

For fictional local demonstration only, set `LOCAL_DEMO=true` in Function settings. Run the frontend and API together with the Static Web Apps CLI:

```bash
npx swa start http://localhost:5173 --run "npm run dev" --api-location api
```

Never enable `LOCAL_DEMO` in Azure.

## Azure setup

1. Create an Entra app registration limited to the school tenant. Add the redirect URI shown by the Static Web App authentication settings (normally `https://YOUR-SWA/.auth/login/aad/callback`). Create a client secret.
2. Replace `<ENTRA_TENANT_ID>` in `staticwebapp.config.json` with the Directory (tenant) ID.
3. In Static Web App configuration, add `ENTRA_CLIENT_ID` and `ENTRA_CLIENT_SECRET`. Do not put either value in GitHub.
4. Create Cosmos DB for NoSQL, database `stat-buddy`, container `records`, partition key `/schoolId`. Enable TTL on the container so `expiresAt` enforces the configured retention period.
5. Enable the Function/Static Web App managed identity. Grant it **Cosmos DB Built-in Data Contributor** at the narrowest useful scope. Set `COSMOS_ENDPOINT`, `COSMOS_DATABASE`, `COSMOS_CONTAINER`, `RETENTION_DAYS` and `PROTOTYPE_WARNING` as application settings. Managed identity is preferred; `COSMOS_CONNECTION_STRING` exists only as a local fallback.
6. Add an `access` record for each approved teacher using their Entra user ID, school ID, `Teacher` or `SchoolAdmin` role and authorised class IDs. The fictional seed illustrates the schema.
7. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to GitHub Actions secrets and push to `main`.

Custom Entra configuration requires an Azure Static Web Apps plan that supports custom authentication. If using the free built-in provider instead, remove the `auth.identityProviders` block and keep `/.auth/login/aad`.

## Seed data

Only the specified fictional Demo Class and Africa reading group are included. Set `SEED_TEACHER_USER_ID` to the approved teacher's Entra user ID, authenticate with Azure CLI/managed identity, then run:

```bash
npm run seed
```

Do not run the seed against a production school database without reviewing its access record.

## Security and data protection

- `/schoolId` tenant partitioning; generated pupil IDs; display names are never partition keys.
- Server-side authorisation and class membership validation on every read/write/delete/export.
- UTC audit records for create, update, reset, delete and export operations.
- Soft deletion with deletion actor/time; TTL provides scheduled secure expiry. Define backup purge procedures separately.
- Minimal application logging: errors do not log pupil details or submission bodies.
- Export operations are audited.
- CSP, clickjacking protection, no-referrer policy and disabled unused browser permissions.
- Successful UI state appears only after the Function confirms the write.

### DPIA checklist placeholder

- Identify controller, processor, DPO and lawful basis.
- Document necessity, proportionality, pupil/parent transparency and children’s rights.
- Map data flows, recipients, hosting region, subprocessors and international transfers.
- Assess risks: inappropriate access, accidental display, exports, device loss, retention, deletion and incident response.
- Approve mitigations, residual risk, consultation, review date and system owner.

### Data-processing inventory placeholder

| Data | Purpose | Lawful basis | Access | Retention | Disposal |
|---|---|---|---|---|---|
| Pupil ID/display name | Classroom tracking | School to approve | Authorised class staff | Configurable | TTL + verified purge |
| Assessment/wellbeing submission | Teaching and safeguarding follow-up | School to approve | Authorised class staff | Configurable | Soft delete + TTL |
| Teacher identity/audit events | Access control/accountability | School to approve | School Admin | Configurable | TTL + verified purge |
| CSV export audit | Accountability | School to approve | School Admin | Configurable | TTL |

Replace this table and the in-app privacy placeholder with the school's approved records before live use.

## Tests and build

```bash
npm test
npm run build
npm --prefix api test
npm --prefix api run build
```

Automated tests cover access-role rejection, independent custom-tool copying, save/attention logic and production compilation. Entra sign-in and Cosmos integration require Azure integration tests using a non-production tenant/database because they cannot be truthfully validated offline.
