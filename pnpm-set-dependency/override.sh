#!/usr/bin/env bash

set -e

DEPS_JSON="$1"

if [[ -z "$DEPS_JSON" ]]; then
  echo "No dependencies input provided."
  exit 1
fi

# Parse JSON and generate pnpmfile.js
cat > pnpmfile.js <<EOL
const dependencyOverrides = $DEPS_JSON;

module.exports = {
  hooks: {
    readPackage(packageJson) {
      if (packageJson.dependencies) {
        for (const [dependency, newVersion] of Object.entries(dependencyOverrides)) {
          if (newVersion && newVersion.toLowerCase() !== 'null' && packageJson.dependencies[dependency]) {
            packageJson.dependencies[dependency] = newVersion;
          }
        }
      }
      return packageJson;
    },
  },
};
EOL
