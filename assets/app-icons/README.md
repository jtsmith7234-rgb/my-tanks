# App Icon Assets

This folder holds the **source-of-truth master images** for the My Tanks app icon. These files are what we will hand off to Capacitor / Xcode when we initialize the native iOS project.

Do not edit these PNGs in place — replace them with new exports from the original design file when the icon changes.

---

## Folder layout

```
assets/app-icons/
├── default/                          ← the standard "leaping koi" icon
│   └── app-icon-default-1024.png     ← MASTER (1024×1024, no alpha, no transparency)
├── japanese/                         ← future Japanese-theme alternate icon
│   └── (app-icon-japanese-1024.png)  ← not added yet
└── README.md
```

## Naming convention

`app-icon-<theme>-<size>.png`

- `<theme>` — `default`, `japanese`, or any future alternate
- `<size>` — pixel size of the master. Always keep a 1024 master; smaller sizes only get generated when Capacitor/iOS tooling needs them.

## Current sources of truth

| Theme    | File                                              | Status   | Notes                                                      |
| -------- | ------------------------------------------------- | -------- | ---------------------------------------------------------- |
| Default  | `default/app-icon-default-1024.png`               | ✅ Final | Leaping orange koi on soft-blue rounded-square plate.      |
| Japanese | `japanese/app-icon-japanese-1024.png`             | ⏳ TBD   | Placeholder location only. Final art not yet provided.     |

## Rules for the master file

- **Format:** PNG, RGB (no alpha channel — iOS App Store rejects transparency on the marketing icon)
- **Dimensions:** exactly **1024 × 1024 pixels**
- **Color profile:** sRGB
- **Safe area:** keep critical artwork inside the inner ~90% — iOS rounds the corners and can clip edges
- **No baked-in shadow / glow** beyond what is part of the artwork
- **No text** unless it is part of the official mark

## Where these are NOT used yet

These master files are **not** wired into the live web app. The web app uses a single icon at `apple-touch-icon.png` (referenced from `index.html` and `manifest.json` using a relative path so it resolves under deployment subpaths like GitHub Pages). When Capacitor is initialized, native iOS icons will be regenerated from the master in this folder.

## Next step (when we initialize Capacitor/iOS)

1. `npm init -y` and install Capacitor: `npm i @capacitor/core @capacitor/cli @capacitor/ios`
2. `npx cap init "My Tanks" com.jtsmith.mytanks --web-dir .`
3. `npx cap add ios`
4. Install the icon generator: `npm i -D @capacitor/assets`
5. Copy the master into the expected input location:
   - `assets/icon-only.png` (Capacitor Assets default lookup path), or
   - point `@capacitor/assets` at `assets/app-icons/default/app-icon-default-1024.png` via config
6. Run `npx capacitor-assets generate --ios` — this builds every required iOS icon size (20pt through 1024pt @1x/@2x/@3x) into `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
7. For the Japanese alternate, register it as an iOS **alternate app icon** (`UIApplicationAlternateIcons` in `Info.plist`) and ship the rendered set alongside the primary in `Assets.xcassets`.

## How to add the Japanese alternate later

1. Drop the final art at `japanese/app-icon-japanese-1024.png` following the same master rules above.
2. Run the same `@capacitor/assets` generation pointed at the Japanese master to produce a parallel `AlternateAppIcon-Japanese.appiconset`.
3. Wire the in-app theme toggle to call `UIApplication.setAlternateIconName("Japanese")` (or `null` for default).
