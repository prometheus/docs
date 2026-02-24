---
title: How Non-Developers Can Contribute to Prometheus
created_at: 2025-10-31
kind: article
author_name: Victoria Nduka (@nwanduka)
---

My first introduction to the Prometheus project was through the 
[Linux Foundation mentorship program](https://mentorship.lfx.linuxfoundation.org/project/36e3f336-ce78-4074-b833-012015eb59be), 
where I conducted UX research. I remember the anxiety I felt when I was selected as a mentee. I was new not just to Prometheus, 
but to observability entirely. I worried I was in over my head, working in a heavily developer-focused domain with no development background.

That anxiety turned out to be unfounded. I went on to make meaningful contributions to the project, and I've learned that what I 
experienced is nearly universal among non-technical contributors to open source.

If you're feeling that same uncertainty, this post is for you. I'll share the challenges you're likely to face (or already face), 
why your contributions matter, and how to find your place in the Prometheus community.

<!-- more -->

## The Challenges Non-Technical Contributors Face
As a non-technical contributor, I've had my share of obstacles in open source. And from conversations with others navigating these spaces, 
I've found the struggles are remarkably consistent. Here are the most common barriers:

### 1. The Technical Intimidation Factor
I've felt out of place in open source spaces, mostly because technical contributors vastly outnumber non-technical ones. Even the non-technical 
people often have technical backgrounds or have been around long enough to understand what's happening.

When every conversation references concepts you don't know, it's easy to feel intimidated. You join meetings and stay silent throughout. 
You respond in the chat instead of unmuting because you don't trust yourself to speak up in a recorded meeting where everyone else seems 
fluent in a technical language you're still learning.

### 2. Unclear Value Proposition
Open source projects rarely spell out their non-technical needs the way a job posting would. You would hardly find an issue titled 
"Need: someone to interview users and write case studies" or "Wanted: community manager to organize monthly meetups." Instead, you’re 
more likely to see a backlog of GitHub issues about bugs, feature requests, and code refactoring.

Even if you have valuable skills, you don't know where they're needed, how to articulate your value, or whether your contributions will 
be seen as mission-critical or just nice-to-have. Without a clear sense of how you fit in, it's difficult to reach out confidently. 
You end up sending vague messages like "I'd love to help! Let me know if there's anything I can do", which rarely leads anywhere because 
maintainers are busy and don't have time to figure out how to match your skills to their needs.

### 3. Lack of Visible Non-Technical Contributors
One of the things that draws me to an open source community or project is finding other people like me. I think it's the same way for most people. 
Representation matters. It's hard to be what you can't see.

It’s even more difficult to find non-technical contributors because their contributions are often invisible in the ways projects typically showcase work. 
GitHub contribution graphs count commits. Changelogs list code changes and bug fixes. You only get the "contributor" label when you've created a 
pull request that got merged. So, even when people are organizing events, supporting users, or conducting research, their work doesn't show up in 
the same prominent ways code does.

### 4. The Onboarding Gap
A typical "Contributing Guide" will walk you through setting up a development environment, creating a branch, running tests, and submitting a pull request. 
But it rarely explains how to contribute documentation improvements, where design feedback should go, or how community support is organized.

You see "Join our community" with a link to a Slack workspace. But between joining and making your first contribution, there's a significant gap. 
There are hundreds of people in dozens of channels. Who's a maintainer and who's just another community member? Which channel is appropriate for 
your questions? Who should you tag when you need guidance?

## Why These Gaps Exist
It's worth acknowledging that most of the time, these gaps aren't intentional. Projects don't set out to exclude non-technical contributors or 
make it harder for them to participate.

In most cases, a small group of developers build something useful and decide to open-source it. They invite people they know who might need it 
(often other developers) to contribute. The project grows organically within those networks. It becomes a community of developers building 
tools for developers, and certain functions simply don't feel necessary yet. Marketing? The word spreads naturally through tech circles. 
Community management? The community is small and self-organizing. UX design? They're developers comfortable with command-line interfaces, 
so they may not fully consider the experience of using a graphical interface.

None of this is malicious. It's just that the project evolved in a context where those skills weren't obviously needed.

The shift happens when someone, often a non-technical contributor who sees the potential, steps in and says: 
"You've built something valuable and grown an impressive community. But here's what you might be missing. 
Here's how documentation could lower the barrier to entry. Here's how community management could retain contributors. 
Here's how user research could guide your roadmap."

## Why Non-Technical Contributions Matter
Prometheus is a powerful monitoring system backed by a large community of developers. But like any open source project, it needs more than code to thrive.

**It needs accessible documentation.** From my experience working with engineers, most would rather focus on building than writing docs, 
and understandably so. Engineers who know the system inside out often write documentation that assumes knowledge newcomers don't have. 
What makes perfect sense to someone who built the feature can feel impenetrable to someone encountering it for the first time. 
A technical writer testing the product from an end user's perspective, not a builder's, can bridge that gap and lower the barrier to entry.

**It needs organization.** The GitHub issues backlog has hundreds of open items that haven't been triaged. Maintainers spend valuable 
time parsing what users actually need instead of building solutions. A project manager or someone with triage experience could turn 
that chaos into a clear roadmap, allowing maintainers to spend their time building solutions.

**It needs community support.** Imagine a user who joins the Slack workspace, excited to contribute. They don't know where to start. 
They ask a question that gets buried in the stream of messages. They quietly leave. The project just lost a potential contributor because 
no one was there to welcome them and point them in the right direction.

These are the situations non-technical contributions can help prevent. Good documentation lowers the barrier to entry, which means more adoption, 
more feedback, and better features. Active community management retains contributors who would otherwise drift away, which means distributed 
knowledge and less maintainer burnout. Organization and triage turn scattered input into actionable priorities.

The Prometheus maintainers are doing exceptional work building a robust, scalable monitoring system. But they can't do everything, 
and they shouldn't have to. The question now isn't whether non-technical contributions matter. It's whether we create the space for them to happen.

## Practical Ways You Can Contribute to Prometheus
If you're ready to contribute to Prometheus but aren't sure where to start, here are some areas where non-technical skills are actively needed.

### 1. Join the UX Efforts
Prometheus is actively working to improve its user experience, and the community now has a 
[UX Working Group](https://cloud-native.slack.com/archives/C09NL3B1EKW) dedicated to this effort.

If you're a UX researcher, designer, or someone with an eye for usability, this is an excellent time to get involved. 
The working group is still taking shape, with ongoing discussions about priorities and processes. 
Join the Slack channel to participate in these conversations and watch for upcoming announcements about specific ways to contribute.

I can tell you from experience that the community is receptive to UX contributions, and your work will have a real impact.

### 2. Write for the Prometheus Blog
If you're a technical writer or content creator, the Prometheus blog is a natural entry point. The blog publishes tutorials, 
case studies, best practices, community updates, and generally, content that helps users get more value from Prometheus.

Check out the [blog content guide](https://github.com/prometheus/docs/blob/main/blog/README.md) to understand what makes a strong blog proposal and how to publish a post on the blog. 
There's an audience eager to learn from your experience.

### 3. Improve and Maintain Documentation
Documentation is one of those perpetual needs in open source. There's always something that could be clearer, more complete, or better organized. 
The Prometheus docs repo is no exception.

You can contribute by fixing typos and [broken links](https://github.com/prometheus/docs/issues/2649), expanding getting-started guides, 
creating tutorials for common monitoring scenarios, or [triaging issues](https://www.youtube.com/watch?v=SzSUa5y7Ji0&t=27105s) to help 
prioritize what needs attention. Even if you don't consider yourself a technical writer, if you've ever been confused by the docs and 
figured something out, you can help make it clearer for the next person.

### 4. Help Organize PromCon
[PromCon](https://promcon.io/) is Prometheus's annual conference, and it takes significant coordination to pull off. 
The organizing team handles everything from speaker selection and scheduling to venue logistics and sponsor relationships.

If you have experience in event planning, sponsor outreach, marketing, or communications, the PromCon organizers would welcome your help. 
Reach out to the [organizing team](mailto:promcon-organizers@googlegroups.com) or watch for announcements in the Prometheus community channels.

### 5. Advocate and Amplify
Finally, one of the simplest but most impactful things you can do is talk about Prometheus. Write blog posts about how you're using Prometheus. 
Give talks at local meetups or conferences. Share tips and learnings on social media. Create video tutorials or live streams. 
Recommend Prometheus to teams evaluating monitoring solutions.

Every piece of content, every conference talk, every social media post expands Prometheus's reach and helps new users discover it.

## How to Get Started
If you're ready to contribute to Prometheus, here's what I've learned from my own experience navigating the community as a non-technical contributor:

**Start by introducing yourself.** When you join the #prometheus-dev Slack channel, say hello. Slack doesn't always make it obvious 
when someone new joins, so if you stay silent, people simply won't know you're there. A simple introduction—your name, what you do, what brought you to Prometheus—is enough to make your presence known.

**Attend community meetings.** Check out the [community calendar](https://prometheus.io/community/#calendar-for-public-events) and 
sync the meetings that interest you. Even if you don't understand everything being discussed at first (and that's completely normal), stay. 
The more you sit in, the more you'll learn about the community's needs and find more opportunities to contribute.

**Observe before you act.** It's tempting to jump in with ideas immediately, but spending time as an observer first pays off. 
Read through Slack discussions and conversations in GitHub issues. Browse the documentation. Notice what kinds of contributions are being made. 
You'll start to see patterns: recurring questions, documentation gaps, areas where help is needed. That's where your opportunity lies.

**Ask questions.** Everyone was new once. If something isn't clear, ask. If you don't get a response right away, 
give it some time—people are busy—then follow up. The community is welcoming, but you have to make yourself visible.

The Prometheus community has room for you. Now you know exactly where to begin.
