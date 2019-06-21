---
title: Monitoring Kubernetes Ingress with Ambassador
---

# Monitoring Kubernetes Ingress with Ambassador
[Ambassador](https://www.getambassador.io/) is a popular open-source API gateway for Kubernetes. Built on [Envoy Proxy](https://www.envoyproxy.io), Ambassador natively exposes statistics that give you better insight to what is happening at the edge of your Kubernetes cluster. In this guide we will: 

* Create a simple Kubernetes application
* Deploy Ambassador as your Kubernetes ingress controller
* Deploy Prometheus in Kubernetes using the [prometheus-operator](https://github.com/coreos/prometheus-operator)
* Examine some metrics related to the performance of Kubernetes application at the edge

## Prerequisites
* A Kubernetes Cluster
* The [Kubernetes command line tool](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

## Deploy and Expose an Application on Kubernetes
First things first, we need get an application running on Kubernetes for our users to access. You can deploy any application you would like but for simplicity, we will use a [sample application](https://www.getambassador.io/user-guide/getting-started#3-creating-your-first-service) provided by the Ambassador team.

We can quickly deploy this application using `kubeclt`:

```
kubectl apply -f https://getambassador.io/yaml/tour/tour.yaml
```

Check the application's status and wait for it to start running:

```
$ kubectl get po --selector=app=tour

NAME                    READY   STATUS    RESTARTS   AGE
tour-6df995489d-lc9hs   2/2     Running   0          1m
```

Now that we have an application running in Kubernetes, we need to expose it to the outside world. We will do this with Ambassador so we can gather metrics about the requests.

1. Deploy Ambassador to your cluster with Kubectl:
    
    ```
    kubectl apply -f https://getambassador.io/yaml/ambassador/ambassador-rbac.yaml
    ```
    Ambassador is now running in your cluster and is ready to start routing traffic to your application.

2. Expose Ambassador to the outside world.

    ```
    kubectl apply -f https://getambassador.io/yaml/ambassador/ambassador-service.yaml
    ```
    This will create a `LoadBalancer` service in Kubernetes which will automatically create a cloud load balancer if you are running in cloud-managed kubernetes. 

    ```
    $ kubectl get svc ambassador

    NAME         TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)       AGE
    ambassador   LoadBalancer   10.96.110.170   34.233.165.XXX   80:33241/TCP  87m
    ```
    **Note:** If you are running in a different Kubernetes environment, you can still access Ambassador using the `NodePort` created (33241 in this example).

3. Route traffic to your application

    You configure Ambassador to expose your application using an annotation to the Kubernetes service of the application.

    The example above was deployed with a pre-configured annotation to expose it. You can can now access this application using the `EXTERNAL_IP` above and going to http://{AMBASSADOR_EXTERNAL_IP}/ from a web-browser.

You now have an application running in Kubernetes and exposed to the internet.

## Deploy Prometheus 
Now that we have an application running and exposed by Ambassador, we need to configure Prometheus to scrape the metrics from Ambassador. We can deploy Prometheus as a Docker container running in Kubernetes using the [Prometheus Operator](https://github.com/coreos/prometheus-operator) from CoreOS.

The Prometheus Operator creates Kubernetes Custom Resource Definitions (CRDs) so we can manage our Prometheus deployment using Kubernetes-style declarative YAML manifests. To deploy the Prometheus Operator, you can clone the [repository](https://github.com/coreos/prometheus-operator) and follow the instructions in the README or just create it with `kubectl`:

```
kubectl apply -f https://raw.githubusercontent.com/coreos/prometheus-operator/master/bundle.yaml
```

Once the Prometheus operator is running, we need to create a Prometheus instance. The Prometheus Operator manages Prometheus deployments with the `Prometheus` CRD. To create a Prometheus instance and Kubernetes service, copy the following YAML to a file called `prometheus.yaml` and deploy it with `kubectl`:

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  annotations:
    getambassador.io/config: |
       ---
       apiVersion: ambassador/v1
       kind: Mapping
       name: prometheus_mapping
       prefix: /prometheus/
       service: prometheus:9090
spec:
  type: ClusterIP
  ports:
  - name: web
    port: 9090
    protocol: TCP
    targetPort: 9090
  selector:
    prometheus: prometheus
---
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: prometheus
spec:
  externalUrl: http://{AMBASSADOR_EXTERNAL_IP}/prometheus
  routePrefix: /prometheus
  ruleSelector:
    matchLabels:
      app: prometheus-operator
  serviceAccountName: prometheus-operator
  serviceMonitorSelector:
    matchLabels:
      app: ambassador
  resources:
    requests:
      memory: 400Mi
```

**Note:** The `externalUrl` and `routePrefix` fields allows for you to route to Prometheus through Ambassador on the `/prometheus` path. Replace `{AMBASSADOR_EXTERNAL_IP}` with the value from above.

```
kubectl apply -f prometheus.yaml
```
We now have Prometheus running in the cluster and exposed through Ambassador. View the Prometheus UI by going to http://{AMBASSADOR_EXTERNAL_IP}/prometheus/graph from a web browser.

Finally, we need tell Prometheus where to scrape metrics from. The Prometheus Operator easily manages this using a `ServiceMonitor` CRD. To tell Prometheus to scrape metrics from Ambassador's `/metrics` endpoint, copy the following YAML to a file called `ambassador-monitor.yaml` and apply it with `kubectl`:

```yaml
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ambassador-monitor
  namespace: monitoring
  labels:
    app: ambassador
spec:
  namespaceSelector:
    matchNames:
    - default
  selector:
    matchLabels:
      service: ambassador-admin
  endpoints:
  - port: ambassador-admin
```

```
kubectl apply -f ambassador-monitor.yaml
```

## Examining Ingress Metrics

If you go to http://{AMBASSADOR_EXTERNAL_IP}/prometheus/targets from a web browser you will now see that Prometheus is configured to scrape metrics from Ambassador. Clicking on the drop down menu at http://{AMBASSADOR_EXTERNAL_IP}/prometheus/graph, you can see the various ingress-related metrics output by Envoy. 

**Notable Metrics:**

| Metric Category | Notable Metrics | Description |
| --------------- | --------------- | ----------- |
| envoy_http_downstream_rq | envoy_http_downstream_rq_http1_total <br></br> envoy_http_downstream_rq_http1_total <br></br> envoy_http_downstream_rq_total <br></br> envoy_http_downstream_rq_xx | Statistics regarding traffic from the internet, to each Ambassador instance. Tracking this will give you insight into how each pod is performing for various requests. |
| envoy_cluster_upstream_rq   | envoy_cluster_upstream_rq <br></br> envoy_cluster_upstream_rq_xx <br></br> envoy_cluster_upstream_rq_total <br></br> envoy_cluster_upstream_rq_retry | Statistics regarding traffic from Envoy to each upstream service. Tracking this will give you insight to how the request is performing after reaching Ambassador. It will help you pinpoint whether failures are happening in Ambassador or the upstream service. |
| 


Envoy collects many more statistics including some regarding rate limiting, circuit breaking, and distributed tracing. See the [Envoy's documentation](https://www.envoyproxy.io/docs/envoy/latest/configuration/http_conn_man/stats) for more information on the metrics envoy collects.
