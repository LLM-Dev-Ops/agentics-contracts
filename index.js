/**
 * @agentics/contracts
 *
 * Authoritative contract layer for the Agentics platform.
 * This module provides programmatic access to all JSON Schema contracts
 * that govern request/response validation across the platform.
 *
 * IMPORTANT: These contracts are AUTHORITATIVE and ENFORCEABLE.
 * No service may bypass contract validation.
 */

const path = require('path');

module.exports = {
  /**
   * Schema path registry organized by domain, version, and schema name.
   * Each path points to the authoritative JSON Schema file.
   */
  schemas: {
    execution: {
      v1: {
        executionGraph: path.join(__dirname, 'execution/v1/execution-graph.schema.json'),
        executionMetadata: path.join(__dirname, 'execution/v1/execution-metadata.schema.json'),
        telemetryEnvelope: path.join(__dirname, 'execution/v1/telemetry-envelope.schema.json')
      }
    },
    simulation: {
      v1: {
        request: path.join(__dirname, 'simulation/v1/request.schema.json'),
        response: path.join(__dirname, 'simulation/v1/response.schema.json'),
        errors: path.join(__dirname, 'simulation/v1/errors.schema.json')
      }
    },
    intent: {
      v1: {
        request: path.join(__dirname, 'intent/v1/request.schema.json')
      }
    },
    exporters: {
      v1: {
        request: path.join(__dirname, 'exporters/v1/request.schema.json')
      }
    },
    diligence: {
      v1: {
        request: path.join(__dirname, 'diligence/v1/request.schema.json')
      }
    },
    roi: {
      v1: {
        request: path.join(__dirname, 'roi/v1/request.schema.json')
      }
    },
    governance: {
      v1: {
        policy: path.join(__dirname, 'governance/v1/policy.schema.json')
      }
    },
    lifecycle: {
      v1: {
        simulationLifecycle: path.join(__dirname, 'lifecycle/v1/simulation-lifecycle.schema.json'),
        deploymentLifecycle: path.join(__dirname, 'lifecycle/v1/deployment-lifecycle.schema.json'),
        policyLifecycle: path.join(__dirname, 'lifecycle/v1/policy-lifecycle.schema.json'),
        roiLifecycle: path.join(__dirname, 'lifecycle/v1/roi-lifecycle.schema.json'),
        erpLifecycle: path.join(__dirname, 'lifecycle/v1/erp-lifecycle.schema.json')
      }
    }
  },

  /**
   * Retrieve a schema path by domain, version, and name.
   *
   * @param {string} domain - The contract domain (e.g., 'execution', 'simulation')
   * @param {string} version - The version (e.g., 'v1')
   * @param {string} name - The schema name (e.g., 'request', 'response')
   * @returns {string|undefined} The absolute path to the schema file, or undefined if not found
   *
   * @example
   * const schemaPath = contracts.getSchema('simulation', 'v1', 'request');
   * const schema = require(schemaPath);
   */
  getSchema(domain, version, name) {
    return this.schemas[domain]?.[version]?.[name];
  },

  /**
   * List all available domains.
   * @returns {string[]} Array of domain names
   */
  getDomains() {
    return Object.keys(this.schemas);
  },

  /**
   * List all versions for a given domain.
   * @param {string} domain - The contract domain
   * @returns {string[]} Array of version strings
   */
  getVersions(domain) {
    return Object.keys(this.schemas[domain] || {});
  },

  /**
   * List all schema names for a given domain and version.
   * @param {string} domain - The contract domain
   * @param {string} version - The version
   * @returns {string[]} Array of schema names
   */
  getSchemaNames(domain, version) {
    return Object.keys(this.schemas[domain]?.[version] || {});
  },

  /**
   * Package version - follows semver.
   * Breaking changes require major version bump.
   */
  version: '1.1.0'
};
