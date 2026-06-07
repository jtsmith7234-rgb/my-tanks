# Tank Care Buddy — Image License Records

This folder holds license audit records for every species image used in the app.
Re-run the audit any time new images are added.

## What's in here

| File | Contents |
|------|----------|
| `tier1_license_audit_YYYYMMDD.json` | Raw Wikimedia Commons API response for each image — machine-readable, timestamped |
| `TankCareBuddy_Image_License_Audit_YYYYMMDD.pdf` | Human-readable audit report with per-image license, attribution string, and clickable source links |

## How to re-run the audit

Tell Perplexity Computer:

> "Re-run the image license audit for Tank Care Buddy. Use the same process as the Tier 1 audit on June 7, 2026 — query the Wikimedia Commons API for every species in FISH_IMAGES with imageStatus=approved, verify the license, and produce a new JSON + PDF report, then commit both to docs/licenses/."

The assistant has the full protocol saved and can reproduce this in one session.

## License summary (Tier 1 — 26 images, audited 2026-06-07)

- **All images:** Wikimedia Commons
- **Licenses:** CC BY 2.0, CC BY 3.0, CC BY 4.0, CC BY-SA 2.0, CC BY-SA 2.5, CC BY-SA 3.0, CC BY-SA 4.0, Public Domain
- **Commercial use:** Permitted for all
- **Attribution required:** Yes for all CC images (displayed in app via `imageAttributionText` field)
- **ShareAlike applies to app:** No — unmodified photo display does not trigger SA

## What to do when adding new images

1. Add the new `FISH_IMAGES` entry to `fishdb.js` with `imageStatus: "approved"`
2. Ask Perplexity Computer to re-run the license audit
3. Commit the new JSON + PDF here with today's date in the filename
4. Optionally: archive each new Wikimedia file page at https://web.archive.org/save/[url]

## If you are ever challenged

This folder provides:
- The exact license the image was published under at time of use
- The attribution text displayed in the app
- A timestamped API query (not a screenshot) confirming license status
- Git commit history proving when the audit was performed
