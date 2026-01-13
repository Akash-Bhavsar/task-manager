#!/bin/bash
#
# Database Initialization Script for Task Manager API
# This script creates the database and initializes the schema using Prisma
#
# Usage: ./scripts/init-db.sh [database_name]
#
# Prerequisites:
#   - PostgreSQL installed and running
#   - Node.js and npm installed
#   - .env file configured with DATABASE_URL
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Task Manager API - Database Initialization   ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Change to server directory
cd "$SERVER_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file from .env.templ:${NC}"
    echo -e "  cp .env.templ .env"
    echo -e "  # Then edit .env with your database credentials"
    exit 1
fi

# Load environment variables
source .env

# Extract database info from DATABASE_URL
# Format: postgres://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env file!${NC}"
    exit 1
fi

# Parse DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

# Allow override via command line argument
if [ -n "$1" ]; then
    DB_NAME="$1"
    echo -e "${YELLOW}Using database name from argument: $DB_NAME${NC}"
fi

echo -e "${BLUE}Database Configuration:${NC}"
echo -e "  Host:     ${DB_HOST}"
echo -e "  Port:     ${DB_PORT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  User:     ${DB_USER}"
echo ""

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${BLUE}Checking PostgreSQL connection...${NC}"
    if PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is running and accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
        echo -e "${YELLOW}Please ensure PostgreSQL is running and credentials are correct${NC}"
        return 1
    fi
}

# Function to check if database exists
check_database_exists() {
    PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1
}

# Function to create database
create_database() {
    echo -e "${BLUE}Creating database '$DB_NAME'...${NC}"
    if PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null; then
        echo -e "${GREEN}✓ Database '$DB_NAME' created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create database '$DB_NAME'${NC}"
        exit 1
    fi
}

# Function to install npm dependencies
install_dependencies() {
    echo -e "${BLUE}Checking npm dependencies...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing npm dependencies...${NC}"
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
}

# Function to generate Prisma client
generate_prisma_client() {
    echo -e "${BLUE}Generating Prisma client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✓ Prisma client generated${NC}"
}

# Function to run Prisma migrations
run_migrations() {
    echo -e "${BLUE}Running Prisma migrations...${NC}"
    npx prisma db push --accept-data-loss
    echo -e "${GREEN}✓ Database schema synchronized${NC}"
}

# Function to show database status
show_status() {
    echo ""
    echo -e "${BLUE}Database Schema Status:${NC}"
    npx prisma db pull --print 2>/dev/null || echo -e "${YELLOW}Could not fetch schema status${NC}"
}

# Main execution
echo -e "${BLUE}Starting database initialization...${NC}"
echo ""

# Step 1: Check PostgreSQL
if ! check_postgres; then
    exit 1
fi
echo ""

# Step 2: Check/Create Database
if check_database_exists; then
    echo -e "${GREEN}✓ Database '$DB_NAME' already exists${NC}"
else
    echo -e "${YELLOW}Database '$DB_NAME' does not exist${NC}"
    create_database
fi
echo ""

# Step 3: Install dependencies
install_dependencies
echo ""

# Step 4: Generate Prisma client
generate_prisma_client
echo ""

# Step 5: Run migrations
run_migrations
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Database initialization complete!            ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Start the development server: ${YELLOW}npm run dev${NC}"
echo -e "  2. Run tests: ${YELLOW}npm test${NC}"
echo ""
