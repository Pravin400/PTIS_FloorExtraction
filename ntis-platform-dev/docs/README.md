# NTIS Platform — Developer Documentation Hub

Welcome to the **NTIS Platform** (Enterprise Municipal e-Governance Platform built with **.NET 10** & Clean Architecture).

This documentation suite is organized logically according to the **Docs-as-Code** standard so that new developers, architects, and frontend teams can understand, run, and extend the system with zero friction.

---

## 🗺️ Documentation Roadmap for New Developers

```
docs/
├── 01-getting-started/
│   ├── 01-quickstart-and-setup.md                  # Local development setup & database configuration
│   └── 02-development-workflow.md                  # Coding standards, Clean Architecture rules & PR checklist
├── 02-architecture/
│   ├── 01-system-overview.md                       # Clean Architecture layers, project dependencies & patterns
│   ├── 02-data-layer-and-database.md               # EF Core 10, Repositories, Unit of Work & Migrations
│   └── 03-security-and-auth.md                     # JWT tokens, Two-Factor Auth, OTP & Rate Limiting
├── 03-modules/
│   ├── grievance/                                  # 🎫 Grievance Redressal & Citizen Portal
│   │   ├── 01-grievance-lifecycle-and-workflow.md  # State machine, officer assignment & department forwarding
│   │   ├── 02-citizen-authentication-and-otp.md    # Passwordless mobile login & security limits
│   │   ├── 03-tracking-and-sla-engine.md           # Real-time timeline & SLA escalation background jobs
│   │   └── 04-service-implementation-deep-dive.md  # Detailed service logic, algorithms & transaction boundaries
│   └── property/                                   # 🏢 Property Assessment & Taxation Logic
│       ├── 01-property-assessment-and-registration.md # Property master, ownership & floor structures
│       ├── 02-apartment-qc-and-survey.md           # Apartment QC scorecards, wing details & survey visits
│       └── 03-split-merge-and-partition.md         # Spatial restructuring, parent-child links & partitions
└── 04-api-reference/
    ├── 01-api-overview.md                          # API standards, pagination, sorting & status codes
    ├── grievance/                                  # 🎫 Grievance REST Endpoints
    │   ├── 01-citizen-auth-api.md                  # OTP send/resend/verify & citizen profile endpoints
    │   ├── 02-grievance-application-and-workflow-api.md # CRUD, tracking, assignment, forwarding & state transitions
    │   ├── 03-grievance-masters-api.md             # Citizen master, department master & type master APIs
    │   └── 04-api-implementation-deep-dive.md     # Controller actions, claim extraction, rate limiting & error schemas
    └── property/                                   # 🏢 Property & Billing REST Endpoints
        ├── 01-property-management-api.md           # Property CRUD, searches, building structure & lock
        ├── 02-apartment-qc-api.md                  # Apartment QC search, top-section & certificates
        └── 03-tax-and-billing-api.md               # Dynamic tax register, rateable value & water billing
```

---

## 🚀 Quick Navigation

### 1. New to the Project? Start Here:
1. Follow the [Quickstart & Setup Guide](01-getting-started/01-quickstart-and-setup.md) to set up your SDK, database, and connection strings.
2. Read the [System Overview](02-architecture/01-system-overview.md) to understand how `Core`, `Application`, `Infrastructure`, and `Api` interact.
3. Review the [Development Workflow](01-getting-started/02-development-workflow.md) for guidelines on code conventions and living documentation updates.

### 2. Working on Grievance Redressal & Citizen Portal?
- [Grievance Lifecycle & Workflow](03-modules/grievance/01-grievance-lifecycle-and-workflow.md)
- [Citizen Passwordless Auth & OTP](03-modules/grievance/02-citizen-authentication-and-otp.md)
- [Tracking & SLA Escalation Engine](03-modules/grievance/03-tracking-and-sla-engine.md)
- [Grievance Service Logic & Algorithms Deep-Dive](03-modules/grievance/04-service-implementation-deep-dive.md)
- [Citizen Auth API Contracts](04-api-reference/grievance/01-citizen-auth-api.md)
- [Grievance Operations API Contracts](04-api-reference/grievance/02-grievance-application-and-workflow-api.md)
- [Grievance API & Controller Deep-Dive](04-api-reference/grievance/04-api-implementation-deep-dive.md)



### 3. Working on Property, Assessment & Billing?
- [Property Assessment & Master Data](03-modules/property/01-property-assessment-and-registration.md)
- [Apartment QC & Field Surveys](03-modules/property/02-apartment-qc-and-survey.md)
- [Property Split, Merge & Partition](03-modules/property/03-split-merge-and-partition.md)
- [Property Management API Reference](04-api-reference/property/01-property-management-api.md)
- [Apartment QC API Reference](04-api-reference/property/02-apartment-qc-api.md)
- [Tax & Water Billing API Reference](04-api-reference/property/03-tax-and-billing-api.md)


---

## 🔄 Living Documentation Rule

Whenever you add or modify entities, services, API endpoints, or workflows:
- Update the corresponding document in `docs/` in the **same commit**.
- Ensure all public C# interfaces and controller endpoints have XML docstrings (`/// <summary>`).
