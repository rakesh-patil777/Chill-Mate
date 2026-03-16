# Security Policy

## Reporting a Vulnerability

Report security issues privately to the Chill Mate maintainers.

- Include: affected endpoint/module, reproduction steps, impact, and suggested fix.
- Do not disclose publicly until a fix is released.

## Severity and SLA

- Critical: acknowledge in 24h, patch target 48h
- High: acknowledge in 24h, patch target 5 days
- Medium: acknowledge in 48h, patch target 14 days
- Low: patch in regular release cycle

## Release Gate

- Block release if any open Critical or High findings.
- CI security scan fails on Medium+ findings.

## Secrets Handling

- Never commit secrets.
- Use environment variables for all keys/tokens.
- Rotate exposed secrets immediately.
