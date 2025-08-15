#!/bin/bash

# Production Deployment Script for roFl Platform
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="rofl-platform"
DOCKER_IMAGE="ghcr.io/your-org/rofl-platform"
HEALTH_CHECK_URL="/api/health"
MAX_WAIT_TIME=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if required environment files exist
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        error "Environment file .env.${ENVIRONMENT} not found"
    fi
    
    log "Prerequisites check passed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment config
    if [[ -f ".env.${ENVIRONMENT}" ]]; then
        cp ".env.${ENVIRONMENT}" "$BACKUP_DIR/"
    fi
    
    # Backup database if applicable
    # Add database backup commands here
    
    log "Backup created in $BACKUP_DIR"
}

# Pull latest Docker image
pull_image() {
    log "Pulling latest Docker image..."
    
    # Login to registry if credentials are available
    if [[ -n "$DOCKER_USERNAME" && -n "$DOCKER_PASSWORD" ]]; then
        echo "$DOCKER_PASSWORD" | docker login ghcr.io -u "$DOCKER_USERNAME" --password-stdin
    fi
    
    docker pull "$DOCKER_IMAGE:latest" || error "Failed to pull Docker image"
    
    log "Successfully pulled latest image"
}

# Deploy application
deploy() {
    log "Deploying application to $ENVIRONMENT..."
    
    # Copy environment file
    cp ".env.${ENVIRONMENT}" .env.local
    
    # Stop existing containers
    if docker-compose ps | grep -q "$APP_NAME"; then
        log "Stopping existing containers..."
        docker-compose down --timeout 30
    fi
    
    # Start new containers
    log "Starting new containers..."
    docker-compose up -d --force-recreate
    
    log "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local start_time=$(date +%s)
    local max_end_time=$((start_time + MAX_WAIT_TIME))
    
    while true; do
        local current_time=$(date +%s)
        
        if [[ $current_time -gt $max_end_time ]]; then
            error "Health check timeout after ${MAX_WAIT_TIME} seconds"
        fi
        
        # Check if container is running
        if ! docker-compose ps | grep -q "Up"; then
            warn "Container not running yet, waiting..."
            sleep 5
            continue
        fi
        
        # Check application health endpoint
        if curl -f -s "http://localhost:3000${HEALTH_CHECK_URL}" > /dev/null 2>&1; then
            log "Health check passed"
            break
        fi
        
        log "Waiting for application to be healthy..."
        sleep 5
    done
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."
    
    # Remove old containers
    docker container prune -f
    
    # Remove old images (keep last 3 versions)
    docker images "$DOCKER_IMAGE" --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}" | \
        tail -n +4 | \
        awk '{print $2}' | \
        xargs -r docker rmi
    
    log "Cleanup completed"
}

# Post-deployment tasks
post_deploy() {
    log "Running post-deployment tasks..."
    
    # Run database migrations if needed
    # docker-compose exec app npm run migrate
    
    # Warm up the application
    curl -s "http://localhost:3000" > /dev/null || warn "Failed to warm up application"
    
    # Send deployment notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 roFl Platform deployed to $ENVIRONMENT successfully\"}" \
            "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
    fi
    
    log "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Find the most recent backup
    LATEST_BACKUP=$(ls -t backups/ | head -n1)
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        error "No backup found for rollback"
    fi
    
    # Restore environment config
    cp "backups/$LATEST_BACKUP/.env.${ENVIRONMENT}" .env.local
    
    # Rollback to previous image
    warn "Rollback functionality requires manual intervention"
    warn "Please manually specify the previous image version"
    
    log "Rollback initiated"
}

# Main deployment flow
main() {
    log "Starting deployment of roFl Platform to $ENVIRONMENT"
    
    case "$1" in
        rollback)
            rollback
            ;;
        *)
            check_prerequisites
            backup_current
            pull_image
            deploy
            health_check
            cleanup
            post_deploy
            ;;
    esac
    
    log "Deployment process completed successfully"
}

# Handle script arguments
if [[ "$1" == "rollback" ]]; then
    main rollback
elif [[ "$1" == "help" ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [environment|rollback|help]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (default: production)"
    echo "  rollback       Rollback to previous deployment"
    echo "  help          Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DOCKER_USERNAME    Docker registry username"
    echo "  DOCKER_PASSWORD    Docker registry password"
    echo "  SLACK_WEBHOOK_URL  Slack webhook for notifications"
    exit 0
else
    main "$@"
fi