# contact-search Lambda

Backs `GET /contact-search` on API Gateway. Managed entirely through the AWS
Console today — there's no CI/CD or IaC wired up yet, so this file is kept
here for version control and review, but **deploying it is a manual step**.

## What was fixed here

The previous version of this handler returned plain JS objects (e.g.
`return byDayRange(...)`) instead of the response shape API Gateway's Lambda
proxy integration requires: `{ statusCode, headers, body: <JSON string> }`.
Because of that:

- API Gateway couldn't parse the Lambda's response at all, so it failed the
  integration and returned its own generic `502 Internal server error` —
  for every request, regardless of query params, and even for `OPTIONS`.
- No headers (including `Access-Control-Allow-Origin`) ever reached the
  browser, which is why the frontend reported this as a CORS error rather
  than a 502.

This version wraps every response (success and error) in the correct proxy
shape, adds CORS headers to all of them, and handles the `OPTIONS` preflight
request explicitly.

## Deploying

1. Open the Lambda function in the AWS Console.
2. Go to the **Code** tab.
3. Replace the contents of `index.mjs` with this file's contents.
4. Click **Deploy**.

## If CORS errors persist after deploying (only on the preflight `OPTIONS` request, not the `GET`)

The Lambda code now answers `OPTIONS` correctly, but the request has to
*reach* the Lambda first:

- **REST API**: in the API Gateway console, select the `/contact-search`
  resource → **Actions → Enable CORS** → redeploy the API stage. REST APIs
  require an explicit `OPTIONS` method/route to exist before a preflight
  request is even forwarded to the Lambda.
- **HTTP API**: either configure CORS directly on the API (API Gateway
  console → your API → **CORS**), or confirm there's an `ANY` or `OPTIONS`
  route pointing at this Lambda.

## Environment

- Runtime: Node.js 22.x
- Handler: `index.handler`
- Env var: `TABLE_NAME` — the DynamoDB table this queries (GSI1 for
  day-range search, GSI2 for phone-number search, primary key for exact
  contact-ID lookup)
