---
title: "What Instrumenting a Django App Taught Me About Prometheus and OpenTelemetry Docs"
created_at: 2026-03-26
kind: article
author_name: "Nweneary Uzochukwu Winnie (@wineshuga)"
---

I had one rule: official documentation only. No tutorials, no Stack Overflow, no AI. Just me and the docs. Currently, I am contributing to Prometheus as an LFX mentee. This is the first in a series documenting my experience with this mentorship.

My work is to improve Prometheus and OpenTelemetry interoperability documentation. To do that well, I need to get first-hand experience with Prometheus and OpenTelemetry. The goal is to have a feel of their documentation and identify areas that could be improved. 

So here’s what I did. I got a Django app I worked on about a month ago and tried instrumenting from scratch with both tools. Surprisingly, while one documentation held my hand for most of the process, the other left me at some point, and I had to take a shortcut.

<!-- more -->

## Getting Started With OpenTelemetry

OpenTelemetry documentation was welcoming. From the first page of the documentation, I got a very easy-to-understand introduction, and the information structure from one page to the next painted a good mental picture of what OpenTelemetry is and how it works. If you are seeking to understand OpenTelemetry concepts, the docs did a really good job. An example is [the getting started page for Python](https://opentelemetry.io/docs/languages/python/getting-started/). It summarizes the whole idea of using OpenTelemetry with Python. The examples are very clear and easy to implement, even in an existing application. Granted, there are still many deeper things to learn, but these introduction pages provide all the information needed to begin work. 

Most of the steps I took to instrument my Django app I found on [this OpenTelemetry documentation for Python instrumentation](https://opentelemetry.io/docs/languages/python/instrumentation/). It basically contains a copy-and-paste guide. For clarity, these were the steps that I took to instrument my Django app with OpenTelemetry for metrics data:
1. Installed the OpenTelemetry API and SDK
2. Copied and pasted the first configuration under [the metrics section](https://opentelemetry.io/docs/languages/python/instrumentation/#metrics) in my app.py file 
3. Created instruments for measuring metrics, as the examples show.
4. Called these instruments in the functions where they are needed
5. Created a middleware to record HTTP request metrics
6. Included the app and middleware in the INSTALLED_APPS and MIDDLEWARE settings

You can see these in [this pull request made in the project's repository here](https://github.com/Wineshuga/task-manager/pull/7).

## Finding My Way With Prometheus

Probably out of some kind of bias, I must admit, I expected Prometheus Instrumentation to be more straightforward than OpenTelemetry. After all, Prometheus focuses mainly on one type of telemetry data — metrics. However, on the third day, I was still trying to figure out what some example configurations I found in the documentation meant. If the goal of reading is to understand Prometheus and what it does, the documentation is clear about these. I found the overview easy to understand and pretty clear. Downloading Prometheus and configuring it to scrape data was also a breeze. I had no challenge doing these whatsoever.

The challenge was in instrumenting my own application. Remember, I used a Django app for this exercise, so everything I say here is from the Python/Django documentation point-of-view. Now, during my dive into the documentation, I came across [this page on the available Prometheus client library for programming languages](/docs/instrumenting/clientlibs.md). I clicked on Python and was directed to the client-python GitHub repository, where the documentation is linked in the README file. Now here is the blocker. The example configuration in this documentation focused largely on exporting metrics, so much so that it failed to show users how to use the library on an existing application. It is great for a quick test of Prometheus, but for someone who has never used the tool or any like it, it is a challenge to understand how to configure their own application. This was my blocker. I got lost.

As I dug deeper, I noticed two options for instrumenting a Django application before me:
1. Use `prometheus-client` directly for full customization and flexibility
2. Use an external package called `django-prometheus` for ready-made monitoring metrics

I wanted flexibility. I tried the first option. But the examples, as I said earlier, were no help for an existing project. And so 3 days after, I had to settle for option 2, using `django-prometheus`. 
Here are the steps that I took:
1. Installed django-prometheus
2. Included the metrics endpoint in the URL file
3. Added django-prometheus to the installed apps in the settings
4. Included the django-prometheus middleware in the settings

Using django-prometheus was fast and easy. I got pre-built, ready-made metrics for Django, like request counts and response times, with very little setup. But I lost control of deciding what to measure, how to name it, and what labels to attach. You can check out [my implementation in the repository here](https://github.com/Wineshuga/task-manager/pull/6).

## My Conclusion

The biggest difference I experienced was not in the tools themselves, but in how they guide the user. Using OpenTelemetry was a smoother process. I learned more about manual instrumentation from the documentation than I did when I tried Prometheus. For Prometheus, I got so confused that I had to settle for a shortcut in Django so I could move ahead. To achieve full customization with Prometheus, one would need additional resources and guidance, as the documentation, at the time of this writing, does not contain enough to help users get started with their own app.

If your goal is to quickly expose metrics and move on, using an external package might be the fastest option, depending on the language and framework (I only have a point of view from the Django Python framework). This might mean that you may trade flexibility for speed and ease.

As part of my role in this mentorship, I will be creating a proposal to improve [the client-python documentation](https://prometheus.github.io/client_python) so that the examples cover a wider picture, as discussed in this article. I will also be exploring other areas of the documentation. The goal is to remove the blockers I encounter so that other users do not have to face them. If you have any observations you’d like to share relating to this work, you can find me on [LinkedIn](https://www.linkedin.com/in/uzochukwu-winnie/) or in the [#prometheus-dev](https://cloud-native.slack.com/archives/C01AUBA4PFE) channel of the CNCF Slack community using my name, Uzochukwu Winnie.
