<#
Merge-Racuni.ps1

Primer:
  .\Merge-Racuni.ps1 -InputFolder "C:\racuni" -OutputFile "C:\racuni\svi_racuni.pdf" -ExcludeStan 8
  .\Merge-Racuni.ps1 -InputFolder "C:\racuni" -OutputFile ".\out.pdf" -ExcludeStan 8,12
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string]$InputFolder,

  [Parameter(Mandatory=$true)]
  [string]$OutputFile,

  [int[]]$ExcludeStan = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputFolder)) {
  throw "Input folder ne postoji: $InputFolder"
}

# Prihvata i 'tima racun_stan_12.pdf' i 'tima_racun_stan_12.pdf'
$files = Get-ChildItem -LiteralPath $InputFolder -File -Filter "*.pdf" |
  Where-Object { $_.Name -match '^racun_stan_(\d+)\.pdf$' } |
  ForEach-Object {
    $stan = [int]($Matches[1])
    [pscustomobject]@{
      Path = $_.FullName
      Stan = $stan
      Name = $_.Name
    }
  }

if (-not $files -or $files.Count -eq 0) {
  throw "Nema PDF fajlova koji matchuju: tima racun_stan_*.pdf (ili tima_racun_stan_*.pdf) u folderu $InputFolder"
}

if ($ExcludeStan.Count -gt 0) {
  $excludeSet = @{}
  foreach ($s in $ExcludeStan) { $excludeSet[[int]$s] = $true }

  $files = $files | Where-Object { -not $excludeSet.ContainsKey($_.Stan) }
}

$files = $files | Sort-Object Stan

if (-not $files -or $files.Count -eq 0) {
  throw "Posle isključenja stanova nema fajlova za spajanje."
}

# Nađi alat za spajanje
$qpdf = Get-Command qpdf -ErrorAction SilentlyContinue
$pdfunite = Get-Command pdfunite -ErrorAction SilentlyContinue

# Kreiraj output folder ako treba
$outDir = Split-Path -Parent $OutputFile
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

# Ako output već postoji, prepiši ga
if (Test-Path -LiteralPath $OutputFile) {
  Remove-Item -LiteralPath $OutputFile -Force
}

$inputPaths = $files.Path

Write-Host "Spajam fajlove (redosled po broju stana):"
$files | ForEach-Object { Write-Host ("  stan {0}: {1}" -f $_.Stan, $_.Name) }

if ($qpdf) {
  # qpdf --empty --pages in1.pdf in2.pdf -- out.pdf
  $args = @("--empty", "--pages") + $inputPaths + @("--", $OutputFile)
  & $qpdf.Source @args
}
elseif ($pdfunite) {
  # pdfunite in1.pdf in2.pdf out.pdf
  $args = $inputPaths + @($OutputFile)
  & $pdfunite.Source @args
}
else {
  throw "Nije pronađen 'qpdf' niti 'pdfunite'. Instaliraj qpdf (preporuka) ili pdfunite pa pokušaj ponovo."
}

Write-Host "`nGotovo! Output: $OutputFile"
