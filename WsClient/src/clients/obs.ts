import crypto from "node:crypto";
import { WebSocket } from "ws";
import { config } from "../config";

const PORT: number = config.obs.port | 4455;
export const obs = new WebSocket("ws://192.168.1.46:" + PORT + "/");

obs.on("error", () => {
    console.log("Error connecting to OBS");
});

obs.on("open", () => {
    console.log("Connected to obs");
});

obs.on("message", (data) => {
    const wsdata = JSON.parse(data.toString());

    //console.log(wsdata);
    switch (wsdata.op) {
        case 0:
            let authentication: string = ""

            if (wsdata.d.authentication) {
                authentication = parseStuff(parseStuff(config.obs.password + wsdata.d.authentication.salt) + wsdata.d.authentication.challenge);
            }

            obs.send(JSON.stringify(
                {
                    "op": 1,
                    "d": {
                        "rpcVersion": 1,
                        "authentication": authentication
                    }
                }
            ));

            break;
        case 2:
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
            obs.send(JSON.stringify(
                {
                    "op": 6,
                    "d": {
                        "requestType": "SetInputSettings",
                        "requestId": "f819dcf0-89cc-11eb-8f0e-382c4ac93b9c",
                        "requestData": {
                            "inputName": "Black",
                            "inputSettings": {
                                "text": "Black"
                            }
                        }
                    }
                }
            ));
            break;
        case 6:

            break;
        case 7:
            //console.log(wsdata.d.responseData.inputSettings);
            break;
    }
});

function parseStuff(stuff: string) {
    // Convert the string to a Buffer
    let inputBuffer = Buffer.from(stuff, 'utf-8');
    // Calculate the SHA256 hash
    let sha256Hash = crypto.createHash('sha256').update(inputBuffer).digest();
    // Base64 encode the hash
    return sha256Hash.toString('base64');
}