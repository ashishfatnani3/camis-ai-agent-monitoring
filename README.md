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

`GET /contact-search` is expected to return:

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

The UI sends `start`, `end`, `page`, `pageSize`, `contactId`, `phoneNumber`
and `outcome` as query params on every request. If the Lambda doesn't yet
filter on `contactId` / `phoneNumber` / `outcome`, the UI still filters the
returned page client-side, so search works correctly either way — once the
backend adds server-side filtering, results (and pagination counts) will
simply become accurate across the whole date range instead of just the
current page.

## Known backend issue (as of this build)

`GET /contact-search` on the `dev` stage currently returns `502 Internal
server error` for every request made through API Gateway (with or without
query params, and for `OPTIONS` preflight too), even though the same Lambda
succeeds when invoked directly as a test event in the Lambda console. This
points to the API Gateway → Lambda proxy integration itself, not this
frontend — check:

- CloudWatch Logs for the Lambda's `dev` alias/version invoked via API
  Gateway (its output/error there will show the real exception)
- Whether the proxy integration is passing an API Gateway `event` shape the
  handler doesn't expect (a Lambda test event and an API Gateway proxy
  event have different shapes)
- Whether CORS is configured on the API (needed for browser `fetch` calls
  regardless of the 502)

The UI already handles this gracefully (see the error banner with **Retry**
on the Contact Search page) — once the endpoint returns 200s, no frontend
changes should be needed.

## Project structure

```
src/
  api/            fetch wrapper + typed contact-search call
  components/     SearchFilters, ContactTable/Row, ConversationTranscript, Pagination, ...
  hooks/          useContactSearch (data fetching state)
  pages/          ContactSearchPage (ties filters + table + pagination together)
  types/          API and UI-facing TypeScript types
  utils/          date formatting, conversation-turn parsing
```
