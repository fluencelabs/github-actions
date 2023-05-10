import "@fluencelabs/js-client.node";
import { Fluence } from "@fluencelabs/js-client.api";
import * as network from "@fluencelabs/fluence-network-environment";
import { checkPeer } from "./_aqua/main.js";

async function main() {
  const env = process.env.ENV;
  const timeout = parseInt(process.env.TIMEOUT) || 25000;
  let peers, relay;

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
      console.error('Invalid ENV value. Use "stage", "testnet", or "kras".');
      process.exit(1);
  }

  try {
    await Fluence.connect(relay.multiaddr);

    const data = peers.map(({ peerId }, index) => ({
      peer: peerId,
      validators: peers.filter((_, idx) => idx !== index).map((n) => n.peerId),
    }));

    for (const setup of data) {
      try {
        const { multiaddr } = peers.find(({ peerId }) => peerId === setup.peer);
        console.log(`Checking peer: ${multiaddr}`);
        const result = await checkPeer(setup.peer, setup.validators, timeout, {
          ttl: timeout,
        });
        console.log(result);
      } catch (e) {
        console.error(JSON.stringify(e, null, 2));
      }
    }
  } catch (e) {
    console.error(`Error connecting to ${relay.multiaddr}: ${e}`);
  } finally {
    await Fluence.disconnect();
  }
}

main();
