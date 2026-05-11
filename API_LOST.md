# API LOST

Last updated: April 11, 2026 (Australia/Adelaide)  
Scope: Admin Settings frontend requirements on branch `feat-auth-pages-ui-dashboard` (frontend-only, no backend changes)

## Missing APIs (Backend Required)

1. Secondary email persistence
- Current state: the current `User` API schema does not include a `secondary_email` field.
- Impact: `Secondary Email` in Admin Settings cannot be saved to the server.
- Expected backend support: profile `GET/UPDATE` should return and accept `secondary_email`.

2. Business role read/write
- Current state: only the boolean `is_superuser` is reliably available in the current frontend branch.
- Impact: business roles (for example, `Project Manager`, `Structural Engineer`) cannot be reliably read/written through current APIs.
- Expected backend support:
  - endpoint to fetch active role options,
  - profile response including `role_name`,
  - profile/user update endpoint supporting `role_name`.

3. Avatar upload/change
- Current state: no avatar upload/update API is exposed in the current frontend API client.
- Impact: profile avatar change cannot be implemented as a real backend-backed feature.
- Expected backend support: avatar upload endpoint and profile binding endpoint (with a URL in profile response).

4. Email preferences persistence
- Current state: email preference toggles are frontend-only display/state.
- Impact: user choices are not stored server-side and cannot be used by backend email jobs.
- Expected backend support:
  - endpoint to read current user's email preferences,
  - endpoint to update email preferences,
  - backend mail dispatch should respect these preferences.

5. In-app notification settings persistence
- Current state: notification setting toggles are frontend-only display/state.
- Impact: notification behavior cannot be personalized consistently across devices/sessions.
- Expected backend support:
  - endpoint to read current user's notification settings,
  - endpoint to update notification settings,
  - optional delivery channel fields (browser, sound, task comments, mentions, risk alerts).

## Current Frontend Temporary Behavior

- `full_name` and `primary email`: saved via existing `updateUserMe`.
- `secondary email` and `role`: saved in browser `localStorage` only as a temporary workaround.
- email preferences and notification settings: currently frontend-only local state (not persisted).
