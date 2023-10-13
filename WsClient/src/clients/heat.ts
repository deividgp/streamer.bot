import { WebSocket } from "ws";
import { config } from "../config";
import { obs } from "./obs";

type Source = {
    name: string;
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
    isOnCd: boolean;
};

const channelId: number = config.features.heat.channelId;
const sources: Array<Source> = config.features.heat.sources;

const heat = new WebSocket("wss://heat-api.j38.net/channel/" + channelId);

heat.on("error", () => {
    console.log("Error connecting to Heat");
});

heat.on("open", () => {
    console.log("Connected to heat");
});

heat.on("message", (data) => {
    const wsdata = JSON.parse(data.toString());

    if (wsdata.type != "click") return;

    const auxSource = getElementInside(Number(wsdata.x), Number(wsdata.y))

    if (auxSource == undefined || auxSource.isOnCd == true) return;

    setCooldown(auxSource);

    switch (auxSource.name) {
        case "orange":
            /*obs.send(JSON.stringify(
                {
                    "op": 6,
                    "d": {
                        "requestType": "GetInputSettings",
                        "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c",
                        "requestData": {
                            "inputName": "Black"
                        }
                    }
                }
            ));*/
            break;
        case "kenny":
            break;
    }
});

function getElementInside(x: number, y: number): Source | undefined {
    return sources.find(source => {
        if ((x >= source.xStart && x <= source.xEnd) && (y >= source.yStart && y <= source.yEnd))
            return true;
    });
}

function setCooldown(source: Source) {
    const index = sources.findIndex(e => e.name == source.name)

    sources[index].isOnCd = true;

    setTimeout(() => {
        sources[index].isOnCd = false;
    }, 2000);
}