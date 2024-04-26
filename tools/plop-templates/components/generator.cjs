/**
 * Adds a generator for components.
 */
module.exports = {
  description:
    "Create a standalone component that can be reused across the whole app",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "What is the component's namespace? (Example: auth):",
    },
  ],
  actions: [
    {
      type: "add",
      path: "packages/components/{{dashCase name}}/index.ts",
      templateFile: `${__dirname}/template/index.ts.hbs`,
    },
    {
      type: "add",
      path: "packages/components/{{dashCase name}}/src/{{properCase name}}.tsx",
      templateFile: `${__dirname}/template/component.tsx.hbs`,
    },
    {
      type: "add",
      path: "packages/components/{{dashCase name}}/package.json",
      templateFile: `${__dirname}/template/package.json.hbs`,
    },
    {
      type: "add",
      path: "packages/components/{{dashCase name}}/tsconfig.json",
      templateFile: `${__dirname}/template/tsconfig.json.hbs`,
    },
  ],
};
