#! /usr/bin/env bash

if [[ $GIT != '' ]]; then

  echo "Assuming package source is git repository."
  if ! [[ $LOCK_SOURCE =~ $GIT ]]; then
    echo "$GIT doesn't match $LOCK_SOURCE found in Cargo.lock."
    exit 1
  else
    echo "$GIT matches $LOCK_SOURCE found in Cargo.lock"
  fi

elif [[ $VERSION != '' ]]; then

  echo "Assuming package source is cargo registry."
  if ! [[ $VERSION =~ $LOCK_VERSION ]]; then
    echo "$VERSION doesn't match $LOCK_VERSION found in Cargo.lock."
    exit 1
  else
    echo "$VERSION matches $LOCK_VERSION found in Cargo.lock"
  fi

else

  echo "Either git or registry source must be set."
  exit 1

fi
