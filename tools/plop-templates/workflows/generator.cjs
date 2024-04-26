/**
 * Adds a generator for workflow packages.
 */
module.exports = {
  description:
    "Create a workflow package that can define one or more workflows to orchestrate logic and data.",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the workflow's namespace? (Example: media-providers):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/workflows/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/workflows/{{dashCase name}}/src/.gitkeep",
    },
    {
      type: "add",
      path: "packages/workflows/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/workflows/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
