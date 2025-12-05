#!/bin/bash

# ============================================
# BuildIt Mini - Project Setup Script
# ============================================
# This script sets up the entire project:
# - Installs dependencies (pnpm install)
# - Starts PostgreSQL service
# - Creates the database
# - Pushes the schema
#
# Run with: ./scripts/setup-db.sh
# ============================================

set -e

# Parse command line arguments
SKIP_SERVICE_START=false
SKIP_INSTALL=false
FORCE=false
YES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-service-start)
            SKIP_SERVICE_START=true
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --yes|-y)
            YES=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-service-start] [--skip-install] [--force] [--yes|-y]"
            exit 1
            ;;
    esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

function write_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

function write_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

function write_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function write_err() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function prompt_user() {
    local message=$1
    local default=${2:-Y}
    
    if [ "$YES" = true ]; then
        return 0
    fi
    
    read -p "$message (Y/n): " choice
    choice=${choice:-$default}
    
    if [[ "$choice" =~ ^[Yy] ]]; then
        return 0
    else
        return 1
    fi
}

clear
echo ""
echo -e "${MAGENTA}============================================${NC}"
echo -e "${MAGENTA}   BuildIt Mini - Project Setup Script${NC}"
echo -e "${MAGENTA}============================================${NC}"
echo ""

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
write_info "Project root: $PROJECT_ROOT"
echo ""

# ============================================
# Step 0: Check Prerequisites
# ============================================
echo -e "${WHITE}Step 0: Checking Prerequisites${NC}"
echo -e "${GRAY}-------------------------------${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    write_err "Node.js is not installed!"
    echo -e "${YELLOW}Please install Node.js from: https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
write_success "Node.js $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    write_warn "pnpm is not installed"
    if prompt_user "Would you like to install pnpm?"; then
        write_info "Installing pnpm..."
        npm install -g pnpm
        write_success "pnpm installed"
    else
        write_err "pnpm is required. Please install it: npm install -g pnpm"
        exit 1
    fi
fi
PNPM_VERSION=$(pnpm --version)
write_success "pnpm v$PNPM_VERSION"

echo ""

# ============================================
# Step 1: Install Dependencies
# ============================================
echo -e "${WHITE}Step 1: Installing Dependencies${NC}"
echo -e "${GRAY}--------------------------------${NC}"

if [ "$SKIP_INSTALL" = false ]; then
    if [ -d "$PROJECT_ROOT/node_modules" ] && [ "$FORCE" = false ]; then
        write_info "node_modules already exists"
        if prompt_user "Would you like to reinstall dependencies?"; then
            write_info "Installing dependencies..."
            pnpm install
            write_success "Dependencies installed"
        else
            write_info "Skipping dependency installation"
        fi
    else
        write_info "Installing dependencies..."
        pnpm install
        write_success "Dependencies installed"
    fi
else
    write_info "Skipping dependency installation (--skip-install)"
fi

echo ""

# ============================================
# Step 2: Check Environment File
# ============================================
echo -e "${WHITE}Step 2: Checking Environment Configuration${NC}"
echo -e "${GRAY}-------------------------------------------${NC}"

ENV_FILE="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE_FILE="$PROJECT_ROOT/.env.example"

if [ ! -f "$ENV_FILE" ]; then
    write_warn ".env.local not found"
    
    if [ -f "$ENV_EXAMPLE_FILE" ]; then
        if prompt_user "Would you like to create .env.local from .env.example?"; then
            cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
            write_success "Created .env.local from .env.example"
            write_warn "Please edit .env.local with your actual values!"
            
            if command -v code &> /dev/null; then
                if prompt_user "Would you like to open .env.local in VS Code?"; then
                    code "$ENV_FILE"
                fi
            fi
            
            echo ""
            read -p "Press Enter after you have configured .env.local"
        fi
    else
        write_err ".env.local is required!"
        echo ""
        echo -e "${YELLOW}Please create .env.local with the following variables:${NC}"
        echo -e "${GRAY}  DATABASE_URL=postgres://user:password@localhost:5432/buildit_mini_db${NC}"
        echo -e "${GRAY}  BETTER_AUTH_SECRET=your-secret-key${NC}"
        echo -e "${GRAY}  BETTER_AUTH_URL=http://localhost:3000${NC}"
        exit 1
    fi
fi

# Load environment variables
write_info "Loading environment variables..."
set -a
source "$ENV_FILE"
set +a

# Validate required variables
REQUIRED_VARS=("DATABASE_URL" "BETTER_AUTH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    write_err "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    exit 1
fi

write_success "Environment configured"
echo ""

# Parse DATABASE_URL
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    write_err "Invalid DATABASE_URL format"
    echo -e "${YELLOW}Expected: postgres://user:password@host:port/database${NC}"
    exit 1
fi

write_info "Database: $DB_NAME @ ${DB_HOST}:${DB_PORT}"
echo ""

# ============================================
# Step 3: Check and Start PostgreSQL Service
# ============================================
echo -e "${WHITE}Step 3: Checking PostgreSQL Service${NC}"
echo -e "${GRAY}------------------------------------${NC}"

if [ "$SKIP_SERVICE_START" = false ]; then
    # Check if PostgreSQL is running
    if command -v systemctl &> /dev/null; then
        # systemd-based system
        PG_SERVICE=$(systemctl list-units --type=service --all | grep -i postgresql | head -n 1 | awk '{print $1}')
        
        if [ -z "$PG_SERVICE" ]; then
            write_err "PostgreSQL service not found!"
            echo ""
            echo -e "${YELLOW}Please install PostgreSQL:${NC}"
            echo -e "${CYAN}  Ubuntu/Debian: sudo apt install postgresql${NC}"
            echo -e "${CYAN}  Fedora/RHEL: sudo dnf install postgresql-server${NC}"
            echo -e "${CYAN}  Arch: sudo pacman -S postgresql${NC}"
            exit 1
        fi
        
        write_info "Found service: $PG_SERVICE"
        
        if ! systemctl is-active --quiet "$PG_SERVICE"; then
            write_warn "PostgreSQL is not running"
            
            if prompt_user "Would you like to start PostgreSQL service?"; then
                write_info "Starting PostgreSQL service (may require sudo)..."
                sudo systemctl start "$PG_SERVICE"
                sleep 2
                write_success "PostgreSQL service started"
            else
                write_err "PostgreSQL must be running to continue"
                exit 1
            fi
        else
            write_success "PostgreSQL is running"
        fi
    elif command -v service &> /dev/null; then
        # SysV init system
        if service postgresql status &> /dev/null; then
            write_success "PostgreSQL is running"
        else
            write_warn "PostgreSQL is not running"
            if prompt_user "Would you like to start PostgreSQL service?"; then
                write_info "Starting PostgreSQL service (may require sudo)..."
                sudo service postgresql start
                sleep 2
                write_success "PostgreSQL service started"
            else
                write_err "PostgreSQL must be running to continue"
                exit 1
            fi
        fi
    else
        # Check if PostgreSQL is running via pg_isready
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h "$DB_HOST" -p "$DB_PORT" &> /dev/null; then
                write_success "PostgreSQL is running"
            else
                write_warn "Cannot connect to PostgreSQL at ${DB_HOST}:${DB_PORT}"
                write_info "Please start PostgreSQL manually"
                exit 1
            fi
        else
            write_warn "Cannot determine PostgreSQL service status"
            write_info "Assuming PostgreSQL is running..."
        fi
    fi
else
    write_info "Skipping service check (--skip-service-start)"
fi

echo ""

# ============================================
# Step 4: Create Database
# ============================================
echo -e "${WHITE}Step 4: Creating Database${NC}"
echo -e "${GRAY}-------------------------${NC}"

export PGPASSWORD="$DB_PASSWORD"

# Find psql
if ! command -v psql &> /dev/null; then
    write_err "psql command not found!"
    echo -e "${YELLOW}Please install PostgreSQL client:${NC}"
    echo -e "${GRAY}  Ubuntu/Debian: sudo apt install postgresql-client${NC}"
    echo -e "${GRAY}  Fedora/RHEL: sudo dnf install postgresql${NC}"
    echo -e "${GRAY}  Arch: sudo pacman -S postgresql${NC}"
    exit 1
fi

write_info "Using psql: $(which psql)"

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>&1)

if [ $? -ne 0 ]; then
    write_err "Failed to connect to PostgreSQL: $DB_EXISTS"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "${GRAY}  - Check DATABASE_URL in .env.local${NC}"
    echo -e "${GRAY}  - Verify PostgreSQL is running${NC}"
    echo -e "${GRAY}  - Check username/password is correct${NC}"
    exit 1
fi

if [ "$DB_EXISTS" = "1" ]; then
    write_info "Database '$DB_NAME' already exists"
    
    if [ "$FORCE" = true ]; then
        write_warn "Force flag set - Dropping and recreating database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE \"$DB_NAME\"" &> /dev/null
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" &> /dev/null
        write_success "Database '$DB_NAME' recreated"
    else
        if prompt_user "Would you like to keep the existing database? (No will drop it)"; then
            write_info "Keeping existing database"
        else
            write_warn "Dropping and recreating database..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE \"$DB_NAME\"" &> /dev/null
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" &> /dev/null
            write_success "Database '$DB_NAME' recreated"
        fi
    fi
else
    write_info "Creating database '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\"" &> /dev/null
    write_success "Database '$DB_NAME' created"
fi

echo ""

# ============================================
# Step 5: Push Schema
# ============================================
echo -e "${WHITE}Step 5: Pushing Database Schema${NC}"
echo -e "${GRAY}--------------------------------${NC}"

if prompt_user "Would you like to push the database schema now?"; then
    write_info "Pushing schema to database..."
    if pnpm drizzle-kit push --force 2>&1 | while IFS= read -r line; do
        if [[ "$line" =~ [Ee]rror|ERROR ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ "$line" =~ [Ww]arning|WARN ]]; then
            echo -e "${YELLOW}$line${NC}"
        else
            echo -e "${GRAY}$line${NC}"
        fi
    done; then
        write_success "Schema pushed successfully"
    else
        write_warn "Schema push had issues. You may need to run: pnpm drizzle-kit push"
    fi
else
    write_info "Skipping schema push"
    echo -e "${GRAY}Run later with: pnpm drizzle-kit push${NC}"
fi

echo ""

# ============================================
# Done!
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${WHITE}Your project is ready! Start the development server:${NC}"
echo ""
echo -e "${CYAN}  pnpm dev${NC}"
echo ""
echo -e "${WHITE}Other useful commands:${NC}"
echo -e "${GRAY}  pnpm drizzle-kit studio   - Open database UI${NC}"
echo -e "${GRAY}  pnpm drizzle-kit push     - Push schema changes${NC}"
echo -e "${GRAY}  pnpm drizzle-kit generate - Generate migrations${NC}"
echo ""

if prompt_user "Would you like to start the development server now?"; then
    echo ""
    write_info "Starting development server..."
    echo -e "${GRAY}Press Ctrl+C to stop${NC}"
    echo ""
    pnpm dev
fi
