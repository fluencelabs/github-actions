#! /usr/bin/env bash
package=$1
version=$2
version="{ ${version//$'\n'/, } }"

# check if "patch" section already set
if grep -q "patch.crates-io" Cargo.toml; then
  # get everything in "patch" section
  patch=$(sed -ne "/\[patch.crates-io\]/,\$ p" Cargo.toml)
  if echo "${patch}" | grep -q ${package}; then
    # if package is present in "patch" section replace it
    sed -i -r "/\[patch.crates-io\]/,/${package}/ s|${package} = .*|${package} = ${version}|" Cargo.toml
  else
    # else add package override in "patch" section
    sed -i "/\[patch.crates-io\]/a ${package} = ${version}" Cargo.toml
  fi
# if no "patch" section found create it
else
  echo -e '\n[patch.crates-io]' >> Cargo.toml
  echo "${package} = ${version}" >> Cargo.toml
fi
