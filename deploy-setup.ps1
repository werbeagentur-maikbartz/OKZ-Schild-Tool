<#
  One-time setup script: creates the GitHub repo in the organization,
  enables GitHub Pages (source: GitHub Actions), and pushes this project.

  Requirements:
    - GitHub CLI (gh) installed: https://cli.github.com
    - Already authenticated: gh auth login
    - Write access to the "werbeagentur-maikbartz" organization

  Run this from PowerShell, inside this project folder:
    .\deploy-setup.ps1
#>

$ErrorActionPreference = "Stop"

$Org      = "werbeagentur-maikbartz"
$RepoName = "OKZ-Schild-Tool"
$FullRepo = "$Org/$RepoName"

function Fail($msg) {
  Write-Host $msg -ForegroundColor Red
  exit 1
}

Write-Host "== Checking gh CLI ==" -ForegroundColor Cyan
gh --version
if ($LASTEXITCODE -ne 0) { Fail "gh CLI not found. Install it from https://cli.github.com" }

Write-Host "== Checking gh auth status ==" -ForegroundColor Cyan
gh auth status
if ($LASTEXITCODE -ne 0) { Fail "gh is not authenticated. Run: gh auth login" }

Write-Host "== Creating repository $FullRepo (public) ==" -ForegroundColor Cyan
gh repo create $FullRepo --public --description "OKZ-Schilder Generator - 16x16cm Vorlagen-Tool"
if ($LASTEXITCODE -ne 0) { Fail "Repo creation failed (it may already exist, or you lack rights in the org)." }

Write-Host "== Enabling GitHub Pages (source: GitHub Actions) ==" -ForegroundColor Cyan
gh api -X POST "repos/$FullRepo/pages" -f build_type=workflow 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "POST failed, retrying with PUT (site may already exist) ..." -ForegroundColor Yellow
  gh api -X PUT "repos/$FullRepo/pages" -f build_type=workflow 2>$null
}
if ($LASTEXITCODE -ne 0) {
  Write-Host "Could not enable Pages automatically. Enable it manually: Settings -> Pages -> Source: GitHub Actions." -ForegroundColor Yellow
}

Write-Host "== Preparing local git repo ==" -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
  git init | Out-Null
  git branch -M main
}

$hasName  = git config --global user.name
$hasEmail = git config --global user.email
if (-not $hasName -or -not $hasEmail) {
  Write-Host "No global git identity found, setting a local one for this repo." -ForegroundColor Yellow
  git config user.name "Baloralys"
  git config user.email "thomas.mantow@gmail.com"
}

git add -A
git commit -m "Initial commit: OKZ-Schilder Generator" -q
if ($LASTEXITCODE -ne 0) { Write-Host "Nothing new to commit, continuing." -ForegroundColor Yellow }

$remoteUrl = "https://github.com/$FullRepo.git"
$existingRemotes = git remote
if ($existingRemotes -notcontains "origin") {
  git remote add origin $remoteUrl
} else {
  git remote set-url origin $remoteUrl
}

Write-Host "== Pushing to GitHub (branch main) ==" -ForegroundColor Cyan
git push -u origin main
if ($LASTEXITCODE -ne 0) { Fail "Push failed." }

Write-Host ""
$setSecret = Read-Host "Set the SITE_PASSWORD login secret now? (y/N)"
if ($setSecret -eq "y" -or $setSecret -eq "Y") {
  gh secret set SITE_PASSWORD --repo $FullRepo
  Write-Host "Secret set. Triggering a redeploy so it takes effect..." -ForegroundColor Cyan
  gh workflow run deploy.yml --repo $FullRepo
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Check deploy status with: gh run watch --repo $FullRepo" -ForegroundColor Green
Write-Host "Pages URL (once deployed): https://$Org.github.io/$RepoName/" -ForegroundColor Green
