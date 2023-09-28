import { WebSocket } from "ws";
import { config } from "./config";

const PORT: number = config.wsPort | 8080;
const ws = new WebSocket("ws://127.0.0.1:" + PORT + "/");

ws.on("error", console.error);

ws.on("open", () => {
    console.log("Connected");
});

export { ws };