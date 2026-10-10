# QuickNotes REST API Design

## Overview

This document describes the proposed **production QuickNotes API**, not the JSONPlaceholder practice endpoint used by the browser client. The production API uses JSON over HTTPS and authenticates users with a bearer access token. Paths are versioned under `/api/v1`.

Base URL example: `https://api.quicknotes.example/api/v1`

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/register` | Create a user account | `201 Created` |
| POST | `/auth/login` | Authenticate and issue access token | `200 OK` |
| GET | `/notes` | List the authenticated user's notes; supports pagination and search | `200 OK` |
| POST | `/notes` | Create a note owned by the authenticated user | `201 Created` |
| GET | `/notes/{noteId}` | Retrieve one note owned by the user | `200 OK` |
| PATCH | `/notes/{noteId}` | Update selected fields of a note | `200 OK` |
| DELETE | `/notes/{noteId}` | Delete a note owned by the user | `204 No Content` |
| GET | `/tags` | List the user's tags | `200 OK` |
| POST | `/notes/{noteId}/tags/{tagId}` | Attach an existing tag to a note | `204 No Content` |

All note and tag routes require authentication. A user may only access their own records. Requests and responses use `Content-Type: application/json` unless the response is empty.

## Create a note

Request:

```http
POST /api/v1/notes
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Revise REST APIs",
  "body": "Review GET, POST, PATCH and DELETE.",
  "tagIds": [2, 4]
}
```

Successful response (`201 Created`):

```json
{
  "id": "note_01J8ABC",
  "userId": "user_123",
  "title": "Revise REST APIs",
  "body": "Review GET, POST, PATCH and DELETE.",
  "tags": [
    {"id": 2, "name": "study"},
    {"id": 4, "name": "work"}
  ],
  "createdAt": "2026-10-10T09:00:00Z",
  "updatedAt": "2026-10-10T09:00:00Z"
}
```

The server validates the title (required, 1–100 characters), verifies that submitted tags belong to the user, and assigns the note ID, owner and timestamps. Clients must not choose `userId` themselves.

## List notes

Request:

```http
GET /api/v1/notes?limit=10&cursor=eyJpZCI6IjEwMCJ9
Authorization: Bearer <access-token>
```

Successful response (`200 OK`):

```json
{
  "items": [
    {
      "id": "note_01J8ABC",
      "userId": "user_123",
      "title": "Revise REST APIs",
      "body": "Review the API examples.",
      "tags": [{"id": 2, "name": "study"}],
      "createdAt": "2026-10-10T09:00:00Z",
      "updatedAt": "2026-10-10T09:00:00Z"
    }
  ],
  "page": {
    "limit": 10,
    "nextCursor": null
  }
}
```

The server returns only notes owned by the authenticated user. `limit` is capped (for example, at 100); cursor pagination avoids large offset scans as the dataset grows. An empty collection returns `200 OK` with `"items": []`.

## Error status codes

| Status | Meaning | Typical cause |
|---|---|---|
| `400 Bad Request` | Invalid request | Malformed JSON or invalid query parameter |
| `401 Unauthorized` | Authentication missing or invalid | Missing, expired or invalid token |
| `403 Forbidden` | Authenticated but not permitted | Attempt to use an action not allowed for the account |
| `404 Not Found` | Resource not found | Note ID does not exist or is not visible to this user |
| `409 Conflict` | Conflict with current state | Duplicate tag name for the same user |
| `422 Unprocessable Content` | Field validation failed | Missing title or title longer than 100 characters |
| `429 Too Many Requests` | Rate limit exceeded | Too many requests in a short period |
| `500 Internal Server Error` | Unexpected server failure | Unhandled server-side problem |

Example error body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title must be between 1 and 100 characters.",
    "details": [
      {"field": "title", "issue": "required"}
    ],
    "requestId": "req_7f91c2"
  }
}
```

Error responses should avoid exposing stack traces, database details, tokens or other secrets. `requestId` lets support staff find the corresponding server log entry.

## Consistency and security

- Use HTTPS for all traffic and store passwords as salted, slow password hashes.
- Validate all inputs on the server even when the browser also validates them.
- Apply per-user authorization to every note and tag query.
- Use parameterized SQL queries to prevent SQL injection.
- Use rate limits on authentication and write endpoints.
- Return consistent error shapes and document any breaking API changes.
