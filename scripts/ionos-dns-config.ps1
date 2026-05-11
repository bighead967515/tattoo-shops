param(
    [string]$ApiKey,
    [string]$Domain = "theinkednetwork.website"
)

if (-not $ApiKey -or [string]::IsNullOrWhiteSpace($ApiKey)) {
    $ApiKey = $env:IONOS_API_KEY
}

if (-not $ApiKey -or [string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Host "Missing API key. Provide -ApiKey or set IONOS_API_KEY." -ForegroundColor Red
    exit 1
}

$headers = @{"X-API-Key" = $ApiKey; "Content-Type" = "application/json"}
$baseUrl = "https://api.hosting.ionos.com/dns/v1"

# Get zones
Write-Host "Fetching zones..." -ForegroundColor Cyan
$zones = Invoke-WebRequest -Uri "$baseUrl/zones" -Headers $headers -UseBasicParsing | ConvertFrom-Json
$zone = $zones | Where-Object { $_.name -like "*$Domain*" }

if (-not $zone) {
    Write-Host "Zone not found for $Domain" -ForegroundColor Red
    exit 1
}

$zoneId = $zone.id
Write-Host "Found zone: $($zone.name) (ID: $zoneId)" -ForegroundColor Green

# Get current records
Write-Host "Fetching current DNS records..." -ForegroundColor Cyan
$records = Invoke-WebRequest -Uri "$baseUrl/zones/$zoneId" -Headers $headers -UseBasicParsing | ConvertFrom-Json

Write-Host "Current records:" -ForegroundColor Yellow
$records.records | Format-Table -Property name,type,content

# Output for next step
Write-Host "`nZone ID: $zoneId" -ForegroundColor Green
Write-Host "Ready to update records." -ForegroundColor Green
