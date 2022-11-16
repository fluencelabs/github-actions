#! /usr/bin/env python3

import toml
import sys

manifest = toml.load("Cargo.toml")
for dependency in manifest["dependencies"]:
    if dependency in sys.argv[1:]:
        manifest["dependencies"][dependency]["registry"] = "fluence"

with open("Cargo.toml", "w") as f:
    f.write(toml.dumps(manifest))
