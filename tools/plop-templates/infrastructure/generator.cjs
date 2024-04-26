/**
 * Adds a generator for infrastructure packages.
 */
module.exports = {
  description:
    "Create an infrastructure package that can define data retrieval from 3rd party providers.",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the packages's namespace? (Example: graph-api):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/infrastructure/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/infrastructure/{{dashCase name}}/src/.gitkeep",
    },
    {
      type: "add",
      path: "packages/infrastructure/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/infrastructure/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
