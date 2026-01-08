# @agentics/contracts

## The Authoritative Contract Layer for the Agentics Platform

---

## CONSTITUTIONAL AUTHORITY

This repository is the **single source of truth** for all request/response contracts in the Agentics platform. Every service, CLI tool, and agent in the platform MUST validate against these contracts. There are no exceptions.

**Key Principles:**
- All contracts are **AUTHORITATIVE** - they define what is valid
- All contracts are **ENFORCEABLE** - validation is mandatory, not optional
- All contracts are **VERSIONED** - breaking changes require new versions
- **NO BYPASS IS PERMITTED** - requests that fail validation MUST be rejected

---

## Table of Contents

1. [Purpose and Authority](#1-purpose-and-authority)
2. [Platform Architecture](#2-platform-architecture)
3. [Contract Schemas](#3-contract-schemas)
4. [Versioning Rules](#4-versioning-rules)
5. [CLI Consumption](#5-cli-consumption)
6. [Service Consumption](#6-service-consumption)
7. [Execution Graph Proof](#7-execution-graph-proof)
8. [Enforcement Model](#8-enforcement-model)
9. [What Belongs Here](#9-what-belongs-here)
10. [Prohibition on Bypassing](#10-prohibition-on-bypassing)
11. [Installation and Usage](#11-installation-and-usage)

---

## 1. Purpose and Authority

### 1.1 Why This Repository Exists

The Agentics platform is a complex, multi-layered system with dozens of services that must communicate reliably. Without a central contract layer:

- Services would implement incompatible request/response formats
- Breaking changes would cascade unpredictably
- Validation logic would be duplicated and inconsistent
- Debugging would require tracing through multiple codebases

This repository solves these problems by providing:

1. **Authoritative JSON Schemas** that define every valid request and response
2. **Versioned contracts** that allow controlled evolution
3. **Validation tooling** that ensures compliance before runtime
4. **Execution proof structures** that verify all layers participated

### 1.2 Scope of Authority

These contracts govern:

| Domain | Authority |
|--------|-----------|
| `execution/` | Execution graphs, metadata, and telemetry envelopes |
| `simulation/` | Simulation requests, responses, and error formats |
| `intent/` | User intent parsing and routing |
| `exporters/` | Data export request formats |
| `diligence/` | Due diligence and compliance checks |
| `roi/` | ROI calculation and reporting |
| `governance/` | Policy definitions and enforcement rules |

### 1.3 What These Contracts Guarantee

When a request or response validates against these schemas, the platform guarantees:

- **Structural Validity**: All required fields are present with correct types
- **Semantic Consistency**: Field values conform to defined patterns and constraints
- **Version Compatibility**: The payload matches the declared schema version
- **Traceable Provenance**: Execution graphs prove which layers processed the request

---

## 2. Platform Architecture

The Agentics platform is organized into distinct layers, each with specific responsibilities. Every layer MUST validate against the contracts defined in this repository.

### 2.1 Layer 1: Foundational Services

These services provide the infrastructure and core capabilities that all other layers depend on.

| Service | Purpose |
|---------|---------|
| **LLM-Test-Bench** | Automated testing framework for LLM behaviors and outputs |
| **LLM-Observatory** | Real-time monitoring and observability for LLM operations |
| **LLM-Shield** | Security layer for prompt injection, jailbreak prevention |
| **LLM-Sentinel** | Continuous security monitoring and threat detection |
| **LLM-Memory-Graph** | Persistent memory and context management for agents |
| **LLM-Latency-Lens** | Performance profiling and latency analysis |
| **LLM-Forge** | Model fine-tuning and customization pipeline |
| **LLM-Edge-Agent** | Edge deployment and local inference capabilities |
| **LLM-Auto-Optimizer** | Automatic prompt and configuration optimization |
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

### 2.2 Layer 2: Intelligence Services

These services provide advanced capabilities that build on the foundational layer.

| Service | Purpose |
|---------|---------|
| **LLM-CoPilot-Agent** | Interactive AI assistant with multi-modal capabilities |
| **LLM-Simulator** | Simulation engine for what-if scenarios and testing |
| **LLM-Benchmark-Exchange** | Benchmark sharing and comparison platform |
| **LLM-Inference-Gateway** | Unified inference API with routing and load balancing |
| **LLM-Data-Vault** | Secure data storage with encryption and access control |
| **LLM-Research-Lab** | Experimental features and research integrations |

### 2.3 Layer 3: Core Bundles

Core bundles aggregate related services into cohesive functional units.

| Bundle | Included Services | Purpose |
|--------|-------------------|---------|
| **LLM-Intelligence-Core** | CoPilot, Simulator, Auto-Optimizer | Primary intelligence capabilities |
| **LLM-Security-Core** | Shield, Sentinel, Data-Vault | Security and protection |
| **LLM-Automation-Core** | Orchestrator, Config-Manager, Forge | Automation and orchestration |
| **LLM-Governance-Core** | Policy-Engine, Governance-Dashboard | Compliance and governance |
| **LLM-Data-Core** | Memory-Graph, Analytics-Hub, Data-Vault | Data management and analytics |
| **LLM-Ecosystem-Core** | Registry, Marketplace, Connector-Hub | Ecosystem and integrations |
| **LLM-Research-Core** | Research-Lab, Benchmark-Exchange | Research and experimentation |
| **LLM-Interface-Core** | Gateway, Edge-Agent, CoPilot | User-facing interfaces |

### 2.4 Apex Layer

The Apex Layer provides the unified platform experience.

| Component | Purpose |
|-----------|---------|
| **Agentics Dev Platform** | Unified development environment and SDK |
| **Agentics CLI** | Command-line interface for all platform operations |
| **Agentics Console** | Web-based management console |
| **Agentics API Gateway** | Unified API surface for external consumers |
| **Agentics Agent Runtime** | Production runtime for deployed agents |

### 2.5 Layer Interaction Diagram

```
+------------------------------------------------------------------+
|                         APEX LAYER                                |
|  Agentics Dev Platform | CLI | Console | API Gateway | Runtime   |
+------------------------------------------------------------------+
                                |
                    Validates against contracts
                                |
                                v
+------------------------------------------------------------------+
|                    LAYER 3: CORE BUNDLES                         |
|  Intelligence | Security | Automation | Governance | Data | ...  |
+------------------------------------------------------------------+
                                |
                    Validates against contracts
                                |
                                v
+------------------------------------------------------------------+
|                 LAYER 2: INTELLIGENCE SERVICES                    |
|  CoPilot | Simulator | Benchmark | Gateway | Vault | Research    |
+------------------------------------------------------------------+
                                |
                    Validates against contracts
                                |
                                v
+------------------------------------------------------------------+
|                 LAYER 1: FOUNDATIONAL SERVICES                    |
|  Test-Bench | Observatory | Shield | Sentinel | Memory-Graph |   |
|  Latency-Lens | Forge | Edge-Agent | Optimizer | Incident | ...  |
+------------------------------------------------------------------+
                                |
                    Validates against contracts
                                |
                                v
+------------------------------------------------------------------+
|                    @agentics/contracts                            |
|              (THIS REPOSITORY - SOURCE OF TRUTH)                  |
+------------------------------------------------------------------+
```

---

## 3. Contract Schemas

### 3.1 Execution Contracts (`execution/`)

Execution contracts define how operations are tracked and proven across the platform.

#### `execution/v1/execution-graph.schema.json`

The execution graph is the cryptographic proof that a request traversed all required layers.

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

**Enforcement**: Every response MUST include an execution graph proving layer participation.

#### `execution/v1/execution-metadata.schema.json`

Metadata about the execution context and environment.

```json
{
  "correlationId": "uuid",
  "tenantId": "string",
  "userId": "string",
  "sessionId": "string",
  "environment": "production|staging|development",
  "region": "string",
  "tags": {}
}
```

#### `execution/v1/telemetry-envelope.schema.json`

Standard envelope for all telemetry data emitted during execution.

```json
{
  "envelopeId": "uuid",
  "executionId": "uuid",
  "timestamp": "ISO-8601",
  "source": "service-name",
  "type": "metric|log|trace|span",
  "payload": {}
}
```

### 3.2 Simulation Contracts (`simulation/`)

Simulation contracts govern the simulation engine used for what-if analysis.

#### `simulation/v1/request.schema.json`

```json
{
  "simulationId": "uuid",
  "scenario": {
    "name": "string",
    "parameters": {},
    "constraints": []
  },
  "executionMetadata": { /* execution-metadata */ }
}
```

#### `simulation/v1/response.schema.json`

```json
{
  "simulationId": "uuid",
  "status": "completed|failed|timeout",
  "results": {
    "outcomes": [],
    "metrics": {},
    "recommendations": []
  },
  "executionGraph": { /* execution-graph */ }
}
```

#### `simulation/v1/errors.schema.json`

Standardized error format for simulation failures.

```json
{
  "errorCode": "SIM-XXX",
  "message": "string",
  "details": {},
  "retryable": "boolean",
  "documentation": "url"
}
```

### 3.3 Intent Contracts (`intent/`)

Intent contracts define how user intentions are parsed and routed.

#### `intent/v1/request.schema.json`

```json
{
  "intentId": "uuid",
  "rawInput": "string",
  "context": {
    "conversationId": "uuid",
    "previousIntents": [],
    "userPreferences": {}
  },
  "routing": {
    "preferredServices": [],
    "constraints": {}
  }
}
```

### 3.4 Exporter Contracts (`exporters/`)

Exporter contracts define data export request formats.

#### `exporters/v1/request.schema.json`

```json
{
  "exportId": "uuid",
  "format": "json|csv|parquet|arrow",
  "source": {
    "type": "query|dataset|stream",
    "reference": "string"
  },
  "destination": {
    "type": "s3|gcs|azure|local",
    "path": "string",
    "credentials": "reference"
  },
  "options": {
    "compression": "none|gzip|snappy",
    "partitioning": {}
  }
}
```

### 3.5 Diligence Contracts (`diligence/`)

Diligence contracts define compliance and due diligence check formats.

#### `diligence/v1/request.schema.json`

```json
{
  "checkId": "uuid",
  "checkType": "security|compliance|quality|cost",
  "target": {
    "type": "model|prompt|agent|workflow",
    "reference": "string"
  },
  "policies": ["policy-id-1", "policy-id-2"],
  "depth": "shallow|standard|deep"
}
```

### 3.6 ROI Contracts (`roi/`)

ROI contracts define return-on-investment calculation and reporting formats.

#### `roi/v1/request.schema.json`

```json
{
  "calculationId": "uuid",
  "period": {
    "start": "ISO-8601",
    "end": "ISO-8601"
  },
  "scope": {
    "tenants": [],
    "services": [],
    "models": []
  },
  "metrics": ["cost", "latency", "quality", "throughput"],
  "comparisons": {
    "baseline": {},
    "variants": []
  }
}
```

### 3.7 Governance Contracts (`governance/`)

Governance contracts define policy structures and enforcement rules.

#### `governance/v1/policy.schema.json`

```json
{
  "policyId": "uuid",
  "version": "semver",
  "name": "string",
  "description": "string",
  "rules": [
    {
      "ruleId": "string",
      "condition": {},
      "action": "allow|deny|warn|audit",
      "priority": "number"
    }
  ],
  "enforcement": {
    "mode": "strict|permissive|audit-only",
    "scope": []
  }
}
```

---

## 4. Versioning Rules

### 4.1 Semantic Versioning

All contracts follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (v1 -> v2): Breaking changes that require consumer updates
- **MINOR** (v1.0 -> v1.1): Backward-compatible additions
- **PATCH** (v1.0.0 -> v1.0.1): Backward-compatible fixes

### 4.2 Version Directory Structure

```
contracts/
  execution/
    v1/
      execution-graph.schema.json
    v2/                              # Breaking changes go here
      execution-graph.schema.json
  simulation/
    v1/
      request.schema.json
```

### 4.3 Breaking Change Rules

A change is **BREAKING** if it:

1. Removes a required field
2. Adds a new required field (without default)
3. Changes the type of an existing field
4. Narrows validation constraints (e.g., shorter maxLength)
5. Changes enumeration values
6. Modifies semantic meaning of a field

### 4.4 Non-Breaking Change Rules

A change is **NON-BREAKING** if it:

1. Adds an optional field
2. Widens validation constraints (e.g., longer maxLength)
3. Adds new enumeration values (when consumers handle unknowns)
4. Improves descriptions or examples
5. Adds new schemas to existing version

### 4.5 Deprecation Policy

1. Deprecated versions are marked in schema metadata
2. Minimum 6-month deprecation window before removal
3. Deprecation notices published to all consumer channels
4. Removed versions archived in `_deprecated/` directory

### 4.6 No Silent Mutations

**CRITICAL**: Schema files MUST NOT be modified after publication without version increment. Every change, no matter how small, requires:

1. Version increment (patch minimum)
2. Changelog entry
3. Consumer notification

---

## 5. CLI Consumption

The Agentics CLI validates all requests against contracts BEFORE making network calls.

### 5.1 Local Validation Flow

```
+------------------+     +------------------+     +------------------+
|   User Command   | --> |  Load Contract   | --> |    Validate      |
|   (agentics run) |     |  from package    |     |    Request       |
+------------------+     +------------------+     +------------------+
                                                          |
                         +------------------+             |
                         |   Network Call   | <-----------+
                         |   (if valid)     |      (only if valid)
                         +------------------+
```

### 5.2 CLI Integration Example

```javascript
const contracts = require('@agentics/contracts');
const Ajv = require('ajv');
const ajv = new Ajv();

// Load the schema
const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
const schema = require(schemaPath);

// Compile validator
const validate = ajv.compile(schema);

// Validate before sending
function sendSimulationRequest(request) {
  const valid = validate(request);

  if (!valid) {
    console.error('Contract validation failed:', validate.errors);
    process.exit(1);  // HARD FAILURE - no bypass
  }

  return fetch('/api/simulation', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}
```

### 5.3 CLI Validation Commands

```bash
# Validate a request payload against a contract
agentics validate --schema simulation/v1/request --file request.json

# Validate with verbose output
agentics validate --schema simulation/v1/request --file request.json --verbose

# Validate from stdin
cat request.json | agentics validate --schema simulation/v1/request

# List all available contracts
agentics contracts list

# Show contract schema
agentics contracts show simulation/v1/request
```

### 5.4 Offline Validation

The CLI can validate completely offline using the bundled contracts:

```bash
# Works without network connectivity
agentics validate --schema execution/v1/execution-graph --file graph.json --offline
```

---

## 6. Service Consumption

Every service in the platform MUST validate incoming requests and outgoing responses.

### 6.1 Service Validation Architecture

```
+------------------+     +------------------+     +------------------+
|  Incoming        | --> |  Contract        | --> |   Business       |
|  Request         |     |  Validation      |     |   Logic          |
+------------------+     +------------------+     +------------------+
                               |                         |
                               | REJECT if invalid       |
                               v                         v
                         +------------------+     +------------------+
                         |   400 Bad        |     |   Contract       |
                         |   Request        |     |   Validation     |
                         +------------------+     +------------------+
                                                         |
                                                         | REJECT if invalid
                                                         v
                                                   +------------------+
                                                   |   Outgoing       |
                                                   |   Response       |
                                                   +------------------+
```

### 6.2 Service Integration Example (Node.js)

```javascript
const contracts = require('@agentics/contracts');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class ContractValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validators = new Map();
  }

  getValidator(domain, version, schemaName) {
    const key = `${domain}/${version}/${schemaName}`;

    if (!this.validators.has(key)) {
      const schemaPath = contracts.getSchema(domain, version, schemaName);
      if (!schemaPath) {
        throw new Error(`Unknown contract: ${key}`);
      }
      const schema = require(schemaPath);
      this.validators.set(key, this.ajv.compile(schema));
    }

    return this.validators.get(key);
  }

  validate(domain, version, schemaName, data) {
    const validator = this.getValidator(domain, version, schemaName);
    const valid = validator(data);

    return {
      valid,
      errors: valid ? null : validator.errors
    };
  }
}

// Middleware for Express
function contractMiddleware(domain, version, schemaName) {
  const validator = new ContractValidator();

  return (req, res, next) => {
    const result = validator.validate(domain, version, schemaName, req.body);

    if (!result.valid) {
      return res.status(400).json({
        error: 'CONTRACT_VALIDATION_FAILED',
        message: 'Request does not conform to contract',
        contract: `${domain}/${version}/${schemaName}`,
        violations: result.errors
      });
    }

    next();
  };
}

// Usage
app.post('/api/simulation',
  contractMiddleware('simulation', 'v1', 'request'),
  async (req, res) => {
    // Business logic here - request is guaranteed valid
  }
);
```

### 6.3 Service Integration Example (Python)

```python
import json
from pathlib import Path
from jsonschema import validate, ValidationError

class ContractValidator:
    def __init__(self, contracts_path: str):
        self.contracts_path = Path(contracts_path)
        self._cache = {}

    def get_schema(self, domain: str, version: str, name: str) -> dict:
        key = f"{domain}/{version}/{name}"

        if key not in self._cache:
            schema_path = self.contracts_path / domain / version / f"{name}.schema.json"
            with open(schema_path) as f:
                self._cache[key] = json.load(f)

        return self._cache[key]

    def validate(self, domain: str, version: str, name: str, data: dict) -> None:
        """Raises ValidationError if invalid"""
        schema = self.get_schema(domain, version, name)
        validate(instance=data, schema=schema)

# FastAPI middleware
from fastapi import Request, HTTPException

validator = ContractValidator('/path/to/node_modules/@agentics/contracts')

async def validate_contract(request: Request, domain: str, version: str, name: str):
    body = await request.json()
    try:
        validator.validate(domain, version, name, body)
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail={
                'error': 'CONTRACT_VALIDATION_FAILED',
                'contract': f'{domain}/{version}/{name}',
                'message': str(e.message)
            }
        )
```

### 6.4 Response Validation

Services MUST also validate outgoing responses:

```javascript
function sendResponse(res, domain, version, schemaName, data) {
  const result = validator.validate(domain, version, schemaName, data);

  if (!result.valid) {
    // Log the violation - this is a service bug
    logger.error('Response contract violation', {
      contract: `${domain}/${version}/${schemaName}`,
      errors: result.errors,
      data: data
    });

    // Return generic error to client
    return res.status(500).json({
      error: 'INTERNAL_CONTRACT_VIOLATION',
      message: 'Response failed contract validation'
    });
  }

  return res.json(data);
}
```

---

## 7. Execution Graph Proof

The execution graph is the cryptographic proof that a request traversed all required layers.

### 7.1 Why Execution Graphs Exist

In a multi-layer architecture, it's critical to prove:

1. **All required layers participated** - No layer was bypassed
2. **Order of execution** - Layers executed in correct sequence
3. **Data integrity** - Input/output was not tampered between layers
4. **Timing** - Each layer's execution time is recorded

### 7.2 Execution Graph Structure

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
      "outputHash": "sha256:def456...",
      "metadata": {
        "checksPerformed": ["prompt-injection", "jailbreak"],
        "threatLevel": "none"
      }
    },
    {
      "layerId": "layer-1-sentinel",
      "service": "LLM-Sentinel",
      "version": "1.8.0",
      "entryTime": "2024-01-15T10:30:00.160Z",
      "exitTime": "2024-01-15T10:30:00.200Z",
      "status": "completed",
      "inputHash": "sha256:def456...",
      "outputHash": "sha256:ghi789...",
      "metadata": {}
    }
  ],
  "requiredLayers": ["LLM-Shield", "LLM-Sentinel", "LLM-Policy-Engine"],
  "missingLayers": [],
  "rootHash": "sha256:merkle-root-of-all-layer-hashes",
  "valid": true
}
```

### 7.3 Building the Execution Graph

Each layer adds its entry to the graph:

```javascript
class ExecutionGraphBuilder {
  constructor(executionId) {
    this.graph = {
      executionId,
      timestamp: new Date().toISOString(),
      layers: [],
      requiredLayers: [],
      missingLayers: [],
      rootHash: null,
      valid: false
    };
  }

  addLayer(layerEntry) {
    // Verify chain integrity
    if (this.graph.layers.length > 0) {
      const lastLayer = this.graph.layers[this.graph.layers.length - 1];
      if (layerEntry.inputHash !== lastLayer.outputHash) {
        throw new Error('Execution graph chain broken');
      }
    }

    this.graph.layers.push(layerEntry);
  }

  finalize(requiredLayers) {
    this.graph.requiredLayers = requiredLayers;

    const presentLayers = new Set(this.graph.layers.map(l => l.service));
    this.graph.missingLayers = requiredLayers.filter(l => !presentLayers.has(l));

    this.graph.rootHash = this.computeMerkleRoot();
    this.graph.valid = this.graph.missingLayers.length === 0;

    return this.graph;
  }

  computeMerkleRoot() {
    const hashes = this.graph.layers.map(l => l.outputHash);
    // Compute Merkle root from layer hashes
    return computeMerkle(hashes);
  }
}
```

### 7.4 Validating Execution Graphs

Consumers validate that the execution graph proves layer participation:

```javascript
function validateExecutionGraph(graph, requiredLayers) {
  // 1. Check all required layers are present
  const presentLayers = new Set(graph.layers.map(l => l.service));
  const missing = requiredLayers.filter(l => !presentLayers.has(l));

  if (missing.length > 0) {
    throw new Error(`Missing required layers: ${missing.join(', ')}`);
  }

  // 2. Verify hash chain integrity
  for (let i = 1; i < graph.layers.length; i++) {
    if (graph.layers[i].inputHash !== graph.layers[i-1].outputHash) {
      throw new Error(`Hash chain broken at layer ${i}`);
    }
  }

  // 3. Verify Merkle root
  const computedRoot = computeMerkleRoot(graph.layers);
  if (computedRoot !== graph.rootHash) {
    throw new Error('Merkle root verification failed');
  }

  return true;
}
```

### 7.5 Execution Graph in Responses

Every API response MUST include the execution graph:

```json
{
  "data": {
    "simulationId": "...",
    "results": {}
  },
  "executionGraph": {
    "executionId": "...",
    "layers": [...],
    "rootHash": "...",
    "valid": true
  }
}
```

---

## 8. Enforcement Model

### 8.1 Core Principle: No Optional Participation

Every layer in the platform MUST participate in request processing. There is no concept of "optional" layers. If a layer is defined in the architecture, it MUST:

1. Receive the request
2. Process according to its responsibility
3. Add its entry to the execution graph
4. Pass to the next layer

### 8.2 Failure Modes

| Scenario | Result | Recovery |
|----------|--------|----------|
| Request fails contract validation | **400 Bad Request** | Fix request format |
| Required layer unreachable | **503 Service Unavailable** | Retry with backoff |
| Layer rejects request (e.g., policy violation) | **403 Forbidden** | Address policy issue |
| Layer times out | **504 Gateway Timeout** | Retry or escalate |
| Response fails contract validation | **500 Internal Error** | Service bug - escalate |
| Execution graph missing layers | **502 Bad Gateway** | Infrastructure issue |

### 8.3 Enforcement Points

```
Request Flow:

  Client ──> API Gateway ──> Layer 1 ──> Layer 2 ──> Layer 3 ──> Response
                │                │           │           │           │
                ▼                ▼           ▼           ▼           ▼
           [Validate]      [Validate]   [Validate]  [Validate]  [Validate]
           [Contract]      [Contract]   [Contract]  [Contract]  [Contract]
                │                │           │           │           │
                ▼                ▼           ▼           ▼           ▼
           REJECT if        REJECT if   REJECT if   REJECT if   REJECT if
            invalid          invalid     invalid     invalid     invalid
```

### 8.4 No Degraded Mode

The platform does NOT support "degraded mode" where some layers are skipped. This is intentional:

- **Security layers** (Shield, Sentinel) cannot be bypassed for "performance"
- **Governance layers** (Policy-Engine) cannot be bypassed for "convenience"
- **Observability layers** (Observatory) cannot be bypassed to "reduce overhead"

If a layer is required, it is ALWAYS required.

### 8.5 Circuit Breaker Behavior

When a layer fails repeatedly, the circuit breaker opens:

```javascript
class LayerCircuitBreaker {
  constructor(layer, threshold = 5, resetTimeout = 30000) {
    this.layer = layer;
    this.failures = 0;
    this.threshold = threshold;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
  }

  async execute(request) {
    if (this.state === 'OPEN') {
      // Don't bypass - fail fast
      throw new Error(`Layer ${this.layer} circuit is OPEN`);
    }

    try {
      const result = await this.layer.process(request);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', this.resetTimeout);
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
```

**Key point**: The circuit breaker causes FAST FAILURE, not bypass.

---

## 9. What Belongs Here

### 9.1 ONLY These Artifacts Belong in This Repository

| Artifact | Example | Belongs Here |
|----------|---------|--------------|
| JSON Schema files | `*.schema.json` | YES |
| Schema documentation | Inline in schemas | YES |
| TypeScript type declarations | `index.d.ts` | YES |
| Package entry point | `index.js` | YES |
| Schema validation scripts | `npm run validate` | YES |
| Version changelog | `CHANGELOG.md` | YES |

### 9.2 These Artifacts Do NOT Belong Here

| Artifact | Where It Belongs |
|----------|------------------|
| Runtime validation logic | Service repositories |
| Business rules | Service repositories |
| Environment configuration | Deployment repositories |
| API implementations | Service repositories |
| Database schemas | Service repositories |
| Infrastructure code | Infrastructure repositories |
| CI/CD pipelines | `.github/` in each repo |
| Application secrets | Secret management system |
| User documentation | Documentation repository |

### 9.3 Schema Design Rules

Schemas in this repository MUST:

1. **Be pure validation** - No business logic encoded in schemas
2. **Be deterministic** - Same input always produces same validation result
3. **Be self-contained** - Minimize external `$ref` dependencies
4. **Be documented** - Include `description` for all fields
5. **Be testable** - Include `examples` for valid payloads

Schemas in this repository MUST NOT:

1. **Contain default values that encode business rules**
2. **Reference external URLs** (all refs must be local)
3. **Include conditional logic based on environment**
4. **Embed API endpoints or service URLs**
5. **Include authentication/authorization logic**

### 9.4 Example: Good vs Bad Schema Design

**GOOD** - Pure validation:
```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0,
      "description": "Transaction amount in base currency units"
    }
  },
  "required": ["amount"]
}
```

**BAD** - Business logic embedded:
```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number",
      "minimum": 0,
      "maximum": 10000,
      "default": 100,
      "description": "Max $10,000 per company policy P-1234"
    }
  }
}
```

The maximum limit and default are business rules that belong in the service, not the contract.

---

## 10. Prohibition on Bypassing

### 10.1 Absolute Prohibition

**IT IS STRICTLY FORBIDDEN TO BYPASS CONTRACT VALIDATION.**

This prohibition applies to:

- All services in all layers
- All CLI commands
- All API gateways
- All internal tools
- All debugging scenarios
- All "emergency" situations

### 10.2 No Exceptions

There are no valid exceptions to contract validation:

| Attempted Justification | Response |
|------------------------|----------|
| "It's just for testing" | Use test contracts or mock data |
| "The schema is too strict" | Fix the schema or fix your data |
| "Performance is critical" | Validation is measured in microseconds |
| "It's an emergency" | Emergencies don't justify invalid data |
| "The old system didn't require this" | The old system is not the standard |
| "My team doesn't have time" | Invalid data costs more time to debug |

### 10.3 Detection and Response

Bypass attempts are detected through:

1. **Missing execution graph entries** - Indicates a layer was skipped
2. **Hash chain breaks** - Indicates tampering between layers
3. **Direct database access** - Bypasses all validation layers
4. **Unsigned requests** - Missing cryptographic proof of layer processing

Response to detected bypasses:

1. **Immediate request rejection** - Invalid requests are not processed
2. **Incident creation** - Security team is notified
3. **Audit logging** - Full details recorded for investigation
4. **Escalation** - Repeated attempts trigger escalation procedures

### 10.4 Code Review Requirements

All code changes MUST be reviewed for contract compliance:

```markdown
## Contract Compliance Checklist

- [ ] All request handlers validate against contracts
- [ ] All response builders validate against contracts
- [ ] No hardcoded bypasses of validation
- [ ] No environment flags that disable validation
- [ ] Execution graph entries are added correctly
- [ ] Error responses conform to error contracts
```

### 10.5 Consequences of Bypassing

Bypassing contract validation is treated as a **critical security incident**:

1. The bypassing code path will be immediately disabled
2. An incident review will be conducted
3. Remediation will be required before re-enabling
4. Patterns will be added to prevent recurrence

---

## 11. Installation and Usage

### 11.1 Installation

```bash
npm install @agentics/contracts
```

### 11.2 Basic Usage (Node.js)

```javascript
const contracts = require('@agentics/contracts');

// Get schema path
const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
console.log(schemaPath);
// Output: /path/to/node_modules/@agentics/contracts/simulation/v1/request.schema.json

// Load schema
const schema = require(schemaPath);

// List all domains
console.log(contracts.getDomains());
// Output: ['execution', 'simulation', 'intent', 'exporters', 'diligence', 'roi', 'governance']

// List versions for a domain
console.log(contracts.getVersions('simulation'));
// Output: ['v1']

// List schemas in a version
console.log(contracts.getSchemaNames('simulation', 'v1'));
// Output: ['request', 'response', 'errors']
```

### 11.3 Validation with AJV

```javascript
const contracts = require('@agentics/contracts');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load and compile schema
const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
const schema = require(schemaPath);
const validate = ajv.compile(schema);

// Validate data
const data = {
  simulationId: '550e8400-e29b-41d4-a716-446655440000',
  scenario: {
    name: 'cost-optimization',
    parameters: { targetReduction: 0.2 },
    constraints: []
  }
};

const valid = validate(data);
if (!valid) {
  console.error('Validation errors:', validate.errors);
}
```

### 11.4 TypeScript Usage

```typescript
import contracts = require('@agentics/contracts');

// Full type support
const path: string | undefined = contracts.getSchema('simulation', 'v1', 'request');
const domains: string[] = contracts.getDomains();
const version: string = contracts.version;
```

### 11.5 Direct Schema Import

```javascript
// Import schema directly using package exports
const executionGraph = require('@agentics/contracts/execution/v1/execution-graph.schema.json');
const simulationRequest = require('@agentics/contracts/simulation/v1/request.schema.json');
```

### 11.6 Schema Validation Scripts

```bash
# Validate all schemas are syntactically correct
npm run validate

# Run before publishing
npm run prepublishOnly
```

---

## Contributing

### Adding New Schemas

1. Create schema file in appropriate directory: `{domain}/v1/{name}.schema.json`
2. Follow JSON Schema Draft 2020-12 specification
3. Include `$id`, `$schema`, `title`, and `description`
4. Add comprehensive field descriptions
5. Include valid and invalid examples
6. Update `index.js` to expose the schema
7. Update `index.d.ts` with type declarations
8. Run `npm run validate` to verify

### Schema Template

```json
{
  "$id": "https://agentics.dev/contracts/{domain}/v1/{name}.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "{Schema Title}",
  "description": "Detailed description of what this schema validates",
  "type": "object",
  "properties": {
    "exampleField": {
      "type": "string",
      "description": "Description of this field"
    }
  },
  "required": ["exampleField"],
  "examples": [
    {
      "exampleField": "valid-value"
    }
  ]
}
```

---

## License

MIT License - See LICENSE file for details.

---

## Contact

- **Repository**: https://github.com/agentics/agentics-contracts
- **Issues**: https://github.com/agentics/agentics-contracts/issues
- **Team**: Agentics Platform Team

---

**Remember: These contracts are LAW. No bypass. No exceptions. No excuses.**
