This document is useful for copy and pasting into https://github.com/settings/replies - feel free to change wording to your preference.
It's good to have a bit of variety in our responses, anyway.
If should be possible to combine any of these snippets. Simply cut off the initial thank you blurb from a snippet and replace with "Also,". Any combination should create a sane flow, even if most of them obviously wouldn't make much sense.

All these snippets follow the same basic layout

1. Thank people.
They actually took the time to create an issue/PR. Some took more time, some less time; for some it was hard, for others it was trivial. Disregarding all this, we simply thank them first as they are doing more than 99% of our userbase.
2. Acknowledge their need for help.
Unless it's a PR for a typo, most likely they actually feel a need for whatever they are asking about.
2. Give context.
Considerations, better places to go with this, etc. If it's anything we have docs on, enable them to come up to speed with the factual basis we have.
3. Provide a course of action.
At the least, if we close anything quickly, we should tell them they can ask to re-open, or where else to take this. Again, take into account that there's a need they feel they need to address, somehow.

It's not always feasible, or even possible, to fill out the XXX used in the snippets below. Still, we should try to make it point to relevant URLs/information. People will land on these issues via search engines for a long time and this builds knowledge in our userbase, so this will hopefully even save us time in the long run.



# Issues


## User Support

Thanks for your report. It looks as if this is actually a question about usage and not development because XXX

To make your question, and all replies, easier to find, we suggest you move this over to our [user mailing list](https://groups.google.com/forum/#!forum/prometheus-users), which you can also search. If you prefer more interactive help, join or our [IRC channel](https://web.libera.chat/#prometheus), #prometheus on irc.libera.chat. Please be aware that our IRC channel has no logs, is not searchable, and that people might not answer quickly if they are busy or asleep. If in doubt, you should choose the mailing list.

If you think this is not purely a support question, feel free to comment in here or take the underlying issues to our [developer mailing list](https://groups.google.com/forum/#!forum/prometheus-developers).

Once your questions have been answered, please add a short line pointing to relevant replies in case anyone stumbles here via a search engine in the future.

All that being said, in your specific case, it might make sense to / please look at / our reasoning can be found at XXX


# PRs


## DCO

Thanks for your PR. For legal reasons, we require that all commits are signed with a [DCO](https://developercertificate.org/) before we can merge them. See [this blog post](https://www.cncf.io/blog/2016/11/08/cloud-native-software-can-trust/) for considerations around this.

This means that the last line of your commit message should read like:

`Signed-Off-By: Your Name <your@email.address>`

If you are using GitHub through the web interface, it's quickest to close this PR and open a new one with the appropriate line.

If you are using Git on the command line, it is probably quickest to amend and force push. You can do that with
````
git commit --amend --signoff
git push -f $remote $remote_branch_for_pr
````

As always, be careful when force-pushing.


## Moratorium on integrations (SD & Alertmanager)

Thanks for suggesting this change. Unfortunately, we are currently not accepting new integrations.

We can only provide the stability and performance we want to provide if we can test integrations in an automated and scalable fashion. For this reason, we are suggesting people integrate with the help of our generic interfaces by either integrating natively or putting a rewriting proxy in the middle. We would be more than happy to list this on our integrations page.

Even if existing integrations can not be tested in an automated fashion, we will not remove them for reasons of compatibility. This also means that any additions we take on, or any changes to existing integrations we make or accept, will mean maintaining and testing these until at least the next major version, realistically even beyond that.

Feel free to question this answer on our [developer mailing list](https://groups.google.com/forum/#!forum/prometheus-developers), but be aware it's unlikely that you will get a different answer.


# Issue or PR


## Duplicate

Thanks for reporting this. It seems we already have this issue tracked at XXX

Thus, we are closing this one for now. If you think this was in error, don't hesitate to comment.


## Non-trivial

Thanks for this. This topic is not as easy as it looks; we actually already had some discussions and considerations about this topic, for more context please look here XXX

You are also welcome to discuss this further on our [developer mailing list](https://groups.google.com/forum/#!forum/prometheus-developers).


## Out of scope

Thank you for taking the time to write this out. Unfortunately, this is out of scope for what we are trying to achieve. You can find more information regarding our reasoning here XXX


#### Philosophy

As this goes against our core philosophy, it's near certain that Prometheus will never address this.

You might want to look at an alternative, such as XXX


#### Non-Goal

This is actually one of our non-goals. We are unlikely to change our minds on this, but feel free to raise this issue on our [developer mailing list](https://groups.google.com/forum/#!forum/prometheus-developers). Please do not be surprised if the answer still remains a simple "no" along with pointing to our docs.


#### Against goal / design decision

As this goes against one of our stated goals/design decisions, we are unlikely to change our minds on this, but feel free to raise this issue on our [developer mailing list](https://groups.google.com/forum/#!forum/prometheus-developers). Please understand if the answer still remains a simple "no" pointing to our docs.
