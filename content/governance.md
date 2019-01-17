---
title: Governance
layout: page

---

# Governance

This document describes the rules and governance of the project. It is meant to be followed by all the developers of the project and the Prometheus community. Common terminology used in this governance document are listed below:

* **Team members**: Any members of the private [prometheus-team][team] Google group.

* **Maintainers**: Maintainers lead an individual project or parts thereof ([`MAINTAINERS.md`][maintainers.md]).

* **Projects**: A single repository in the Prometheus [GitHub organization][gh] is referred to as a project.

* **The Prometheus project**: The sum of all activities performed under this governance, concerning one or more repositories or the community.

## Values

The Prometheus developers and community are expected to follow the values defined in the [CNCF charter][charter], including the [CNCF Code of Conduct][coc]. Furthermore, the Prometheus community strives for kindness, giving feedback effectively, and building a welcoming environment. The Prometheus developers generally decide by consensus and only resort to conflict resolution by a majority vote if consensus cannot be reached.

## Projects

Each project must have a `MAINTAINERS.md` file with at least one maintainer. Where a project has a release process, access and documentation should be such that more than one person can perform a release. Releases should be announced on the [prometheus-users mailing list][users]. Any new projects should be first proposed on the [developers mailing list][devs] following the voting procedures listed below. When a project is no longer relevant, it should be moved to the prometheus-junkyard GitHub organization.

## Decision making

### Team members 

Team member status may be given to those who have made ongoing contributions to the Prometheus project for at least 3 months. This is usually in the form of code improvements and/or notable work on documentation, but organizing events or user support could also be taken into account. 

New members may be proposed by any existing member by email to [prometheus-team][team]. It is highly desirable to reach consensus about acceptance of a new member. However, the proposal is ultimately voted on by a formal [supermajority vote](#supermajority-vote).

If the new member proposal is accepted, the proposed team member should be contacted privately via email to confirm or deny their acceptance of team membership. This email will also be CC'd to [prometheus-team][team] for record-keeping purposes.

If they choose to accept, the following steps are taken:

* Team members are added to the [GitHub organization][gh] as _Owner_.
* Team members are added to the [team mailing list][team].
* Team members are added to the list of team members in this document.
* New team members are announced on the [developers mailing list][devs] by an existing team member.

Team members may retire at any time by emailing [the team][team].

Team members can be removed by [supermajority vote](#supermajority-vote) on [the team mailing list][team]. For this vote, the member in question is not eligible to vote and does not count towards the quorum.

Upon death of a member, their team membership ends automatically.

The current team members are:

* Ben Kochie
* Björn Rabenstein
* Brian Brazil
* Fabian Reinartz
* Frederic Branczyk
* Ganesh Vernekar
* Goutham Veeramachaneni
* Johannes Ziemke
* Julius Volz
* Krasi Georgiev
* Matt Layher
* Matthias Rampke
* Max Inden
* Richard Hartmann
* Simon Pasquier
* Steve Durrheimer
* Stuart Nelson
* Tobias Schmidt
* Tom Wilkie

### Maintainers

Maintainers lead one or more project(s) or parts thereof and serve as a point of conflict resolution amongst the contributors to this project. Ideally, maintainers are also team members, but exceptions are possible for suitable maintainers that, for whatever reason, are not yet team members.

Changes in maintainership have to be announced on the [developers mailing list][devs]. They are decided by [lazy consensus](#consensus) and formalized by changing the `MAINTAINERS.md` file of the respective repository.

Maintainers are granted commit rights to all projects in the [GitHub organization][gh].

A maintainer or committer may resign by notifying the [team mailing list][team]. A maintainer with no project activity for a year is considered to have resigned. Maintainers that wish to resign are encouraged to propose another team member to take over the project.

A project may have multiple maintainers, as long as the responsibilities are clearly agreed upon between them. This includes coordinating who handles which issues and pull requests.

### Technical decisions

Technical decisions that only affect a single project are made informally by the maintainer of this project, and [lazy consensus](#consensus) is assumed. Technical decisions that span multiple parts of the Prometheus project should be discussed and made on the [Prometheus developer mailing list][devs].

Decisions are usually made by [lazy consensus](#consensus). If no consensus can be reached, the matter may be resolved by [majority vote](#majority-vote).

### Governance changes

Material changes to this document are discussed publicly on the [developer mailing mailing list][devs]. Any change requires a [supermajority](#supermajority-vote) in favor. Editorial changes may be made by [lazy consensus](#consensus) unless challenged.

### Other matters

Any matter that needs a decision, including but not limited to financial matters, may be called to a vote by any member if they deem it necessary. For financial, private, or personnel matters, discussion and voting takes place on the [team mailing list][team], otherwise on the [developer mailing list][devs].

## Voting

The Prometheus project usually runs by informal consensus, however sometimes a formal decision must be made.

Depending on the subject matter, as laid out [above](#decision-making), different methods of voting are used.

For all votes, voting must be open for at least one week. The end date should be clearly stated in the call to vote. A vote may be called and closed early if enough votes have come in one way so that further votes cannot change the final decision.

In all cases, all and only [team members](#team-members) are eligible to vote, with the sole exception of the forced removal of a team member, in which said member is not eligible to vote.

Discussion and votes on personnel matters (including but not limited to team membership and maintainership) are held in private on the [team mailing list][team]. All other discussion and votes are held in public on the [developer mailing list][devs].

For public discussions, anyone interested is encouraged to participate. Formal power to object or vote is limited to [team members](#team-members).

### Consensus

The default decision making mechanism for the Prometheus project is [lazy consensus][lazy]. This means that any decision on technical issues is considered supported by the [team][team] as long as nobody objects.

Silence on any consensus decision is implicit agreement and equivalent to explicit agreement. Explicit agreement may be stated at will. Decisions may, but do not need to be called out and put up for decision on the [developers mailing list][devs] at any time and by anyone.

Consensus decisions can never override or go against the spirit of an earlier explicit vote.

If any [team member](#team-members) raises objections, the team members work together towards a solution that all involved can accept. This solution is again subject to lazy consensus.

In case no consensus can be found, but a decision one way or the other must be made, any [team member](#team-members) may call a formal [majority vote](#majority-vote).

### Majority vote

Majority votes must be called explicitly in a separate thread on the appropriate mailing list. The subject must be prefixed with `[VOTE]`. In the body, the call to vote must state the proposal being voted on. It should reference any discussion leading up to this point.

Votes may take the form of a single proposal, with the option to vote yes or no, or the form of multiple alternatives.

A vote on a single proposal is considered successful if more vote in favor than against.

If there are multiple alternatives, members may vote for one or more alternatives, or vote “no” to object to all alternatives. It is not possible to cast an “abstain” vote. A vote on multiple alternatives is considered decided in favor of one alternative if it has received the most votes in favor, and a vote from more than half of those voting. Should no alternative reach this quorum, another vote on a reduced number of options may be called separately.

### Supermajority vote

Supermajority votes must be called explicitly in a separate thread on the appropriate mailing list. The subject must be prefixed with `[VOTE]`. In the body, the call to vote must state the proposal being voted on. It should reference any discussion leading up to this point.

Votes may take the form of a single proposal, with the option to vote yes or no, or the form of multiple alternatives.

A vote on a single proposal is considered successful if at least two thirds of those eligible to vote vote in favor.

If there are multiple alternatives, members may vote for one or more alternatives, or vote “no” to object to all alternatives. A vote on multiple alternatives is considered decided in favor of one alternative if it has received the most votes in favor, and a vote from at least two thirds of those eligible to vote. Should no alternative reach this quorum, another vote on a reduced number of options may be called separately.

## FAQ

This section is informational. In case of disagreement, the rules above overrule any FAQ.

### How do I propose a decision?

Send an email to [the developer mailing list][devs] with your motion. If there is no objection within a reasonable amount of time, consider the decision made. If there are objections and no consensus can be found, a vote may be called by a team member.

### How do I become a team member?

To become an official team member, you should make ongoing contributions to one or more project(s) for at least three months. At that point, a team member (typically a maintainer of the project) may propose you for membership. The discussion about this will be held in private, and you will be informed privately when a decision has been made. A possible, but not required, graduation path is to become a maintainer first.

Should the decision be in favor, your new membership will also be announced on the [developers mailing list][devs].

### How do I add a project?

As a team member, propose the new project on the [developer mailing list][devs]. If nobody objects, create the project in the GitHub organization. Add at least a `README.md` explaining the goal of the project, and a `MAINTAINERS.md` with the maintainers of the project (at this point, this probably means you).

### How do I archive or remove a project?

Send an email to the [developer mailing list][devs] proposing the retirement of a project. If nobody objects, move it to the prometheus-junkyard GitHub organization.

### How do I remove an inactive maintainer?

A maintainer may resign by notifying the [team mailing list][team]. A maintainer with no project activity for a year will be treated as if they had resigned. If there is an urgent need to replace a maintainer, discuss this on the [team mailing list][team].

### How do I remove a team member?

Team members may resign by notifying the [team mailing list][team]. If you think a team member should be removed against their will, propose this to the [team mailing list][team]. Discussions will be held there in private.

[team]: https://groups.google.com/forum/#!forum/prometheus-team
[gh]: https://github.com/prometheus
[devs]: https://groups.google.com/forum/#!forum/prometheus-developers
[users]: https://groups.google.com/forum/#!forum/prometheus-users
[maintainers.md]: https://github.com/search?l=&q=org%3Aprometheus+filename%3AMAINTAINERS.md+path%3A%2F&ref=advsearch&type=Code&utf8=%E2%9C%93
[charter]: https://www.cncf.io/about/charter/
[coc]: https://github.com/cncf/foundation/blob/master/code-of-conduct.md
[lazy]: https://couchdb.apache.org/bylaws.html#lazy
