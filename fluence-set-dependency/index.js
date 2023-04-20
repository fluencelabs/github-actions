const fs = require('fs');
const yaml = require('js-yaml');
const core = require('@actions/core');
const path = require('path');

// Read the project path from the input variable
const projectPath = core.getInput('path');

// Change the working directory to the specified project path
process.chdir(projectPath);

// Construct the path to the fluence.yaml file
const fluenceFilePath = path.join(projectPath, 'fluence.yaml');

// Read and parse fluence.yaml
const fluenceYaml = fs.readFileSync(fluenceFilePath, 'utf8');
const fluence = yaml.load(fluenceYaml);

// Read versions from the input variable
const versionsJson = core.getInput('versions');
const versions = JSON.parse(versionsJson);

// Update dependencies in fluence object
const dependencies = fluence.dependencies;
Object.keys(versions).forEach((depType) => {
  Object.entries(versions[depType]).forEach(([depName, depVersion]) => {
    // Skip updating dependency if version is empty or null
    if (depVersion && depVersion !== 'null') {
      dependencies[depType][depName] = depVersion;
    }
  });
});

// Convert the updated fluence object back to YAML
const updatedYaml = yaml.dump(fluence);

// Write the updated YAML to fluence.yaml and stdout
fs.writeFileSync(fluenceFilePath, updatedYaml);
console.log(updatedYaml);
