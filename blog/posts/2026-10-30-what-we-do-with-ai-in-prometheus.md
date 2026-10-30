---
title: "What we actually do with AI in Prometheus"
created_at: 2026-10-30
kind: article
author_name: "Bartłomiej Płotka (@bwplotka)"
---

Prometheus is a monitoring system and time series database, not an AI product. Still, over the past few months, contributors and maintainers have quietly built and adopted several AI tools across the `prometheus` organization. Some help operators query and debug running Prometheus servers. Others help maintainers survive the review queue of a large open-source project.

This post walks through what we actually ship and use today, what worked, and where we drew hard boundaries. Monitoring AI and LLM workloads with Prometheus, such as ingesting OpenTelemetry `gen_ai` metrics, scraping GPU exporters, or tracking token and latency distributions with Native Histograms, is out of scope for this article. Here, the focus is on how we use AI to operate, build, and maintain Prometheus itself.

<!-- more -->

> NOTE: This post shares my perspective as a Prometheus maintainer. Some of the maintainer workflows described below are recent experiments that we are still tuning.

## Querying and operating Prometheus with `prometheus-mcp`

The biggest user-facing addition is [`prometheus/prometheus-mcp`](https://github.com/prometheus/prometheus-mcp), an official Model Context Protocol server for Prometheus created by TJ Hoplock, `@tjhop`, which recently moved into the `prometheus` GitHub organization.

Connecting an LLM directly to a production monitoring system usually fails in two ways. Either the model hallucinates PromQL functions and metric names that do not exist in your environment, or a single `series` call on a high-cardinality instance dumps megabytes of JSON into the prompt and blows up the context window.

`prometheus-mcp` solves the first problem by giving agents structured read access to the Prometheus HTTP API alongside embedded official documentation and operational runbooks:

* Query and discovery tools cover instant and range queries, exemplar queries, series and label lookups, target discovery status, active alerts, loaded rules, runtime flags, and `tsdb_stats` cardinality reports.
* Documentation tools index the markdown files from `prometheus/docs` so an agent can look up PromQL syntax or metric naming rules before writing a query.
* Embedded runbooks, exposed via `runbooks_list` and `runbooks_read`, give agents step-by-step instructions for common operational tasks like diagnosing slow queries, investigating high cardinality, or drafting SLO recording rules.

To handle context window limits, `prometheus-mcp` supports configurable response truncation per tool call and optional [Token-Oriented Object Notation](https://github.com/toon-format/toon) encoding. Because Prometheus API responses often contain long arrays of uniform JSON objects with repeated keys, encoding them as TOON cuts token usage on large metric and target listings.

Safety defaults are strict. Destructive TSDB admin endpoints such as `delete_series`, `clean_tombstones`, and `snapshot` are disabled unless the operator starts the server with `--dangerous.enable-tsdb-admin-tools`.

## Turning documentation questions into a feedback loop

Back in April, we added the `Ask AI` search integration on `prometheus.io` through the CNCF partnership with Kapa.ai, as Arthur Silva Sens covered in the [announcement post](https://prometheus.io/blog/2026/04/22/ask-the-prometheus-docs-with-kapa-ai/). In June, we also exposed the hosted documentation MCP endpoint at `https://prometheus.mcp.kapa.ai` in [prometheus/docs#3010](https://github.com/prometheus/docs/pull/3010), so local coding agents can query `prometheus.io` docs without scraping HTML.

For users, this means you can describe a problem in plain language, or in your native language, and get an answer with links to the exact documentation pages. For maintainers, the real value goes the other way. Studying which questions users ask most often and where the model reports low confidence tells us which pages are missing or confusing, tracked in [prometheus/docs#3019](https://github.com/prometheus/docs/issues/3019). If the bot cannot answer a question from our docs, a human reading the docs probably cannot find the answer either.

## Teaching coding agents how Prometheus writes Go

Whether maintainers like it or not, contributors use coding agents to write patches. When an agent does not know a repository's conventions, the maintainer pays the price during code review.

In Prometheus, we care a lot about details that generic Go prompts miss. We avoid allocations in hot paths. We reuse slices and buffers across iterations and document caller ownership at the interface definition. We require six-run `benchstat` outputs for performance changes, prefer adding cases to existing table-driven tests over creating new test functions, and gate experimental changes behind `--enable-feature` flags or the `exp/` module in `client_golang`.

To stop repeating these rules in every review, maintainers started checking `AGENTS.md` files into our repositories, including [`prometheus/prometheus`](https://github.com/prometheus/prometheus/blob/main/AGENTS.md), [`prometheus/client_golang`](https://github.com/prometheus/client_golang/blob/main/AGENTS.md), [`prometheus/alertmanager`](https://github.com/prometheus/alertmanager/blob/main/AGENTS.md), [`prometheus/node_exporter`](https://github.com/prometheus/node_exporter/blob/master/AGENTS.md), [`prometheus/blackbox_exporter`](https://github.com/prometheus/blackbox_exporter/blob/master/AGENTS.md), [`prometheus/mysqld_exporter`](https://github.com/prometheus/mysqld_exporter/blob/main/AGENTS.md), [`prometheus/otlptranslator`](https://github.com/prometheus/otlptranslator/blob/main/AGENTS.md), and [`prometheus/prometheus-mcp`](https://github.com/prometheus/prometheus-mcp/blob/main/AGENTS.md).

We compiled these files directly from recurring review comments on merged pull requests. When we notice agents making a new mistake, we update `AGENTS.md`. For example, after seeing agents repeatedly suggest importing internal Prometheus packages as a stable Go library or writing separate test functions for every edge case, we added explicit rules in [prometheus/prometheus#19843](https://github.com/prometheus/prometheus/pull/19843) and [prometheus/prometheus#19208](https://github.com/prometheus/prometheus/pull/19208). Those files help human first-time contributors just as much as they help agents.

## Human accountability and sponsored performance agents

Making it easy to generate code creates a real problem for open-source maintainers: pull requests that the author does not understand. Reviewing a plausible-looking but subtly broken concurrency or TSDB patch takes much longer than generating it.

Our rule, which Bryan Boreham is making explicit in the pull request template in [prometheus/prometheus#19301](https://github.com/prometheus/prometheus/pull/19301), is simple. A human must submit the pull request, sign the Developer Certificate of Origin, and understand what they are submitting. If you cannot explain why your patch is safe or how you tested it, we will close the pull request.

Where agents have worked well for code changes is when an experienced human engineer sponsors the run and pairs the agent with a strict measurement loop. Recently, Tomás Senart and I have been testing [Perfloop](https://app.perfloop.ai) on `prometheus/prometheus`. Instead of asking an LLM to "make TSDB faster" and hoping for the best, each run targets a specific package, builds a benchmark, runs paired before-and-after measurements with `benchstat`, verifies zero regressions in allocations, and runs the race detector and build tags like `dedupelabels` and `forcedirectio`. Every pull request names the human who triggered and reviewed it before opening.

Several of these agent-generated patches have already merged into `main`, and newer runs are under review for TSDB performance and edge-case bugs:

* Pooling OTLP converter scratch state in [prometheus/prometheus#19388](https://github.com/prometheus/prometheus/pull/19388) and caching repeated OTLP histogram metric names in [prometheus/prometheus#19717](https://github.com/prometheus/prometheus/pull/19717), cutting allocations by 35% and execution time by 18% on explicit histogram conversions.
* Skipping unnecessary label cloning on sampled remote reads when no external labels are configured in [prometheus/prometheus#19503](https://github.com/prometheus/prometheus/pull/19503), reducing memory allocations by 23%.
* Profiling `BenchmarkCompaction` to find that `UvarintBytes` decoding inside `Symbols.Lookup` dominated CPU time, then proposing packed 16-bit offsets for small TSDB index symbol tables in [prometheus/prometheus#20160](https://github.com/prometheus/prometheus/pull/20160) to cut four-block compaction CPU time by 26%, alongside targeted TSDB bug-fix and `AppenderV2` PRs such as [prometheus/prometheus#20174](https://github.com/prometheus/prometheus/pull/20174) and [prometheus/prometheus#20186](https://github.com/prometheus/prometheus/pull/20186).

Fast, deterministic test suites make this kind of agent-assisted work safer too. In [`prometheus/compliance`](https://github.com/prometheus/compliance), we recently added full Remote-Write 2.0 sender and receiver compliance tests in [prometheus/compliance#267](https://github.com/prometheus/compliance/pull/267) and a programmatic `go test` PromQL compliance suite in [prometheus/compliance#268](https://github.com/prometheus/compliance/pull/268) that replays scrape data directly into an in-process Prometheus engine in seconds.

## Agent skills for maintainer triage and bug scrubs

If contributors have agents helping them open pull requests, maintainers need tools to help triage and review them. Over the last month, we started adding vendor-neutral agent skills under `.agents/skills/` in `prometheus/prometheus`.

The first is [`pr-triage-board`](https://github.com/prometheus/prometheus/pull/20166). In a repository with over 500 open pull requests, GitHub's default list view hides what actually needs maintainer attention. The skill runs a Python script against the GitHub GraphQL API, cross-references changed files against `CODEOWNERS` and `MAINTAINERS.md`, checks DCO sign-off and PR hygiene, and sorts open pull requests into turn-based buckets:

* **Quick Wins** for pull requests with 60 or fewer changed lines, green CI, and clean hygiene that a maintainer can review and merge in five minutes.
* **Updated After Review** for pull requests where the author pushed commits or answered every review comment since the last maintainer review, returning the turn to the reviewer.
* **Waiting on Maintainer** for pull requests ready for their first review, with proposed owners matched from `CODEOWNERS`.
* Collapsed sections at the bottom for pull requests waiting on the author, failing CI, or needing a rebase.

We run this hourly on weekdays to update pinned live dashboards in [prometheus/prometheus#20165](https://github.com/prometheus/prometheus/issues/20165), [prometheus/client_golang#2190](https://github.com/prometheus/client_golang/issues/2190), and [prometheus/common#1023](https://github.com/prometheus/common/issues/1023). As documented in `CONTRIBUTING.md`, contributors can see exactly what puts a pull request at the top of the maintainer review queue.

The second skill, proposed in [prometheus/prometheus#20192](https://github.com/prometheus/prometheus/pull/20192), is `bug-scrub-triage`. During our regular Prometheus bug scrubs, maintainers go through the oldest untouched issues and pull requests and leave a `"Hello from the bug scrub!"` comment. A lot of time in those calls goes into archaeology: checking whether a linked pull request already fixed the issue six months ago, whether the author ever replied to review comments, which repository an out-of-scope issue actually belongs to, or who owns the affected package.

To build `bug-scrub-triage`, we analyzed 117 pull request and 421 issue bug-scrub comments across more than 1,000 historical items in `prometheus/prometheus`. The script fetches the candidates, checks timeline cross-references and prior bug scrub pings, and prepares a queue with concrete recommended actions and draft `"Hello from the bug scrub!"` comments. Maintainers stay in the loop and decide what to post, turning a slow lookup exercise into a fast review decision.

## Come build with us

None of these tools replace human maintainers or architectural consensus at the Prometheus Dev Summit. What they do is remove repetitive toil: looking up docs, formatting boilerplate tests, hunting down which pull requests are waiting on a reviewer, or digging through five-year-old issue timelines.

If you want to try these out or contribute:

* Try [`prometheus/prometheus-mcp`](https://github.com/prometheus/prometheus-mcp) against your Prometheus setup and help us improve its embedded runbooks and tool schemas.
* Check the live [PR Triage Dashboard](https://github.com/prometheus/prometheus/issues/20165) if you have an open pull request or want to help review.
* Read `AGENTS.md` in your favorite Prometheus repository before pointing a coding agent at an issue, and make sure you understand and verify every commit before opening a pull request.
