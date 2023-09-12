import { WebSocket } from "ws";

const PORT: number = +process.env.PORT | 9001;
const ws = new WebSocket("ws://127.0.0.1:" + PORT + "/");

ws.on("error", console.error);

ws.on("open", () => {
    console.log("Connected");
});

export { ws };