using System;

public class CPHInline
{
    public bool Execute()
    {
        switch (args["filter"].ToString())
        {
            case "dead":
                CPH.ObsHideSource("Escena", "Red");
                CPH.ObsShowSource("Escena", "Black");
                break;
            case "low-hp":
                CPH.ObsHideSource("Escena", "Black");
                CPH.ObsShowSource("Escena", "Red");
                break;
            case "alive":
                CPH.ObsHideSource("Escena", "Black");
                CPH.ObsHideSource("Escena", "Red");
                break;
        }

        return true;
    }
}