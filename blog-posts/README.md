# Prometheus Blog Content Guide

The Prometheus blog exists to share what’s happening in and around the Prometheus project.
It’s a space for updates, tutorials, deep dives, and stories from the community.
Our goal is to keep Prometheus users and contributors informed and engaged.  


## What belongs on the blog?

We feature posts that help people learn, stay up to date, or feel more 
connected to the project.

That could mean announcing new releases, explaining how a feature works, 
or walking readers through a setup guide.

It might also mean sharing how your organization uses Prometheus, 
talking about a recent event, or reflecting on your journey as a contributor.  

What doesn’t belong are ads, marketing pitches, or reposts from company blogs.
We want posts that feel original, useful, and rooted in the spirit of open source collaboration.  


## How should posts be written?

We understand that everyone has their own writing style, and we’d hate to cramp yours. 
So, there are no rigid rules around style. But here a few formatting guidelines to keep the posts consistent:
- **Headings:** See [this guide for headings](../markdown-guide.md#proper-usage-of-heading-levels).

- **Links:** Add them with descriptive text instead of just dropping the raw URL. Example:
`[Prometheus documentation](https://prometheus.io/docs/introduction/overview/)`.

- **Images and diagrams:** Always include alt text so the content is accessible to everyone.
  Store images in the `<repo_root>/public/assets` folder (instead of linking from external sites) and reference them in your post.

> [!NOTE]
> See the general [Markdown Documentation Formatting Guide](../markdown-guide.md) for more formatting rules.


The tone should be friendly and professional.
If you’re not sure what that looks like, take a look at some of the [previously published posts](https://prometheus.io/blog/) 
on the blog for inspiration.  

Most posts fall somewhere between 800 words (like [this short announcements](https://prometheus.io/blog/2023/09/01/promcon2023-schedule/)) 
and 1500 words (like [this long deep dive](https://prometheus.io/blog/2021/11/16/agent/)).   

If you include code snippets or configuration examples, please make sure they work as written.
Diagrams or screenshots are also great additions if they help readers grasp complex ideas more quickly.  

When multiple people contribute to a post, we’ll make sure everyone is credited at the end.  


## Review process

Every post should be reviewed before it goes live.
Whoever reviews the pull request will check for both technical accuracy and editorial quality. 
This ensures that the content is both correct and accessible. 
In some cases, these might be done by different people, but often one reviewer can cover both.


## How to contribute

If you’d like to write for the blog, the process is simple:  

1. Open a **“Blog Post Proposal” issue** in the `prometheus/docs` repo to share your idea.  
2. Wait for feedback from maintainers or editors to confirm it’s a good fit.  
3. Draft your post in Markdown and submit it as a pull request.  
4. Go through the review process, where we’ll help refine the draft together.  
5. Once it’s approved, we’ll merge and publish it on the blog. 🎉
6. Share your post on your socials and feel free to tag us so we can boost it too. 


## Why contribute?

Contributing to the blog is a way to give back to the Prometheus community beyond code.
It helps others learn from your experience and brings visibility to your work.  

Plus, non-code contributions like this count as real contributions. You’ll be joining 
the long list of people who’ve shaped Prometheus in meaningful ways.  
