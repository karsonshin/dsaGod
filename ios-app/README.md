# Offer Ready on iPhone

A thin Capacitor shell: the same web app, bundled inside a native iPhone app. All progress stays on the phone (the app's own storage, including PDFs and cover letters). Nothing needs a server or internet, except running Python (Pyodide loads from the internet).

An iPhone app can only be compiled on macOS. This Windows PC cannot do it, so use a free cloud Mac, then install by USB cable.

## 1. Build the .ipa on a cloud Mac (free)
1. Create a **private** GitHub repository and upload this whole project folder (the repo root is the folder holding `index.html`). `.gitignore` already skips generated files.
2. On GitHub: **Actions → Build iPhone app (unsigned .ipa) → Run workflow**. It takes about 5 to 10 minutes.
3. Open the finished run and download the **OfferReady-ipa** artifact (a zip containing `OfferReady.ipa`).

## 2. Install it over the cable (from Windows)
1. Install **iTunes** and **iCloud** from apple.com (not the Microsoft Store versions), then **Sideloadly** (sideloadly.io).
2. On the iPhone: Settings → Privacy & Security → **Developer Mode** → on, then restart. Plug the phone in with the cable and tap Trust.
3. In Sideloadly, drag in `OfferReady.ipa`, enter your Apple ID, and press Start. It signs the app with a free developer certificate and installs it.
4. On the iPhone: Settings → General → **VPN & Device Management** → your Apple ID → Trust.

A free Apple ID's signature **expires after 7 days** (the app then won't open until re-installed; Sideloadly can auto-renew while the phone and PC are on the same Wi-Fi). Re-installing the same app over the cable keeps its data. Back up first anyway (see below). A paid Apple Developer account extends this to a year.

## Moving progress between the phone and the PC
Settings → **Export backup** on one device (on the iPhone it opens the share sheet: save to Files or iCloud Drive, or AirDrop to the PC), then **Import backup** on the other. It is one JSON file with progress, notes, stories, applications and stored documents. Importing replaces what is on that device. Do this before each 7-day re-install.

## Updating the app
Change the web files, upload again, run the workflow, install the new `.ipa` over the old one.

## Not verified
Built and reviewed on Windows only: the iOS compile, the signing and the share sheet have not been run on a real iPhone. The bundled web files were checked in desktop Chrome with an iPhone user agent (no console errors).
