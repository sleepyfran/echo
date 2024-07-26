/**
 * Adds a generator for service packages.
 */
module.exports = {
  description:
    "Create a service package that can define custom logic and orchestration between multiple infrastructure packages.",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the packages's namespace? (Example: player):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/services/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/services/{{dashCase name}}/src/.gitkeep",
    },
    {
      type: "add",
      path: "packages/services/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/services/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
