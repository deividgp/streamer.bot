import { Agent, setGlobalDispatcher } from "undici";
import * as methods from "./methods";

const agent: Agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

setGlobalDispatcher(agent);

setInterval(methods.fetchActivePlayerData, 250);
//setInterval(methods.fetchEvents, 500);