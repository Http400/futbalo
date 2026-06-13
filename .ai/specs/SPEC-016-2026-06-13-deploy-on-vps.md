# SPEC-016: Deploy on VPS

## Overview

Add a production deployment workflow at `.github/workflows/deploy-on-vps.yaml` named `Deploy on VPS`.

The workflow deploys the full Futbalo stack onto a VPS using Docker Compose and the immutable images published by `.github/workflows/build-and-push.yml`. It does not build images on the VPS. Instead, it pulls already-published GHCR images for the exact commit SHA being deployed.

The deployment uses a new standalone production manifest at `docker-compose.prod.yml`. That manifest defines the production stack that runs on the VPS and references the published image tags directly.

## User Stories

### Story 1: Maintainer deploys a specific commit

**Persona**: Maintainer - wants to deploy a known-good commit after CI and image publishing have completed.

**Flow**:

```text
workflow_dispatch
    |
    v
Deploy on VPS
    |
    +-- validate commit SHA
    +-- copy prod compose + nginx config to VPS
    +-- update APP_SHA in /var/futbalo/.env
    +-- pull GHCR images
    +-- start stack with docker compose
    +-- smoke test public URL
```

**Change vs. current state**: Today production deployment is described only as local `docker compose up --build -d` in the README, which implies image builds happen at deployment time. After this change, deployment uses prebuilt GHCR images tagged by full commit SHA and runs the stack via the VPS workflow.

**Behind the scenes**: The workflow accepts a full 40-character SHA or defaults to the selected branch SHA. It stores the active SHA in `/var/futbalo/.env` as `APP_SHA`, pulls the matching images, then rolls out the compose stack with `--no-build --wait`.

### Story 2: Release engineer promotes the same images across environments

**Persona**: Release engineer - needs one image set to move between environments without rebuilding.

**Flow**:

```text
build-and-push.yml
    |
    v
GHCR images tagged with full SHA
    |
    v
deploy-on-vps.yaml for production or staging
```

**Change vs. current state**: There is already a build-and-push workflow, but no dedicated deployment workflow that consumes its output. After this change, the same immutable image tags can be deployed to any configured environment.

**Behind the scenes**: The workflow does not publish or depend on mutable tags such as `latest`. It relies on the full commit SHA as the only deployment identity, which keeps the deployed runtime aligned with source history.

### Story 3: Deployment failure rolls back cleanly

**Persona**: Operator - wants the VPS to recover automatically if the new deployment starts but the public smoke test fails.

**Flow**:

```text
update APP_SHA
    |
    v
pull images + start stack
    |
    v
smoke test fails
    |
    v
restore previous APP_SHA
    |
    v
redeploy old stack
```

**Change vs. current state**: Manual compose deployments require an operator to notice failures and revert them manually. After this change, the workflow records the previous SHA before rollout and uses it to restore the prior deployment if the smoke test fails.

**Behind the scenes**: The workflow reads the existing `APP_SHA` from `/var/futbalo/.env`, updates it to the requested SHA, performs the rollout, and if the smoke test fails it rewrites `APP_SHA` back to the previous value, pulls the prior images, and restarts the stack.

## Architecture

The deployment flow has three layers:

1. GitHub Actions orchestration
2. VPS runtime state stored in `/var/futbalo`
3. Docker Compose production stack

### GitHub Actions workflow

`deploy-on-vps.yaml` is a manual deployment workflow triggered with `workflow_dispatch`.

It accepts:

- `image_tag`: optional full 40-character SHA, defaulting to the selected branch SHA when omitted
- `environment`: target deployment environment, default `production`
- `project_path`: VPS working directory, default `/var/futbalo`
- `compose_wait_timeout`: compose wait timeout, default `90`

The workflow validates the SHA length, prepares SSH access, copies deployment manifests to the VPS, updates the active SHA in the VPS `.env`, pulls the images, starts the stack, and smoke tests the deployed URL.

### VPS deployment state

The VPS keeps a persistent `.env` file at `/var/futbalo/.env`. That file stores runtime values that must survive deployments, including:

- `APP_SHA`
- PostgreSQL credentials
- JWT secrets
- pgAdmin credentials
- Cloudflared token

The workflow mutates only `APP_SHA` during deploy and rollback. It must not overwrite the other environment values.

### Production compose stack

`docker-compose.prod.yml` is a standalone production manifest. It defines the full stack needed for VPS deployment:

- `postgres`
- `pgadmin`
- `auth-service`
- `catalog-service`
- `web-app`
- `admin-app`
- `nginx`
- `cloudflared`

The deployable app services reference GHCR images with `image:` rather than `build:`. The image tag comes from `APP_SHA` so that one commit SHA selects a consistent set of images across the full stack.

The production manifest must not rebuild app images locally on the VPS.
The manifest uses `GHCR_REPOSITORY` and `APP_SHA` interpolation for image names, and the workflow injects `GHCR_REPOSITORY=${{ github.repository }}` at deploy time instead of storing it in the VPS `.env` file.

## Data Models

Not applicable. This change does not add database tables or application domain entities.

The only persistent deployment state is the VPS `.env` file, which acts as a runtime configuration store for the compose stack.

## API Contracts

Not applicable. This change does not add or modify HTTP APIs.

## UI/UX

Not applicable. This change has no user-facing application UI.

## Configuration

### GitHub Actions inputs

The workflow must support:

- `image_tag`
  - optional
  - when provided, must be a full 40-character commit SHA
  - when empty, defaults to the selected branch SHA
- `environment`
  - default `production`
  - used to bind the workflow to the corresponding GitHub Environment
- `project_path`
  - default `/var/futbalo`
- `compose_wait_timeout`
  - default `90`

### GitHub Secrets

Required secrets:

- `VPS_SSH_KEY`
- `VPS_HOST`

Optional secrets:

- `VPS_USER`
- `GHCR_USERNAME`
- `GHCR_TOKEN`

### GitHub Variables

Required environment variable:

- `SMOKE_URL`

### VPS files

The workflow copies these production deployment files to the VPS:

- `docker-compose.prod.yml`
- `nginx/nginx.conf`
- `nginx/config-location.conf`

The VPS must already have a writable project directory at `/var/futbalo` or allow the workflow to create it.

## Implementation Details

### Trigger and validation

The workflow should be manually triggered with `workflow_dispatch`.

It should validate that any explicit `image_tag` is exactly 40 characters long before making changes on the VPS.

### GHCR image contract

The workflow should deploy the immutable images published by `build-and-push.yml`:

- `ghcr.io/<owner>/<repo>/auth-service:<full-sha>`
- `ghcr.io/<owner>/<repo>/catalog-service:<full-sha>`
- `ghcr.io/<owner>/<repo>/web-app:<full-sha>`
- `ghcr.io/<owner>/<repo>/admin-app:<full-sha>`

The workflow should validate that the requested images exist before changing the active deployment on the VPS.
The compose invocation on the VPS should pass `GHCR_REPOSITORY` inline so the manifest can resolve GHCR image names without modifying the persisted `.env` contents.

### Rollout and rollback

Deployment should:

1. Read the previous `APP_SHA` from `/var/futbalo/.env`
2. Write the new `APP_SHA`
3. Pull the images for the new SHA
4. Start the stack with `docker compose up -d --no-build --wait`
5. Smoke test `SMOKE_URL`

If the smoke test fails, the workflow should:

1. Restore the previous `APP_SHA`
2. Pull the previous images
3. Start the stack again
4. Re-run the smoke test
5. Fail the workflow if the rollback smoke test still fails

### Networking

Production traffic should continue to use Cloudflared rather than exposing nginx directly on host port 80.

This keeps the VPS compose stack aligned with the existing nginx and tunnel-based production setup in the repository.

## References

- [`build-and-push.yml`](/Users/pawel/Code/Mine/futbalo/.github/workflows/build-and-push.yml)
- [`deploy-on-vps.yaml`](https://github.com/ewoludev/minitask/blob/solution-deploy/.github/workflows/deploy-on-vps.yaml)
- [`release.yaml`](https://github.com/ewoludev/minitask/blob/solution-deploy/.github/workflows/release.yaml)
- [`compose.prod.yaml`](https://github.com/ewoludev/minitask/blob/solution-deploy/compose.prod.yaml)
- [`docker-compose.yml`](/Users/pawel/Code/Mine/futbalo/docker-compose.yml)
- [`nginx/nginx.conf`](/Users/pawel/Code/Mine/futbalo/nginx/nginx.conf)
- [`nginx/config-location.conf`](/Users/pawel/Code/Mine/futbalo/nginx/config-location.conf)
- [`SPEC-015-2026-06-13-build-and-push-images.md`](/Users/pawel/Code/Mine/futbalo/.ai/specs/SPEC-015-2026-06-13-build-and-push-images.md)

## Changelog

### 2026-06-13

- Added the initial specification for the VPS deployment workflow and standalone production compose manifest.
- Clarified that the production compose manifest resolves GHCR image names from an inline `GHCR_REPOSITORY` variable supplied by the workflow.
