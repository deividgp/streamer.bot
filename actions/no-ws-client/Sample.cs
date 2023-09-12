using System;
using System.Collections;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Sockets;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    int waitInMS = 2500;
    int lastEvent = 0;
    bool gameIsOver = true;
    public bool Execute()
    {
		StringOutput("Iniciamos a API");
        Start();
        return true;
    }

    void Start()
    {
        using (TcpClient tcpClient = new TcpClient())
        {
            try
            {
                tcpClient.Connect("127.0.0.1", 2999);
                //CPH.SendMessage("O jogo está rolando!");
                gameIsOver = false;
                EventData();
            }
            catch (Exception)
            {
                if (!gameIsOver)
                {
                    gameIsOver = true;
                    StringOutput("O Jogo Acabou!");
                    lastEvent = 0;
                }

                Retry();
            }
        }
    }

    async void EventData()
    {
        using (HttpClientHandler handler = new HttpClientHandler())
        {
            handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            using (HttpClient client = new HttpClient(handler))
            {
                try
                {
                    HttpResponseMessage data = await client.GetAsync("https://127.0.0.1:2999/liveclientdata/eventdata");
                    data.EnsureSuccessStatusCode();
                    string responseBody = await data.Content.ReadAsStringAsync();

                    JObject results = JObject.Parse(responseBody);
                    JArray eventResults = (JArray)results["Events"];
                    int totalEvents = eventResults.Count;
                    int lastID = (int)eventResults[totalEvents - 1]["EventID"];

                    if (lastEvent < lastID)
                    {
                        lastEvent = lastID + 1;
                    }

                    while (lastEvent < totalEvents)
                    {
                        StringOutput("Evento: " + eventResults[lastEvent]["EventName"]);

                        if (eventResults[lastEvent]["KillerName"] != null)
                        {
                            StringOutput("KillerName: " + eventResults[lastEvent]["KillerName"]);
                        }

                        if (eventResults[lastEvent]["VictimName"] != null)
                        {
                            StringOutput("VictimName: " + eventResults[lastEvent]["VictimName"]);
                        }

                        lastEvent++;
                    }
                }
                catch (HttpRequestException e)
                {
                    //CPH.SetGlobalVar("isPlaying", "0", false);
                    StringOutput("ERROR: " + e);
                }
                finally
                {
                    Retry();
                }
            }
        }
    }

    void Retry()
    {
        int isPlaying = CPH.GetGlobalVar<int>("isPlaying", false);
        if (isPlaying != 1)
        {
			StringOutput("A API Parou com Sucesso!");
            return;
        }

        CPH.Wait(waitInMS);
        Start();
    }

    void StringOutput(string output)
    {
		//CPH.SendMessage(output);
		CPH.WebsocketBroadcastString(output);
    }
}