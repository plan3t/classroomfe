# classroomfe

## Docker release workflow

This repository includes a manual GitHub Actions workflow at `.github/workflows/docker-release.yml`.
Run **Docker Release** from the Actions tab, provide a release tag such as `v1.0.0`, and the workflow will:

1. build the Docker image from `Dockerfile`
2. push the image to GitHub Container Registry as `ghcr.io/<owner>/<repo>`
3. create or update the matching Git tag
4. publish a GitHub release with generated notes and the image digest
