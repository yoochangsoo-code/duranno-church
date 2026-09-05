$WshShell = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "Naver_Login.lnk"
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c `"`"c:\ai\naver-blog-automation\login.bat`"`""
$Shortcut.WorkingDirectory = "c:\ai\naver-blog-automation"
$Shortcut.IconLocation = "C:\Program Files\Google\Chrome\Application\chrome.exe,0"
$Shortcut.Description = "Naver 1-Time Login Helper"
$Shortcut.Save()
Write-Output "SUCCESS: $shortcutPath"
