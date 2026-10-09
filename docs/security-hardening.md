# Security guidance

This is general guidance for contributors, not an audit report or confirmation
that workspace changes have been deployed.

## Contributing safely

- Preserve authentication, account ownership checks, and administrative access
  controls when changing protected operations.
- Keep credentials, session data, and private security reviews out of this
  public repository, public issues, and pull requests.
- Validate inputs and retain appropriate browser and HTTP protections.
- Run the applicable automated checks before submitting changes.
- Verify deployment behavior separately from local or preview behavior.
- Plan authentication and session configuration changes carefully; some changes
  require users to sign in again.

## Reporting concerns

Discuss sensitive findings privately through a channel agreed with the
repository maintainer. Do not post exploit details, credentials, or
deployment-specific security assessment notes publicly.
