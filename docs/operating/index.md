---
title: Operating Prometheus in Production
sort_rank: 5
nav_icon: settings
---

# Operating Prometheus in Production

This section provides comprehensive guidance for deploying, monitoring, and maintaining Prometheus in production environments. These guides are designed for SRE, DevOps, and platform engineering teams who need to run Prometheus reliably at scale.

## Production Deployment

Running Prometheus in production requires careful planning around scalability, reliability, and operational concerns:

* [Production Deployment Guide](production-deployment.md) - Comprehensive guide for production-ready Prometheus deployments including hardware sizing, high availability setup, and configuration best practices
* [Performance Tuning](performance-tuning/) - Optimization techniques for large-scale deployments, memory management, and query performance
* [Storage Management](storage-management/) - Long-term storage strategies, retention policies, and data lifecycle management

## Monitoring and Maintenance

Effective operation requires monitoring your monitoring infrastructure:

* [Monitoring Prometheus](monitoring-prometheus.md) - How to monitor your Prometheus instances, essential metrics, and alerting on infrastructure health
* [Troubleshooting Guide](troubleshooting/) - Common issues, diagnostic techniques, and resolution strategies for production problems
* [Backup and Recovery](backup-recovery/) - Data protection strategies, disaster recovery procedures, and backup validation

## Security and Compliance

Securing monitoring infrastructure is critical for production deployments:

* [Security Best Practices](security.md) - Authentication, authorization, network security, and data protection
* [Compliance Considerations](compliance/) - Meeting regulatory requirements, audit trails, and data governance

## Operational Integration

Prometheus doesn't operate in isolation - integration with your operational ecosystem is key:

* [Alert Management](alert-management/) - Alert routing, escalation policies, and integration with incident management systems
* [Capacity Planning](capacity-planning/) - Growth planning, resource forecasting, and scaling strategies
* [Multi-tenancy](multi-tenancy/) - Patterns for shared Prometheus infrastructure, isolation, and resource allocation

## Migration and Upgrades

Managing changes to production monitoring infrastructure:

* [Upgrade Strategies](upgrade-strategies/) - Safe upgrade procedures, rollback plans, and compatibility considerations
* [Migration Guide](migration-guide/) - Moving from other monitoring systems, data migration, and transition planning

---

**Note**: These guides assume you have a basic understanding of Prometheus concepts. If you're new to Prometheus, start with the [Introduction](/docs/introduction/) section.
