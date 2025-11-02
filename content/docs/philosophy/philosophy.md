---
title: Philosophy
sort_rank: 2
---

# Do one thing well

We believe in the [Unix
philosophy](https://en.wikipedia.org/wiki/Unix_philosophy), abridged from [Doug
McIlroy's initial version from 1978](http://emulator.pdp-11.org.ru/misc/1978.07_-_Bell_System_Technical_Journal.pdf):

1. Make each program do one thing well.
  While the scope of "one thing" invariably encompasses more and more
  elements due to increased overall system and computing complexity, we are
  still doing one thing: ingest metric data, do computations on it, and expose
  it to other systems.
2. Expect the output of every program to become the input to another, as yet unknown, program.
  Today's lingua franca is HTTP endpoints, which are used by Prometheus
  extensively.
  In the same vein, Prometheus relies heavily on its own libraries and strict
  layering internally.
3. Design and build software, even operating systems, to be tried early, ideally within weeks. Don't hesitate to throw away the clumsy parts and rebuild them.
  Prometheus will always be available for free as in beer and as in speech.
  We ensure that master always builds, called Continuous Integration these days,
  and we not afraid to replace whole sections of our codebase, e.g. our storage
  engine.
4. Use tools in preference to \[manual work\]
  Automation where possible is still one of the core characteristics any modern
  philosophy.

# Work well across a variety of paradigms

There are a lot of paragims which fundamentally try to achieve clean design,
implementation, and operation. We are not bound to any single of them, but
Prometheus tends to work well with any good practice.

# Be pragmatic

To not lose focus, we need to be honest to our users and ourselves about what we
can do and not do.

# Be open

We will always put as much of our code, discussions, presentations, and other
content as possible into a form and place which is accessible in the long term,
free of charge.

# Be opionated

One size does never fit all, so we need to deliberately choose what we want to
achieve and what not. We can not, and do not try to, fill every single niche.

# Play well with others

Prometheus is a project of convinced and passionate individuals. As we do not
have a profit motive, nor quarterly projections, or any other requirement to
meet arbitrary business requirements, we can focus on getting things right. This
also means that we are free to suggest other implementations and projects if
they are a better fit for a particular use-case.

# Be inclusive - TODO, move elsewhere

We strongly believe that technology should be accessible to all. As such, we
will always strive to be welcoming to everyone.

As an example of this, many of us are investing their personal time helping
individuals or communities by educating and helping them to be more productive
in the tech sector, as well as sponsoring diversity efforts, for example paying
for travel and accommodation at [PromCon](https://promcon.io).
