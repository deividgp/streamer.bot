using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace CodeTest
{
    public class Test1
    {
        int waitInMS = 2500;
        int lastEvent = 0;

        public Test1() { }

        public async Task StartAsync()
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
                            Console.WriteLine("Evento: " + eventResults[lastEvent]["EventName"]);

                            if (eventResults[lastEvent]["KillerName"] != null)
                            {
                                Console.WriteLine("KillerName: " + eventResults[lastEvent]["KillerName"]);
                            }

                            if (eventResults[lastEvent]["VictimName"] != null)
                            {
                                Console.WriteLine("VictimName: " + eventResults[lastEvent]["VictimName"]);
                            }

                            lastEvent++;
                        }
                    }
                    catch (HttpRequestException e)
                    {
                        //CPH.SetGlobalVar("isPlaying", "0", false);
                        Console.WriteLine("ERROR: " + e);
                        lastEvent = 0;
                    }
                    finally
                    {
                        System.Threading.Thread.Sleep(waitInMS);
                        await StartAsync();
                    }
                }
            }
        }
    }
}
