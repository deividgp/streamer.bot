import { ws } from "./socket";

const activePlayerDataUrl: string =
    "https://127.0.0.1:2999/liveclientdata/activeplayer";
const eventDataUrl: string = "https://127.0.0.1:2999/liveclientdata/eventdata";
const hpPercentage: number = +process.env.HPPERCENTAGE | 30;

let lastEventId: number = 0;
let summonerName: string;

function fetchActivePlayerData(): void {
    fetch(activePlayerDataUrl)
        .then((res) => res.json())
        .then(async (json) => {
            summonerName = json.summonerName;
            const currentHP: number = json.championStats.currentHealth;
            let filter = "no";

            if (currentHP == 0) {
                console.log("Black filter");
                filter = "black";
            } else {
                const minHP: number =
                    (json.championStats.maxHealth * hpPercentage) / 100;

                if (currentHP <= minHP) {
                    console.log("Red filter");
                    filter = "red";
                }
            }
            
            ws.send(
                JSON.stringify(
                    {
                        "request": "DoAction",
                        "action": {
                            "name": process.argv[2]
                        },
                        "args": {
                            "filter": filter,
                        },
                        "id": "123"
                    }
                )
            );
        })
        .catch(() => { });
}

function fetchEvents(): void {
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

export { fetchActivePlayerData, fetchEvents };