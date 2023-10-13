import { Agent, setGlobalDispatcher } from "undici";
import * as methods from "./methods";
import "./clients/obs";
import "./clients/heat";

const agent: Agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

setGlobalDispatcher(agent);

setInterval(methods.fetchActivePlayerData, 250);
setInterval(methods.fetchPlayerListData, 250);
//setInterval(methods.fetchEventData, 500);
