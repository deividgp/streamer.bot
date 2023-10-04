import { WebSocket } from "ws";
import { config } from "./config";

const PORT: number = config.wsPort | 8080;
const ws = new WebSocket("ws://127.0.0.1:" + PORT + "/");
const wlTitle = "QUIEN GANA EL GAME?";
const minTitle = "EL GAME TERMINA EN 25 MINUTOS O MENOS?";
const deathsTitle = "SE MUERE 5 O MÁS VECES SENDITO?";
const killsTitle = "5 O MÁS KILLS POR PARTE DE SENDITO?";
let intervalId: number | NodeJS.Timeout;
let gameEndIntervalId: number;
let gameEnded: boolean = false;
let cancelPrediction: boolean = false;

ws.on("error", console.error);

ws.on("open", () => {
    console.log("Connected");

    if(config.features.predictions.enabled == "no") return;

    ws.send(JSON.stringify(
        {
            "request": "Subscribe",
            "events": {
                "Twitch": [
                    "PredictionCreated"
                ]
            },
            "id": "subscribe-events-id"
        }
    ));
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

            switch (prediction.title) {
                case wlTitle:
                case minTitle:
                    intervalId = setInterval(fetchGameEnd, 500, prediction.id, prediction.outcomes[0].id, prediction.outcomes[1].id, prediction.title);
                    break;
                case deathsTitle:
                case killsTitle:
                    gameEndIntervalId = setInterval(fetchGameEnd, 500);
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
            
            cancelPrediction = lastEvent.EventTime / 60 <= 10;

            clearInterval(gameEndIntervalId);

            if (predictionId == undefined) return;

            if (cancelPrediction) {
                ws.send(
                    JSON.stringify(
                        {
                            "request": "DoAction",
                            "action": {
                                "name": config.features.predictions.cancelActionName
                            },
                            "args": {
                                "predictionId": predictionId
                            },
                            "id": "123"
                        }
                    )
                );

                clearInterval(intervalId);
                return;
            }

            let outcomeId: string;

            if (title == wlTitle) {
                outcomeId = lastEvent.Result == "Win" ? outcome1Id : outcome2Id;
            } else if (title == minTitle) {
                outcomeId = lastEvent.EventTime / 60 <= 25 ? outcome1Id : outcome2Id;
            }

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": config.features.predictions.resolveActionName
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
            if ((title == deathsTitle && json.deaths < 5) || (title == killsTitle && json.kills < 5)) return;

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": config.features.predictions.resolveActionName
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
            
            if(cancelPrediction){
                ws.send(
                    JSON.stringify(
                        {
                            "request": "DoAction",
                            "action": {
                                "name": config.features.predictions.cancelActionName
                            },
                            "args": {
                                "predictionId": predictionId
                            },
                            "id": "123"
                        }
                    )
                );
            }
            else
            {
                ws.send(
                    JSON.stringify(
                        {
                            "request": "DoAction",
                            "action": {
                                "name": config.features.predictions.resolveActionName
                            },
                            "args": {
                                "predictionId": predictionId,
                                "outcomeId": outcome2Id,
                            },
                            "id": "123"
                        }
                    )
                );
            }

            clearInterval(intervalId);
        });
}


export { ws };