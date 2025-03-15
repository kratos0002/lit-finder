#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Book Service Test Runner${NC}"
echo "==============================================="

function run_unit_tests() {
    echo -e "${GREEN}Running unit tests with mocked APIs...${NC}"
    export USE_REAL_APIS=false
    python -m pytest tests/test_recommendations.py -v
}

function run_integration_tests() {
    echo -e "${YELLOW}Running integration tests with real APIs...${NC}"
    echo -e "${RED}Warning: This will use real API calls which may incur costs!${NC}"
    export USE_REAL_APIS=true
    python -m pytest tests/test_integration.py -v
}

function run_all_tests() {
    echo -e "${GREEN}Running all tests...${NC}"
    echo -e "${RED}Warning: Integration tests will use real API calls which may incur costs!${NC}"
    export USE_REAL_APIS=true
    python -m pytest -v
}

case "$1" in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    all)
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {unit|integration|all}"
        echo "  unit        Run only unit tests with mocked APIs"
        echo "  integration Run only integration tests with real APIs"
        echo "  all         Run all tests (both unit and integration)"
        exit 1
esac

exit 0 