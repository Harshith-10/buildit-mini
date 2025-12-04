# ============================================
# BuildIt Mini - Project Setup Script
# ============================================
# This script sets up the entire project:
# - Installs dependencies (pnpm install)
# - Starts PostgreSQL service
# - Creates the database
# - Pushes the schema
#
# Run with: .\scripts\setup-db.ps1
# ============================================

param(
    [switch]$SkipServiceStart,
    [switch]$SkipInstall,
    [switch]$Force,
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Prompt-User {
    param(
        [string]$Message,
        [string]$Default = "Y"
    )
    if ($Yes) { return $true }
    
    $choice = Read-Host "$Message (Y/n)"
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = $Default }
    return $choice -match "^[Yy]"
}

Clear-Host
Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "   BuildIt Mini - Project Setup Script" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# Change to project root
$projectRoot = Join-Path $PSScriptRoot ".."
Set-Location $projectRoot
Write-Info "Project root: $projectRoot"
Write-Host ""

# ============================================
# Step 0: Check Prerequisites
# ============================================
Write-Host "Step 0: Checking Prerequisites" -ForegroundColor White
Write-Host "-------------------------------" -ForegroundColor Gray

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Err "Node.js is not installed!"
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = & node --version
Write-Success "Node.js $nodeVersion"

# Check pnpm
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpm) {
    Write-Warn "pnpm is not installed"
    if (Prompt-User "Would you like to install pnpm?") {
        Write-Info "Installing pnpm..."
        npm install -g pnpm
        Write-Success "pnpm installed"
    } else {
        Write-Err "pnpm is required. Please install it: npm install -g pnpm"
        exit 1
    }
}
$pnpmVersion = & pnpm --version
Write-Success "pnpm v$pnpmVersion"

Write-Host ""

# ============================================
# Step 1: Install Dependencies
# ============================================
Write-Host "Step 1: Installing Dependencies" -ForegroundColor White
Write-Host "--------------------------------" -ForegroundColor Gray

if (-not $SkipInstall) {
    $nodeModulesExists = Test-Path (Join-Path $projectRoot "node_modules")
    
    if ($nodeModulesExists -and -not $Force) {
        Write-Info "node_modules already exists"
        if (Prompt-User "Would you like to reinstall dependencies?") {
            Write-Info "Installing dependencies..."
            pnpm install
            Write-Success "Dependencies installed"
        } else {
            Write-Info "Skipping dependency installation"
        }
    } else {
        Write-Info "Installing dependencies..."
        pnpm install
        Write-Success "Dependencies installed"
    }
} else {
    Write-Info "Skipping dependency installation (--SkipInstall)"
}

Write-Host ""

# ============================================
# Step 2: Check Environment File
# ============================================
Write-Host "Step 2: Checking Environment Configuration" -ForegroundColor White
Write-Host "-------------------------------------------" -ForegroundColor Gray

$envFile = Join-Path $projectRoot ".env.local"
$envExampleFile = Join-Path $projectRoot ".env.example"

if (-not (Test-Path $envFile)) {
    Write-Warn ".env.local not found"
    
    if (Test-Path $envExampleFile) {
        if (Prompt-User "Would you like to create .env.local from .env.example?") {
            Copy-Item $envExampleFile $envFile
            Write-Success "Created .env.local from .env.example"
            Write-Warn "Please edit .env.local with your actual values!"
            
            if (Prompt-User "Would you like to open .env.local in VS Code?") {
                code $envFile
            }
            
            Write-Host ""
            Read-Host "Press Enter after you have configured .env.local"
        }
    } else {
        Write-Err ".env.local is required!"
        Write-Host ""
        Write-Host "Please create .env.local with the following variables:" -ForegroundColor Yellow
        Write-Host "  DATABASE_URL=postgres://user:password@localhost:5432/buildit_mini_db" -ForegroundColor Gray
        Write-Host "  BETTER_AUTH_SECRET=your-secret-key" -ForegroundColor Gray
        Write-Host "  BETTER_AUTH_URL=http://localhost:3000" -ForegroundColor Gray
        exit 1
    }
}

# Load environment variables
Write-Info "Loading environment variables..."
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        Set-Item -Path "env:$name" -Value $value
    }
}

# Validate required variables
$requiredVars = @("DATABASE_URL", "BETTER_AUTH_SECRET")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Get-Item -Path "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Err "Missing required environment variables:"
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    exit 1
}

Write-Success "Environment configured"
Write-Host ""

# Parse DATABASE_URL
$databaseUrl = $env:DATABASE_URL
if ($databaseUrl -match "postgres://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} else {
    Write-Err "Invalid DATABASE_URL format"
    Write-Host "Expected: postgres://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

Write-Info "Database: $dbName @ ${dbHost}:${dbPort}"
Write-Host ""

# ============================================
# Step 3: Check and Start PostgreSQL Service
# ============================================
Write-Host "Step 3: Checking PostgreSQL Service" -ForegroundColor White
Write-Host "------------------------------------" -ForegroundColor Gray

if (-not $SkipServiceStart) {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if (-not $pgService) {
        Write-Err "PostgreSQL service not found!"
        Write-Host ""
        Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
        Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
        Write-Host ""
        
        if (Prompt-User "Would you like to open the download page?") {
            Start-Process "https://www.postgresql.org/download/windows/"
        }
        exit 1
    }
    
    Write-Info "Found service: $($pgService.Name)"
    
    if ($pgService.Status -ne "Running") {
        Write-Warn "PostgreSQL is not running"
        
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        
        if (-not $isAdmin) {
            Write-Err "Administrator privileges required to start PostgreSQL"
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  1. Run this script as Administrator" -ForegroundColor White
            Write-Host "  2. Start PostgreSQL manually:" -ForegroundColor White
            Write-Host "     - Press Win + R, then type: services.msc" -ForegroundColor Gray
            Write-Host "     - Find: $($pgService.Name)" -ForegroundColor Gray
            Write-Host "     - Right-click and select Start" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Then run: .\scripts\setup-db.ps1 -SkipServiceStart" -ForegroundColor Cyan
            exit 1
        }
        
        if (Prompt-User "Would you like to start PostgreSQL service?") {
            try {
                Start-Service -Name $pgService.Name
                Start-Sleep -Seconds 2
                Write-Success "PostgreSQL service started"
            } catch {
                Write-Err "Failed to start PostgreSQL: $_"
                exit 1
            }
        } else {
            Write-Err "PostgreSQL must be running to continue"
            exit 1
        }
    } else {
        Write-Success "PostgreSQL is running"
    }
} else {
    Write-Info "Skipping service check (--SkipServiceStart)"
}

Write-Host ""

# ============================================
# Step 4: Create Database
# ============================================
Write-Host "Step 4: Creating Database" -ForegroundColor White
Write-Host "-------------------------" -ForegroundColor Gray

$env:PGPASSWORD = $dbPassword

# Find psql
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    $pgPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe"
    )
    
    foreach ($path in $pgPaths) {
        if (Test-Path $path) {
            $psql = $path
            break
        }
    }
    
    if (-not $psql) {
        Write-Err "psql command not found!"
        Write-Host "Please add PostgreSQL bin folder to your PATH" -ForegroundColor Yellow
        Write-Host "Usually: C:\Program Files\PostgreSQL\17\bin" -ForegroundColor Gray
        exit 1
    }
}

Write-Info "Using psql: $psql"

try {
    $result = & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to connect to PostgreSQL: $result"
    }
    
    if ($result -eq "1") {
        Write-Info "Database '$dbName' already exists"
        
        if ($Force) {
            Write-Warn "Force flag set - Dropping and recreating database..."
            & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE `"$dbName`"" 2>&1 | Out-Null
            & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE `"$dbName`"" 2>&1 | Out-Null
            Write-Success "Database '$dbName' recreated"
        } else {
            if (Prompt-User "Would you like to keep the existing database? (No will drop it)") {
                Write-Info "Keeping existing database"
            } else {
                Write-Warn "Dropping and recreating database..."
                & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "DROP DATABASE `"$dbName`"" 2>&1 | Out-Null
                & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE `"$dbName`"" 2>&1 | Out-Null
                Write-Success "Database '$dbName' recreated"
            }
        }
    } else {
        Write-Info "Creating database '$dbName'..."
        & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE `"$dbName`"" 2>&1 | Out-Null
        Write-Success "Database '$dbName' created"
    }
} catch {
    Write-Err "Database operation failed: $_"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Check DATABASE_URL in .env.local" -ForegroundColor Gray
    Write-Host "  - Verify PostgreSQL is running" -ForegroundColor Gray
    Write-Host "  - Check username/password is correct" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# ============================================
# Step 5: Push Schema
# ============================================
Write-Host "Step 5: Pushing Database Schema" -ForegroundColor White
Write-Host "--------------------------------" -ForegroundColor Gray

if (Prompt-User "Would you like to push the database schema now?") {
    Write-Info "Pushing schema to database..."
    try {
        pnpm drizzle-kit push --force 2>&1 | ForEach-Object { 
            if ($_ -match "error|Error|ERROR") {
                Write-Host $_ -ForegroundColor Red
            } elseif ($_ -match "warning|Warning|WARN") {
                Write-Host $_ -ForegroundColor Yellow
            } else {
                Write-Host $_ -ForegroundColor Gray
            }
        }
        Write-Success "Schema pushed successfully"
    } catch {
        Write-Warn "Schema push had issues. You may need to run: pnpm drizzle-kit push"
    }
} else {
    Write-Info "Skipping schema push"
    Write-Host "Run later with: pnpm drizzle-kit push" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Done!
# ============================================
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your project is ready! Start the development server:" -ForegroundColor White
Write-Host ""
Write-Host "  pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Other useful commands:" -ForegroundColor White
Write-Host "  pnpm drizzle-kit studio   - Open database UI" -ForegroundColor Gray
Write-Host "  pnpm drizzle-kit push     - Push schema changes" -ForegroundColor Gray
Write-Host "  pnpm drizzle-kit generate - Generate migrations" -ForegroundColor Gray
Write-Host ""

if (Prompt-User "Would you like to start the development server now?") {
    Write-Host ""
    Write-Info "Starting development server..."
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    pnpm dev
}