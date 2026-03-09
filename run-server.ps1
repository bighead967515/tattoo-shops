# Load .env file and set environment variables
(Get-Content .env -ErrorAction Stop) | Where-Object { $_ -match '=' -and -not ($_ -match '^\s*#') } | ForEach-Object {
    $parts = $_ -split '=', 2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($name) {
        [System.Environment]::SetEnvironmentVariable($name, $value)
        Set-Item "env:$name" -Value $value
        Write-Host "Set $name"
    }
}

Write-Host "`nStarting backend server..."
pnpm exec tsx backend/server/_core/index.ts
