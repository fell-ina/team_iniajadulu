# Download script for competency images from Pexels
# Run this in PowerShell from the project root directory

$baseDir = "D:\team_iniajadulu\public\images\kompetensi"
$pexelsBase = "https://images.pexels.com/photos"

# Function to download image
function Download-PexelsImage {
    param(
        [string]$photoId,
        [string]$fileName,
        [int]$width = 1200,
        [int]$height = 800
    )
    $url = "$pexelsBase/$photoId/pexels-photo-$photoId.jpeg?auto=compress&cs=tinysrgb&w=$width&h=$height&dpr=1"
    $outputPath = Join-Path $baseDir $fileName
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
        Write-Host "Downloaded: $fileName ($photoId)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Failed: $fileName ($photoId) - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Create directory if not exists
if (-not (Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
}

Write-Host "Starting download of competency images..." -ForegroundColor Cyan

# ==========================================
# PPLG - 6 competencies
# ==========================================
$pplgImages = @(
    @{ id = "1181359"; name = "pplg-01-pemrograman.jpg" },
    @{ id = "14553707"; name = "pplg-02-pengembangan-website.jpg" },
    @{ id = "574071"; name = "pplg-03-pengembangan-aplikasi.jpg" },
    @{ id = "37730211"; name = "pplg-04-basis-data.jpg" },
    @{ id = "31862218"; name = "pplg-05-pengembangan-gim.jpg" },
    @{ id = "3861951"; name = "pplg-06-pemodelan-perangkat-lunak.jpg" }
)

# ==========================================
# TJKT - 6 competencies
# ==========================================
$tjktImages = @(
    @{ id = "17489155"; name = "tjkt-01-jaringan-komputer.jpg" },
    @{ id = "1181341"; name = "tjkt-02-administrasi-jaringan.jpg" },
    @{ id = "17489151"; name = "tjkt-03-teknologi-telekomunikasi.jpg" },
    @{ id = "17489156"; name = "tjkt-04-server.jpg" },
    @{ id = "4973899"; name = "tjkt-05-keamanan-jaringan.jpg" },
    @{ id = "5087172"; name = "tjkt-06-infrastruktur-jaringan.jpg" }
)

# ==========================================
# DKV - 6 competencies
# ==========================================
$dkvImages = @(
    @{ id = "4623113"; name = "dkv-01-desain-grafis.jpg" },
    @{ id = "31120860"; name = "dkv-02-ilustrasi.jpg" },
    @{ id = "33154292"; name = "dkv-03-fotografi.jpg" },
    @{ id = "29504352"; name = "dkv-04-tipografi.jpg" },
    @{ id = "7661590"; name = "dkv-05-branding.jpg" },
    @{ id = "34155027"; name = "dkv-06-media-visual.jpg" }
)

# ==========================================
# TKR - 6 competencies
# ==========================================
$tkrImages = @(
    @{ id = "8478259"; name = "tkr-01-perawatan-kendaraan.jpg" },
    @{ id = "36044141"; name = "tkr-02-perbaikan-mesin.jpg" },
    @{ id = "8478228"; name = "tkr-03-sistem-kelistrikan.jpg" },
    @{ id = "3807297"; name = "tkr-04-diagnosis-kendaraan.jpg" },
    @{ id = "4116224"; name = "tkr-05-sistem-pemindah-tenaga.jpg" },
    @{ id = "4756887"; name = "tkr-06-teknologi-otomotif.jpg" }
)

$allImages = @($pplgImages, $tjktImages, $dkvImages, $tkrImages) | ForEach-Object { $_ }

$success = 0
$failed = 0

foreach ($img in $allImages) {
    if (Download-PexelsImage -photoId $img.id -fileName $img.name) {
        $success++
    } else {
        $failed++
    }
    # Small delay to be respectful to the server
    Start-Sleep -Milliseconds 500
}

Write-Host "`nDownload complete!" -ForegroundColor Cyan
Write-Host "Success: $success" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

# List downloaded files
Write-Host "`nDownloaded files:" -ForegroundColor Cyan
Get-ChildItem $baseDir -File | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1024, 1)
    Write-Host "  $($_.Name) - ${sizeKB}KB"
}