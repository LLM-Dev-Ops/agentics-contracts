<p align="center">
  <img src="https://img.shields.io/npm/v/@llm-dev-ops/contracts?style=for-the-badge&logo=npm&logoColor=white&label=npm&color=CB3837" alt="npm version" />
  <img src="https://img.shields.io/badge/JSON_Schema-Draft_07-blue?style=for-the-badge&logo=json&logoColor=white" alt="JSON Schema Draft 07" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js >= 18" />
  <img src="https://img.shields.io/badge/TypeScript-Typed-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-See_Below-EF9421?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License" />
</p>

<h1 align="center">📜 @llm-dev-ops/contracts</h1>

<p align="center">
  <strong>The Authoritative Contract Layer for the Agentics Platform</strong><br/>
  <em>Enforceable · Versioned · Strongly Typed · Zero Bypass</em>
</p>

<p align="center">
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-contract-domains">Domains</a> ·
  <a href="#-lifecycle-specs">Lifecycle Specs</a> ·
  <a href="#-enforcement-model">Enforcement</a> ·
  <a href="#-licensing">Licensing</a>
</p>

---

## ⚠️ Licensing

> **This package requires a valid license for use in production environments.**

| Use Case | License Required | Contact |
|----------|:---:|---------|
| 🔍 Evaluation & Development | ✅ Free | — |
| 🏢 Commercial / Production | 💼 **Commercial License** | [sales@globalbusinessadvisors.co](mailto:sales@globalbusinessadvisors.co) |
| 🎓 Academic / Research | 📄 Academic License | [sales@globalbusinessadvisors.co](mailto:sales@globalbusinessadvisors.co) |
| 🤝 Open Source Integration | 📄 OSS License | [sales@globalbusinessadvisors.co](mailto:sales@globalbusinessadvisors.co) |

By installing or using this package, you agree to the [License Terms](#-license-terms). Unauthorized use in production without a valid license is prohibited.

---

## 🏛️ Constitutional Authority

This repository is the **single source of truth** for all request/response contracts in the Agentics platform. Every service, CLI tool, and agent MUST validate against these contracts.

| Principle | Guarantee |
|-----------|-----------|
| 🔒 **Authoritative** | Contracts define what is valid — no other source |
| ⚖️ **Enforceable** | Validation is mandatory, not optional |
| 🏷️ **Versioned** | Breaking changes require new major versions |
| 🚫 **No Bypass** | Requests failing validation MUST be rejected |

---

## 📋 Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | [🚀 Getting Started](#-getting-started) | Installation and basic usage |
| 2 | [🏗️ Platform Architecture](#️-platform-architecture) | Layer overview and service map |
| 3 | [📦 Contract Domains](#-contract-domains) | All schema domains and their purpose |
| 4 | [🔄 Lifecycle Specs](#-lifecycle-specs) | Canonical lifecycle state machines |
| 5 | [🏷️ Versioning Rules](#️-versioning-rules) | Semver policy and breaking change rules |
| 6 | [🖥️ CLI Consumption](#️-cli-consumption) | CLI integration patterns |
| 7 | [⚙️ Service Consumption](#️-service-consumption) | Service-side validation patterns |
| 8 | [🔗 Execution Graph Proof](#-execution-graph-proof) | Cryptographic layer-traversal proof |
| 9 | [🛡️ Enforcement Model](#️-enforcement-model) | Failure modes and enforcement points |
| 10 | [📐 Schema Design Rules](#-schema-design-rules) | What belongs (and doesn't) in this repo |
| 11 | [🤝 Contributing](#-contributing) | How to add or modify contracts |
| 12 | [📄 Licensing](#-license-terms) | Full license terms |

---

## 🚀 Getting Started

### Installation

```bash
npm install @llm-dev-ops/contracts
```

### Quick Start

```javascript
const contracts = require('@llm-dev-ops/contracts');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// 📌 Load any schema by domain / version / name
const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
const validate = ajv.compile(require(schemaPath));

// ✅ Validate before sending
const valid = validate(payload);
if (!valid) throw new Error(JSON.stringify(validate.errors));
```

### TypeScript

```typescript
import contracts = require('@llm-dev-ops/contracts');

const path: string | undefined = contracts.getSchema('lifecycle', 'v1', 'simulationLifecycle');
const domains: string[] = contracts.getDomains();
```

### Direct Import

```javascript
// Import schemas directly via package exports
const schema = require('@llm-dev-ops/contracts/lifecycle/v1/simulation-lifecycle');
const policy = require('@llm-dev-ops/contracts/governance/v1/policy');
```

---

## 🏗️ Platform Architecture

The Agentics platform is organized into distinct layers. Every layer MUST validate against contracts defined in this repository.

```
┌──────────────────────────────────────────────────────────────────┐
│  🔺 APEX LAYER                                                   │
│  Dev Platform · CLI · Console · API Gateway · Agent Runtime      │
├──────────────────────────────────────────────────────────────────┤
│  🧩 LAYER 3 — CORE BUNDLES                                      │
│  Intelligence · Security · Automation · Governance · Data · ...  │
├──────────────────────────────────────────────────────────────────┤
│  🧠 LAYER 2 — INTELLIGENCE SERVICES                             │
│  CoPilot · Simulator · Benchmark · Gateway · Vault · Research    │
├──────────────────────────────────────────────────────────────────┤
│  🔧 LAYER 1 — FOUNDATIONAL SERVICES                             │
│  Test-Bench · Observatory · Shield · Sentinel · Memory-Graph     │
│  Latency-Lens · Forge · Edge-Agent · Optimizer · Incident · ...  │
├──────────────────────────────────────────────────────────────────┤
│  📜 @llm-dev-ops/contracts — THIS REPOSITORY (SOURCE OF TRUTH)  │
└──────────────────────────────────────────────────────────────────┘
```

### 🔧 Layer 1 — Foundational Services

| Service | Purpose |
|---------|---------|
| **LLM-Test-Bench** | Automated testing framework for LLM behaviors |
| **LLM-Observatory** | Real-time monitoring and observability |
| **LLM-Shield** | Prompt injection & jailbreak prevention |
| **LLM-Sentinel** | Continuous security monitoring & threat detection |
| **LLM-Memory-Graph** | Persistent memory and context management |
| **LLM-Latency-Lens** | Performance profiling and latency analysis |
| **LLM-Forge** | Model fine-tuning and customization pipeline |
| **LLM-Edge-Agent** | Edge deployment and local inference |
| **LLM-Auto-Optimizer** | Automatic prompt and config optimization |
| **LLM-Incident-Manager** | Incident detection, escalation, and resolution |
| **LLM-Orchestrator** | Multi-agent coordination and workflow management |
| **LLM-CostOps** | Cost tracking, budgeting, and optimization |
| **LLM-Governance-Dashboard** | Visual governance and compliance monitoring |
| **LLM-Policy-Engine** | Policy evaluation and enforcement runtime |
| **LLM-Registry** | Service discovery and model registry |
| **LLM-Marketplace** | Model and plugin marketplace |
| **LLM-Analytics-Hub** | Analytics aggregation and reporting |
| **LLM-Config-Manager** | Configuration management and distribution |
| **LLM-Schema-Registry** | Schema versioning and compatibility checking |
| **LLM-Connector-Hub** | Integration connectors for external systems |

### 🧠 Layer 2 — Intelligence Services

| Service | Purpose |
|---------|---------|
| **LLM-CoPilot-Agent** | Interactive AI assistant with multi-modal capabilities |
| **LLM-Simulator** | Simulation engine for what-if scenarios |
| **LLM-Benchmark-Exchange** | Benchmark sharing and comparison platform |
| **LLM-Inference-Gateway** | Unified inference API with routing & load balancing |
| **LLM-Data-Vault** | Secure data storage with encryption & access control |
| **LLM-Research-Lab** | Experimental features and research integrations |

### 🧩 Layer 3 — Core Bundles

| Bundle | Services | Purpose |
|--------|----------|---------|
| **Intelligence-Core** | CoPilot, Simulator, Auto-Optimizer | Primary intelligence |
| **Security-Core** | Shield, Sentinel, Data-Vault | Security & protection |
| **Automation-Core** | Orchestrator, Config-Manager, Forge | Automation |
| **Governance-Core** | Policy-Engine, Governance-Dashboard | Compliance |
| **Data-Core** | Memory-Graph, Analytics-Hub, Data-Vault | Data management |
| **Ecosystem-Core** | Registry, Marketplace, Connector-Hub | Integrations |
| **Research-Core** | Research-Lab, Benchmark-Exchange | Research |
| **Interface-Core** | Gateway, Edge-Agent, CoPilot | User-facing |

### 🔺 Apex Layer

| Component | Purpose |
|-----------|---------|
| **Agentics Dev Platform** | Unified development environment & SDK |
| **Agentics CLI** | Command-line interface for all platform operations |
| **Agentics Console** | Web-based management console |
| **Agentics API Gateway** | Unified API surface for external consumers |
| **Agentics Agent Runtime** | Production runtime for deployed agents |

---

## 📦 Contract Domains

### Overview

| Domain | Directory | Schemas | Purpose |
|--------|-----------|:-------:|---------|
| 🔗 Execution | `execution/v1/` | 3 | Execution graphs, metadata, telemetry |
| 🧪 Simulation | `simulation/v1/` | 3 | Simulation requests, responses, errors |
| 🎯 Intent | `intent/v1/` | 1 | User intent parsing and routing |
| 📤 Exporters | `exporters/v1/` | 1 | Data export request formats |
| ✅ Diligence | `diligence/v1/` | 1 | Compliance and due diligence checks |
| 💰 ROI | `roi/v1/` | 1 | ROI calculation and reporting |
| ⚖️ Governance | `governance/v1/` | 2 | Policy definitions and enforcement |
| 🔄 **Lifecycle** | `lifecycle/v1/` | **5** | **Canonical lifecycle state machines** |

### 🔗 Execution Contracts

#### `execution/v1/execution-graph.schema.json`
Cryptographic proof that a request traversed all required layers.

```json
{
  "executionId": "uuid",
  "timestamp": "ISO-8601",
  "layers": [
    {
      "layerId": "layer-1",
      "service": "LLM-Shield",
      "entryTime": "ISO-8601",
      "exitTime": "ISO-8601",
      "status": "completed",
      "hash": "sha256-of-input-output"
    }
  ],
  "rootHash": "merkle-root-of-all-layer-hashes"
}
```

#### `execution/v1/execution-metadata.schema.json`
Execution context and environment metadata.

#### `execution/v1/telemetry-envelope.schema.json`
Standard envelope for all telemetry data emitted during execution.

### 🧪 Simulation Contracts

#### `simulation/v1/request.schema.json`
```json
{
  "simulationId": "uuid",
  "scenario": { "name": "string", "parameters": {}, "constraints": [] },
  "executionMetadata": {}
}
```

#### `simulation/v1/response.schema.json`
Simulation results including outcomes, metrics, and recommendations.

#### `simulation/v1/errors.schema.json`
Standardized error format for simulation failures.

### 🎯 Intent · 📤 Exporters · ✅ Diligence · 💰 ROI

Each domain provides a `request.schema.json` governing the input contract for its respective service. See individual schema files for full property definitions.

### ⚖️ Governance Contracts

#### `governance/v1/policy.schema.json`
Policy definitions with rules, conditions, enforcement modes.

#### `governance/v1/definitions.schema.json`
Shared type definitions: UUIDs, semver, timestamps, layer enums, principals, resources.

---

## 🔄 Lifecycle Specs

> **New in v1.1.0** — Canonical lifecycle state machines consumed by all downstream repos.

Every lifecycle spec defines **10 ordered stages**, each tracked by a uniform `stage_record`:

```json
{
  "status": "pending | in_progress | completed | failed | skipped",
  "entered_at": "ISO-8601",
  "completed_at": "ISO-8601",
  "initiated_by": "principal-or-service",
  "error": { "code": "...", "message": "...", "recoverable": true },
  "artifacts": [{ "artifact_type": "...", "artifact_id": "uuid", "uri": "..." }]
}
```

### 🧪 SimulationLifecycleSpec

📄 `lifecycle/v1/simulation-lifecycle.schema.json`

| # | Stage | Description |
|:-:|-------|-------------|
| 1 | `simulation_requested` | Simulation run formally requested |
| 2 | `plan_created` | Simulation plan generated from request |
| 3 | `plan_evaluated` | Plan evaluated for feasibility and risk |
| 4 | `plan_approved` | Required approvals obtained |
| 5 | `execution_started` | Simulation execution begins |
| 6 | `execution_completed` | Execution finishes (success or failure) |
| 7 | `telemetry_recorded` | Telemetry data persisted |
| 8 | `cost_recorded` | Resource and financial costs captured |
| 9 | `governance_recorded` | Compliance artifacts recorded |
| 10 | `results_indexed` | Results indexed for querying and analysis |

### 🚀 DeploymentLifecycleSpec

📄 `lifecycle/v1/deployment-lifecycle.schema.json`

| # | Stage | Description |
|:-:|-------|-------------|
| 1 | `intent_received` | Deployment intent received and validated |
| 2 | `pre_checks_passed` | Health, capacity, and policy checks passed |
| 3 | `artifacts_resolved` | Images, configs, and secrets resolved |
| 4 | `approval_granted` | Human or automated approvals obtained |
| 5 | `rollout_started` | Deployment rollout begins |
| 6 | `rollout_completed` | Rollout finished across all targets |
| 7 | `verification_passed` | Smoke tests and health checks passed |
| 8 | `traffic_shifted` | Traffic shifted to new deployment |
| 9 | `telemetry_recorded` | Deployment telemetry persisted |
| 10 | `governance_recorded` | Compliance records filed |

> Includes a `rollback` block for tracking rollback triggers, timestamps, and target versions.

### ⚖️ PolicyLifecycleSpec

📄 `lifecycle/v1/policy-lifecycle.schema.json`

| # | Stage | Description |
|:-:|-------|-------------|
| 1 | `policy_drafted` | Policy authored in draft form |
| 2 | `policy_reviewed` | Peer or compliance review completed |
| 3 | `policy_approved` | Required approvals for activation |
| 4 | `policy_published` | Published to governance registry |
| 5 | `enforcement_started` | Enforcement activated across services |
| 6 | `compliance_verified` | Initial compliance verification |
| 7 | `audit_recorded` | Audit trail persisted |
| 8 | `review_scheduled` | Periodic review cycle scheduled |
| 9 | `policy_expired` | Reached expiration or superseded |
| 10 | `policy_archived` | Archived for historical reference |

> Metadata includes `enforcement_level`, `compliance_frameworks` (SOC2, HIPAA, GDPR, etc.), and `target_layers`.

### 💰 RoiLifecycleSpec

📄 `lifecycle/v1/roi-lifecycle.schema.json`

| # | Stage | Description |
|:-:|-------|-------------|
| 1 | `analysis_requested` | ROI analysis formally requested |
| 2 | `baseline_captured` | Current-state baselines captured |
| 3 | `cost_data_collected` | Compute, license, labor costs gathered |
| 4 | `benefit_data_collected` | Throughput, savings, quality metrics gathered |
| 5 | `projection_calculated` | ROI projections and payback period calculated |
| 6 | `projection_validated` | Projections validated against actuals/benchmarks |
| 7 | `report_generated` | ROI report generated |
| 8 | `stakeholder_reviewed` | Stakeholders reviewed and acknowledged |
| 9 | `governance_recorded` | Governance artifacts filed |
| 10 | `results_indexed` | Results indexed for trend analysis |

> Metadata includes `time_horizon_months`, `currency` (ISO 4217), and `analysis_type`.

### 🏢 ErpLifecycleSpec

📄 `lifecycle/v1/erp-lifecycle.schema.json`

| # | Stage | Description |
|:-:|-------|-------------|
| 1 | `sync_requested` | ERP sync operation requested |
| 2 | `connection_established` | Connection to external ERP established |
| 3 | `schema_validated` | Source/target schemas validated for compatibility |
| 4 | `data_extracted` | Data extracted from source system |
| 5 | `data_transformed` | Data transformed to match target schema |
| 6 | `data_loaded` | Transformed data loaded into target |
| 7 | `reconciliation_completed` | Source and target data reconciled |
| 8 | `telemetry_recorded` | Sync telemetry (rows, latency, errors) persisted |
| 9 | `governance_recorded` | Data lineage and compliance records filed |
| 10 | `sync_finalized` | Operation finalized, connections released |

> Supports: SAP S/4HANA, Oracle Fusion, Microsoft Dynamics 365, NetSuite, Workday, Sage Intacct, Custom.
> Metadata includes `erp_system`, `sync_direction` (inbound/outbound/bidirectional), and `record_count`.

---

## 🏷️ Versioning Rules

### Semantic Versioning

All contracts follow [Semantic Versioning 2.0.0](https://semver.org/):

| Change Type | Version Bump | Example |
|-------------|:------------:|---------|
| 🔴 Breaking (remove field, change type) | **MAJOR** | v1 → v2 |
| 🟢 Additive (new optional field, new schema) | **MINOR** | v1.0 → v1.1 |
| 🔵 Fix (description, constraint widening) | **PATCH** | v1.0.0 → v1.0.1 |

### ❌ Breaking Changes

A change is **BREAKING** if it:
1. Removes a required field
2. Adds a new required field without a default
3. Changes the type of an existing field
4. Narrows validation constraints
5. Changes enumeration values
6. Modifies the semantic meaning of a field

### ✅ Non-Breaking Changes

A change is **NON-BREAKING** if it:
1. Adds an optional field
2. Widens validation constraints
3. Adds new enum values (when consumers handle unknowns)
4. Improves descriptions or examples
5. Adds new schemas to an existing version

### 🚫 No Silent Mutations

Schema files MUST NOT be modified after publication without a version increment. Every change requires:
1. Version increment (patch minimum)
2. Changelog entry
3. Consumer notification

---

## 🖥️ CLI Consumption

The Agentics CLI validates all requests against contracts **before** making network calls.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 📝 User      │ ──→ │ 📜 Load      │ ──→ │ ✅ Validate  │
│ Command      │     │ Contract     │     │ Request      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌──────────────┐             │ only if valid
                     │ 🌐 Network   │ ←───────────┘
                     │ Call         │
                     └──────────────┘
```

```javascript
const contracts = require('@llm-dev-ops/contracts');
const Ajv = require('ajv');
const ajv = new Ajv();

const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
const validate = ajv.compile(require(schemaPath));

function sendSimulationRequest(request) {
  if (!validate(request)) {
    console.error('❌ Contract validation failed:', validate.errors);
    process.exit(1);  // HARD FAILURE — no bypass
  }
  return fetch('/api/simulation', { method: 'POST', body: JSON.stringify(request) });
}
```

### CLI Commands

```bash
# Validate a request payload against a contract
agentics validate --schema simulation/v1/request --file request.json

# List all available contracts
agentics contracts list

# Show contract schema
agentics contracts show lifecycle/v1/simulation-lifecycle
```

---

## ⚙️ Service Consumption

Every service MUST validate incoming requests **and** outgoing responses.

### Node.js Express Middleware

```javascript
const contracts = require('@llm-dev-ops/contracts');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

function contractMiddleware(domain, version, schemaName) {
  const schemaPath = contracts.getSchema(domain, version, schemaName);
  const validate = ajv.compile(require(schemaPath));

  return (req, res, next) => {
    if (!validate(req.body)) {
      return res.status(400).json({
        error: 'CONTRACT_VALIDATION_FAILED',
        contract: `${domain}/${version}/${schemaName}`,
        violations: validate.errors
      });
    }
    next();
  };
}

app.post('/api/simulation',
  contractMiddleware('simulation', 'v1', 'request'),
  async (req, res) => { /* ✅ Request is guaranteed valid */ }
);
```

### Python (FastAPI)

```python
import json
from pathlib import Path
from jsonschema import validate, ValidationError
from fastapi import Request, HTTPException

class ContractValidator:
    def __init__(self, contracts_path: str):
        self.base = Path(contracts_path)
        self._cache = {}

    def get_schema(self, domain: str, version: str, name: str) -> dict:
        key = f"{domain}/{version}/{name}"
        if key not in self._cache:
            path = self.base / domain / version / f"{name}.schema.json"
            self._cache[key] = json.loads(path.read_text())
        return self._cache[key]

    def validate(self, domain: str, version: str, name: str, data: dict):
        validate(instance=data, schema=self.get_schema(domain, version, name))
```

---

## 🔗 Execution Graph Proof

The execution graph is the cryptographic proof that a request traversed all required layers.

### Why Execution Graphs Exist

| Guarantee | How |
|-----------|-----|
| 🔒 All required layers participated | Layer entries are mandatory |
| 📊 Correct execution order | Entry/exit timestamps enforce sequence |
| 🔐 Data integrity | SHA-256 hash chain between layers |
| ⏱️ Timing accountability | Per-layer execution time recorded |

### Structure

```json
{
  "executionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "layers": [
    {
      "layerId": "layer-1-shield",
      "service": "LLM-Shield",
      "version": "2.3.1",
      "entryTime": "2024-01-15T10:30:00.100Z",
      "exitTime": "2024-01-15T10:30:00.150Z",
      "status": "completed",
      "inputHash": "sha256:abc123...",
      "outputHash": "sha256:def456..."
    }
  ],
  "rootHash": "sha256:merkle-root",
  "valid": true
}
```

Every API response MUST include an execution graph proving layer participation.

---

## 🛡️ Enforcement Model

### 🚨 Core Principle: No Optional Participation

Every layer defined in the architecture MUST participate. There is no concept of "degraded mode."

- 🔒 **Security layers** (Shield, Sentinel) — cannot be bypassed for performance
- ⚖️ **Governance layers** (Policy-Engine) — cannot be bypassed for convenience
- 📊 **Observability layers** (Observatory) — cannot be bypassed to reduce overhead

### Failure Modes

| Scenario | HTTP | Recovery |
|----------|:----:|----------|
| Request fails validation | `400` | Fix request format |
| Required layer unreachable | `503` | Retry with backoff |
| Layer rejects (policy violation) | `403` | Address policy issue |
| Layer times out | `504` | Retry or escalate |
| Response fails validation | `500` | Service bug — escalate |
| Execution graph missing layers | `502` | Infrastructure issue |

### 🚫 Prohibition on Bypassing

**IT IS STRICTLY FORBIDDEN TO BYPASS CONTRACT VALIDATION.**

| Attempted Justification | Response |
|------------------------|----------|
| "It's just for testing" | Use test contracts or mock data |
| "The schema is too strict" | Fix the schema or fix your data |
| "Performance is critical" | Validation is measured in microseconds |
| "It's an emergency" | Emergencies don't justify invalid data |
| "My team doesn't have time" | Invalid data costs more time to debug |

Detected bypass attempts trigger: immediate rejection → incident creation → audit logging → escalation.

---

## 📐 Schema Design Rules

### ✅ Schemas MUST

1. Be **pure validation** — no business logic
2. Be **deterministic** — same input → same result
3. Be **self-contained** — minimize external `$ref` dependencies
4. Be **documented** — `description` for all fields
5. Be **testable** — include valid examples

### ❌ Schemas MUST NOT

1. Contain default values encoding business rules
2. Reference external URLs (all refs must be local)
3. Include conditional logic based on environment
4. Embed API endpoints or service URLs
5. Include authentication/authorization logic

---

## 🤝 Contributing

### Adding New Schemas

1. Create schema in `{domain}/v1/{name}.schema.json`
2. Follow **JSON Schema Draft 07** specification
3. Include `$id`, `$schema`, `title`, and `description`
4. Add comprehensive field descriptions
5. Update `index.js` to register the schema
6. Update `index.d.ts` with type declarations
7. Run `npm run validate` to verify

### Schema Template

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://agentics.org/schemas/{domain}/v1/{name}.schema.json",
  "title": "{Schema Title}",
  "description": "Detailed description of what this schema validates",
  "type": "object",
  "properties": {
    "example_field": {
      "type": "string",
      "description": "Description of this field"
    }
  },
  "required": ["example_field"],
  "additionalProperties": false
}
```

### Contract Compliance Checklist

- [ ] All request handlers validate against contracts
- [ ] All response builders validate against contracts
- [ ] No hardcoded bypasses of validation
- [ ] No environment flags that disable validation
- [ ] Execution graph entries added correctly
- [ ] Error responses conform to error contracts

---

## 📄 License Terms

**Copyright © 2025 Global Business Advisors. All rights reserved.**

This software and associated documentation files (the "Software") are the proprietary property of Global Business Advisors.

### Permitted (with valid license)

- ✅ Use in internal development and testing environments
- ✅ Integration into licensed production systems
- ✅ Schema validation in downstream services

### Prohibited (without written authorization)

- ❌ Redistribution or sublicensing
- ❌ Use in production environments without a commercial license
- ❌ Modification of schema `$id` URIs or authorship metadata
- ❌ Removal of license notices from source files

### Obtaining a License

Contact **[sales@globalbusinessadvisors.co](mailto:sales@globalbusinessadvisors.co)** to obtain a commercial, academic, or open-source integration license.

Use of this package constitutes acceptance of these terms.

---

<p align="center">
  <strong>📜 These contracts are LAW. No bypass. No exceptions. No excuses.</strong>
</p>

<p align="center">
  <a href="https://github.com/LLM-Dev-Ops/agentics-contracts/issues">🐛 Report Issue</a> ·
  <a href="mailto:sales@globalbusinessadvisors.co">📧 Contact</a> ·
  <a href="https://github.com/LLM-Dev-Ops">🏠 LLM-Dev-Ops</a>
</p>
