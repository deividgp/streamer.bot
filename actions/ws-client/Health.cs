using System;

public class CPHInline
{
    public bool Execute()
    {
        switch (args["filter"].ToString())
        {
            case "black":
                CPH.ObsHideSource("Escena", "Red");
                CPH.ObsShowSource("Escena", "Black");
                break;
            case "red":
                CPH.ObsHideSource("Escena", "Black");
                CPH.ObsShowSource("Escena", "Red");
                break;
            case "no":
                CPH.ObsHideSource("Escena", "Black");
                CPH.ObsHideSource("Escena", "Red");
                break;
        }

        return true;
    }
}