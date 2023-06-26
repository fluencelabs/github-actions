import "@fluencelabs/js-client.node";
import * as core from "@actions/core";
import { Fluence } from "@fluencelabs/js-client.api";
import * as network from "@fluencelabs/fluence-network-environment";
import { checkPeer } from "./_aqua/main.js";

async function main() {
  try {
    const env = core.getInput("env");
    const timeout = parseInt(core.getInput("timeout"));
    const peers = getPeersByEnv(env);

    await attemptToConnect(peers);
    const data = generatePeerData(peers);

    let errorMessages = [];
    for (let setup of data) {
      const checkResult = await performCheck(setup, timeout, errorMessages);
      if (!isTargetReachable(checkResult)) {
        errorMessages.push(checkResult);
      }
    }

    await Fluence.disconnect();
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function attemptToConnect(peers) {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    const relay = getRandomRelay(peers);

    try {
      await Fluence.connect(relay.multiaddr);
      return;
    } catch (e) {
      console.error(`Error connecting to ${relay.multiaddr}:\n ${e}`);
    }
  }
  throw new Error("Could not connect to relay.");
}

async function performCheck(setup, timeout, errorMessages) {
    console.log(`Checking target: ${setup.multiaddr}`);
    let validators = setup.validators;

    let checkResult = null;
    for (let validator of validators) {
        try {
            const result = await checkPeer(setup.peer, validator.peerId, timeout, {
                ttl: timeout,
            });

            if (isTargetReachable(result)) {
                console.log(`Target reachable from ${validator.multiaddr}`);
            } else {
                console.log(`Target not reachable from ${validator.multiaddr}`);
            }

            checkResult = { ...result, peer: setup.multiaddr };
        } catch (e) {
            const errorMessage = `Target check from ${validator.multiaddr} failed with error:\n ${
              JSON.stringify(e, null, 2)
            }`;
            console.error(errorMessage);
            errorMessages.push(errorMessage);
        }
    }

    return checkResult;
}

function getPeersByEnv(env) {
  switch (env) {
    case "stage":
      return network.stage;
    case "testnet":
      return network.testNet;
    case "kras":
      return network.kras;
    default:
      console.error('Invalid "env" input. Use "stage", "testnet", or "kras".');
      process.exit(1);
  }
}

function getRandomRelay(peers) {
  const randomIndex = Math.floor(Math.random() * peers.length);
  return peers[randomIndex];
}

function generatePeerData(peers) {
  return peers.map(({ peerId, multiaddr }, index) => ({
    peer: peerId,
    multiaddr: multiaddr,
    validators: peers
      .filter((_, idx) => idx !== index)
      .map((n) => ({ peerId: n.peerId, multiaddr: n.multiaddr })),
  }));
}

function isTargetReachable(result) {
  for (const key in result) {
    if (result[key].includes("TARGET REACHABLE")) {
      return true;
    }
  }
  return false;
}

main();
