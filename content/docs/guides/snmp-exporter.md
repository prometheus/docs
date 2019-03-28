---
title: Understanding and using the SNMP exporter
---
# Understanding and using the SNMP exporter

This guide will introduce you to the SNMP exporter. We will:

* explain the basics of SNMP,
* what parts of SNMP the exporter supports,
* what OID and MIB are, 
* how to configure the SNMP exporter using the snmp.yml and
* how to use the generator.yml to create snmp.yml with less effort.

# Summary

The SNMP server is mostly useful for devices (mostly network gear and large office coffee makers) whose operating system you don’t control and that don’t speak IPMI (another similar more modern protocol). If you do have control over the operating system and you can run software on it (and that is what I understood is the case with your linux machine) it is simpler to just run the node-exporter. It is easier to configure and it will give you metrics with less latency.

I was in a similar situation to you a while ago and there are a few different concepts to understand. Please forgive me, if I mention something you know already, as I might not know that you know and also this is hopefully helpful for others that search for SNMP later. I’ll likely forget things and might make mistakes. Please correct me if you see them.

# A few basics about SNMP

SNMP is an old metrics, config and alert protocol that was primarily designed for network appliances in the 1980ies and 1990ies. Tons of devices speak some version of it. Network gear, servers, printers, copiers, even some larger office coffee machines.

## GET, SET, TRAP

There are three important modes of communication:
1. One where your agent (in our case the snmp_exporter) asks the SNMP-device for information and gets a response.
2. One where you configure a setting on the device and get a response.
3. One were the SNMP-device sends a message without prior request to your agent.

Number 3 is called a TRAP and is used for alerts (that have the unfortunate tendency to get silently lost in a broken network), number 2 is called a SET and is not used much because of security issues and because there are more comfortable config management mechanisms nowadays and number 1 is a GET (but not the HTTP kind) and used for classical metrics.
The Prometheus snmp_exporter only handles the number 1 kind of communication.

## OID and MIBs

SNMP has a tree structure. To get a certain metric you need to request an OID, which is a long line of decimal numbers divided by dots. Each number gives means you choose a certain branch in the tree. E.g.: 1.3.6.1.4.1.9.9.719.1.1.1.1.16
You could just start at the beginning and ask the device for the next point (as they are numbered that is pretty easy to do) until you have gotten everything. That is called a "complete walk". But as Brian mentioned that takes forever (can easily take half an hour on some devices) and is nothing you want to do all the time.
Furthermore these numbers are uninformative for humans and also you don’t know what the return value will be, e.g. a table, a string or a number or a hex-value.
So there are MIBs, those are databases (text files in a somewhat human decipherable format) where each OID in a certain subbranch is documented with a name, an explanation and what kind of value is returned.
Each MIB file only documents its subbranch of the tree, so you need some for the basic values and another one for your device. And for some vendors even more than one.

# The snmp.yml and the generator.yml

The exporter uses the snmp.yml file to know which OID it should walk, how they are and how they should be combined (for example to match certain values with certain names, etc.) and correct some mistakes in the MIB (wrong types and spelling mistakes are common).
You can write the snmp.yml by hand but it is more comfortable to let the generator make one you need based on the generator.yml. Sometimes you have to correct the snmp.yml a little bit by hand because the generator cannot yet generate all the magic the snmp_exporter is capable to execute.

Here is a small example from a generator.yml that makes use of some of the most common functions:

module:
  cisco-ucs:
    walk:
      - 1.3.6.1.4.1.9.9.719.1.1.1.1.16 #cucsFaultOccur
    lookups:
      - old_index: cucsFaultIndex
        new_index: cucsFaultDn
    overrides:
      cucsFaultDn:
        type: DisplayString
So what does this do?
1. We walk the cucsFaultOccur to get a counter for errors. Each will be labeled with an index that is given by the device.
2. Because that index is rather useless we then look up cucsFaultDn which contains a long string with useful informative values (like what is broken on which machine with wich error code?) and match and replace the aforementioned cucsFaultIndex with it. So we get a nice label with useful information and have good timeseries. 
3. In a later relabeling step in the config.yml we split that one long string label into single labels to make it more useful when querying and allow queries like "count all errors of hard drives by blade".
4. And because unfortunately the cucsFaultDn is slightly faulty described in the MIB, hence we override its type to what it actually is, a DisplayString.

Of course your values will be different as these are highly vendor and somewhat device specific and of course you need to get the metrics that are of interest for you.

I hope this gives you some more insight. I have to attend a meeting now, but feel free to ask more questions.
I wish you fun and perseverance!

