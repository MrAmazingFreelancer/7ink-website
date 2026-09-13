# Blog structure

- `../index.html` is the blog listing served at `/blog/`.
- Each post lives in `posts/<post-slug>/index.html` and is served at `/blog/posts/<post-slug>/`.
- Shared post images live in `/assets/img/blog/posts/`.
- Legacy URLs such as `/blog.html`, `/blog-post-name.html`, and `/blog/post-name/` are redirected by `vercel.json`.
