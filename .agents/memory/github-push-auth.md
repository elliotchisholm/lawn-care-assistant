---
name: GitHub push authentication
description: Native Git credentials can fail while the existing GitHub OAuth integration remains usable.
---

Treat native Git push authentication and the Replit GitHub integration as separate authentication channels. A rejected native Git token does not, by itself, prove the OAuth integration needs reconnecting.

**Why:** Native pushes were rejected while the existing GitHub connection still had repository write access and could successfully upload the committed history.

**How to apply:** Check repository access through the existing integration before requesting reconnection. Never extract its credentials into a custom Git helper. An authenticated Git-data API upload is an acceptable alternative only when every uploaded blob, tree, and commit preserves its original hash and the branch update is non-forced. Preserve remote-only commits and verify the resulting remote head.
