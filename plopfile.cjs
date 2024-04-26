const addComponentGenerator = require("./tools/plop-templates/components/generator.cjs");
const addCoreGenerator = require("./tools/plop-templates/core/generator.cjs");
const addInfrastructureGenerator = require("./tools/plop-templates/infrastructure/generator.cjs");
const addWorkerGenerator = require("./tools/plop-templates/workers/generator.cjs");
const addWorkflowGenerator = require("./tools/plop-templates/workflows/generator.cjs");

/**
 * Main configuration for Plop, which allows us to create generators for
 * common repeating boilerplate, like adding new components or workflows.
 */
module.exports = function (plop) {
  plop.setGenerator("component", addComponentGenerator);
  plop.setGenerator("core", addCoreGenerator);
  plop.setGenerator("infrastructure", addInfrastructureGenerator);
  plop.setGenerator("worker", addWorkerGenerator);
  plop.setGenerator("workflow", addWorkflowGenerator);
};
