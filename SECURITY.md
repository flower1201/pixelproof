# Security

PixelProof is local-first. It does not upload images, reports, or source code to a PixelProof server.

## URL capture limits

- `--url` only accepts loopback hosts: `localhost`, `127.0.0.1`, `[::1]`
- URL username/password is rejected
- Top-level navigation away from loopback fails the capture
- Public/remote URL capture is intentionally out of P0 scope

Pages loaded from a loopback URL may still fetch their own third-party assets. PixelProof does not claim a fully offline network sandbox for page content.

## Report contents

Generated reports can contain screenshots of local apps. Treat report directories as sensitive unless you intentionally share them.

## Reporting issues

If you discover a security issue in PixelProof itself, open a private advisory or contact the maintainers through GitHub once the repository is published.
