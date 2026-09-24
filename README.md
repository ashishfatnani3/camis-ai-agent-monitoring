# CAMIS Contact Center Monitoring

A React + TypeScript admin tool for monitoring the AI Agent self-service
channel in the CAMIS contact center. It lists contacts (similar to the
Contact Search view in Amazon Connect) and lets you expand any row to read
the full conversation between the AI Agent and the customer, including the
knowledge-base sources the agent used to answer.

## Stack

- React 19 + TypeScript, built with Vite
- No UI framework — plain CSS (`src/App.css`) styled after an AWS-console-like
  admin layout
- Talks directly to an API Gateway endpoint backed by a Lambda (`GET
  /contact-search`)

## Getting started

```bash
npm install
cp .env.example .env   # adjust if your API URL/path differ
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Configuration

All API configuration lives in environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API Gateway invoke URL, no trailing slash |
| `VITE_CONTACT_SEARCH_PATH` | Path appended to the base URL for the search endpoint |
| `VITE_API_KEY` | Optional — sent as `x-api-key` once API Gateway auth is enabled |

`src/api/client.ts` is the single place auth headers are attached
(`buildAuthHeaders`). When you move to Cognito JWTs or SigV4 signing, that
function is the only thing to change.

## API contract

`GET /contact-search` has three modes, selected server-side by which query
params are present (see `backend/contact-search/index.mjs` for the exact
logic):

1. **Day/date range** (default — used when neither `contactId` nor
   `phoneNumber` is given): paginated.
2. **Phone number** (`phoneNumber`): paginated, optionally scoped to a date
   range.
3. **Exact contact ID** (`contactId`): a single-item lookup by primary key.
   Ignores date range, phone number, and pagination entirely.

Paginated responses look like:

```jsonc
{
  "start": "2026-09-24T00:00:00.000Z",
  "end": "2026-09-24T23:59:59.999Z",
  "page": 1,
  "pageSize": 10,
  "totalEntries": 2,
  "totalPages": 1,
  "calls": [
    {
      "contactId": "bda4ee64-e328-41d8-871d-eb6c7f05b7eb",
      "phoneNumber": "+14379740733",
      "startedAt": "2026-09-24T04:51:41.100Z",
      "outcome": "DEFLECTED",
      "conversation": [
        { "Customer": "May I know the fees for senior citizen" },
        {
          "AI Agent": "BC Parks offers a senior rate for camping...",
          "Sources": ["https://camis.atlassian.net/wiki/..."]
        }
      ]
    }
  ]
}
```

An exact `contactId` lookup instead returns `{ contactId, callCount, calls }`
with no pagination fields. The frontend models both shapes as a
`ContactSearchResponse` union (`src/types/contact.ts`,
`isPaginatedResponse`) and renders accordingly — `ContactSearchPage` shows
pagination controls only for the paginated shape, and an "Exact match" note
for the lookup shape.

The UI sends `start`, `end`, `page`, `pageSize`, `contactId`, `phoneNumber`
and `outcome` as query params on every request. `outcome` isn't filtered
server-side, so the UI also filters the current page client-side on it (and
redundantly on `contactId`/`phoneNumber`, which is a no-op once the backend
has already filtered).

## Backend

`backend/contact-search/` holds the Lambda source behind this endpoint. It's
deployed manually through the AWS Console (no CI/IaC yet) — see that
directory's README for deploy steps and CORS troubleshooting.

## Project structure

```
backend/
  contact-search/   Lambda source for GET /contact-search (console-deployed)
src/
  api/            fetch wrapper + typed contact-search call
  components/     SearchFilters, ContactTable/Row, ConversationTranscript, Pagination, ...
  hooks/          useContactSearch (data fetching state)
  pages/          ContactSearchPage (ties filters + table + pagination together)
  types/          API and UI-facing TypeScript types
  utils/          date formatting, conversation-turn parsing
```
