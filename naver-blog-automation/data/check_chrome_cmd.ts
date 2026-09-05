import { execSync } from 'child_process';

try {
  const output = execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"name = \'chrome.exe\'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json"', { encoding: 'utf8' });
  console.log(output);
} catch (e: any) {
  console.log('ERR:', e.message);
}
