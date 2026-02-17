---
title: Contributing
---

# Contributor's guide

This document provides general guidelines for contributors of all experience
levels.

If you are new, you might want to check out [how to pick something to
work on](#how-to-pick-something-to-work-on) first.

If you are an experienced contributor Looking to contribute a change, check the 
[high level process](#how-to-get-a-pr-merged).

If you have concrete plans for something more involved already, please refer to the [proposal
process](#proposal-process).

This document is guide for the prometheus/prometheus repository. Much of this 
applies to other repos in the Prometheus community, but these projects might 
have their own guides and rules. For repository-specific information, check out 
the README.md and CONTRIBUTING.md files of each repository.

## How to get a PR merged

If you’re working on your first contribution please read this whole document, this section is aimed at experienced Open Source contributors.

- Test changes locally and consider adding tests for your change.
- Commit with `git commit -s` to sign the DCO.
- Generally, open a PRs against the repositories default branch, i.e. most often 
  `main` or sometimes `master`. Reviewers will help with exceptions.
- Reviewers should be assigned automatically, we aim to respond timely but other 
  priorities can create delays.
- Check the results of failing CI jobs, all are expected to succeed.
- Reviewers might request changes. Addressing these quickly will improve the 
  turn-around time of the PR.

For more details around our git refer to
[the Github Guidelines](#github-guidelines).

## Communication channels

The usual [community channels for users](/community) are meant to discuss usage
of Prometheus including using Prometheus code for non-Prometheus development
(e.g. instrumenting code with a Prometheus instrumentation library).
Development of Prometheus components themselves happens via other channels as
described in this section.

### GitHub

Contributions are reviewed in GitHub pull requests. See the [GitHub
guidelines](github-guidelines) below for details. GitHub issues are often a
good way to discuss specific bugs and feature requests. For informal or
overarching discussions, the other channels below might be more appropriate.

### CNCF Slack

A lot of the informal chat-like discussion happens on the [CNCF
Slack](https://slack.cncf.io/). The main development channel is
`#prometheus-dev`, but there are plenty of specialized channels. Look for
channel names like `#prometheus-...-dev`, e.g. `#prometheus-protobuf-dev`.

Note that Slack is a silo. The content is not indexed by external search
engines, there is no easy way to export and archive the content, and even
read-only access requires a login. Therefore, consider everything in Slack as
ephemeral and inaccessible for the general public. Important information, like
the result of a discussion, should also be published via other channels (e.g.
on [GitHub](github) or the [mailing list](#developer-mailing-list)) to make it
accessible and durable. Avoid linking to Slack messages from other media
without summarizing the content of the linked messages.

### Developer mailing list

The
[prometheus-developers](https://groups.google.com/forum/#!forum/prometheus-developers)
mailing list
([mirror](https://www.mail-archive.com/prometheus-developers@googlegroups.com/))
is suitable for announcements and more formal discussions about overarching
topics. The mailing list archive is indexed by search engines and thus a good
way to find past discussions and ensure that information is not lost in a silo
like Slack.

### Developer summits

Developer summits are public meetings to discuss more involved development
topics. For the schedule, meeting notes, and many other details see the
[dedicated section](#developer-summit-details) below.

### Work groups

If developers working on a specific topic would like to conduct online meetings
on a more or less regular basis, they start a work group. Work group meetings
are public and published via the [Prometheus
calendar](https://calendar.google.com/calendar/u/0/embed?src=prometheus.io_bdf9qgm081nrd0fe32g3olsld0%40group.calendar.google.com).

## How to pick something to work on

The best feature or bug to work on is something that matters to you. Something 
you are already a user or even expert on or something you want to become an 
expert on.

The Prometheus community tries to help with identifying good issues to work on 
in two way:

1. Look for the label `good-first-issue`. This label identifies work that we 
   think would be a good starting point for any new contributors.
2. If you are looking for more complex issues to solve look for the 
   `triage/accepted` label. This label indicates that an issues has been 
   triaged, all needed information has been gathered and work can begin.
   The labels `triage/needs-triage` and `triage/needs-information` mean that 
   either no one has had time to look at the issue yet or more information is 
   need. Do not work on issues labeled `triage/needs-triage` or 
   `triage/needs-information` .See <label proposal> for more details on how we 
   use labels.

## Proposal process

For bigger changes and ideas we require a formal proposal and review in the 
[Proposal repository](https://github.com/prometheus/proposals/). For details 
please read the accepted [proposal proposal](https://github.com/prometheus/proposals/blob/main/proposals/0001-proposal-process.md).

## GitHub guidelines

Commit message should describe the change made in the commit.
We don't have strong opinions on how large or small commits should be, use your 
best judgment to make a logical series of changes. Good commits make reviews 
easier and thus can be merged faster. For example it's a good pattern to have a 
commit adding a test to expose a bug and then have a separate commit to fix the 
bug.
Commit messages must include a `Signed-off-by: <author identity>` line. With 
this the author agrees to the terms published at 
https://developercertificate.org/ for _that_ particular contribution.

Once you have a change you would like to propose, push it to your personal fork 
of Prometheus and open a pull request against the default branch. The default 
branch is usually `main` but can be `master` in some repositories.
Some situations require a PR against a release branch, e.g. `release-3.5`. The 
most common situations are fixes for a release candidate for a new release or a 
fix for a LTS version of Prometheus. If in doubt, ask via one of the channels 
mentioned in this document.

The needed reviewers will be added automatically. Anyone else that should or 
wants to review a change can be mentioned by their user name in a comment, but 
please avoid pinging random community members.

We have checks that run on every PR. To merge all checks should succeed. Any 
failing checks should be investigated and addressed by the PR author.

Reviewers might request changes, which requires the author to either add commits 
or rewrite the existing commits. Prometheus defaults to merging PR commits (not 
rebase or squash), so adding a list of `fixup` commits is not a good idea unless 
they get rebased or squashed by the PR author. Rebase and squash rewrite gits 
commit history and authors should be aware of the implications (for example see 
https://git-scm.com/book/en/v2/Git-Branching-Rebasing). Rebasing a branch for a 
pull request is generally fine. Only once others have changes based on commits 
that are not part of the `main` branch yet, commit authors should refrain from 
rewriting those commits.

## AI generated contributions

The Prometheus authors don't discourage the use of AI tools to generate code.
However we require a [DCO](https://developercertificate.org/) on each commit, by 
which the author certifies that the contribution was created in whole or in part 
by the author and that they have the right to submit it. Or if the contribution 
is based upon previous work, it is covered under an appropriate open source 
license and the author has the right under that license to submit that work with 
modifications. See https://www.linuxfoundation.org/legal/generative-ai for more 
details.
Please consider the DCO and carefully review AI generate code before submitting 
it. We encourage explicitly disclosing AI tool usage, for example by adding an 
`Assisted-by: <name of AI tool used>` to the respective commits.

For discussions around issues and PRs we strongly prefer a dialog with humans.

## Coding style

Much has been written about coding styles for a given language elsewhere. For 
Prometheus contributions stick to the following:

- Use idiomatic code of the language.
- Stick to the existing style around you. Don’t conflate style improvements with 
  code changes.
- We have plenty of linters, use `make format`, `make lint` and `make style` to 
  correctly format your code.
- Use proper English grammar and punctuation. Don’t needlessly abbreviate.
  BAD: // batchQueue full, try again later
  GOOD: // The batchQueue is full, so we need to try again later.
- In markdown, limit line length to 80 characters, instead of one line per 
  paragraph. It makes commenting in reviews so much easier.


### Go style guide

Go is the main programming language used in Prometheus and its ecosystem. Go 
based project tend to follow a very similar style, Prometheus is no exception.  
https://go.dev/wiki/CodeReviewComments is a great resource for specifics. We 
have a few rules that are worth mentioning here:

- Often we put named imports into a separate block. The blocks should be grouped 
  into stdlib / other repos / same repo.
- Doc comments on exported types are not enforced by the linter (because of too 
  many false positives), but we do care. Use them where they make sense.
- For long function signatures that require line breaks put closing parentheses 
  on separate line. For example:
```
func (s *shards) sendSamples(
	ctx context.Context, samples []prompb.TimeSeries,
	sampleCount, exemplarCount, histogramCount int,
	pBuf *proto.Buffer, buf compression.EncodeBuffer, compr compression.Type,
) error {
```
**NOT**
```
func (s *shards) sendSamples(
	ctx context.Context, samples []prompb.TimeSeries,
	sampleCount, exemplarCount, histogramCount int,
	pBuf *proto.Buffer, buf compression.EncodeBuffer, compr compression.Type) error {
```

## Developer summit details

Developer summits usually happen on the last Thursday each month as an online
meeting. See the [Prometheus
calendar](https://calendar.google.com/calendar/u/0/embed?src=prometheus.io_bdf9qgm081nrd0fe32g3olsld0%40group.calendar.google.com)
for the current schedule. In addition, we aim for all-day in-person summits
whenever enough active Prometheus developers are gathered at one place for some
reason, typically at a conference like [PromCon](https://promcon.io/) or
[Kubecon EU](https://events.linuxfoundation.org/kubecon-cloudnativecon-europe/).

The online meetings are open for everyone, while the in-person meetings might
have some restrictions for logistical reasons. If in doubt, ask via the channels
listed above, and we'll see what can be done. We also try to make in-person
summits accessible for online participants on a best-effort basis.

The Prometheus team curates the agenda based on recent discussions via other
channels. You can propose a topic explicitly by adding it at the top of the
meeting notes (see below) or by sending a mail to the [developer mailing
list](https://groups.google.com/forum/#!forum/prometheus-developers) at least
24 hours prior to the summit.

### Meeting notes

We maintain [rolling meeting notes
document](https://docs.google.com/document/d/1uurQCi5iVufhYHGlBZ8mJMK_freDFKPG0iYBQqJ9fvA) (current version starting 2024-09-13).

Historical meeting notes:

- [2017 developer summit notes](https://docs.google.com/document/d/1DaHFao0saZ3MDt9yuuxLaCQg8WGadO8s44i3cxSARcM)
- [2018 developer summit notes](https://docs.google.com/document/d/1-C5PycocOZEVIPrmM1hn8fBelShqtqiAmFptoG4yK70)
- [2019 developer summit notes](https://docs.google.com/document/d/1NQIX78nwBhfLZD3pAb0PK-uBKYqnkzjjVhOQ-kIaEGU)
- [2019 developer summit 2 notes](https://docs.google.com/document/d/1VVxx9DzpJPDgOZpZ5TtSHBRPuG5Fr3Vr6EFh8XuUpgs)
- [2020 virtual developer summit 1 notes](https://docs.google.com/document/d/1yuaPKLDvhJNXMF1ubsOOm5kE2_6dvCxHowBQIDs0KdU)
- [2020 virtual developer summit 2 notes](https://docs.google.com/document/d/1vhXKpCNY0k2cbm0g10uM2msXoMoH8CTwrg_dyqsFUKo)
- [2020 virtual developer summit 3 notes](https://docs.google.com/document/d/18Jbl5LC_FPLqCqU12qY8XpjVMJLCtGt-ykbyAhYXcIc)
- [2020 virtual developer summit 4 notes](https://docs.google.com/document/d/1_60pplXWF1R-utJtswJYFf8F9HBAJdDS5x4Lv9CgAJ8)
- [2020 virtual developer summit 5 notes](https://docs.google.com/document/d/1iO1QHRyABaIpc6xXB1oqu91jYL1QQibEpvQqXfQF-WA)
- [2021 virtual developer summit 1 notes](https://docs.google.com/document/d/10o4gkjgK46MdUHTowpUG_pyeON3Z5k0CbPBqQ211KOE)
- [2021-2024 developer summit rolling notes](https://docs.google.com/document/d/11LC3wJcVk00l8w5P3oLQ-m3Y37iom6INAMEu2ZAGIIE)

### Facilitator

The Facilitator role was created to help the Prometheus team to run the
Developer Summits effectively. It's a rotational role (switches for
every meeting) and its responsibilities are spread across different
phases of the summit:

#### Before the summit

Before the summit, the Facilitator's main goal is to help the
Prometheus team define the agenda and the topics to be discussed while
making sure interested parties of the most voted topics will be able to
attend the summit. We suggest the following tasks:

- Two or three days before the meeting, send reminders in our public
  community channels inviting people to add Agenda Topics, and
  Prometheus Team members and maintainers to vote on topics they'd
  like to discuss.
- One day before the meeting, reach out to "Topic owners" who
  received the most votes to make sure they'll make it to the summit.

#### During the summit

During the summit, the Facilitator is here to make sure the meeting runs
smoothly, and that consensus is reached when needed. We suggest the
following tasks:

- Start the meeting on time. Use `@prometheus.io` account for the admin meeting
  permissions.
- Start the recording and mention that the Code of Conduct applies.
- Select topics to be discussed based on votes and who is currently present in
  the meeting.
- Take notes or find volunteer for taking notes in the shared document.
- Strategically step in when the discussion is not moving forward or deviating
  from the topic.
- Call for consensus when needed.

#### After the summit

Once the meeting is over, the last task of the Facilitator is to find a new
Facilitator for the next summit by sending an email to the Prometheus Team
mailing list.
