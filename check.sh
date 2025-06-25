#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are available
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        exit 1
    fi

    if ! command -v cargo &> /dev/null; then
        print_error "cargo is not installed"
        exit 1
    fi

    print_success "All dependencies found"
}

# Frontend checks
run_frontend_checks() {
    print_status "Running frontend checks..."

    # TypeScript type checking
    print_status "Running TypeScript type checking..."
    if pnpm exec tsc --noEmit; then
        print_success "TypeScript type checking passed"
    else
        print_error "TypeScript type checking failed"
        return 1
    fi

    # Check if ESLint is configured
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || grep -q "eslint" package.json; then
        print_status "Running ESLint..."
        if pnpm exec eslint . --ext .ts,.tsx,.js,.jsx; then
            print_success "ESLint passed"
        else
            print_error "ESLint failed"
            return 1
        fi
    else
        print_warning "ESLint not configured. Consider adding ESLint for better code quality."
        print_warning "To add ESLint, run: pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin"
    fi

    # Check if Prettier is configured
    if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || grep -q "prettier" package.json; then
        print_status "Running Prettier check..."
        if pnpm exec prettier --check .; then
            print_success "Prettier check passed"
        else
            print_error "Prettier check failed"
            return 1
        fi
    else
        print_warning "Prettier not configured. Consider adding Prettier for code formatting."
        print_warning "To add Prettier, run: pnpm add -D prettier"
    fi
}

# Backend checks
run_backend_checks() {
    print_status "Running backend checks..."

    cd src-tauri

    # Rust type checking and compilation
    print_status "Running Rust type checking..."
    if cargo check; then
        print_success "Rust type checking passed"
    else
        print_error "Rust type checking failed"
        cd ..
        return 1
    fi

    # Rust linting with clippy
    print_status "Running Clippy (Rust linter)..."
    if cargo clippy -- -D warnings; then
        print_success "Clippy passed"
    else
        print_error "Clippy failed"
        cd ..
        return 1
    fi

    # Rust formatting check
    print_status "Running Rust formatting check..."
    if cargo fmt -- --check; then
        print_success "Rust formatting check passed"
    else
        print_error "Rust formatting check failed"
        print_warning "Run 'cargo fmt' to fix formatting issues"
        cd ..
        return 1
    fi

    cd ..
}

# Main execution
main() {
    echo "🔍 Running project checks..."
    echo "================================"

    check_dependencies

    local frontend_result=0
    local backend_result=0

    echo ""
    echo "📝 Frontend Checks"
    echo "=================="
    run_frontend_checks || frontend_result=1

    echo ""
    echo "🦀 Backend Checks"
    echo "================="
    run_backend_checks || backend_result=1

    echo ""
    echo "📊 Summary"
    echo "=========="

    if [ $frontend_result -eq 0 ]; then
        print_success "Frontend checks passed"
    else
        print_error "Frontend checks failed"
    fi

    if [ $backend_result -eq 0 ]; then
        print_success "Backend checks passed"
    else
        print_error "Backend checks failed"
    fi

    if [ $frontend_result -eq 0 ] && [ $backend_result -eq 0 ]; then
        print_success "All checks passed! 🎉"
        exit 0
    else
        print_error "Some checks failed"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-}" in
    --frontend-only)
        check_dependencies
        run_frontend_checks
        ;;
    --backend-only)
        check_dependencies
        run_backend_checks
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --frontend-only    Run only frontend checks"
        echo "  --backend-only     Run only backend checks"
        echo "  --help, -h         Show this help message"
        echo ""
        echo "Default: Run all checks"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac