const core = require("@actions/core");
const fs = require("fs");
const path = require("path");
const { findWorkspacePackages } = require("@pnpm/find-workspace-packages");

function overrideDependencies(packageJson, dependencies) {
  ["dependencies", "devDependencies"].forEach((depKey) => {
    if (packageJson[depKey]) {
      for (const [dependency, newVersion] of Object.entries(dependencies)) {
        if (
          newVersion &&
          newVersion.toLowerCase() !== "null" &&
          packageJson[depKey][dependency]
        ) {
          packageJson[depKey][dependency] = newVersion;
        }
      }
    }
  });
  return packageJson;
}

(async () => {
  try {
    const dependenciesInput = core.getInput("dependencies");
    const depsJson = JSON.parse(dependenciesInput || "{}");

    const workspaceDir = process.cwd();
    const workspacePackages = await findWorkspacePackages(workspaceDir);

    for (const pkg of workspacePackages) {
      const packageJsonPath = path.join(pkg.dir, "package.json");
      const packageJson = require(packageJsonPath);
      const updatedPackageJson = overrideDependencies(packageJson, depsJson);

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(updatedPackageJson, null, 2) + "\n",
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
