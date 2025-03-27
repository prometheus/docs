---
title: Contributing
---

# Contributor's guide

This document provides general guidelines for contributors of all experience
levels. If you are new, you might want to check out [how to pick something to
work on](#how-to-pick-something-to-work-on) first. If you have concrete plans
for something more involved already, please refer to the [proposal
process](#proposal-process).

For repository-specific information, check out the README.md and
CONTRIBUTING.md files of each repository.

## Communication channels

The usual [community channels for users](/community) are meant to discuss usage
of Prometheus including using Prometheus code for non-Prometheus development
(e.g. instrumenting code with a Prometheus instrumentation library).
Development of Prometheus components themselves happens via other channels as
described in this section.

### GitHub

Contributions are reviewed in GitHub pull requests. See the [GitHub
guidelines](github-guibelines) below for details. GitHub issues are often a
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

### IRC

The IRC development channel is `#prometheus-dev` on
[irc.libera.chat](https://libera.chat/). It is also accesible via Matrix as
[`#prometheus-dev:matrix.org`](https://app.element.io/#/room/#prometheus-dev:matrix.org).
In principle, IRC/Matrix is the preferred chat-like communication channel
because it is much more open than Slack. However, in practice the traffic on
IRC is very low.

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

<!-- TODO -->

## Proposal process

<!-- TODO -->

## GitHub guidelines

<!-- PRs (CI must be green, linter pragmas within reason), commits (broken or
not), who/when to merge/rebase/squash, mention DCO -->

## Coding style

<!-- TODO: not repeating general good practices, use proper English, a lot is in the CI, see above -->

### Go style guide

<!-- https://go.dev/wiki/CodeReviewComments -->
<!-- TODO line breaks in function headers, import grouping, avoid make and new -->

## Developer summit details

Developer summits usually happen on the last Thursday each month as an online
meeting. See the [Prometheus
calendar](https://calendar.google.com/calendar/u/0/embed?src=prometheus.io_bdf9qgm081nrd0fe32g3olsld0%40group.calendar.google.com)
for the current schedule. In addition, we aim for all-day in-person summits
whenever enough active Prometheus developers are gathered at one place for some
reason, typically at a conference like [PromCon](https://promcon.io/).

The online meetings are open for everyone, while the in-person meetings might
have some restrictions for logistical reasons. In doubt, ask via the channels
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
