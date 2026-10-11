(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'cloud-2026-08-k8s-1-37',
      area: 'Cloud and infrastructure',
      date: '2026-08-26',
      title: 'Kubernetes 1.37 ships with 67 enhancements and several deprecations',
      source: 'Kubernetes Blog',
      url: 'https://kubernetes.io/blog/2026/08/26/kubernetes-v1-37-release/',
      summary: 'Kubernetes v1.37 ("Garhwal") has 67 enhancements: 16 stable, 23 beta, 27 alpha and one deprecation. Stable items include resilient watch-cache startup, the metrics.k8s.io API and pod certificates. HPA scale-to-zero is beta and enabled by default. The kube-dns add-on and kube-proxy ipvs mode are deprecated (ipvs is expected to be removed by v1.43), and static Pods may no longer reference Secrets or ConfigMaps.',
      why: 'If you run or deploy to Kubernetes, deprecations like ipvs mode and cgroup v1 decide what you must migrate before upgrading.',
      terms: [['HPA', 'Horizontal Pod Autoscaler, which adds or removes pod replicas based on load.'], ['kube-proxy', 'Node component that routes Service traffic to pods; ipvs is one of its modes.'], ['Feature gate', 'A flag that turns a Kubernetes feature on or off while it matures through alpha, beta and stable.']],
      interview: 'Scaling to zero trades cost savings against cold-start latency, a common autoscaling trade-off discussion.'
    },
    {
      id: 'cloud-2026-08-gcp-us-west1-fiber',
      area: 'Cloud and infrastructure',
      date: '2026-08-27',
      title: 'Google Cloud report: fiber maintenance and failed rerouting hit us-west1',
      source: 'Google Cloud Status',
      url: 'https://status.cloud.google.com/incidents/utF3FMFdQfwBzJcGG6vf',
      summary: 'On 20 August 2026 many Google Cloud services in us-west1 saw errors and latency, including GKE, Compute Engine, Cloud Storage and Pub/Sub. Google says scheduled fiber maintenance cut inter-data-center capacity and automated rerouting failed, causing congestion and packet loss that cascaded into timeouts. Engineers drained traffic, then restored it in stages. Planned fixes: stricter maintenance safety checks and better regional failover, still being finalised. The report gives 2h22m, while the status header differs.',
      why: 'It shows how a planned change plus a failed safety mechanism can take down a whole region, and why recovery outlasts the fault.',
      terms: [['Postmortem', 'A written analysis of an incident covering cause, impact and follow-up actions.'], ['Backlog reconciliation', 'Work a service must do after an outage to clear queued work and rebuild consistent state.'], ['Failover', 'Automatically shifting traffic to healthy capacity when something fails.']],
      interview: 'Fits the system design question of how to design for cascading failures, retries and graceful degradation.'
    },
    {
      id: 'cloud-2026-09-aws-t8i-beanstalk',
      area: 'Cloud and infrastructure',
      date: '2026-09-21',
      title: 'AWS weekly roundup: T8i instances and Elastic Beanstalk Cluster Mode',
      source: 'AWS News Blog',
      url: 'https://aws.amazon.com/blogs/aws/aws-weekly-roundup-aws-builder-center-mobile-apps-amazon-connect-talent-ga-amazon-corretto-27-and-more-september-14-2026/',
      summary: 'AWS announced burstable EC2 T8i instances on Intel Granite Rapids, claiming up to 30% better price performance than T3 and the same CPU-credit model. Elastic Beanstalk Cluster Mode runs many apps on shared EKS infrastructure, with automatic rollback, event-driven autoscaling and OpenTelemetry. Corretto 27 makes G1 the default garbage collector and adds post-quantum hybrid TLS key exchange. All performance and cost figures are AWS claims. The page date and URL slug disagree (21 vs 14 September).',
      why: 'Instance family and shared-cluster choices are direct cost levers, and vendor benchmarks should be tested on your own workload.',
      terms: [['Burstable instance', 'A VM with a low baseline CPU that can spend saved credits to burst higher.'], ['Garbage collector', 'Runtime component that frees memory the program no longer uses.'], ['EKS', 'Amazon Elastic Kubernetes Service, a managed Kubernetes control plane.']],
      interview: 'Illustrates cost-versus-performance sizing and multi-tenancy (sharing infrastructure to cut per-app cost).'
    },
    {
      id: 'cloud-2026-09-cloudflare-containers-faster',
      area: 'Cloud and infrastructure',
      date: '2026-09-30',
      title: 'Cloudflare rebuilds Containers for faster agent sandboxes',
      source: 'Cloudflare Blog',
      url: 'https://blog.cloudflare.com/faster-agent-sandboxes/',
      summary: 'Cloudflare reworked how Containers are scheduled so application code can pick each sandbox image and instance type at start time, and added filesystem snapshots (public beta). On a third-party benchmark with 100 concurrent sandboxes, median time-to-interactive fell from 4.05 s to 648 ms. A preliminary test started 100,000 containers in 5.4 s across six locations. The older Container and Sandbox classes get updates only until 31 December 2026.',
      why: 'Fast-starting isolated containers are what AI agents and serverless-style workloads depend on, so cold start is a core platform metric.',
      terms: [['Cold start', 'Delay while a new instance is created before it can serve its first request.'], ['Durable Object', 'Cloudflare stateful object pinned to one location that serialises access to its data.'], ['Snapshot', 'A saved copy of state that can be restored later.']],
      interview: 'Relates to containers versus VMs, cold-start latency and p50 versus p99 reporting.'
    },
    {
      id: 'cloud-2026-10-cloudflare-kv-instant',
      area: 'Cloud and infrastructure',
      date: '2026-10-01',
      title: 'Cloudflare Workers KV Instant trades capacity for fast global writes',
      source: 'Cloudflare Blog',
      url: 'https://blog.cloudflare.com/workers-kv-instant/',
      summary: 'KV Instant, in private beta, is a Workers KV mode built on Cloudflare\'s Quicksilver v2 store. It reports p99 reads of 1.62 ms and writes reaching 300+ edge locations in a median 107 ms, versus a 4.38 s p99 for classic KV. The limits are steep: 1 MB per namespace, 10,000 keys, no metadata, one write per second, and much higher storage cost. It targets read-heavy data like feature flags.',
      why: 'It is a concrete example of picking a data store by access pattern rather than by name.',
      terms: [['TTL', 'Time to live, how long a cached value is trusted before being refreshed.'], ['p99 latency', 'The latency that 99 percent of requests beat; it exposes tail behaviour.'], ['System of record', 'The single authoritative store that all writes go through.']],
      interview: 'Direct example of cache invalidation, eventual consistency versus fast propagation, and single-writer designs.'
    },
    {
      id: 'cloud-2026-10-cloudflare-k2',
      area: 'Cloud and infrastructure',
      date: '2026-10-01',
      title: 'Cloudflare K2: an event log built on object storage',
      source: 'Cloudflare Blog',
      url: 'https://blog.cloudflare.com/cloudflare-k2-streams/',
      summary: 'Cloudflare launched K2 in public beta for Workers Paid accounts: a serverless, ordered, durable event stream stored on R2 instead of broker servers. Edge servers batch writes into segment files and use R2 atomic operations for offsets. Consumers lease batches for five minutes. Beta limits are 10 GB and 30 MB/s per stream, with about 1 s p99 produce latency; pricing shown is anticipated, and Kafka compatibility is only a roadmap item.',
      why: 'It shows how a Kafka-style log can be rebuilt on object storage, trading latency for operational simplicity.',
      terms: [['Event streaming', 'Storing events as an ordered log that many consumers can read at their own pace.'], ['Offset', 'A monotonically increasing position of a message in a log.'], ['Lease', 'Temporary exclusive claim on work that expires if not acknowledged.']],
      interview: 'Touches message queues versus logs, ordering guarantees and at-least-once delivery.'
    },
    {
      id: 'cloud-2026-10-cloudflare-observability',
      area: 'Cloud and infrastructure',
      date: '2026-10-02',
      title: 'Cloudflare merges logs, traces and alerts into one observability product',
      source: 'Cloudflare Blog',
      url: 'https://blog.cloudflare.com/one-observability-platform/',
      summary: 'Cloudflare announced eight updates unifying logs, traces, analytics, alerts and dashboards, queryable through one SQL API. Traces and the SQL API are in open beta, with OpenTelemetry export for traces. New unified pricing starts 1 December 2026: paid plans include 50 GB ingestion and 10 GB-month storage, then $0.25 per GB ingested and $0.10 per GB-month stored. Longer retention and cross-dataset queries are listed as coming soon.',
      why: 'Observability billed per GB ingested is a real cost driver, so sampling and retention choices matter.',
      terms: [['Distributed trace', 'A record of one request as it passes through multiple services.'], ['OpenTelemetry', 'Vendor-neutral standard for emitting logs, metrics and traces.'], ['SLO', 'Service level objective, a target such as 99.9 percent of requests succeeding.']],
      interview: 'Links to the three pillars of observability (logs, metrics, traces) and how you debug a production latency spike.'
    },
    {
      id: 'cloud-2026-10-azure-gateway-outage',
      area: 'Cloud and infrastructure',
      date: '2026-10-02',
      title: 'Azure gateway outage across many regions, cause still unconfirmed',
      source: 'shattered.io',
      url: 'https://shattered.io/?p=5519',
      summary: 'This secondary report describes two Azure incidents. On 29 September Azure OpenAI and related AI services in Sweden Central were disrupted for about six hours with no cause stated. From 20:30 UTC on 30 September, ExpressRoute and VPN gateways, and reportedly Azure Firewall and Application Gateway, were affected, with recovery around 02:15 UTC. Microsoft reportedly saw a correlation with infrastructure OS servicing, now paused. No full postmortem existed yet; the 18-region count is unverified.',
      why: 'It is a reminder that network and gateway layers are shared dependencies, and early outage reports are provisional.',
      terms: [['ExpressRoute', 'Azure private network link between a customer site and Azure.'], ['Correlation vs root cause', 'Two events lining up in time does not prove one caused the other.'], ['Region', 'A geographic cluster of data centers offered by a cloud provider.']],
      interview: 'Useful for discussing multi-region design, blast radius and why you wait for a root cause before assigning blame.'
    }
  );
})();
