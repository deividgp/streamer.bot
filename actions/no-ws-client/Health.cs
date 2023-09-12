using System;
using System.Collections;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Sockets;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    int waitInMS = 250;
	int percent = 30;
    
    public bool Execute()
    {
		Start();
		return true;
    }
    
    public async void Start()
	{
        try
        {
            bool isPlaying = CPH.GetGlobalVar<bool>("isPlaying", false);
            
            if (!isPlaying) throw new Exception("Connection error");

            using (HttpClientHandler handler = new HttpClientHandler())
            {
                handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
                using (HttpClient client = new HttpClient(handler))
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
						CPH.ObsHideSource("Escena", "Red");
						CPH.ObsShowSource("Escena", "Black");
						return;
					}

					double minHP = (int)championStats["maxHealth"] * percent/100;

					if (currentHP <= minHP)
					{
						Console.WriteLine("Red filter");
						CPH.ObsHideSource("Escena", "Black");
						CPH.ObsShowSource("Escena", "Red");
						return;
					}
					
					CPH.ObsHideSource("Escena", "Black");
					CPH.ObsHideSource("Escena", "Red");
                }
            }
        }
        catch (Exception)
        {
            CPH.ObsHideSource("Escena", "Black");
            CPH.ObsHideSource("Escena", "Red");
        }
        finally
        {
            CPH.Wait(waitInMS);
            Start();
        }
	}
}