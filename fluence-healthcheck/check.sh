#! /usr/bin/env bash

check_connection() {
  if ! result=$(npx aqua run --addr $1 -f $INPUTS_FUNCTION --input $INPUTS_SCRIPT 2>&1); then
    echo $result | tee -a log.txt
  fi
}

get_peers() {
  npx aqua default_peers $1
}

case $INPUTS_TARGET in
  stage|testnet|krasnodar)
    while read -r peer; do
      check_connection $peer
    done < <(get_peers $INPUTS_TARGET)
  ;;
  *) check_connection $INPUTS_TARGET ;;
esac

if [[ -f log.txt ]]; then
  echo "Failure occured, check the log"
  echo "log=$(cat log.txt)" >> $GITHUB_OUTPUT
  exit 1
fi