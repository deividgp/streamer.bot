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
    public class Test2
    {
        int waitInMS = 2500;
        int percent = 30;

        public Test2() { }

        public async Task StartAsync()
        {
            using (HttpClientHandler handler = new HttpClientHandler())
            {
                handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
                using (HttpClient client = new HttpClient(handler))
                {
                    try
                    {
                        HttpResponseMessage data = await client.GetAsync("https://127.0.0.1:2999/liveclientdata/activeplayer");
                        data.EnsureSuccessStatusCode();
                        string responseBody = await data.Content.ReadAsStringAsync();

                        JObject results = JObject.Parse(responseBody);
                        JObject championStats = (JObject)results["championStats"];

                        int currentHP = (int)championStats["currentHealth"];

                        if (currentHP == 0)
                        {
                            Console.WriteLine("Black filter");
                            return;
                        }

                        double minHP = (int)championStats["maxHealth"] * percent/100;

                        if (currentHP <= minHP)
                        {
                            Console.WriteLine("Red filter");
                            return;
                        }
                    }
                    catch (HttpRequestException e)
                    {
                        //CPH.SetGlobalVar("isPlaying", "0", false);
                        Console.WriteLine("ERROR: " + e);
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
