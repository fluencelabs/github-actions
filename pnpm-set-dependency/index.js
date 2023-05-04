const core = require("@actions/core");
const pnpm = require("pnpm");
const fs = require("fs");
const path = require("path");

function overrideDependencies(packageJson, dependencies) {
  ["dependencies", "devDependencies"].forEach((depKey) => {
    if (packageJson[depKey]) {
      for (
        const [dependency, newVersion] of Object.entries(dependencies)
      ) {
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
    const dependencies = core.getInput("dependencies");
    const depsJson = JSON.parse(dependencies || "{}");

    const workspaceDir = process.cwd();
    const workspaceManifest = await pnpm.readWorkspaceManifest(workspaceDir);
    const workspacePackages = await workspaceManifest.findAll();

    for (const pkg of workspacePackages) {
      const packageJsonPath = path.join(pkg.dir, "package.json");
      const packageJson = require(packageJsonPath);
      const updatedPackageJson = overrideDependencies(packageJson, depsJson);

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(updatedPackageJson, null, 2),
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
