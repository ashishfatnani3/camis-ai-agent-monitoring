/**
 * Fetch AI agent conversations.
 *
 * Three ways to call it (works whether invoked directly with a test event,
 * or via a Function URL / API Gateway with queryStringParameters). All three
 * support page-number pagination — { "page": 1, "pageSize": 25 } — and every
 * response includes page, pageSize, totalEntries, and totalPages, so a
 * frontend can drive page buttons / "Page 1 of N" directly off this API
 * without any extra bookkeeping.
 *
 * 1. By day/date range (default mode):
 *      { "day": "2026-09-14" }                                    // one full day
 *      { "start": "2026-09-14T00:00:00Z", "end": "2026-09-16T00:00:00Z" }
 *      {}                                                          // defaults to TODAY
 *      { "day": "2026-09-14", "page": 2, "pageSize": 25 }
 *
 * 2. By contact ID (exact lookup, ignores everything else, no pagination):
 *      { "contactId": "a4c48a96-f442-4372-99d0-b19ed482693a" }
 *
 * 3. By phone number (uses GSI2; date range optional — omit it to get that
 *    caller's full history instead of just one window):
 *      { "phoneNumber": "+14379740733" }
 *      { "phoneNumber": "+14379740733", "day": "2026-09-14", "page": 1, "pageSize": 10 }
 *
 * Runtime: Node.js 22.x   Handler: index.handler
 * Env: TABLE_NAME
 *
 * Response envelope: every path below returns API Gateway's Lambda-proxy
 * shape ({ statusCode, headers, body }), not the raw payload — a plain
 * object here makes API Gateway fail the integration and return its own
 * headerless 502, which browsers report as a CORS error since no
 * Access-Control-Allow-Origin header ever gets attached.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.TABLE_NAME;
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(payload),
  };
}

const pad = (ms) => String(ms).padStart(13, '0');

function clampPageSize(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_PAGE_SIZE);
}

function clampPage(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseTime(v, fallback) {
  if (v == null || v === '') return fallback;
  if (typeof v === 'number') return v;

  const n = Number(v);
  if (Number.isFinite(n) && String(v).trim().length >= 10) return n; // epoch ms

  const t = new Date(v).getTime();
  if (Number.isNaN(t)) throw new Error(`Could not read "${v}" as a time`);
  return t;
}

function startOfDayMs(dayStr) {
  const t = new Date(`${dayStr}T00:00:00.000Z`).getTime();
  if (Number.isNaN(t)) throw new Error(`Could not read "${dayStr}" as a date (expected YYYY-MM-DD)`);
  return t;
}

const endOfDayMs = (dayStr) => startOfDayMs(dayStr) + 24 * 60 * 60 * 1000 - 1;

/** Every UTC day the window touches — GSI1 is partitioned by day. */
function daysBetween(startMs, endMs) {
  const days = [];
  const d = new Date(startMs);
  d.setUTCHours(0, 0, 0, 0);

  while (d.getTime() <= endMs) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/**
 * Slice an already-sorted array into a page. Total entries can only be known
 * by reading every matching item first, so all three modes below fully page
 * through DynamoDB internally (via ExclusiveStartKey) before this runs —
 * this function itself does no I/O, just the page-number math.
 */
function paginate(items, page, pageSize) {
  const totalEntries = items.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const start = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    totalEntries,
    totalPages,
    calls: items.slice(start, start + pageSize),
  };
}

async function queryDay(day, startMs, endMs) {
  const items = [];
  let last;

  do {
    const res = await doc.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      // The sort key is a zero-padded epoch, so the window is a range read
      // rather than a full-day scan plus filter.
      KeyConditionExpression: 'GSI1PK = :d AND GSI1SK BETWEEN :a AND :b',
      ExpressionAttributeValues: {
        ':d': `DAY#${day}`,
        ':a': pad(startMs),
        ':b': pad(endMs),
      },
      ExclusiveStartKey: last,
    }));
    items.push(...(res.Items || []));
    last = res.LastEvaluatedKey;
  } while (last);

  return items;
}

async function queryAllByPhone(phoneNumber, hasRange, startMs, endMs) {
  const values = { ':p': `PHONE#${phoneNumber}` };
  let keyCondition = 'GSI2PK = :p';

  if (hasRange) {
    keyCondition += ' AND GSI2SK BETWEEN :a AND :b';
    values[':a'] = pad(startMs);
    values[':b'] = pad(endMs);
  }

  const items = [];
  let last;

  do {
    const res = await doc.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI2',
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: values,
      ExclusiveStartKey: last,
    }));
    items.push(...(res.Items || []));
    last = res.LastEvaluatedKey;
  } while (last);

  return items;
}

/**
 * One conversation, reduced to who said what, in order. Any KB retrieval
 * that fed into an answer has its source IDs attached to that answer as
 * "Sources" — these are the raw `sourceId` values the logger captured off
 * the Retrieve tool's results, not fetched or resolved here.
 */
function shape(item) {
  const conversation = [];

  for (const pair of item.qa || []) {
    if (pair.silence) conversation.push({ Customer: '(no speech detected)' });
    else if (pair.question) conversation.push({ Customer: pair.question });

    if (pair.answer) {
      const entry = { 'AI Agent': pair.answer };
      const sources = [...new Set((pair.retrievals || []).flatMap((r) => r.sources || []))];
      if (sources.length) entry.Sources = sources;
      conversation.push(entry);
    }
  }

  return {
    contactId: item.contactId,
    phoneNumber: item.phoneNumber || null,
    startedAt: item.initiationTimestamp,
    outcome: item.outcome?.conversationOutcome || 'ABANDONED',
    conversation,
  };
}

// --------------------------------------------------------------- resolvers

async function byContactId(contactId) {
  const res = await doc.send(new GetCommand({ TableName: TABLE, Key: { contactId } }));
  const calls = res.Item ? [shape(res.Item)] : [];
  return { contactId, callCount: calls.length, calls };
}

async function byPhoneNumber(phoneNumber, { hasRange, startMs, endMs, page, pageSize }) {
  const items = await queryAllByPhone(phoneNumber, hasRange, startMs, endMs);
  const sorted = items
    .sort((a, b) => new Date(a.initiationTimestamp) - new Date(b.initiationTimestamp))
    .map(shape);

  return { phoneNumber, ...paginate(sorted, page, pageSize) };
}

async function byDayRange({ startMs, endMs, page, pageSize }) {
  const days = daysBetween(startMs, endMs);
  const batches = await Promise.all(days.map((d) => queryDay(d, startMs, endMs)));

  const sorted = batches
    .flat()
    .sort((a, b) => new Date(a.initiationTimestamp) - new Date(b.initiationTimestamp))
    .map(shape);

  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    ...paginate(sorted, page, pageSize),
  };
}

async function resolve(event) {
  if (!TABLE) throw new Error('TABLE_NAME is not set');

  const q = event.queryStringParameters || {};
  const get = (key) => event[key] ?? q[key];

  const contactId = get('contactId');
  if (contactId) return byContactId(contactId);

  const day = get('day');
  const rawStart = get('start');
  const rawEnd = get('end');
  const dateWasExplicit = Boolean(day || rawStart || rawEnd);

  let startMs;
  let endMs;

  if (day) {
    startMs = startOfDayMs(day);
    endMs = endOfDayMs(day);
  } else {
    // Default: today, midnight UTC through now — i.e. one day.
    const now = Date.now();
    const midnight = new Date().setUTCHours(0, 0, 0, 0);
    startMs = parseTime(rawStart, midnight);
    endMs = parseTime(rawEnd, now);
  }

  if (startMs > endMs) throw new Error('start is after end');

  const page = clampPage(get('page'));
  const pageSize = clampPageSize(get('pageSize'));

  const phoneNumber = get('phoneNumber');
  if (phoneNumber) {
    return byPhoneNumber(phoneNumber, { hasRange: dateWasExplicit, startMs, endMs, page, pageSize });
  }

  return byDayRange({ startMs, endMs, page, pageSize });
}

// ------------------------------------------------------------------ handler

export const handler = async (event = {}) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const result = await resolve(event);
    return jsonResponse(200, result);
  } catch (err) {
    return jsonResponse(400, { message: err.message });
  }
};
