/**
 * Adds a generator for worker packages.
 */
module.exports = {
  description:
    "Create a worker package which defines a dedicated worker that can be instantiated by the main thread.",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the worker's namespace? (Example: media-provider):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/workers/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/workers/{{dashCase name}}/src/.gitkeep",
    },
    {
      type: "add",
      path: "packages/workers/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/workers/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
