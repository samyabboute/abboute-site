# ABBOUTE Global Trading — Website

Static, single-page corporate website for **abboute.com**.
No build step, no dependencies, no framework. Just upload and it works.

---

## What is in this repository

```
.
├── index.html                  Homepage (all content, 4 languages)
├── 404.html                    Error page
├── CNAME                       Custom domain for GitHub Pages
├── .nojekyll                   Tells GitHub Pages not to run Jekyll
├── robots.txt                  Search-engine directives
├── sitemap.xml                 Sitemap
├── site.webmanifest            Web app manifest
└── assets/
    ├── css/style.css           All styles
    ├── js/main.js              All scripts + translations (EN / PL / FR / AR)
    ├── img/                    Photographs and illustrations
    └── icons/                  Favicons (light and dark variants)
```

**Total size: about 1.1 MB**, of which ~1 MB is images.

---

## Languages

The site ships in four languages: **English (default), Polish, French, Arabic**.

- Visitors from Poland (browser timezone `Europe/Warsaw` or Polish browser language) land on the **Polish** version automatically.
- Everyone else lands on **English**, unless their browser language is French or Arabic.
- The globe icon in the header lets anyone switch manually.
- Arabic switches the whole layout to right-to-left.

All translations live in a single object at the top of `assets/js/main.js`, in the constant `T`.
To edit any text, find the language key (`en`, `pl`, `fr`, `ar`) and change the value. No other file needs touching.

---

## Deploying to GitHub Pages

### 1. Create the repository

Create a new **public** repository on GitHub. Any name works, for example `abboute-site`.

### 2. Upload the files

Either drag and drop the contents of this folder into the GitHub web interface, or from a terminal:

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/abboute-site.git
git push -u origin main
```

> Upload the **contents** of the folder, not the folder itself.
> `index.html` must sit at the root of the repository.

### 3. Turn on GitHub Pages

In the repository: **Settings → Pages**

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Save

After a minute the site is live at `https://YOUR-USERNAME.github.io/abboute-site/`.

### 4. Point the custom domain

Still under **Settings → Pages**:

- Custom domain: `abboute.com` → Save
- Wait for the DNS check to pass, then tick **Enforce HTTPS**

The `CNAME` file in this repository already contains `abboute.com`, so this step is usually automatic.

---

## Configuring DNS at Namecheap

Log in to Namecheap → **Domain List** → **Manage** next to `abboute.com` → **Advanced DNS**.

**Delete** the default records Namecheap adds (usually a `CNAME` for `www` pointing to `parkingpage.namecheap.com`, and a `URL Redirect` record).

Then add these six records:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME Record | `www` | `YOUR-USERNAME.github.io.` | Automatic |
| TXT Record | `_github-pages-challenge-YOUR-USERNAME` | *(value given by GitHub when you verify the domain)* | Automatic |

The last record is optional — it only serves to verify domain ownership on GitHub, which prevents anyone else from claiming it.

> Replace `YOUR-USERNAME` with your actual GitHub username.
> Keep the trailing dot in the CNAME value.

**Propagation takes 30 minutes to 24 hours.** The HTTPS certificate is issued by GitHub automatically once the DNS resolves — it can take up to another hour. Do not panic if the site shows a certificate warning during that window.

---

## Email for the domain

GitHub Pages does not provide email. To use `contact@abboute.com`, add an email service and its MX records at Namecheap:

- **Namecheap Private Email** — a few euros per month, easiest since it is already in your Namecheap account.
- **Zoho Mail** — free for one domain and one mailbox.
- **Google Workspace** — from about 6 € per month per user.

Whichever you pick, the provider gives you MX records to add under **Advanced DNS**. Adding MX records does not affect the website.

---

## Editing the site

### Change a text

Open `assets/js/main.js`, find the constant `T` at the top, and edit the value under the right language.

### Change a photograph

Replace the file in `assets/img/`, keeping the same filename. Recommended sizes:

| File | Size | Purpose |
|---|---|---|
| `hero-container-vessel.jpg` | 1920 × 1276 | Hero background |
| `corridor-*.jpg` | 760 × 570 | Corridor cards |
| `date-harvest-biskra.jpg` | 1560 × 975 | Flagship product section |
| `og-image.jpg` | 1200 × 630 | Social media preview |

Keep JPEG quality around 78 and always run the file through an optimiser before committing.

### Change a colour

All colours are CSS variables at the top of `assets/css/style.css`, under `:root`.
The brand blue is `--blue: #102ea1`.

---

## Before going live — checklist

- [ ] Replace `contact@abboute.com` with a mailbox that actually receives mail
- [ ] Add the real telephone number (currently shown as "On request")
- [ ] Add the registered company address once the Sp. z o.o. is incorporated
- [ ] Add the legal notice / imprint page required for commercial sites in the EU
- [ ] Connect the contact form to a real service — it currently only displays a confirmation message and sends nothing. Free options: Formspree, Web3Forms, Formsubmit
- [ ] Replace the placeholder social media links in the left rail and the footer
- [ ] Submit `https://abboute.com/sitemap.xml` to Google Search Console

---

## Notes

- The contact form **does not send anything yet**. It is a visual placeholder.
- Fonts load from Google Fonts. Without an internet connection the site falls back to the system font.
- The site works without JavaScript for basic reading, but language switching, the corridor carousel and the animations require it.
- No cookies are set and no analytics are loaded, so no cookie banner is required as things stand. If you add analytics later, you will need one.
