# FH Development Studio Site

Static marketing website for FH Development Studio, hosted with GitHub Pages at `www.fhdevelopmentstudio.com`.

## Related FH Development Studio repositories

This site is one of three related repositories:

- [`FHDevelopmentStudio`](https://github.com/4bkm6xsb8f-byte/FHDevelopmentStudio) — the umbrella monorepo that ties the site and admin app together.
- `fh-development-studio-site` (this repository) — the public marketing site.
- [`fh-development-studio-admin`](https://github.com/4bkm6xsb8f-byte/fh-development-studio-admin) — the internal Next.js operations app that this site's `admin-login.html` links into, and that receives this site's public inquiry and page-tracking submissions.

## Project Structure

- `index.html` - Home page and primary service positioning.
- `services.html`, `process.html`, `support.html`, `privacy.html`, `terms.html` - Supporting site pages.
- `brand-standards.html` and `discovery-workflow.html` - Brand and workflow reference pages.
- `admin-login.html` - Redirect-style entry point for the admin experience.
- `styles.css` - Shared site styling.
- `site.js` - Shared browser behavior.
- `assets/` - Logos, icons, and product screenshots.
- `CNAME` - GitHub Pages custom domain.
- `sitemap.xml` and `robots.txt` - Search indexing metadata.

## Local Development

This site has no package manager, build step, or test runner. You can open the HTML files directly, or serve the repository root when testing navigation and relative assets:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Changes are deployed by pushing the static files on `main` to GitHub. The files in this repository are the files served publicly by GitHub Pages.

## Maintenance Notes

- Update `sitemap.xml` when pages are added, removed, or renamed.
- Keep canonical URLs and Open Graph metadata aligned with `www.fhdevelopmentstudio.com`.
- Keep icon and logo references in sync with the assets in `assets/`.
