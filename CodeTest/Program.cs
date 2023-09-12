using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CodeTest
{
    internal class Program
    {
        private static Test1 test1;
        private static Test2 test2;

        static async Task Main(string[] args)
        {
            Console.WriteLine("Start");
            test1 = new Test1();
            test2 = new Test2();
            //await test1.StartAsync();
            await test2.StartAsync();
        }
    }
}
