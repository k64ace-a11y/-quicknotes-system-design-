# QuickNotes System Design

QuickNotes is a learning project that demonstrates how a browser client communicates with a REST API and documents a proposed backend for a note-taking service designed to scale to one million registered users.

## Project contents

- `index.html` — accessible HTML structure for loading, creating and deleting notes.
- `api.js` — reusable fetch request helper, GET/POST/DELETE operations, validation and status messages.
- `style.css` — responsive layout and distinct success/error states.
- `docs/api-design.md` — proposed production REST endpoints, JSON examples and error codes.
- `docs/data-model.md` — SQL entities, relationships, constraints, indexes and example queries.
- `docs/architecture.md` — requirements, load estimates, architecture diagram, request flows and trade-offs.

## Run the API client

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open `index.html` in a browser. For a smoother local development experience, use VS Code's Live Server extension and choose **Open with Live Server**.
4. Select **Load notes** to fetch up to 10 posts from `https://jsonplaceholder.typicode.com/posts?_limit=10`.
5. Enter a title (required, maximum 100 characters), optionally enter a body, and choose **Create note**.
6. Choose **Delete** on a note to simulate deleting it.
7. If a request fails, read the status message and check the browser developer tools' Console and Network tabs.

This front end uses JSONPlaceholder as a practice API. JSONPlaceholder simulates POST and DELETE requests and does not permanently store those changes. The client updates its own displayed list after a successful response; reloading can restore the original practice data. The documents in `docs/` describe a separate production API that would need a real backend and database.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How to use `fetch()` and a reusable asynchronous request helper to communicate with a REST API.
- Why an interface should show loading, success, empty and error states rather than leaving users guessing.
- How to validate user input and safely insert user-provided text with `textContent`.
- How primary keys, foreign keys, indexes and junction tables represent relationships in a relational database.
- How caching, read replicas, queues and multiple application servers can improve capacity while introducing trade-offs.
- Why a practice API and a production backend are different, especially when it comes to persistent storage and authentication.

## Suggested Git commit history

Make separate commits as each part is completed rather than committing everything at once:

1. `Add QuickNotes HTML structure and styles`
2. `Add API client with GET`
3. `Add create note with POST`
4. `Add delete with DELETE`
5. `Add API design doc`
6. `Add data model doc`
7. `Add architecture doc`
8. `Add README`

At least five meaningful commits are required. Push the commits to the public GitHub repository before submitting the repository URL.
