# VSL Connect — AI Coding Rules

> **Purpose:** Mandatory engineering instructions for AI coding assistants working on VSL Connect. Read this file before planning, writing, modifying, or reviewing code.
>
> **Priority:** Follow the user's current explicit request, then these project rules, then existing repository conventions. If requirements conflict or are ambiguous, explain the conflict and ask before making irreversible changes.

## 1. Project scope

VSL Connect is a Vietnamese Sign Language (VSL) learning and communication platform.

- **Phase 1 (current):** Build and deploy the learning website: authentication, courses, lessons, sign demonstration videos, quizzes, progress tracking, admin content management, and responsive UI.
- **Phase 2:** Develop and evaluate sign-recognition AI **independently** of the web application.
- **Phase 3:** Integrate AI-powered practice and sign-to-text assistance; add WebRTC video calling and real-time captions.
- **Phase 4:** Harden security, accessibility, performance, monitoring, and deployment.

Do not claim to translate all VSL or support unrestricted continuous sign-language interpretation. The initial AI supports only a clearly defined, evaluated vocabulary. Do not implement Phase 2/3 features unless requested; interfaces or placeholders may be created when needed for future integration.

## 2. Approved technology stack

| Layer | Approved choice |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui |
| Routing | React Router (unless repository already has an established equivalent) |
| Backend | Python, FastAPI, Pydantic |
| Persistence | MySQL, SQLAlchemy, Alembic |
| Authentication | Secure cookie/session or short-lived JWT with refresh-token strategy, chosen deliberately |
| Future AI training | Python, PyTorch, MediaPipe, OpenCV |
| Future browser inference | MediaPipe Web, ONNX Runtime Web, **only after compatibility and performance validation** |
| Future video calling | WebRTC, WebSocket signaling, STUN/TURN (e.g. coturn) |
| Deployment | Docker, Docker Compose, Nginx, HTTPS |

- Do **not** switch to Next.js, Angular, Vue, Django, Express, MongoDB, Firebase, Supabase, or a different major stack without explicit approval.
- Do not add a new dependency when the existing stack or standard library reasonably solves the problem. Explain the purpose and trade-offs before adding major dependencies.
- Use supported, compatible, pinned dependency versions; do not invent version numbers. Check the actual repository manifests and documentation.

## 3. Repository structure

```text
vsl-connect/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── alembic/
│   └── requirements.txt
├── ai/                  # Separate training/inference work; may be empty in Phase 1
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── rules.md
```

Adapt to existing repository conventions rather than moving files unnecessarily. Do not create unused folders or boilerplate solely to match this tree.

## 4. Mandatory AI assistant workflow

Before changes:
1. Read `rules.md`, relevant code, configuration, tests, and existing conventions.
2. Summarize the request, affected files, expected behavior, and any assumptions.
3. For large or risky changes, propose a concise implementation plan and request approval before destructive, architectural, or security-sensitive changes.
4. Make the **smallest coherent change** needed; avoid unrelated refactors.

During changes:
5. Keep code consistent with the established stack, formatting, naming, and folder structure.
6. Do not silently remove, rewrite, rename, or disable existing features, APIs, database tables, or tests.
7. Do not overwrite user work or revert unrelated changes. Do not run destructive shell commands, force-push, reset branches, or delete production data without explicit permission.
8. Never fabricate files, endpoints, test results, screenshots, performance figures, or successful deployments.
9. Do not introduce mock data into production paths. Clearly label temporary mock implementations and keep them replaceable.
10. Do not make external API calls, paid-service integrations, infrastructure changes, or production deployments without authorization.

After changes:
11. Run relevant available linting, type checking, unit/integration tests, and builds. If not runnable, state why.
12. Explain what changed, list touched files, identify any migrations/configuration steps, and disclose remaining limitations.
13. Never claim “tested”, “secure”, “production-ready”, or “working” without supporting checks.

## 5. Frontend standards

- Use React function components and TypeScript; avoid `any` unless justified and documented.
- Separate reusable UI, domain features, API clients, and types. Avoid giant components and duplicated logic.
- Use semantic HTML, keyboard-accessible controls, visible focus, descriptive labels, readable contrast, and responsive layouts.
- Use Tailwind design tokens and shadcn/ui consistently. Do not introduce unrelated UI libraries or arbitrary colors without a design reason.
- Handle loading, empty, error, success, and offline states. Never leave controls visually enabled if they do nothing.
- Validate form inputs on the client for UX and on the server for security.
- Do not put secrets, database credentials, or privileged API keys in frontend code or `VITE_*` environment variables.
- For videos, provide captions/text descriptions where available; do not rely on audio-only instructions.
- Request camera/microphone permission only when the user initiates a feature that needs it; release tracks when no longer needed.

## 6. Backend and API standards

- Organize FastAPI endpoints, Pydantic schemas, services, and persistence concerns separately.
- Use versioned API routes (for example `/api/v1/...`) and consistent JSON response/error conventions.
- Validate and authorize **every** sensitive operation server-side. Never trust a frontend role or user ID without verification.
- Use SQLAlchemy parameterized queries/ORM patterns; never build SQL with untrusted string concatenation.
- Keep long-running AI inference, video processing, and heavy CPU work off the main async request path.
- Add pagination, filtering, and sensible limits for list endpoints.
- Use structured logging without passwords, tokens, personal video frames, or other sensitive content.
- Provide health checks and meaningful HTTP status codes.
- Use idempotent operations where appropriate; avoid duplicate submissions and inconsistent progress updates.

## 7. Database rules

- MySQL is the source of truth for users, courses, lessons, sign entries, quizzes, enrollments, learning progress, and practice results.
- All schema changes require reviewed Alembic migrations. Do not rely on runtime `create_all()` as a production migration strategy.
- Enforce foreign keys, uniqueness, nullability, indexes, and appropriate constraints.
- Never drop columns/tables or erase data without approval and a recovery plan.
- Store large sign demonstration videos in object storage or suitable media storage; store references and metadata in MySQL.
- Use UTC for stored timestamps and convert for display.
- Seed development/demo data separately; never overwrite real user data.

## 8. Authentication, security, and privacy

- Hash passwords with a reputable password-hashing algorithm (e.g. Argon2id); never store plaintext passwords.
- Use HTTPS in deployment, secure cookie settings when cookies are used, appropriate CSRF protection, and strict CORS origins.
- Apply least-privilege role-based access control (e.g. learner/admin) and check permissions on the backend.
- Keep secrets in environment variables or secret management, not Git. Commit `.env.example` only with placeholders.
- Rate-limit sensitive endpoints such as login and password reset; avoid exposing whether an account exists.
- Minimize collection and retention of camera/video data. Do not record or upload camera streams without clear user consent and a documented purpose.
- Do not expose private lessons, user progress, or recorded sessions to unauthorized users.
- Avoid claiming regulatory compliance without a formal assessment.

## 9. Learning platform requirements

- The website must remain useful **without** the AI model: browsing lessons, watching sign demonstrations, quizzes, and tracking progress must work independently.
- Organize learning content with stable IDs, topics, difficulty levels, lesson order, and sign metadata.
- Distinguish Vietnamese written labels from VSL signs; do not assume a one-to-one translation between natural-language sentences and signs.
- Support regional variation and review sign content with qualified VSL users/instructors where feasible.
- Do not invent authoritative sign videos or claim a gesture is correct without verified content.
- Practice pages may show a clearly labeled “AI evaluation coming later” state; do not fake scores or recognition confidence.

## 10. Future AI integration contract

Keep AI training separate from the production web application. Define a replaceable inference interface, but do not implement speculative infrastructure until requested.

Example **illustrative** result (not a mandatory endpoint):

```json
{
  "label": "cam_on",
  "confidence": 0.94,
  "model_version": "v1"
}
```

- Maintain consistent class labels, feature order, frame sampling, landmark normalization, missing-landmark handling, and handedness between training and inference.
- Use person-independent train/validation/test splits where the dataset permits; report dataset limitations.
- Report precision, recall, F1, confusion matrix, and latency, not accuracy alone.
- Support an `unknown`/no-sign state and temporal smoothing; do not present every prediction as certain.
- Model confidence is **not** an objective grading score for sign correctness.
- Never claim full VSL translation from a limited-vocabulary classifier.
- Test ONNX export and browser performance before committing to client-side inference. Provide a server fallback only if justified and authorized.

## 11. Future video call requirements

- Use WebRTC for media; use WebSocket for signaling and lightweight real-time messages, not as a default raw-video transport.
- Plan for STUN/TURN and test across different networks, browsers, and devices.
- Do not route live video through FastAPI by default.
- Keep captions synchronized as reasonably possible; handle repeated predictions and confidence uncertainty.
- Request user consent before transmitting recognition results or storing call history.
- Never promise that calls are peer-to-peer in all network conditions or that server costs are always negligible.

## 12. Performance and deployment

- Prefer a simple modular monolith (React + FastAPI + MySQL) for Phase 1. Do not add Kubernetes, message queues, Redis, microservices, or GPUs without measured need.
- Build a production frontend bundle; serve it behind Nginx with HTTPS.
- Containerize services using Docker Compose, non-root containers where practical, environment-based configuration, health checks, and persistent database volumes.
- Do not expose MySQL publicly unless explicitly required and secured.
- Add automated database backups and a tested restore procedure before storing important user data.
- Use sensible image sizes, lazy-loaded routes, compressed media, caching, and pagination.
- Benchmark browser AI on representative desktop and mobile devices before setting latency targets.
- Never claim production readiness based only on `docker compose up`; verify migrations, HTTPS, backup, logs, resource use, and core user flows.

## 13. Quality gates and definition of done

A feature is complete only when:

- [ ] It matches the explicitly requested scope and existing architecture.
- [ ] Existing behavior is preserved or intentional changes are documented.
- [ ] Frontend types/build and backend tests/lint pass where applicable.
- [ ] Errors, loading states, and authorization are handled.
- [ ] Database changes have migrations where needed.
- [ ] Responsive and keyboard behavior are checked for UI changes.
- [ ] No secrets or large raw datasets are committed.
- [ ] Any unrun checks, known limitations, and next steps are reported.

## 14. Communication format for AI coding assistants

For each substantive coding request, respond concisely with:

1. **Understanding:** what will be built or fixed.
2. **Plan:** key steps and files to change (before major work).
3. **Implementation:** make only approved, relevant changes.
4. **Verification:** exact commands run and their actual outcomes.
5. **Summary:** changed files, remaining risks, and any manual steps.

**Final rule:** If uncertain, inspect the code and ask a focused question instead of guessing. Favor correctness, accessibility, privacy, maintainability, and incremental delivery over unnecessary complexity.
