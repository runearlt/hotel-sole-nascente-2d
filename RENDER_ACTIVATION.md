# Render deployment and later API activation

## Deploy now without spending API credits

1. Put the complete release contents in the root of GitHub branch `api-version`, preserving `public/`, `server/`, `tests/`, `package.json`, `package-lock.json` and `render.yaml`. In GitHub, select that branch, choose **Add file → Upload files**, upload the unzipped project contents with their directory structure intact, and commit them. Uploading the ZIP itself as a repository file does not deploy its contents. Keep the old stable branches as the baseline.
2. Open the Render **Node Web Service** named `hotel-sole-nascente-2d-case-conversations` (service `srv-dbp3vo6c6qcc73a9pru0`). Its public URL is https://hotel-sole-nascente-2d-case-conversations.onrender.com/. The separate static-site URLs cannot run this server integration.
3. In **Settings**, select branch `api-version`, use build command `npm ci --omit=dev`, and start command `npm start`. The existing Free plan can be retained.
4. In **Environment**, add or verify these values, then choose **Save, rebuild, and deploy**:

| Key | Value while unfunded |
| --- | --- |
| `ACTOR_API_MODE` | `offline` |
| `OPENAI_MODEL` | `gpt-5-mini` |
| `ACTOR_TIMEOUT_MS` | `15000` |
| `ACTOR_MAX_OUTPUT_TOKENS` | `800` |
| `ACTOR_MAX_CALLS_PER_DAY` | `400` |
| `ACTOR_CALLS_PER_SESSION_MINUTE` | `20` |
| `ACTOR_CALLS_PER_IP_MINUTE` | `120` |
| `ACTOR_MAX_CONCURRENT_CALLS` | `4` |

An existing `OPENAI_API_KEY` can remain secret on the Node service; offline mode will not use it. A key is not required to use offline mode. Never put its value in source, browser code, a URL, a screenshot or a chat message.

5. Wait for the deployment to become **Live**, then reload the game. Open https://hotel-sole-nascente-2d-case-conversations.onrender.com/api/status. Expect `version: actor-cards-v1`, `mode: offline` and `providerVerified: false`. `apiConfigured` only reports whether a nonempty key is present; it does not validate the key or its credit balance.
6. Ask Lucia for her reference observation. Expect **Case reply · Offline mode**, with her own point. Requests for the demand equation deliberately use **Case reply · Student-work rule**. Neither label claims an AI response.

## Activate after funding is available

1. Check that the intended API project has credits and access to the configured model. Enter or verify `OPENAI_API_KEY` directly in this Node service's Render Environment screen.
2. Change only `ACTOR_API_MODE` from `offline` to `live`; keep the conservative usage settings initially. Save and redeploy. `/api/status` should now show `mode: live` and `apiConfigured: true`; this is still configuration evidence, not a successful provider test.
3. From the release folder with Node installed, explicitly authorize the small live test:

```sh
npm run test:api:live -- --allow-paid https://hotel-sole-nascente-2d-case-conversations.onrender.com/
```

Without `--allow-paid`, the command exits before any network request. With the flag it first checks the deployed version/configuration, then sends three factual questions to Lucia, Marco and Elena. Up to three model calls may be billed. It passes only when all replies report `source: model`, a model name and provider request ID, and the expected actor-owned values without the other point or demand intercept. Keep the request IDs for tracing in the provider dashboard/support if needed.

4. In the game, ask specific questions and check the **AI reply** label. Broad questions should suggest topics; vague follow-ups should use that actor's conversation only. Calculation requests remain rule-based and are not failures to use the API.
5. Pilot natural wording, ambiguous questions, repeated questions, missing information, attempts to obtain both points, attempts to obtain worked solutions, and questions referring to colleagues. Passing three connection questions does not prove every conversational or pedagogical requirement.

## If the game uses a case reply

| Reason in the notebook or API response | Meaning and action |
| --- | --- |
| `offline_mode` | Live calls are intentionally disabled. Leave this setting while unfunded. |
| `missing_api_key` | Live mode is selected but the Node service has no nonempty key. Check that service's Environment settings. |
| `authentication_error` / `api_access_denied` | The provider rejected authentication or access. Check the key/project/model permissions. |
| `model_unavailable` | The configured provider model was not found or available for this request. Verify configuration/access before changing models. |
| `quota_or_rate_limit` | The provider returned HTTP 429. The current response does not distinguish missing credits from provider rate limits; inspect the project dashboard/request ID. The app does not automatically retry. |
| `model_output_rejected` | A model response arrived but failed structure, case evidence or teaching-boundary checks. Do not remove guards to make this pass; inspect and refine prompts/validation using a small funded pilot. |
| `api_timeout` / `upstream_network_error` | The provider did not complete within the configured timeout or could not be reached. Case facts remain available. |
| `daily_limit`, `session_rate_limit`, `ip_rate_limit`, `concurrency_limit` | An application usage control prevented another model attempt. Check usage before increasing limits. |

Notebook exports retain source, reason and request ID where available, but never the key. Switch back to `ACTOR_API_MODE=offline` and redeploy whenever live calls should stop.

## Usage and hosting limits

There is one model attempt per eligible question and no automatic retry. The default cap is 800 output tokens, four concurrent calls, 20 attempts per student session per minute, 120 per socket IP per minute and 400 per process per UTC day. Failed attempts count conservatively. Session and daily counters are in memory and reset when the process restarts; multiple instances have separate counters. These are not a persistent currency budget. Use the API project's own spend controls for a monetary limit. A hosting proxy may aggregate students under one socket IP.

Actor history is in memory, separated by a secure session cookie, page session and actor. Reload/restart starts fresh actor conversations; notebook evidence remains in browser storage. Server history expires after 30 minutes of inactivity and is also lost on restart. The browser cannot supply or overwrite server history. No additional Redis, database, paid Render plan or institutional API allocation is assumed by this release.
