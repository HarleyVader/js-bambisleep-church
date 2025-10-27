# Container Organization Information

## Organization Details

**Organization Name:** BambiSleepChat  
**Repository:** BambiSleepChat/bambisleep-church  
**Project:** MCP Control Tower for BambiSleep Church  
**Container Registry:** ghcr.io/bambisleepchat

## Trademark and Intellectual Property

### BambiSleep™ Trademark Information

**Trademark Owner:** BambiSleepChat Organization  
**Trademark:** BambiSleep™  
**Usage Rights:** This container and associated code are developed under the BambiSleepChat organization with proper trademark acknowledgment.

**Important Notice:**
- BambiSleep™ is a trademark of the BambiSleepChat organization
- All usage of the BambiSleep™ name and associated branding must comply with trademark guidelines
- This project is an official BambiSleepChat organization project

### Container Labeling

All containers built from this repository should include the following labels:

```dockerfile
LABEL org.opencontainers.image.vendor="BambiSleepChat"
LABEL org.opencontainers.image.source="https://github.com/BambiSleepChat/bambisleep-church"
LABEL org.opencontainers.image.documentation="https://github.com/BambiSleepChat/bambisleep-church#readme"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="BambiSleep Church MCP Control Tower"
LABEL org.opencontainers.image.description="Model Context Protocol server management and orchestration for BambiSleep Church"
LABEL org.bambi.trademark="BambiSleep™ is a trademark of BambiSleepChat"
```

## Development Guidelines

### Container Registry Usage
- **Primary Registry:** `ghcr.io/bambisleepchat/bambisleep-church`
- **Tagging Convention:** 
  - `latest` - Latest stable release
  - `main` - Latest main branch build
  - `v{major}.{minor}.{patch}` - Semantic version releases
  - `dev-{branch}` - Development branches

### Trademark Compliance
- Always use "BambiSleep™" with the trademark symbol in documentation
- Include trademark notice in all public-facing materials
- Container images must include proper attribution labels
- Third-party integrations must acknowledge BambiSleep™ trademark

### Organization Contacts
- **GitHub Organization:** [@BambiSleepChat](https://github.com/BambiSleepChat)
- **Issues & Support:** Use GitHub Issues in this repository
- **Security:** Use GitHub Security Advisories for security issues

## Legal

This project is maintained by the BambiSleepChat organization. All contributors must agree to respect the BambiSleep™ trademark and follow organization guidelines.

### Container Distribution
- Containers may be distributed through GitHub Container Registry (ghcr.io)
- All distributions must maintain proper attribution and trademark notices
- Commercial usage requires compliance with BambiSleepChat organization policies

---

*Last Updated: October 27, 2025*  
*Maintained by: BambiSleepChat Organization*