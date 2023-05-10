import "@fluencelabs/js-client.node";
import * as core from "@actions/core";
import { Fluence } from "@fluencelabs/js-client.api";
import * as network from "@fluencelabs/fluence-network-environment";
import { checkPeer } from "./_aqua/main.js";

async function main() {
  const env = core.getInput("env");
  const timeout = parseInt(core.getInput("timeout"));
  let peers, relay;
  console.log(env)

  const errorMessages = [];

  switch (env) {
    case "stage":
      peers = network.stage;
      relay = network.randomStage();
      break;
    case "testnet":
      peers = network.testNet;
      relay = network.randomTestNet();
      break;
    case "kras":
      peers = network.kras;
      relay = network.randomKras();
      break;
    default:
      console.error('Invalid "env" input. Use "stage", "testnet", or "kras".');
      process.exit(1);
  }

  try {
    await Fluence.connect(relay.multiaddr);

    const data = peers.map(({ peerId, multiaddr }, index) => ({
      peer: peerId,
      multiaddr: multiaddr,
      validators: peers.filter((_, idx) => idx !== index).map((n) => n.peerId),
    }));

    for (const setup of data) {
      try {
        console.log(`Checking peer: ${setup.multiaddr}`);
        const result = await checkPeer(setup.peer, setup.validators, timeout, {
          ttl: timeout,
        });
        console.log(result);
      } catch (e) {
        const errorMessage = JSON.stringify(e, null, 2);
        console.error(errorMessage);
        errorMessages.push(`${setup.multiaddr} failed:\n ${errorMessage}`);
      }
    }
  } catch (e) {
    console.error(`Error connecting to ${relay.multiaddr}:\n ${e}`);
    errorMessages.push(`Error connecting to ${relay.multiaddr}:\n ${e}`);
  } finally {
    await Fluence.disconnect();
  }

  if (errorMessages.length > 0) {
    core.setOutput("error_log", errorMessages.join("\n"));
    console.log(errorMessages.join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  core.setFailed(error.message);
});
