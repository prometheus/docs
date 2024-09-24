---
title: Setting Up Prometheus Alerts with Webex Integration
created_at: 2024-09-24
kind: article
author_name: Akshay Awate
---

In this guide, we will walk you through integrating Prometheus with Webex to send alerts directly to your Webex spaces. This is especially useful for teams using Webex for collaboration, as it allows you to receive real-time alerts on the platform.

## Overview
We’ll cover the following:

1. Installation and prerequisites.
2. Creating a Webex Bot.
3. Retrieving the room_id using the Webex API.
4. Configuring Alertmanager to send alerts to Webex.
5. Securing your Bot Token with Kubernetes secrets.

1. Installation and Prerequisites
  To get started, ensure that you have Prometheus and Alertmanager installed. If not, you can refer to the Prometheus documentation for     
  installation instructions.

  ## Tools required:
  1. Prometheus and Alertmanager.
  2. Webex account with developer access.
  3. Working Kubernetes cluster (for deploying Alertmanager).
  
2. Creating a Webex Bot
  To integrate Webex with Prometheus, you'll first need to create a bot in Webex Teams that will handle receiving and sending messages on 
  your behalf.
  
  ## Steps to Create a Webex Bot:
    1. Log in to the Webex Developer Portal: Head to the Webex Developer Portal and log in.
    2. Navigate to My Apps: Once logged in, click on "My Apps" from the top navigation bar.
    3. Create a New App: Select "Create a New App" and choose "Create a Bot.
  
  Fill in the Details:
  
  **Bot Name:** Choose a name that reflects the bot's purpose (e.g., PrometheusAlertBot).
  
  **Bot Username:** A unique identifier for your bot.
  
  **Generate Access Token:** After the bot is created, you’ll be provided with an access_token. Copy this token and save it securely. This 
     will be used later to authenticate API requests.

3. Invite the Bot to a Webex Channel
Now that you have a bot, you need to add it to a Webex space where it can post alerts.

Steps:
Create a Webex Space: In Webex Teams, create a space (channel) for your alerts.

Invite the Bot: Go to the "Add People" section of your space and invite your bot by using its bot username.

Once added, your bot will be able to receive and send messages within the space.

4. Retrieving the room_id Using the Webex API
  To configure Prometheus to send alerts to Webex, you'll need the room_id of the space where you invited your bot.
  
  Steps to Retrieve room_id:
  Open your terminal and run the following command, replacing YOUR_ACCESS_TOKEN with the token you generated earlier:

  ```
  curl -s -X GET -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' https://webexapis.com/v1/rooms | jq .
  ```
  The response will contain a list of rooms the bot is part of. Look for the room where you invited the bot and copy the room_id.
  
  This room_id will be used to configure Alertmanager to send alerts to the right Webex space.

5. Configuring Alertmanager to Send Alerts to Webex
  Now that you have the room_id and access_token, it's time to configure Alertmanager to forward alerts to Webex.

  Step 1: Modify alertmanager.yaml
  Update your Alertmanager configuration to include a new receiver for Webex:
  ```
  receivers:
    - name: webexroom
      webex_configs:
        - room_id: "add_room_id_here"
          message: "CPU usage is high"
          http_config:
            authorization:
              type: Bearer
              credentials: "add_bot_token_here"
  ```
  In this configuration:
  
  Replace add_room_id_here with the actual room_id you retrieved earlier.
  Replace add_bot_token_here with the access token generated for your bot.
  Step 2: Secure Your Bot Token Using Kubernetes Secrets
  Since the bot token is sensitive information, it’s a best practice to store it securely using Kubernetes secrets. Follow these steps to     create a Kubernetes secret for the bot token:
  
  Create a Secret:
  
  Save your bot token in base64 encoding (you can encode it using ```echo -n "your_token" | base64```, and create the following secret 
  configuration file:
  
  ```
  apiVersion: v1
  kind: Secret
  metadata:
    name: apc-webex-receiver
  type: Opaque
  data:
    Bearer: your_encoded_token
  ```
  Add the Secret to AlertmanagerSpec:
  
  In your Alertmanager Helm chart or Kubernetes configuration, add the secret name to the alertmanagerSpec:
  ```
  alertmanagerSpec:
    secrets:
    - apc-webex-receiver
  ```
  Modify Alertmanager Config to Use Secret:
  
  Update the credentials_file to point to the secret in your Kubernetes cluster:
  ```
  receivers:
    - name: webexroom
      webex_configs:
        - room_id: "your_room_id"
          message: "CPU usage is high"
          http_config:
            authorization:
              type: Bearer
              credentials_file: /etc/alertmanager/secrets/apc-webex-receiver/Bearer
  ```
  This ensures your token is securely managed and not hardcoded into configuration files.

6. Using Templating for Dynamic Alerts
  If you want to loop through multiple alerts and send them as a formatted message, you can use the templating feature in Alertmanager’s message field.
  
  For example:
  ```
  message: >-
    {{ range .Alerts }}
      *Alert:* {{ .Labels.alertname }}
      *Cluster:* {{ .Labels.cluster }}
    {{ end }}
  ```
This will format the alerts in a user-friendly way, providing more context in your Webex notifications.
