/**
 * Adds a generator for core packages.
 */
module.exports = {
  description:
    "Create a core package, which are stateless and free of side effects, self-contained pieces of logic that can be reused across the entire app.",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the core's namespace? (Example: auth):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/core/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/core/{{dashCase name}}/src/.gitkeep",
    },
    {
      type: "add",
      path: "packages/core/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/core/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
