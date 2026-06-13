# SPEC-015 - Build and Push Docker Images

## Overview

Add a GitHub Actions workflow at `.github/workflows/build-and-push.yml` named `Build and push`.

The workflow builds and pushes Docker images for every deployable project image in the monorepo to GitHub Container Registry (GHCR). It runs only when code is pushed to `master`, publishes images tagged with the full commit SHA, and does not publish a mutable `latest` tag.

This workflow complements `SPEC-013-2026-06-08-github-actions-ci.md`: CI remains the quality gate, while this workflow is responsible only for Docker image publishing.

## User Stories

### Story 1: Maintainer merges to master

**Persona**: Maintainer - reviews and merges changes to `master`, then needs immutable images available for deployment.

**Flow**:

```text
push to master
     |
     v
Build and push workflow
     |
     +-- auth-service image      ghcr.io/<owner>/<repo>/auth-service:<full-sha>
     +-- catalog-service image   ghcr.io/<owner>/<repo>/catalog-service:<full-sha>
     +-- web-app image           ghcr.io/<owner>/<repo>/web-app:<full-sha>
     +-- admin-app image         ghcr.io/<owner>/<repo>/admin-app:<full-sha>
```

**Change vs. current state**: The repository currently has CI and test workflows but no workflow that publishes deployable Docker images. After this change, every successful push to `master` produces one immutable GHCR image per deployable subproject.

**Technical context**: GitHub Actions authenticates to `ghcr.io` with `GITHUB_TOKEN`, builds each Dockerfile from the repository root, and pushes tags based on `${{ github.sha }}`.

### Story 2: Operator deploys a known commit

**Persona**: Operator - deploys a specific source revision and needs image tags that map directly to Git commits.

**Flow**:

```text
selected commit SHA
     |
     v
deployment config references:
  ghcr.io/<owner>/<repo>/<subproject>:<full-sha>
```

**Change vs. current state**: Deployments can currently build images locally through `docker-compose.yml`. After this change, deployment can pull prebuilt images from GHCR by exact commit SHA.

**Technical context**: The workflow does not publish `latest`, branch tags, or shortened SHA tags. Full SHA tags keep image provenance unambiguous and prevent accidental deployment of a moving tag.

### Story 3: Frontend runtime configuration remains environment agnostic

**Persona**: Release engineer - promotes the same frontend image between environments without rebuilding it.

**Flow**:

```text
web-app/admin-app Docker build
     |
     v
static dist copied into alpine volume image
     |
     v
nginx serves runtime /config per environment
```

**Change vs. current state**: The frontend Docker pattern remains unchanged. The workflow publishes the same environment-agnostic SPA images that local Docker builds already produce.

**Technical context**: No `VITE_*` build args are introduced. Runtime API configuration stays in nginx `/config`, as documented by `SPEC-014-2026-06-12-runtime-api-config.md` and `.ai/standards/infra/docker-spa-pattern.md`.

## Architecture

```text
on push to master
     |
     v
permissions:
  contents: read
  packages: write
env:
  REGISTRY: ghcr.io
     |
     v
login to env.REGISTRY
     |
     v
matrix build:
  - auth-service
  - catalog-service
  - web-app
  - admin-app
     |
     v
docker/build-push-action pushes each image tagged with github.sha
```

The workflow should use a matrix so the four image definitions stay explicit while sharing the same login, metadata, and build/push steps.

Each image builds with repository root as the Docker context (`context: .`) because the Dockerfiles rely on monorepo workspace manifests and shared packages. The workflow must not build from individual package directories.

## Workflow Contract

### Workflow file

**Path**: `.github/workflows/build-and-push.yml`

### Trigger

```yaml
on:
  push:
    branches: [master]
```

No pull request trigger is included because pull requests must not publish images.

### Permissions

```yaml
permissions:
  contents: read
  packages: write
```

`contents: read` allows the workflow to check out the repository. `packages: write` allows `GITHUB_TOKEN` to push GHCR packages owned by the repository owner.

### Registry and authentication

```yaml
REGISTRY: ghcr.io
registry: ${{ env.REGISTRY }}
username: ${{ github.actor }}
password: ${{ secrets.GITHUB_TOKEN }}
```

No custom GHCR token is required for repository-owned packages unless repository/package settings later require different permissions.

### Image matrix

| Project           | Dockerfile                            | Image                                                          |
| ----------------- | ------------------------------------- | -------------------------------------------------------------- |
| `auth-service`    | `services/auth-service/Dockerfile`    | `${{ env.REGISTRY }}/${{ github.repository }}/auth-service`    |
| `catalog-service` | `services/catalog-service/Dockerfile` | `${{ env.REGISTRY }}/${{ github.repository }}/catalog-service` |
| `web-app`         | `apps/web-app/Dockerfile`             | `${{ env.REGISTRY }}/${{ github.repository }}/web-app`         |
| `admin-app`       | `apps/admin-app/Dockerfile`           | `${{ env.REGISTRY }}/${{ github.repository }}/admin-app`       |

`github.repository` keeps the owner/repository prefix canonical for forks and repository transfers.

### Tagging

Each image is tagged only with the full commit SHA:

```text
${{ env.REGISTRY }}/${{ github.repository }}/<project>:${{ github.sha }}
```

The workflow must not publish:

- `latest`
- branch tags
- short SHA tags
- semantic version tags

Those tags can be added later with a separate release/versioning specification if needed.

### Docker metadata inputs

Each matrix entry generates Docker metadata with:

```yaml
images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.image }}
tags: |
  type=sha,format=long,prefix=
flavor: |
  latest=false
```

This produces the full commit SHA tag and explicitly disables `latest`.

### Docker build inputs

Each matrix entry uses:

```yaml
context: .
file: ${{ matrix.dockerfile }}
push: true
tags: ${{ steps.meta.outputs.tags }}
labels: ${{ steps.meta.outputs.labels }}
cache-from: type=gha,scope=${{ matrix.image }}
cache-to: type=gha,mode=max,scope=${{ matrix.image }}
```

The service Dockerfiles already provide dummy `DATABASE_URL` defaults for Prisma generation, so the workflow does not need database secrets or build args for the initial implementation.

Docker Buildx must be set up before `docker/build-push-action` because the GitHub Actions cache backend is a BuildKit cache backend. Each matrix image uses `scope=${{ matrix.image }}` so the four image builds do not overwrite the same default cache scope.

### GitHub Actions dependencies

Use current Docker official action major versions:

| Action                       | Version |
| ---------------------------- | ------- |
| `actions/checkout`           | `v4`    |
| `docker/login-action`        | `v4`    |
| `docker/metadata-action`     | `v6`    |
| `docker/setup-buildx-action` | `v4`    |
| `docker/build-push-action`   | `v7`    |

The Docker action majors were checked against upstream release pages on 2026-06-13.

## Data Models

Not applicable. This workflow does not add database entities or application data contracts.

## API Contracts

Not applicable. This workflow does not add or change HTTP APIs.

## UI/UX

Not applicable. This workflow has no user-facing application UI.

## Configuration

No repository secrets or runtime environment variables are required beyond GitHub's built-in `GITHUB_TOKEN`.

The repository/package settings must allow GitHub Actions to write packages to GHCR. If GHCR package visibility needs to be public, that package visibility is managed in GitHub package settings after the first push; it is not encoded in the workflow.

## References

- `.ai/specs/SPEC-013-2026-06-08-github-actions-ci.md` - existing CI workflow scope.
- `.ai/specs/SPEC-014-2026-06-12-runtime-api-config.md` - frontend runtime config stays outside the Docker build.
- `.ai/standards/infra/docker-monorepo-build.md` - Docker build context and monorepo build constraints.
- `.ai/standards/infra/docker-spa-pattern.md` - frontend image structure and runtime config constraints.
- `docker-compose.yml` - existing deployable Docker services.
- `services/auth-service/Dockerfile`
- `services/catalog-service/Dockerfile`
- `apps/web-app/Dockerfile`
- `apps/admin-app/Dockerfile`
- `https://github.com/docker/build-push-action/releases`
- `https://github.com/docker/login-action/releases`
- `https://github.com/docker/metadata-action/releases`

## Implementation Checklist

- [x] Inject standards
- [x] Create `.github/workflows/build-and-push.yml`
- [x] Validate workflow YAML syntax
- [x] Verify standards
- [x] Document build verification scope: no package build applies to workflow/spec-only changes

## Changelog

### 2026-06-13

- Initial specification for publishing all deployable Docker images to GHCR on pushes to `master`.
