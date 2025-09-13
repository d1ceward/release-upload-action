# Release Upload Action

A simple GitHub Action for uploading release assets to GitHub Releases. Automates the process of attaching files to releases in CI/CD workflows, supporting flexible configuration and robust error handling.

## Features

- **Automatic Draft Release:** Creates a draft GitHub release on tag push.
- **Asset Upload:** Uploads specified files as release assets.
- **Easy Integration:** Minimal configuration required.

## Usage

Add the following to your workflow (e.g., `.github/workflows/release.yml`):

```yaml
name: Release Upload Action

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      # ... your build steps ...
      - uses: d1ceward/release-upload-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          files: |
            bin/my-first-binary
            bin/my-second-binary
```

### Inputs

| Name   | Description                | Required | Example                      |
|--------|----------------------------|----------|------------------------------|
| token  | GitHub token (with `repo` scope) | Yes      | `${{ secrets.GITHUB_TOKEN }}` |
| files  | Newline-separated list of files to upload | Yes      | `bin/my-binary`               |

## Contributing

Contributions are welcome! To get started:

1. **Fork** the repo: [release-upload-action/fork](https://github.com/d1ceward/release-upload-action/fork)
2. **Create a branch:**
   `git checkout -b my-new-feature`
3. **Commit your changes:**
   `git commit -am 'Add some feature'`
4. **Push to your fork:**
   `git push origin my-new-feature`
5. **Open a Pull Request**

By contributing, you agree to abide by the [Code of Merit](https://github.com/d1ceward/release-upload-action/blob/main/CODE_OF_MERIT.md).

## Development

1. Install the required Node.js version (see `.node-version`).
2. Enable pnpm:
   `corepack enable pnpm`
3. Install dependencies:
   `pnpm install`

## License

[MIT](LICENSE)

## Contributors

- [d1ceward](https://github.com/d1ceward) – creator and maintainer

Bug reports and pull requests are welcome on [GitHub](https://github.com/d1ceward/release-upload-action).
