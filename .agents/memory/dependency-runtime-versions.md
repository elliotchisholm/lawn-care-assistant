---
name: Runtime dependency version mismatch
description: Installed packages can lag the versions declared in the project manifest.
---

Verify the actual installed package version before relying on version-specific APIs; manifest ranges are not proof of what the running app uses.

**Why:** During auth troubleshooting, the active Express installation was an older major version than the manifest requested, making newer route syntax silently miss the home page.

**How to apply:** Check resolved versions when an upgrade-specific API behaves unexpectedly. Prefer compatible interfaces when practical; do not perform an unrelated broad dependency update merely to resolve the mismatch.

Do not equate successful post-merge workflow reconciliation with reloading dependencies in the running web process.

**Why:** Reconciliation reported success after a locked reinstall, but the preview still used an old Vite process referencing files removed by the upgrade.

**How to apply:** Confirm the serving workflow has restarted after replacing installed packages. If it has not, restart the leaf application workflow explicitly rather than reinstalling packages again.
