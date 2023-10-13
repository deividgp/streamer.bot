import { WebSocket } from "ws";
import { config } from "../config";

const PORT: number = config.wsPort | 8080;
export const sb = new WebSocket("ws://127.0.0.1:" + PORT + "/");
const wlTitle = "QUIEN GANA EL GAME?";
const minTitle = "EL GAME TERMINA EN 25 MINUTOS O MENOS?";
const deathsTitle = "SE MUERE 5 O MÁS VECES SENDITO?";
const killsTitle = "5 O MÁS KILLS POR PARTE DE SENDITO?";
let intervalId: number | NodeJS.Timeout;
let gameEndIntervalId: number = 0;
let gameEnded: boolean = false;
let cancelPrediction: boolean = false;

sb.on("error", () => {
    console.log("Error connecting to streamer.bot");
});

sb.on("open", () => {
    console.log("Connected to streamer.bot");

    if(config.features.predictions.enabled == "no") return;

    sb.send(JSON.stringify(
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

sb.on("message", (data) => {
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
                    intervalId = setInterval(fetchGameEnd, 250, prediction.id, prediction.outcomes[0].id, prediction.outcomes[1].id, prediction.title);
                    break;
                case deathsTitle:
                case killsTitle:
                    gameEndIntervalId = setInterval(fetchGameEnd, 250);
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

            cancelPrediction = lastEvent.EventTime / 60 <= 5;

            clearInterval(gameEndIntervalId);

            if (predictionId == undefined) return;

            if (cancelPrediction) {
                doPredictionAction(predictionId);
                return;
            }

            let outcomeId: string;

            if (title == wlTitle) {
                outcomeId = lastEvent.Result == "Win" ? outcome1Id : outcome2Id;
            } else if (title == minTitle) {
                outcomeId = lastEvent.EventTime / 60 <= 25 ? outcome1Id : outcome2Id;
            }

            doPredictionAction(predictionId, outcomeId);
        })
        .catch(() => {
        });
}

function fetchKda(predictionId: string, outcome1Id: string, outcome2Id: string, title: string): void {
    fetch("https://127.0.0.1:2999/liveclientdata/playerscores?summonerName=" + global.summonerName)
        .then((res) => res.json())
        .then(async (json) => {
            if (json.deaths == undefined && json.kills == undefined) return;
            if ((title == deathsTitle && json.deaths < 5) || (title == killsTitle && json.kills < 5)) return;

            console.log(json.deaths);
            console.log(json.kills);

            doPredictionAction(predictionId, outcome1Id);

            clearInterval(gameEndIntervalId);
        })
        .catch(() => {
            if (!gameEnded) return;
            
            cancelPrediction ? doPredictionAction(predictionId) : doPredictionAction(predictionId, outcome2Id)
        });
}

function doPredictionAction(predictionId: string, outcomeId: string = null){
    clearInterval(intervalId);

    if(outcomeId == null){
        sb.send(
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
        return;
    }

    sb.send(
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
}