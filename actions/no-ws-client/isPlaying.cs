using System;
using System.Net.Sockets;

public class CPHInline
{
	public bool Execute()
	{
		try
		{
			using (TcpClient tcpClient = new TcpClient())
			{
				tcpClient.Connect("127.0.0.1", 2999);
				CPH.SetGlobalVar("isPlaying", true, false);
				return true;
			}
		}
		catch (Exception)
		{
			CPH.SetGlobalVar("isPlaying", false, false);
			return false;
		}
	}
}