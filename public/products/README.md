# Real product photos

Put your photos here, named after the product slug (full list in `FILENAMES.txt`):

    dior-sauvage.jpg          main photo
    dior-sauvage-2.jpg        extra gallery photo (-2, -3, ...)

Then run `npm run db:images` (needs your Firebase env vars) and commit + push. Files in this folder are served by Vercel directly from git.
Tips: JPG/WebP, about 1200 x 1500 px (4:5), under 500 KB each so pages stay fast.
Only use photos you own or have a licence for; official brand photography is copyrighted.
You can also upload photos from /admin > Products > Edit (needs Firebase Storage).
