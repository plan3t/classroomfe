# classroomfe

## Docker release workflow

This repository includes a manual GitHub Actions workflow at `.github/workflows/docker-release.yml`.
Run **Docker Release** from the Actions tab, provide a release tag such as `v1.0.0`, and the workflow will:

1. build the Docker image from `Dockerfile`
2. push the image to GitHub Container Registry as `ghcr.io/<owner>/<repo>`
3. create or update the matching Git tag
4. publish a GitHub release with generated notes and the image digest

## Quick start with Docker Compose

Run the published image together with PostgreSQL using the included compose file:

```bash
docker compose up -d
```

This starts:

- `ghcr.io/plan3t/classroomfe:latest` on <http://localhost:3000>
- PostgreSQL 16 with the required schema and starter item data preloaded automatically

The default database credentials are already wired into `docker-compose.yml`, so no extra `.env` file or manual migration step is required for a first run.

