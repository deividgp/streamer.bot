import { ws } from "./socket";
import { config } from "./config";

const activePlayerDataUrl: string =
    "https://127.0.0.1:2999/liveclientdata/activeplayer";
const eventDataUrl: string = "https://127.0.0.1:2999/liveclientdata/eventdata";
const playerListDataUrl: string = "https://127.0.0.1:2999/liveclientdata/playerlist";
const hpPercentage: number = config.features.health.hpPercentage | 30;

let summonerName: string;
let lastEventId: number = 0;
let isDead: boolean = false;

export function fetchActivePlayerData(): void {
    fetch(activePlayerDataUrl)
        .then((res) => res.json())
        .then(async (json) => {
            summonerName = json.summonerName;

            if (isDead) return;

            const currentHP: number = json.championStats.currentHealth;
            let filter = "alive";

            const minHP: number =
                (json.championStats.maxHealth * hpPercentage) / 100;

            if (currentHP <= minHP) {
                console.log("Red filter");
                filter = "low-hp";
            }

            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": config.features.health.actionName
                        },
                        "args": {
                            "filter": filter,
                        },
                        "id": "123"
                    }
                )
            );
        })
        .catch(() => {
        });
}

export function fetchPlayerListData(): void {
    fetch(playerListDataUrl)
        .then((res) => res.json())
        .then(async (json) => {
            const player = json.find(
                (element: any) => element.summonerName == summonerName
            );

            isDead = player.isDead;

            if (player.isDead) {
                console.log("Black filter");

                ws.send(
                    JSON.stringify(
                        {
                            "request": "DoAction",
                            "action": {
                                "name": config.features.health.actionName
                            },
                            "args": {
                                "filter": "dead",
                            },
                            "id": "123"
                        }
                    )
                );
            }
        })
        .catch(() => { });
}

export function fetchEventData(): void {
    fetch(eventDataUrl)
        .then((res) => res.json())
        .then(async (json) => {
            const events = json.Events.filter(
                (element: any) => element.EventID > lastEventId
            );

            if (events.length == 0) return;

            lastEventId = events[events.length - 1].EventID;

            const multikill = events.findLast(
                (element: any) =>
                    element.EventName == "Multikill" && element.KillerName == summonerName
            );
        })
        .catch(() => { });
}