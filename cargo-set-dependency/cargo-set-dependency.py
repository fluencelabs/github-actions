#! /usr/bin/env python3

import toml
import json

def replace_nested_key(data, key, value):
    if isinstance(data, dict):
        return {
            k: value if k == key else replace_nested_key(v, key, value)
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [replace_nested_key(v, key, value) for v in data]
    else:
        return data

with open("input.json") as source:
    input = json.loads(source.read())

for dep in input:
    package=dep.pop("package")
    manifest_path=dep.pop("manifest", "Cargo.toml")

    cargo_toml = toml.load(manifest_path)
    cargo_toml = replace_nested_key(cargo_toml, package, dep)

    with open(manifest_path, "w") as manifest:
        manifest.write(toml.dumps(cargo_toml))
