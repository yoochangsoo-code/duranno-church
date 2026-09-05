$src = "C:\Users\hp\AppData\Local\Google\Chrome\User Data"
$dst = "c:\ai\naver-blog-automation\data\naver_user_data"

try {
    Copy-Item "$src\Local State" "$dst\Local State" -Force
    if (-not (Test-Path "$dst\Default\Network")) {
        New-Item -ItemType Directory -Path "$dst\Default\Network" -Force | Out-Null
    }
    Copy-Item "$src\Default\Network\Cookies" "$dst\Default\Network\Cookies" -Force
    Write-Output "SUCCESS_COPIED"
} catch {
    Write-Output "COPY_FAILED: $($_.Exception.Message)"
}
