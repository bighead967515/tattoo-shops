param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey,
    [string]$Domain = "theinkednetwork.website"
)

$headers = @{"X-API-Key" = $ApiKey; "Content-Type" = "application/json"}
$baseUrl = "https://api.hosting.ionos.com/dns/v1"

# Get zones
Write-Host "Fetching zones..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/zones" -Headers $headers -UseBasicParsing -ErrorAction Stop
    $zones = $response.Content | ConvertFrom-Json
} catch {
    Write-Error "Failed to fetch zones: $($_.Exception.Message) (Status: $($_.Exception.Response?.StatusCode))"
    exit 1
}

# Exact match against domain name; DNS zone names may have a trailing dot
$zone = $zones | Where-Object { $_.name -eq $Domain -or $_.name -eq "$Domain." }

if (-not $zone) {
    Write-Host "Zone not found for $Domain" -ForegroundColor Red
    exit 1
}

if (@($zone).Count -gt 1) {
    Write-Error "Multiple zones matched '$Domain'. Aborting to avoid ambiguity."
    exit 1
}

$zone = @($zone)[0]
$zoneId = $zone.id
Write-Host "Found zone: $($zone.name) (ID: $zoneId)" -ForegroundColor Green

# Get current records
Write-Host "Fetching current DNS records..." -ForegroundColor Cyan
try {
    $recordsResponse = Invoke-WebRequest -Uri "$baseUrl/zones/$zoneId" -Headers $headers -UseBasicParsing -ErrorAction Stop
    $records = $recordsResponse.Content | ConvertFrom-Json
} catch {
    Write-Error "Failed to fetch DNS records: $($_.Exception.Message) (Status: $($_.Exception.Response?.StatusCode))"
    exit 1
}

Write-Host "Current records:" -ForegroundColor Yellow
if ($null -eq $records -or $null -eq $records.records) {
    Write-Host "No records found or unexpected response format." -ForegroundColor Yellow
} else {
    $records.records | Format-Table -Property name,type,content
}

# Output for next step
Write-Host "`nZone ID: $zoneId" -ForegroundColor Green
Write-Host "Ready to update records." -ForegroundColor Green
