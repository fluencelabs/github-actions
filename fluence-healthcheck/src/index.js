import "@fluencelabs/js-client.node";
import * as core from "@actions/core";
import { Fluence } from "@fluencelabs/js-client.api";
import * as network from "@fluencelabs/fluence-network-environment";
import { checkPeer } from "./_aqua/main.js";

async function main() {
  const env = core.getInput("env");
  const timeout = parseInt(core.getInput("timeout"));
  const peers = getPeersByEnv(env);

  const errorMessages = [];
  let connected = false;

  for (let retryCount = 0; retryCount < 3; retryCount++) {
    const relay = getRandomRelay(peers);

    try {
      await Fluence.connect(relay.multiaddr);
      connected = true;
      break;
    } catch (e) {
      console.error(`Error connecting to ${relay.multiaddr}:\n ${e}`);
      errorMessages.push(`Error connecting to ${relay.multiaddr}:\n ${e}`);
    }
  }

  if (connected) {
    try {
      const data = generatePeerData(peers);
      const results = [];

      for (const setup of data) {
        try {
          console.log(`Checking peer: ${setup.multiaddr}`);
          const result = await checkPeer(
            setup.peer,
            setup.validators,
            timeout,
            {
              ttl: timeout,
            },
          );

          results.push(result);
        } catch (e) {
          const errorMessage = JSON.stringify(e, null, 2);
          console.error(errorMessage);
          errorMessages.push(`${setup.multiaddr} failed:\n ${errorMessage}`);
        }
      }

      if (results.every(isTargetReachable)) {
        console.log(results);
      } else {
        throw new Error("Target is not reachable or other error occurred.");
      }
    } catch (e) {
      console.error(e);
      errorMessages.push(`Error during peer checks:\n ${e}`);
    } finally {
      await Fluence.disconnect();
    }
  }

  if (errorMessages.length > 0) {
    core.setOutput("error_log", errorMessages.join("\n"));
    console.log(errorMessages.join("\n"));
    process.exit(1);
  }
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
    validators: peers.filter((_, idx) => idx !== index).map((n) => n.peerId),
  }));
}

function isTargetReachable(result) {
  return result.includes("status TARGET REACHABLE");
}

main().catch((error) => {
  core.setFailed(error.message);
});
