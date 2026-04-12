Add-Type -AssemblyName System.Drawing;
$p = "c:\Projetos\PontoFacil\pontofacil-electron\build\icon.png";
$img = [System.Drawing.Image]::FromFile($p);
$img.Save("c:\Projetos\PontoFacil\pontofacil-electron\build\real_icon.png", [System.Drawing.Imaging.ImageFormat]::Png);
$img.Dispose();
