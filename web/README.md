## Example website

This example builds a website with the following URLs, based on the file structure in the `/public` directory:

```
/ -> (/index.html)
/cookies -> (/cookies.html)
/privacy -> (/privacy.html)
/css/styles.css -> (/css/styles.css)
```

## How it works

The content in the `/public` directory is mapped using the following rules:

 * `/` always maps to file `public/index.html`
 * URLs without a file extension map to an html file, e.g. URL `/some/directory/file` maps to file `public/some/directory/file.html`
 * URLs with a file extension are unchanged, e.g. URL `/assets/img/logo.png` maps to file `public/assets/img/logo.png`
