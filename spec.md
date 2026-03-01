# Specification

## Summary
**Goal:** Fix the registration flow so that user creation succeeds, errors are surfaced properly, and the app navigates to the chat list screen after successful registration.

**Planned changes:**
- Fix `RegistrationScreen.tsx` to correctly await the `createUser` mutation, disable the submit button during submission, and display readable inline error messages on failure
- Fix `App.tsx` navigation logic so that after a successful `createUser` call the app transitions to the chat list screen immediately, without looping back to registration or getting stuck on a loading spinner
- Audit and fix `backend/main.mo` `createUser` function to return `#ok` with the new profile on success, return descriptive `#err` variants for duplicate username or already-registered principal, and persist the user record so subsequent `getMyProfile` calls return the new profile

**User-visible outcome:** A user can complete registration by entering a display name and username, and is immediately taken to the chat list screen without errors, refresh, or infinite loading.
