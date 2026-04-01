#!/bin/bash

# CTS v3 Database Initialization Script
# Initializes and migrates database for SQLite, PostgreSQL, or Remote PostgreSQL

# set -e

# Configuration
DATABASE_TYPE="${DATABASE_TYPE:-sqlite}"
DATABASE_URL="${DATABASE_URL:-file:./data/cts.db}"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}ℹ${NC} $1"; }

echo "=========================================="
echo "CTS v3 Database Initialization"
echo "=========================================="
echo "Database Type: $DATABASE_TYPE"
echo "Database URL: ${DATABASE_URL:0:50}..."
echo ""

# Function to run SQL file
run_sql_file() {
    local file=$1
    local filename=$(basename "$file")
    
    case "$DATABASE_TYPE" in
        sqlite)
            if [ -f "$file" ]; then
                mkdir -p "$(dirname "${DATABASE_PATH:-./data/cts.db}")"
                touch "${DATABASE_PATH:-./data/cts.db}"
                
                sqlite3 "${DATABASE_PATH:-./data/cts.db}" < "$file" 2>&1 | grep -v "duplicate column name" | grep -v "already exists" || true
                if [ ${PIPESTATUS[0]} -eq 0 ]; then
                    print_success "Applied $filename"
                else
                    print_error "Failed to apply $filename (continuing anyway)"
                fi
            fi
            ;;
        postgresql|remote-postgresql)
            if [ -f "$file" ]; then
                if command -v psql &> /dev/null; then
                    psql "$DATABASE_URL" -f "$file" 2>&1 | grep -v "already exists" | grep -v "duplicate" || true
                    if [ ${PIPESTATUS[0]} -eq 0 ]; then
                        print_success "Applied $filename"
                    else
                        print_error "Failed to apply $filename (continuing anyway)"
                    fi
                else
                    print_error "psql command not found. Install postgresql-client"
                fi
            fi
            ;;
    esac
}

# Create database directory for SQLite
if [ "$DATABASE_TYPE" = "sqlite" ]; then
    mkdir -p data/databases
    mkdir -p "$(dirname "${DATABASE_PATH:-./data/cts.db}")"
    touch "${DATABASE_PATH:-./data/cts.db}"
    print_success "Created database directory and file"
fi

if [ ! -d "$SCRIPTS_DIR" ] || [ -z "$(ls -A "$SCRIPTS_DIR"/*.sql 2>/dev/null)" ]; then
    print_error "No SQL migration files found in $SCRIPTS_DIR"
    print_info "Database will be created empty. Migrations will run on first app start."
    exit 0
fi

# Initialize database with all migration scripts
print_info "Running database migrations..."

for sql_file in "$SCRIPTS_DIR"/*.sql; do
    if [ -f "$sql_file" ]; then
        filename=$(basename "$sql_file")
        # Skip sqlite_init.sql as it's a complete initialization script
        if [ "$filename" != "sqlite_init.sql" ]; then
            run_sql_file "$sql_file"
        fi
    fi
done

# For SQLite, also run the complete initialization script
if [ "$DATABASE_TYPE" = "sqlite" ] && [ -f "$SCRIPTS_DIR/sqlite_init.sql" ]; then
    print_info "Running SQLite initialization..."
    sqlite3 "${DATABASE_PATH:-./data/cts.db}" < "$SCRIPTS_DIR/sqlite_init.sql" 2>&1 | grep -v "duplicate" | grep -v "already exists" || true
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "SQLite database initialized"
    else
        print_error "SQLite initialization had errors (continuing anyway)"
    fi
fi

print_success "Database initialization complete"
echo ""
