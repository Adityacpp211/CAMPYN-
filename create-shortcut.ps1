$wscript = New-Object -ComObject WScript.Shell
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "CAMPES.lnk"

$shortcut = $wscript.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "c:\CAMPYN\CAMPYN_APP\CAMPES-Desktop.bat"
$shortcut.WorkingDirectory = "c:\CAMPYN\CAMPYN_APP"
$shortcut.IconLocation = "c:\CAMPYN\CAMPYN_APP\node_modules\electron\dist\electron.exe,0"
$shortcut.Description = "CAMPES Academic Operating System"
$shortcut.Save()

Write-Output "Shortcut successfully created at: $shortcutPath"
