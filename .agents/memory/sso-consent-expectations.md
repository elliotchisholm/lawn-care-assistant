---
name: SSO consent expectations
description: The user's distinction between fresh sign-in and repeated provider approval screens.
---

The user's SSO problem is repeated Replit and Google consent approvals on each login, not simply being asked to sign in again.

**Why:** The user explicitly clarified this distinction when troubleshooting SSO.

**How to apply:** Evaluate sign-in changes against unnecessary repeated acceptance screens, not just session duration. Preserve provider-required initial authorization and security checks.

Security hardening should retain refresh-capable sessions instead of removing refresh tokens or offline authorization as a shortcut.

**Why:** Removing renewal would undermine the user's SSO usability request while addressing token storage. Protecting token storage must not reintroduce forced sign-ins or consent.

**How to apply:** Verify renewal and token rotation alongside any session-storage changes; retain stable account identity and initial-authorization requirements.
