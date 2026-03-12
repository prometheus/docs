---
title: Visualizing Target Relabeling Rules in Prometheus 3.8.0
created_at: 2025-12-02
kind: article
author_name: Julius Volz (@juliusv)
---

Prometheus' [target relabeling](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#relabel_config) feature allows you to adjust the labels of a discovered target or even drop the target entirely. Relabeling rules, while powerful, can be hard to understand and debug. Your rules have to match the expected labels that your service discovery mechanism returns, and getting any step wrong could label your target incorrectly or accidentally drop it.

To help you figure out where things go wrong (or right), Prometheus 3.8.0 [just added a relabeling visualizer](https://github.com/prometheus/prometheus/pull/17337) to the Prometheus server's web UI that allows you to inspect how each relabeling rule is applied to a discovered target's labels. Let's take a look at how it works!

<!-- more -->

## Using the relabeling visualizer

If you head to any Prometheus server's "Service discovery" page (for example: https://demo.promlabs.com/service-discovery), you will now see a new "show relabeling" button for each discovered target:

![Service discovery page screenshot](/assets/blog/2025-12-02/prometheus-sd-page-show-relabeling.png)

Clicking this button shows you how each relabeling rule is applied to that particular target in sequence:

<video playsinline muted autoplay loop controls>
  <source src="/assets/blog/2025-12-02/prometheus-sd-page-relabeling-visualizer.mp4" type="video/mp4" />
  <p>Sorry, your browser does not support videos.</p>
</video>

The visualizer shows you:

* The **initial labels** of the target as discovered by the service discovery mechanism.
* The details of **each relabeling rule**, including its action type and other parameters.
* **How the labels change** after each relabeling rule is applied, with changes, additions, and deletions highlighted in color.
* Whether the target is ultimately **kept or dropped** after all relabeling rules have been applied.
* The **final output labels** of the target if it is kept.

To debug your relabeling rules, you can now read this diagram from top to bottom and find the exact step where the labels change in an unexpected way or where the target gets dropped. This should help you identify misconfigurations in your relabeling rules more easily.

## Conclusion

The new relabeling visualizer in the Prometheus server's web UI is a powerful tool to help you understand and debug your target relabeling configurations. By providing a step-by-step view of how each relabeling rule affects a target's labels, it makes it easier to identify and fix issues in your setup. Update your Prometheus servers to 3.8.0 now to give it a try!
