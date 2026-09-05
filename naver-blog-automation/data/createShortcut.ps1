$WshShell = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "Chrome_Naver.lnk"
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Shortcut.Arguments = "--remote-debugging-port=9222 --user-data-dir=`"$($env:LOCALAPPDATA)\Google\Chrome\User Data`" https://blog.naver.com/reading-kids"
$Shortcut.IconLocation = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
$Shortcut.Description = "Chrome for Naver Blog Automation"
$Shortcut.Save()
Write-Output "SUCCESS: $shortcutPath"
