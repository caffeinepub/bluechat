# Specification

## Summary
**Goal:** Fix the post-registration navigation flow so the app immediately transitions to the chat list screen after a successful account creation.

**Planned changes:**
- Update `App.tsx` to ensure `currentUser`/profile state is populated before the navigation logic evaluates which screen to render.
- Update `RegistrationScreen.tsx` so that after a successful `createUser` call, the state update and navigation to the chat list happen immediately without intermediate steps, loading screens, or delays.
- Ensure failed registration keeps the user on the registration screen with a readable error message.

**User-visible outcome:** After successfully submitting the registration form, the user is taken directly to the chat list (main screen) with no loading screens or redirect back to the registration screen.
