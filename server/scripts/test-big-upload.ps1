<#
.SYNOPSIS
  Drives the chunked upload API end to end from the command line.

.EXAMPLE
  .\scripts\test-big-upload.ps1 -File D:\samples\big.pdf

.EXAMPLE
  # resume an upload that died halfway
  .\scripts\test-big-upload.ps1 -File D:\samples\big.pdf -UploadId 0f3c...
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$BaseUrl  = 'http://localhost:8000/api',
  [string]$Email    = 'user@dms.com',
  [string]$Password = 'password123',
  [string]$Title,
  [string]$Tags,
  [string]$FolderId,
  [string]$UploadId,
  [int]$MaxRetries  = 3
)

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'   # PS 5.1: the progress bar cripples Invoke-* throughput

$MimeByExt = @{ '.pdf' = 'application/pdf'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.png' = 'image/png' }

function Get-AccessToken {
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json
  (Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -ContentType 'application/json' -Body $body).accessToken
}

function Show-ApiError($err) {
  $resp = $err.Exception.Response
  if ($null -eq $resp) { return $err.Exception.Message }
  $reader = New-Object IO.StreamReader($resp.GetResponseStream())
  $text = $reader.ReadToEnd()
  $reader.Close()
  "HTTP $([int]$resp.StatusCode) $text"
}

$item = Get-Item -LiteralPath $File
$size = $item.Length
$ext  = $item.Extension.ToLower()
$mime = $MimeByExt[$ext]

if (-not $mime) {
  throw "The API only accepts PDF/JPG/PNG. '$ext' is not one of them (see config.upload.allowedMime)."
}

Write-Host "File     : $($item.FullName)"
Write-Host "Size     : $([math]::Round($size / 1GB, 3)) GB ($size bytes)"
Write-Host "Type     : $mime"

# --- auth -------------------------------------------------------------------
$token = Get-AccessToken
$clock = [Diagnostics.Stopwatch]::StartNew()   # access tokens live 15m; re-login before that
$authHeader = { @{ Authorization = "Bearer $token" } }

# --- init or resume ---------------------------------------------------------
if ($UploadId) {
  $session = Invoke-RestMethod -Method Get -Uri "$BaseUrl/uploads/$UploadId" -Headers (& $authHeader)
  $pending = @($session.missing)
  $chunkSize   = $session.chunkSize
  $totalChunks = $session.totalChunks
  Write-Host "Resuming : $UploadId ($($pending.Count) of $totalChunks chunks left)`n"
} else {
  $payload = @{ name = $item.Name; type = $mime; size = $size }
  if ($Title)    { $payload.title    = $Title }
  if ($Tags)     { $payload.tags     = $Tags }
  if ($FolderId) { $payload.folderId = $FolderId }

  try {
    $session = Invoke-RestMethod -Method Post -Uri "$BaseUrl/uploads/init" `
      -Headers (& $authHeader) -ContentType 'application/json' -Body ($payload | ConvertTo-Json)
  } catch {
    throw "init failed: $(Show-ApiError $_)"
  }

  $UploadId    = $session.uploadId
  $chunkSize   = $session.chunkSize
  $totalChunks = $session.totalChunks
  $pending     = 0..($totalChunks - 1)
  Write-Host "Upload   : $UploadId"
  Write-Host "Chunks   : $totalChunks x $([math]::Round($chunkSize / 1MB, 1)) MB`n"
}

# --- push the chunks --------------------------------------------------------
$buffer = New-Object byte[] $chunkSize
$stream = [IO.File]::OpenRead($item.FullName)
$timer  = [Diagnostics.Stopwatch]::StartNew()
$sent   = 0

try {
  foreach ($index in $pending) {
    if ($clock.Elapsed.TotalMinutes -gt 12) { $token = Get-AccessToken; $clock.Restart() }

    $offset = [int64]$index * $chunkSize
    $stream.Position = $offset

    # a single Read can come up short on large buffers, so fill it explicitly
    $want = [int][math]::Min([int64]$chunkSize, $size - $offset)
    $have = 0
    while ($have -lt $want) {
      $n = $stream.Read($buffer, $have, $want - $have)
      if ($n -eq 0) { break }
      $have += $n
    }

    # must stay a real byte[] — $buffer[0..n] would yield Object[] and get sent as text
    if ($have -eq $chunkSize) {
      $payload = $buffer
    } else {
      $payload = New-Object byte[] $have
      [Array]::Copy($buffer, 0, $payload, 0, $have)
    }

    for ($try = 1; $try -le $MaxRetries; $try++) {
      try {
        Invoke-RestMethod -Method Put -Uri "$BaseUrl/uploads/$UploadId/chunk/$index" `
          -Headers (& $authHeader) -ContentType 'application/octet-stream' -Body $payload | Out-Null
        break
      } catch {
        if ($try -eq $MaxRetries) { throw "chunk $index failed: $(Show-ApiError $_)" }
        Write-Warning "chunk $index attempt $try failed, retrying"
        Start-Sleep -Seconds ($try * 2)
        $token = Get-AccessToken; $clock.Restart()
      }
    }

    $sent += $have
    $mbps = if ($timer.Elapsed.TotalSeconds -gt 0) { ($sent / 1MB) / $timer.Elapsed.TotalSeconds } else { 0 }
    Write-Host -NoNewline ("`r  {0}/{1} chunks  {2} MB  {3:N1} MB/s   " -f `
      ($pending.IndexOf($index) + 1), $pending.Count, [math]::Round($sent / 1MB), $mbps)
  }
} finally {
  $stream.Close()
}

Write-Host "`n"

# --- finish -----------------------------------------------------------------
try {
  $doc = Invoke-RestMethod -Method Post -Uri "$BaseUrl/uploads/$UploadId/complete" -Headers (& $authHeader)
} catch {
  throw "complete failed: $(Show-ApiError $_)"
}

Write-Host "Done in $([math]::Round($timer.Elapsed.TotalSeconds, 1))s"
$doc | ConvertTo-Json -Depth 5
