import { WebSocket } from "ws";
import { config } from "./config";

const PORT: number = config.wsPort | 8080;
const ws = new WebSocket("ws://127.0.0.1:" + PORT + "/");
let intervalId: number | NodeJS.Timeout;
let gameEndIntervalId: number;
let gameEnded: boolean = false;

ws.on("error", console.error);

ws.on("open", () => {
    console.log("Connected");
    /*ws.send(JSON.stringify(
        {
            "request": "Subscribe",
            "events": {
                "Twitch": [
                    "PredictionCreated"
                ]
            },
            "id": "subscribe-events-id"
        }
    ));*/
});

ws.on("message", (data) => {
    const wsdata = JSON.parse(data.toString());

    if (!wsdata.event) return;

    switch (wsdata.event.type) {
        case "PredictionCreated":
            const prediction = wsdata.data;
            console.log(wsdata);
            console.log(prediction.outcomes);
            gameEnded = false;
            gameEndIntervalId = setInterval(fetchGameEnd, 500);

            switch (prediction.title) {
                case "W/L":
                case "+25min":
                    clearInterval(gameEndIntervalId);
                    intervalId = setInterval(fetchGameEnd, 500, prediction.id, prediction.outcomes[0].id, prediction.outcomes[1].id, prediction.title);
                    break;
                case "+5deaths":
                case "+5kills":
                    intervalId = setInterval(fetchKda, 1000, prediction.id, prediction.outcomes[0].id, prediction.outcomes[1].id, prediction.title);
                    break;
            }
            break;
    }
});

function fetchGameEnd(predictionId: string, outcome1Id: string, outcome2Id: string, title: string): void {
    fetch("https://127.0.0.1:2999/liveclientdata/eventdata")
        .then((res) => res.json())
        .then(async (json) => {
            const lastEvent = json.Events[json.Events.length - 1];

            if (lastEvent.EventName != "GameEnd") return;

            gameEnded = true;

            clearInterval(gameEndIntervalId);

            if (predictionId == undefined) return;

            let outcomeId: string;

            if (title == "W/L") {
                outcomeId = lastEvent == "Win" ? outcome1Id : outcome2Id;
            } else if ("+25min") {
                outcomeId = lastEvent.EventTime / 60 >= 25 ? outcome1Id : outcome2Id;
            }

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": "resolvePrediction"
                        },
                        "args": {
                            "predictionId": predictionId,
                            "outcomeId": outcomeId,
                        },
                        "id": "123"
                    }
                )
            );

            clearInterval(intervalId);
        })
        .catch(() => {
        });
}

function fetchKda(predictionId: string, outcome1Id: string, outcome2Id: string, title: string): void {
    fetch("https://127.0.0.1:2999/liveclientdata/playerscores?summonerName=" + global.summonerName)
        .then((res) => res.json())
        .then(async (json) => {
            if ((title == "+5deaths" && json.deaths < 5) || (title == "+5deaths" && json.kills < 5)) return;

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": "resolvePrediction"
                        },
                        "args": {
                            "predictionId": predictionId,
                            "outcomeId": outcome1Id,
                        },
                        "id": "123"
                    }
                )
            );

            clearInterval(intervalId);
        })
        .catch(() => {
            if (!gameEnded) return;

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": "resolvePrediction"
                        },
                        "args": {
                            "predictionId": predictionId,
                            "outcomeId": outcome2Id,
                        },
                        "id": "123"
                    }
                )
            );

            clearInterval(intervalId);
        });
}


export { ws };