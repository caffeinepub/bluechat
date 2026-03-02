# Specification

## Summary
**Goal:** Fix the "connection not ready, please try again" error on the Registration screen by ensuring the backend actor is fully initialized before allowing form submission.

**Planned changes:**
- Disable the registration form's submit button while the backend actor/connection is initializing
- Show a loading indicator on the Registration screen while the actor is initializing
- Enable the submit button only once the actor is ready
- In `useQueries.ts`, add a guard in the `createUser` mutation to check that the actor is defined and non-null before invoking the canister method
- If the actor is unavailable at mutation time, surface a clear, actionable inline error message (e.g., "Unable to connect. Please wait a moment and try again.") without crashing the app or leaving the registration screen
- If the actor fails to initialize within a reasonable timeout, show a retry message inline on the registration form

**User-visible outcome:** Users can complete registration without encountering a "connection not ready" error; the form is disabled with a loading indicator while the connection initializes, and once ready the submission proceeds successfully, navigating the user to the chat list screen.
