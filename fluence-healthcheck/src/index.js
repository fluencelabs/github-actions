import "@fluencelabs/js-client.node";
import { Fluence } from "@fluencelabs/js-client.api";
import * as network from "@fluencelabs/fluence-network-environment";
import { checkPeer } from "./_aqua/main.js";
import * as core from "@actions/core";
import chalk from "chalk";

const envs = {
  stage: network.stage,
  testnet: network.testNet,
  kras: network.kras,
};

const getEnv = () => core.getInput("env");
const getTimeout = () => parseInt(core.getInput("timeout"));

async function main() {
  try {
    const env = getEnv();
    const timeout = getTimeout();
    const peerList = envs[env];

    if (!peerList) {
      core.setFailed('Invalid env. Use "stage", "testnet", or "kras".');
    }

    await establishConnection(peerList);
    const peerData = constructPeerData(peerList);

    let failureMessages = [];
    for (const peerSetup of peerData) {
      await validateConnectivity(peerSetup, timeout);
    }

    await Fluence.disconnect();

    if (failureMessages.length > 0) {
      core.setOutput("error_log", failureMessages.flat().join("\n"));
      core.setFailed("Some target checks were unsuccessful.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function establishConnection(peerList) {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    const relay = selectRandomRelay(peerList);
    try {
      await Fluence.connect(relay.multiaddr);
      return;
    } catch (error) {
      core.info(`Error connecting to ${relay.multiaddr}:\n ${error}`);
    }
  }
  throw new Error("Could not connect to relay after 3 tries.");
}

async function validateConnectivity(peerSetup, timeout) {
  core.info(`\nChecking target: ${peerSetup.multiaddr}`);
  let errorList = [];
  for (const validator of peerSetup.validators) {
    try {
      const result = await checkPeer(
        peerSetup.peer,
        validator.peerId,
        timeout,
        { ttl: timeout },
      );
      const isReachable = isPeerReachable(result);
      core.info(
        isReachable
          ? chalk.green(`Target reachable from ${validator.multiaddr}`)
          : chalk.red(`Target not reachable from ${validator.multiaddr}`),
      );
    } catch (error) {
      const errorMessage =
        `Target ${peerSetup.multiaddr} check from ${validator.multiaddr} failed with error:\n ${
          JSON.stringify(error, null, 2)
        }`;
      core.info(chalk.red(errorMessage));
      errorList.push(errorMessage);
    }
  }
  return errorList;
}

const selectRandomRelay = (peerList) =>
  peerList[Math.floor(Math.random() * peerList.length)];

function constructPeerData(peerList) {
  return peerList.map(({ peerId, multiaddr }, index) => ({
    peer: peerId,
    multiaddr: multiaddr,
    validators: peerList
      .filter((_, idx) => idx !== index)
      .map(({ peerId, multiaddr }) => ({ peerId, multiaddr })),
  }));
}

function isPeerReachable(checkResult) {
  return Object.values(checkResult).some((value) =>
    value.includes("TARGET REACHABLE")
  );
}

main();
