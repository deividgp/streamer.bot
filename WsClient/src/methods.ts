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
let lastHp: number = 0;

export function fetchActivePlayerData(): void {
    fetch(activePlayerDataUrl)
        .then((res) => res.json())
        .then(async (json) => {
            summonerName = json.summonerName;

            if (isDead) return;

            const currentHp: number = json.championStats.currentHealth;

            let filter = undefined;

            // minHp required to activate the red filter
            const minHp: number =
                (json.championStats.maxHealth * hpPercentage) / 100;

            if (lastHp <= minHp && currentHp > minHp) {
                // If lastHp is lower or equal than minHp and currentHp is higher than minHp
                filter = "alive";
                console.log("Alive");
            } else if (lastHp > minHp && currentHp <= minHp) {
                // If lastHp is higher than minHp and currentHp is lower than minHp
                filter = "low-hp";
                console.log("Red filter");
            }

            lastHp = currentHp == 0 ? -1 : currentHp;

            if (filter == undefined) return;

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

            if (player.isDead && lastHp != 0) {
                lastHp = 0;
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