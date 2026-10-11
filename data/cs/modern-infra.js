/* Offer Ready: CS fundamentals, track. Modern infrastructure and cloud. */
OR.cs = OR.cs || [];
OR.cs.push({
  id: "modern-infra",
  order: 7,
  title: "Modern infrastructure and cloud",
  blurb: "Containers, Dockerfiles, Kubernetes basics, infrastructure as code, CI/CD and rollout strategies, cloud building blocks, serverless, observability and SLOs, reliability patterns, networking, security, cost and incident response.",
  minutes: 100,
  sections: [
    {
      id: "containers",
      title: "Containers: namespaces, cgroups and layers",
      body: `
A **container** is an ordinary process (or group of processes) on a shared Linux kernel, started with a restricted view of the machine. It is not a small virtual machine: there is no second kernel. A **virtual machine** (VM) emulates hardware and runs its own kernel, so it is heavier but isolates more strongly.

Two kernel features do the work:

- **Namespaces** limit what a process can *see*. A PID namespace gives the container its own process numbering (its main process thinks it is PID 1). Others cover the network stack, mount points, hostname and user IDs.
- **cgroups** (control groups) limit what a process can *use*: CPU time, memory, number of processes, disk I/O. If a container goes over its memory limit, the kernel's out-of-memory killer ends it.

An **image** is the read-only package a container starts from: a root filesystem plus metadata such as the default command. It is built from **layers**, each one a set of file changes stacked on the previous (a union filesystem presents them as one tree). A running container adds a thin writable layer on top that is thrown away when the container is removed. Layers are identified by a content hash, so two images that share a base share those layers on disk and in the registry, and a pull only downloads layers you do not have.

Why this exists: "it works on my machine" came from differences in installed libraries. An image bundles the app with its user-space dependencies, so the same artifact runs on a laptop, in CI and in production. Starting a container takes roughly the time to start a process, not to boot an OS.

A **registry** stores images; a **tag** (like \`1.4\`) is a movable label, while a **digest** (\`sha256:...\`) names exact content and never changes.

Trade-offs and traps:

- Shared kernel means a kernel exploit can break out of a container; for untrusted code people add extra isolation (microVMs, user-space kernels). Do not claim containers are a security boundary equal to VMs.
- Containers are meant to be **ephemeral**: data written inside vanishes, so state goes in volumes or external services.
- A container running as root inside is still risky; run as a non-root user.

Interview line: "a container is a process with namespaces for visibility, cgroups for resource limits, and a layered image for its filesystem." For the kernel background see [operating systems](#/cs/os).
`
    },
    {
      id: "dockerfile",
      title: "Writing a good Dockerfile",
      body: `
A **Dockerfile** is the recipe for an image. Each instruction (\`FROM\`, \`RUN\`, \`COPY\`, ...) produces a layer, and the builder **caches** layers: if an instruction and everything before it are unchanged, the cached layer is reused. That cache is the key to fast builds and to most best practices.

\`\`\`dockerfile
# build stage: has compilers and dev tools
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# runtime stage: only what we need to run
FROM python:3.12-slim
RUN useradd --create-home appuser
WORKDIR /app
COPY --from=build /install /usr/local
COPY . .
USER appuser
CMD ["python", "main.py"]
\`\`\`

Why it looks like this:

- **Order for caching.** Copy the dependency list and install first; copy your source after. Source changes every commit, dependencies rarely, so the slow install layer stays cached.
- **Multi-stage builds.** The first stage builds; the final stage copies only the results. The image you ship does not carry compilers, which makes it smaller and gives attackers fewer tools.
- **Small, pinned base.** A slim base means less to download and fewer packages to patch. Pin a specific version (or digest) rather than \`latest\`, which silently changes.
- **Non-root user** with \`USER\`.
- **A \`.dockerignore\` file** keeps \`.git\`, local virtualenvs and secrets out of the build context, which is the directory sent to the builder.
- **Exec form** (\`CMD ["python", "main.py"]\`, a JSON list) runs your program directly as the main process so it receives stop signals. The shell form wraps it in \`/bin/sh -c\`, which may not forward them.
- Combine related shell steps in one \`RUN\` so temporary files are removed in the same layer; a file deleted in a later layer still exists in the earlier one and still counts toward size.

\`ENTRYPOINT\` is the fixed executable and \`CMD\` supplies default arguments that are easy to override. \`COPY\` is preferred over \`ADD\`, which has extra behaviors (like unpacking archives) that surprise people.

Common mistakes: baking secrets into a layer (they stay in the image history even if deleted later), running as root, one giant image with the whole toolchain, and \`COPY . .\` before installing dependencies, which busts the cache on every edit.
`
    },
    {
      id: "k8s-basics",
      title: "Kubernetes: the model and why it exists",
      body: `
Running one container is easy. Running hundreds across many machines, restarting the failed ones, spreading load and rolling out updates is the job of an **orchestrator**. **Kubernetes** (often "K8s") is the most widely used one. Its core idea is **declarative desired state**: you tell the cluster what you want ("three copies of this container, reachable on this port"), and **controllers** run loops that compare reality to that description and fix any difference.

The pieces, bottom up:

- A **node** is a machine (virtual or physical) that runs containers.
- A **pod** is the smallest unit you deploy: one or more containers that share a network address and storage volumes and are scheduled together. Usually one app container per pod, sometimes with a helper "sidecar".
- A **Deployment** manages a set of identical pods through a **ReplicaSet**: it keeps N running and performs rolling updates.
- A **Service** gives a stable name and virtual IP in front of a changing set of pods, chosen by **labels** (key/value tags). Pods come and go with new IPs; the Service is the fixed address.
- A **Namespace** (a Kubernetes one, unrelated to Linux namespaces) groups resources inside a cluster.
- The **control plane** holds the API server (the single front door), a key-value store with the cluster state, the scheduler and the controllers.

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: {app: web}
  template:
    metadata:
      labels: {app: web}
    spec:
      containers:
        - name: web
          image: registry.example.com/web:1.4.2
          ports:
            - containerPort: 8080
\`\`\`

You apply this with \`kubectl apply -f web.yaml\`. If a node dies, the Deployment controller notices fewer than three pods and creates replacements elsewhere. That reconciliation loop is the thing to explain in interviews.

Trade-offs: Kubernetes is powerful and also complex to operate; for a small app a managed platform or a single VM can be the right answer. Trap: pods are **not** durable. Never rely on a pod's IP or local disk, and do not create bare pods in production, because nothing recreates them.
`
    },
    {
      id: "k8s-sched-health",
      title: "Scheduling, resources, probes and configuration",
      body: `
**Scheduling** means choosing a node for each new pod. The scheduler first filters out nodes that cannot host it (not enough free resources, wrong labels, a **taint** the pod does not tolerate), then ranks the rest and picks one. You steer it with node selectors, **affinity** rules (prefer or require co-location or spreading) and taints/tolerations (nodes repelling pods unless they opt in).

Resources are declared per container:

- A **request** is what the scheduler reserves when placing the pod.
- A **limit** is the cap enforced at runtime. Exceed the memory limit and the container is killed; exceed the CPU limit and it is throttled, not killed.

Requests too low cause overpacked, noisy nodes; too high waste money. Setting no requests at all is a classic mistake.

**Probes** are health checks the kubelet (the per-node agent) runs:

- **Liveness**: is the process stuck? On failure the container is restarted.
- **Readiness**: should this pod receive traffic right now? On failure it is removed from the Service's endpoints but not restarted. Use it for warm-up and temporary overload.
- **Startup**: gives slow-starting apps extra time before the other probes begin.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
    - name: web
      image: registry.example.com/web:1.4.2
      resources:
        requests: {cpu: 100m, memory: 128Mi}
        limits: {memory: 256Mi}
      readinessProbe:
        httpGet: {path: /ready, port: 8080}
        periodSeconds: 5
      livenessProbe:
        httpGet: {path: /healthz, port: 8080}
        initialDelaySeconds: 10
      envFrom:
        - configMapRef: {name: web-config}
        - secretRef: {name: web-secrets}
\`\`\`

(\`100m\` means 100 millicores, a tenth of one CPU core.) **ConfigMaps** hold non-secret configuration and **Secrets** hold sensitive values; both can be injected as environment variables or mounted files. A Secret is only base64-encoded by default, which is encoding and not encryption, so you also need access control and ideally encryption at rest.

Interview traps: a liveness probe that checks a downstream database makes a database blip restart every pod and turns a small outage into a big one; keep liveness checks about the process itself. Also, config changes via environment variables need a pod restart to take effect.
`
    },
    {
      id: "iac",
      title: "Infrastructure as code",
      body: `
**Infrastructure as code** (IaC) means describing servers, networks, databases and permissions in text files kept in version control, and having a tool create them, instead of clicking in a console. The problems it solves are real: manual setups cannot be reviewed, cannot be reproduced for a second environment, and drift quietly until nobody knows what is running.

Two styles:

- **Declarative**: you describe the end state ("a bucket with these settings") and the tool works out the steps. Terraform-style tools and Kubernetes manifests work this way.
- **Imperative**: you write the steps (a script or program). More flexible, but you own ordering and re-run safety.

A typical declarative tool keeps **state**, a record of what it created, compares it with your files and your real environment, and shows a **plan** (a preview of the changes) before an **apply** that makes them. Good practice is to review the plan in a pull request just like code.

Key ideas:

- **Idempotent**: applying the same description twice leaves the same result and changes nothing the second time. This is what lets you re-run safely.
- **Drift**: the real environment diverges from the code because someone changed it by hand. Detect it with a plan, then either revert the manual change or capture it in code.
- **State is sensitive and shared.** It can contain secrets, and two people applying at once can corrupt it, so teams store it remotely with locking and access control.
- **Modules** package reusable pieces (a network layout, a service template) so environments differ by inputs, not copy-pasted files.
- **Immutable infrastructure**: instead of patching a running server, build a new image and replace the old server. It avoids "snowflake" machines that nobody can rebuild.

A configuration management tool (installing and configuring software on existing machines) is a related but different job from provisioning (creating the machines).

Traps: committing secrets into IaC files, huge "one state for everything" setups where a mistake can touch production, and destroying a stateful resource (a database) because a rename looked like delete-and-create. Always read the plan for lines that say a resource will be destroyed or replaced.
`
    },
    {
      id: "cicd",
      title: "CI/CD pipelines",
      body: `
**Continuous integration** (CI) means every change is merged into the shared branch frequently and each merge triggers an automatic build and test run, so integration problems appear within minutes. **Continuous delivery** means every passing change is *ready* to release at the push of a button; **continuous deployment** goes one step further and releases automatically with no manual gate.

A pipeline is a series of stages, each a gate:

1. Check out the code and restore cached dependencies.
2. Lint and run fast unit tests.
3. Build an artifact (a container image, say) once.
4. Run slower tests (integration, security scans).
5. Push the artifact to a registry.
6. Deploy to staging, run smoke tests, then to production.

A generic pipeline definition looks like this (the exact keys differ per CI product, the shape does not):

\`\`\`yaml
stages: [test, build, deploy]
test:
  stage: test
  script: [pip install -r requirements.txt, pytest -q]
build:
  stage: build
  script: [docker build -t web:$COMMIT_SHA ., docker push web:$COMMIT_SHA]
deploy:
  stage: deploy
  script: [kubectl set image deployment/web web=web:$COMMIT_SHA]
  when: manual
\`\`\`

Principles worth stating in an interview:

- **Build once, deploy the same artifact everywhere.** Rebuilding per environment means production runs something you never tested. Differences between environments belong in configuration, not in the build.
- **Tag artifacts with the commit** so you can say exactly what is running and roll back to a known one.
- **Keep the pipeline fast.** Slow feedback gets bypassed. Run the quick checks first and parallelize.
- **Fix flaky tests**; a pipeline people re-run until green stops meaning anything.
- **Trunk-based development** (short-lived branches merged to main often, incomplete work hidden behind flags) fits CI better than long-lived feature branches.
- **GitOps** is the pattern where the desired state lives in a Git repository and an agent in the cluster pulls and applies it, so the deploy is a reviewed commit.

Trap: confusing delivery with deployment. Also, a pipeline with production credentials is a high-value target, so scope those credentials tightly (see the security section).
`
    },
    {
      id: "deploy-strategies",
      title: "Deployment strategies and feature flags",
      body: `
Releasing new code risks breaking users. The strategies below trade speed, cost and blast radius.

- **Recreate**: stop the old version, start the new. Simple, but there is downtime.
- **Rolling update**: replace instances a few at a time, so old and new run side by side briefly. Cheap and the default in Kubernetes Deployments. Cost: two versions serve traffic at once, so changes must be **backward compatible**, especially database schemas and API contracts. Rollback is another rolling update.
- **Blue-green**: keep two full environments. "Blue" serves traffic; deploy to idle "green", test it, then switch the router. Rollback is switching back, which is fast. Cost: double capacity during the switch, and shared state (the database) is still a single point where incompatibility bites.
- **Canary**: send a small share of real traffic (say 1 to 5 percent) to the new version, watch error rate and latency, and increase the share only if healthy. It limits blast radius using real traffic, but needs good metrics and a traffic-splitting router. Automated analysis can promote or abort without a human.
- **Shadow (mirrored) traffic**: copy real requests to the new version and discard its responses. Safe for reads; dangerous if the new version has side effects.

**Feature flags** separate *deploying* code from *releasing* a feature. The code ships turned off; you enable it for staff, then 1 percent of users, then everyone, and a flag flip is the instant rollback. A minimal idea:

\`\`\`python
import hashlib

def enabled(flag, user_id, percent):
    h = int(hashlib.sha256(f"{flag}:{user_id}".encode()).hexdigest(), 16)
    return h % 100 < percent

print(enabled("new-checkout", "user-42", 100), enabled("new-checkout", "user-42", 0))
\`\`\`

Hashing the user id keeps each user's experience stable between requests. (Output: \`True False\`.)

Traps: flags are **debt**; remove them once rolled out, because stale flags multiply the combinations you must test. Schema changes need the **expand and contract** pattern: add the new column first (compatible with old code), deploy code that uses both, migrate data, then remove the old column later. And "we can roll back" is false if the new version already wrote data the old version cannot read.
`
    },
    {
      id: "cloud-blocks",
      title: "Cloud building blocks",
      body: `
Every major cloud sells variations of the same few primitives. Knowing the *concepts* lets you work on any provider; the product names change, the ideas do not.

- **Compute.** Virtual machines (rent a server by size and time), container platforms (run images without managing machines), and functions (see the serverless section). **Autoscaling** adds or removes instances based on load, so you need instances that start fast and are stateless.
- **Object storage.** Stores blobs (files) by key in a flat bucket, accessed over HTTP. Very durable, cheap per gigabyte, effectively unlimited, but not a filesystem: no in-place edits, no real directories, higher latency than disk. Good for images, backups, logs and data lakes. Typical trap: assuming a just-written object behaves like a local file you can append to.
- **Block storage** is a network-attached disk for one machine, behaving like a raw drive; it is what databases on VMs use.
- **Message queues and streams.** A **queue** decouples producers from consumers, smooths bursts and lets work be retried; a consumer takes a message, processes it, then acknowledges. Most queues deliver **at least once**, so consumers must tolerate duplicates (see idempotency below). A **stream** (a replicated, ordered log many consumers can read and replay) suits event pipelines.
- **Load balancers** spread requests across instances and stop sending to unhealthy ones. A layer-4 balancer routes by IP and port; a layer-7 balancer understands HTTP and can route by path or header and terminate TLS. See [networking](#/cs/networking).
- **CDN** (content delivery network): servers near users cache copies of content, cutting latency and origin load. Set cache headers carefully and have a plan to invalidate stale content.
- **Managed databases** handle backups, patching and failover for you, at a price and with some loss of control.
- **Virtual private network (VPC)**: your private address space, with subnets and firewall rules; public and private subnets are the basic split.
- **IAM** (identity and access management): who or what may do which action on which resource (see the security section).

Design vocabulary: a **region** is a geographic area; an **availability zone** is a separate data-center group inside a region. Spreading across zones protects against a zone failure; spreading across regions protects against a regional one at much higher complexity.

Trade-off: managed services save operations work but increase lock-in. Keep data formats and interfaces standard where it is cheap to do so. For the design-side view see [databases in depth](#/cs/databases-deep).
`
    },
    {
      id: "serverless",
      title: "Serverless: what it is and its trade-offs",
      body: `
**Serverless** does not mean no servers; it means you do not provision or manage them. The two common flavors are **functions as a service** (you upload a function; the platform runs it per event and bills per execution time) and managed backends (a database or queue that scales and bills by usage).

How a function platform works: when an event arrives (an HTTP request, a queue message, a file upload, a timer) the platform finds or creates an instance of your function, runs it, and may keep the instance warm for later events. If it must create one, you pay a **cold start**: extra latency to start the runtime and load your code.

What you gain:

- **No capacity planning** and automatic scaling, including down to zero, so idle code costs nothing.
- **Pay per use**, which is cheap for spiky or low traffic.
- Less operations work: no patching of servers.

What you give up:

- **Cold starts** hurt latency-sensitive paths. Mitigations: smaller packages, lighter runtimes, keeping instances warm or reserving capacity (which costs money).
- **Execution limits**: maximum run time, memory and payload size, so long jobs need a different tool.
- **Statelessness**: do not assume memory or local disk survives between invocations. State lives in external stores, and concurrency can mean many copies run at once.
- **Cost at steady high load**: a function running constantly can cost more than a reserved server. This is a rule of thumb; do the arithmetic for your numbers.
- **Harder local testing and debugging**, and **lock-in** to the platform's triggers and APIs.
- **Downstream limits**: a function can scale to hundreds of copies and overwhelm a database that has a connection limit. Put a queue or a connection pool/proxy in between.

Event-driven code is delivered **at least once** on most platforms, so write handlers to be idempotent:

\`\`\`python
def handler(event, context=None):
    return {"statusCode": 200, "body": f"hello {event.get('name', 'world')}"}

print(handler({"name": "ada"}))
\`\`\`

(Output: \`{'statusCode': 200, 'body': 'hello ada'}\`. The exact handler signature varies by provider.)

Interview answer: serverless fits event-driven, bursty, loosely coupled work; it fits poorly for steady heavy compute, tight latency budgets, or long-lived connections. Say "it depends" and name the factors.
`
    },
    {
      id: "observability",
      title: "Observability: logs, metrics and traces",
      body: `
**Monitoring** tells you when something known is wrong; **observability** is the ability to ask new questions about a running system from the data it emits, including problems you did not predict. Three signal types support it.

- **Logs**: timestamped records of events. Best for detail about one occurrence. Write **structured** logs (JSON key/value fields) so they can be searched and filtered, and include a request or correlation id. Never log secrets or personal data.
- **Metrics**: numbers aggregated over time (request count, error count, latency percentiles, CPU use). Cheap to store, good for dashboards and alerts, poor at explaining one specific request. Watch **cardinality**: a label with millions of distinct values, like user id, makes a metrics system collapse.
- **Traces**: the path of a single request across services. A trace is a tree of **spans**, each span being one timed operation; a propagated trace id (passed in request headers) ties them together. Traces show *where* the time went in a chain of calls.

Typical workflow: an alert on a metric tells you something is wrong, a trace shows which service is slow, and logs for that trace id tell you why.

**Percentiles** matter more than averages. The p99 latency is the value that 99 percent of requests beat; the average hides the slow tail, and users in a fan-out system (one request calling many backends) hit the tail often. Never average percentiles across servers; aggregate the underlying histograms instead.

Two useful frameworks (rules of thumb, not laws):

- **RED** for services: Rate, Errors, Duration.
- **USE** for resources: Utilization, Saturation, Errors.

**Alerting** advice: alert on symptoms users feel (error rate, latency), not every cause (a CPU spike that harms no one). Every page should be actionable and urgent, or it is noise, and noisy alerts train people to ignore them (alert fatigue). Attach a runbook link to each.

A **health endpoint** answers "am I up?" for infrastructure; it is not a substitute for real metrics.

Trap: logging everything at high volume gets expensive and slow; sample or set levels. Another: having dashboards but no traces, then guessing during an incident.
`
    },
    {
      id: "slo",
      title: "SLIs, SLOs and error budgets",
      body: `
Reliability needs a number, otherwise "make it more reliable" has no end. Three linked terms:

- **SLI** (service level indicator): a measurement of user-visible quality, usually a ratio of good events to valid events. Example: requests answered successfully in under 300 ms, divided by all requests.
- **SLO** (service level objective): the target for an SLI over a window. Example: 99.9 percent of requests good, over 30 days.
- **SLA** (service level agreement): a contract with customers, with consequences (such as credits) if missed. SLAs are usually looser than internal SLOs.

The **error budget** is the allowed failure: 100 percent minus the SLO. A 99.9 percent SLO over 30 days allows 0.1 percent badness, which is 43.2 minutes of full downtime:

\`\`\`python
slo = 0.999
print(round(30 * 24 * 60 * (1 - slo), 1), "minutes per 30 days")
\`\`\`

Output: \`43.2 minutes per 30 days\`. Each extra nine cuts the budget by ten times (99.99 percent leaves about 4.3 minutes), and costs far more to achieve.

Why a budget helps: reliability and feature speed pull against each other, and the budget turns the argument into a shared rule. While budget remains, ship quickly. When it is spent, slow down releases and spend effort on reliability. It also makes 100 percent an explicit non-goal: it is unreachable and users cannot tell 99.99 from 99.999 when their own network is flakier.

**Burn rate** is how fast you consume the budget relative to the pace that would exactly use it all by the end of the window. Alerting on a high burn rate (for example, fast burn over a short window plus slow burn over a long one) catches both sudden outages and slow leaks while avoiding pages for tiny blips.

Choosing SLIs: pick what users experience (availability, latency, correctness, freshness), measure as close to the user as practical (at the load balancer or client, not just inside the app), and use few of them. An SLI on CPU usage is not an SLI.

Traps: setting the SLO to whatever you currently achieve, counting health-check traffic as good requests, and tracking availability by uptime of servers instead of by successful user requests. Dependencies cap you: if you need three services in a row each at 99.9 percent, your best case is about 99.7 percent (0.999 cubed, assuming independent failures).
`
    },
    {
      id: "reliability",
      title: "Reliability patterns: timeouts, retries, circuit breakers, idempotency",
      body: `
In a distributed system any call can be slow, fail, or fail after succeeding on the server. These patterns contain the damage. For the concurrency background see [concurrency](#/cs/concurrency).

**Timeouts.** Every network call needs one. Without it, a slow dependency ties up your threads or connections until you are down too. Set it from the dependency's observed latency (say, a bit above its p99), and keep the caller's total budget larger than the sum of nested calls. Propagating a **deadline** down the chain stops work nobody is waiting for.

**Retries with exponential backoff and jitter.** Retrying fixes transient failures, but retrying immediately and in lockstep creates a **retry storm** that keeps a struggling service down. So wait longer after each failure (backoff: base times 2 to the attempt), cap it, and randomize the wait (**jitter**) so clients spread out. Only retry errors that can succeed later (timeouts, 503) and never ones that cannot (400, 404). Bound the attempts, and beware retries stacking across layers: three layers retrying three times is 27 calls per user request.

\`\`\`python
import random, time

def retry(fn, attempts=5, base=0.1, cap=2.0, sleep=time.sleep):
    for n in range(attempts):
        try:
            return fn()
        except ConnectionError:
            if n == attempts - 1:
                raise
            sleep(random.uniform(0, min(cap, base * 2 ** n)))   # full jitter
\`\`\`

I ran this with a function that fails twice then succeeds: it returned the result after 3 calls and every wait stayed under the cap.

**Circuit breaker.** Wrapping a dependency so that after enough consecutive failures the breaker **opens** and calls fail immediately for a cool-down period (no waiting, no piling on). Then it goes **half-open**: it lets a trial request through; success closes it, failure re-opens it. This gives the dependency room to recover and gives the caller a fast failure to handle with a fallback.

**Idempotency.** An operation is **idempotent** if doing it several times has the same effect as once. Retries and at-least-once queues make this essential: you must not charge a card twice. The standard tool is an **idempotency key**, a unique id the client sends with the request; the server records the result under that key and returns it for repeats.

\`\`\`python
done = {}
def charge(key, amount):
    if key in done:
        return done[key]
    done[key] = f"charged {amount}"
    return done[key]
\`\`\`

(A real server must make the check-and-record atomic, for example with a unique database constraint, or two concurrent retries can both pass the check.) HTTP \`GET\`, \`PUT\` and \`DELETE\` are meant to be idempotent; \`POST\` is not by default.

Other patterns: **bulkheads** (separate pools per dependency so one cannot starve the rest), **load shedding** (reject excess work early to stay healthy), **graceful degradation** (serve a cached or reduced result), and **backpressure** (tell upstream to slow down).
`
    },
    {
      id: "networking-infra",
      title: "Networking for infrastructure: DNS, TLS and HTTP versions",
      body: `
This section is the infrastructure view; [networking](#/cs/networking) covers the fundamentals.

**DNS** maps names to IP addresses. A resolver walks from the root through the top-level domain to the domain's authoritative servers and caches answers for each record's **TTL** (time to live). Common records: **A**/**AAAA** (name to IPv4/IPv6), **CNAME** (alias to another name), **MX** (mail), **TXT** (free text, used for verification). Operational points: a low TTL speeds up changes but increases query load; DNS-based failover is slow and uneven because caches and some clients ignore the TTL; and "it's always DNS" is a joke because misconfiguration here breaks everything. Inside Kubernetes, a Service gets a stable DNS name so callers never track pod IPs.

**TLS** (transport layer security) gives encryption, integrity and server authentication on top of TCP. The server presents a **certificate** signed by a **certificate authority** (CA) that clients trust; the client checks the name matches and the validity dates, then both sides agree on session keys. Practical consequences:

- Certificates **expire**; an expired one is a classic outage. Automate renewal and alert well before expiry.
- **TLS termination** at a load balancer decrypts traffic once at the edge. Re-encrypting to backends, or **mutual TLS** (mTLS, where the client also presents a certificate), is used for service-to-service trust. A **service mesh** can handle mTLS and retries for you via sidecar proxies, at a complexity cost.
- Do not turn off certificate verification "to make it work".

**HTTP versions.**

- **HTTP/1.1**: one request at a time per connection (needing many connections), text headers. Head-of-line blocking at the request level.
- **HTTP/2**: many requests **multiplexed** over one TCP connection, binary framing, header compression. It removes request-level blocking, but one lost TCP packet still stalls every stream on that connection.
- **HTTP/3**: runs over **QUIC**, built on UDP, with its own per-stream loss recovery, so a lost packet only stalls its own stream, plus faster connection setup and better handling of switching networks (like Wi-Fi to cellular). It still uses TLS 1.3.

Choose by need rather than novelty: most clients negotiate the best version automatically, and a CDN or load balancer often handles it.

Trap: a long-lived connection (HTTP/2, gRPC) through a layer-4 balancer pins all of a client's requests to one backend, causing uneven load; use a layer-7 balancer or client-side balancing.
`
    },
    {
      id: "security-infra",
      title: "Security basics: least privilege, secrets and supply chain",
      body: `
**Least privilege** means each person, service and process gets only the access it needs, for only as long as it needs it. The reason is blast radius: when (not if) a credential leaks or a service is exploited, the damage is limited to what that identity could do.

In the cloud this is **IAM**: a *policy* states which *principal* (user, group, or workload identity) may perform which *actions* on which *resources*. Good practice:

- Give each service its **own identity** with a narrow policy instead of sharing one powerful key.
- Prefer **short-lived credentials** issued to workloads by the platform over long-lived access keys stored in files.
- Default deny; avoid wildcard permissions; review regularly; require multi-factor authentication for humans.
- Separate environments (development, production) with separate accounts or projects.

**Secrets** (passwords, API keys, tokens, private keys):

- Never commit them to Git or bake them into images. History keeps them forever; if one leaks, **rotate** it (issue a new one and revoke the old) rather than just deleting the file.
- Keep them in a dedicated secrets manager and inject them at runtime, with access logged.
- A Kubernetes Secret is base64, not encryption; add access control and encryption at rest.
- Scan commits for secrets automatically.

**Supply chain** security covers the code you did not write: base images, packages, build tools.

- Pin dependency versions and use lock files; verify hashes where supported.
- Scan images and dependencies for known vulnerabilities, and patch on a schedule.
- Prefer minimal base images, which have fewer packages to be vulnerable.
- Produce a **software bill of materials** (SBOM, a list of what is inside an artifact) and **sign** artifacts so deployment can check they came from your pipeline.
- Protect the pipeline itself: it holds deploy credentials, so limit who can change it.

Other basics: **defense in depth** (several layers, none trusted alone), keep the network private by default (databases not reachable from the internet), encrypt data in transit and at rest, and log security-relevant events. In Kubernetes, run pods as non-root with a read-only filesystem and network policies limiting which pods can talk.

Interview traps: saying "it's in a private repo" as a reason a secret is safe, using one admin key everywhere for convenience, and treating a vulnerability scan with zero findings as proof of safety (it only knows published issues).
`
    },
    {
      id: "cost-awareness",
      title: "Cost awareness (FinOps basics)",
      body: `
The cloud turns capital spending into a metered bill, and the meter runs whether or not anyone is looking. **FinOps** is the practice of making engineers and finance share responsibility for that bill. Interviewers like candidates who treat cost as a design constraint, like latency.

Where money usually goes:

- **Compute** that is over-provisioned (instances much bigger than their use), idle (a forgotten development cluster), or running around the clock when needed only in work hours.
- **Data transfer.** Moving data *out* of a cloud, or across regions or zones, is typically charged; ingress often is not. Chatty microservices spread across zones can generate a large bill. Prices differ by provider, so check the pricing page rather than assume.
- **Storage** that grows forever: old logs, snapshots, unattached disks, versions of objects. Lifecycle rules can move cold data to cheaper tiers or delete it.
- **Observability** data. High-cardinality metrics and verbose logs can cost more than the application they describe.
- **Managed services priced per request or per provisioned unit**, where a bug (an infinite loop calling an API) becomes a bill.

Levers:

- **Right-size**: match instance size to measured use.
- **Autoscale** down at night and weekends, including to zero for non-production.
- **Pricing models**: on-demand is flexible and costliest; committing to steady usage for a term is cheaper; interruptible spare capacity ("spot" or preemptible) is much cheaper but can be taken away, so use it for fault-tolerant batch work only.
- **Caching and CDNs** cut compute and transfer.
- **Tag** every resource with owner and purpose so costs can be attributed, and set budgets with alerts.
- **Architecture**: sometimes a simpler design, such as batching or compressing data, saves more than any discount.

A back-of-envelope habit: compute the monthly cost of a design before building it (requests per second times cost per request, or gigabytes times price per gigabyte). It catches order-of-magnitude surprises.

Trade-offs: cost optimization competes with reliability and developer time. Running two regions doubles cost for resilience you may not need, and an engineer-week spent saving a hundred dollars a month is a bad trade. Optimize the largest line items first, using actual billing data.

Trap: quoting specific dollar prices in an interview as fact. Prices change; state the structure (what is charged for) and how you would estimate.
`
    },
    {
      id: "incidents",
      title: "Incident response and postmortems",
      body: `
An **incident** is an unplanned event that degrades service. How a team responds matters as much as how rarely it happens. A calm, practiced process beats heroics.

Roles in a larger incident (one person can hold several in a small one):

- **Incident commander**: coordinates, decides, and does *not* dig into the fix. Keeping the big picture is the job.
- **Operations/responders**: investigate and apply changes.
- **Communications lead**: updates stakeholders and the status page on a regular schedule, even when the update is "no change".
- **Scribe**: keeps a timestamped log, which later becomes the postmortem timeline.

Typical flow:

1. **Detect**: an alert, ideally from user-facing symptoms, or a customer report.
2. **Triage**: how bad, who is affected? Assign a **severity** level so everyone shares expectations.
3. **Mitigate first.** The first goal is to stop the user pain, not to find the root cause. Roll back the last deploy, flip a feature flag, shift traffic away from a bad zone, add capacity, shed load. Ask "what changed recently?" because most incidents follow a change.
4. **Communicate** early and often.
5. **Resolve**, confirm with metrics, then stand down.
6. **Learn** with a postmortem.

Useful measures: **MTTD** (mean time to detect), **MTTR** (mean time to recover or restore; people use the letter R for several different things, so define it), and the incident count. Treat averages with care since incident durations are very skewed.

A **blameless postmortem** examines what happened without blaming individuals. People act reasonably with the information they had, and blame teaches people to hide mistakes. Good contents: a summary and impact, a timeline, contributing factors (usually several, not one "root cause"; techniques like "five whys" help but can over-simplify), what went well, what was lucky, and **action items** with owners and due dates. Weak actions ("be more careful") change nothing; strong ones change the system (add a guardrail, automate the check, improve an alert).

Operational tools: **runbooks** (step-by-step guides for known problems), **on-call rotation** with sustainable load, and **game days** or chaos experiments that rehearse failure on purpose.

Trap in interviews: describing an incident where you found the bug but never mention mitigation, communication or follow-up. Tell the story in full: detect, mitigate, communicate, resolve, learn.
`
    },
    {
      id: "interview-angles",
      title: "Interview angles and how to answer",
      body: `
Modern infrastructure questions test judgement more than memorized commands. A good answer names the problem, the options, the trade-off, and a choice for stated assumptions.

**Common prompts and a skeleton answer.**

- *"What happens when you run kubectl apply on a Deployment?"* The request goes to the API server, which authenticates, validates and stores the desired state. The Deployment controller creates or updates a ReplicaSet, which creates pods; the scheduler assigns each pod to a node; the kubelet on that node pulls the image and starts the containers via the container runtime; readiness probes decide when the Service sends traffic. The key idea: controllers reconcile desired against actual state.
- *"How would you deploy safely?"* Build one artifact in CI, deploy to a canary or a small slice, watch SLIs, ramp up, keep rollback quick, and use flags for risky features. Mention backward-compatible schema changes.
- *"A service is slow. How do you debug?"* Start from user impact and recent changes. Use metrics (RED), find the slow hop with traces, read logs for that trace, then check saturation of resources (USE). Mitigate before perfecting the diagnosis.
- *"Design for failure of a dependency."* Timeouts, bounded retries with backoff and jitter, circuit breaker, fallback or degraded response, bulkheads, idempotent operations, and alerting on the SLI.
- *"Container versus VM?"* Shared kernel and process-level isolation (fast, light) versus own kernel and hardware emulation (stronger isolation, heavier).
- *"How do you handle secrets?"* Never in Git or images, use a secrets manager, short-lived credentials, least privilege, rotation, audit.
- *"Serverless or containers?"* Ask about traffic shape, latency limits, run time, team skills and cost at steady load.

**Habits that impress.**

- Clarify requirements and the failure you are protecting against before naming tools.
- State trade-offs: every choice here costs something (rolling updates need compatibility, blue-green costs double capacity, retries risk storms, managed services add lock-in).
- Give numbers where you can (the error budget arithmetic, a p99), and mark rules of thumb as such.
- Prefer boring and simple. A single well-run VM may beat a cluster.
- Talk about operations: monitoring, rollback and who gets paged.

**Traps.**

- Listing tool brand names instead of explaining the concept; tools change, concepts last.
- Claiming something is "100 percent reliable" or "secure".
- Forgetting state: stateless services scale easily, and the hard part is always the data.
- Ignoring cost and people. A design nobody can operate at 3 a.m. is a bad design.

Related practice material: the system design fundamentals in this app and [databases in depth](#/cs/databases-deep) for the stateful side.
`
    }
  ],
  quiz: [
    {
      kind: "concept",
      q: "What do Linux namespaces and cgroups each provide to a container?",
      choices: [
        "Namespaces limit what the process can see; cgroups limit how much it can use",
        "Namespaces limit CPU and memory; cgroups give it a private filesystem",
        "Namespaces boot a separate kernel; cgroups encrypt its network traffic",
        "Both only control which files the process may read"
      ],
      answer: 0,
      explain: "Namespaces isolate views (process IDs, network, mounts, hostname, users). Cgroups cap and account resources (CPU, memory, processes, I/O). A container shares the host kernel; it does not boot its own."
    },
    {
      kind: "concept",
      q: "Why copy the dependency list and install dependencies before copying the application source in a Dockerfile?",
      choices: [
        "Source changes often, so the slow install layer stays cached across rebuilds",
        "Docker refuses to copy source files first",
        "It makes the final container run faster",
        "It encrypts the dependency layer"
      ],
      answer: 0,
      explain: "Layer caching reuses a layer only if it and every layer before it are unchanged. Putting rarely changing steps first keeps them cached when only your source changes."
    },
    {
      kind: "concept",
      q: "A readiness probe fails on a pod. What does Kubernetes do?",
      choices: [
        "Stops sending Service traffic to that pod without restarting it",
        "Restarts the container immediately",
        "Deletes the Deployment",
        "Moves the pod to another namespace"
      ],
      answer: 0,
      explain: "Readiness controls whether the pod is in the Service's endpoints. A failing liveness probe is the one that triggers a restart."
    },
    {
      kind: "bug",
      q: "A team makes the liveness probe check that the database is reachable. The database has a brief outage. What is the likely result?",
      choices: [
        "Every pod fails liveness and restarts, turning a dependency blip into a wider outage",
        "Nothing happens because liveness probes ignore network calls",
        "Pods are rescheduled onto new nodes with a healthier database",
        "The Service switches to a backup database automatically"
      ],
      answer: 0,
      explain: "Liveness should reflect whether the process itself is stuck. Checking a downstream dependency causes mass restarts when that dependency is down. Use readiness for dependency-related traffic gating, carefully."
    },
    {
      kind: "concept",
      q: "In Kubernetes, what is the difference between a resource request and a limit?",
      choices: [
        "The request is what the scheduler reserves for placement; the limit is the runtime cap",
        "The request is the cap; the limit is the scheduling reservation",
        "Requests apply to CPU only and limits to memory only",
        "They are two names for the same setting"
      ],
      answer: 0,
      explain: "Scheduling uses requests to find a node with room. Limits are enforced while running: memory over the limit gets the container killed, CPU over the limit gets throttled."
    },
    {
      kind: "concept",
      q: "What does it mean for infrastructure-as-code tooling to be idempotent?",
      choices: [
        "Applying the same configuration repeatedly leaves the same end state and makes no extra changes",
        "Each apply creates new resources with fresh names",
        "The tool refuses to run twice",
        "All state is stored only in memory"
      ],
      answer: 0,
      explain: "Idempotence is what makes re-running safe: the second apply sees that reality already matches the description and changes nothing."
    },
    {
      kind: "pattern",
      q: "You want to test a new version on 2 percent of real traffic and expand only if error rate and latency stay healthy. Which strategy is this?",
      choices: [
        "Canary release",
        "Recreate deployment",
        "Blue-green switch",
        "Shadow traffic"
      ],
      answer: 0,
      explain: "A canary exposes a small slice of real users and ramps up on healthy metrics. Blue-green flips all traffic at once between two environments; shadow traffic discards the new version's responses."
    },
    {
      kind: "concept",
      q: "What is the main extra constraint of rolling updates and canaries compared with recreate deployments?",
      choices: [
        "Old and new versions run at the same time, so changes must be backward compatible",
        "They always cause downtime",
        "They need double the infrastructure permanently",
        "They cannot be rolled back"
      ],
      answer: 0,
      explain: "During the rollout both versions serve traffic and share the database and APIs, so schemas and contracts must work with both. The expand and contract pattern handles schema changes."
    },
    {
      kind: "concept",
      q: "Why is object storage not a drop-in replacement for a local filesystem?",
      choices: [
        "It stores whole objects by key over HTTP, with no in-place edits or real directories, and higher latency",
        "It cannot store files larger than a few kilobytes",
        "It loses data after a few days",
        "It only works with a single machine"
      ],
      answer: 0,
      explain: "Object stores are durable and cheap with huge scale, but you replace whole objects by key rather than appending or editing in place, and access has network latency."
    },
    {
      kind: "complexity",
      q: "A 99.9 percent availability SLO over 30 days. About how much full downtime does the error budget allow?",
      choices: [
        "About 43 minutes",
        "About 4.3 minutes",
        "About 7 hours",
        "About 72 minutes"
      ],
      answer: 0,
      explain: "30 days is 43,200 minutes; 0.1 percent of that is 43.2 minutes. 99.99 percent would leave about 4.3 minutes."
    },
    {
      kind: "concept",
      q: "What is the purpose of jitter in retry backoff?",
      choices: [
        "To randomize waits so many clients do not retry in lockstep and cause a retry storm",
        "To make retries faster",
        "To guarantee the request eventually succeeds",
        "To avoid needing a timeout"
      ],
      answer: 0,
      explain: "Backoff alone can still synchronize clients that failed together. Randomizing the delay spreads the load so the recovering service is not hit by waves."
    },
    {
      kind: "pattern",
      q: "A queue delivers each message at least once and a consumer sometimes sees duplicates. What is the standard way to keep side effects correct?",
      choices: [
        "Make the handler idempotent, for example by recording an idempotency key per message",
        "Add more consumers so duplicates cancel out",
        "Lower the timeout to zero",
        "Disable acknowledgements"
      ],
      answer: 0,
      explain: "At-least-once delivery plus retries means duplicates are normal. Idempotent handlers (keyed by message or request id, with an atomic check) make repeats harmless."
    },
    {
      kind: "concept",
      q: "What state does a circuit breaker enter after the cool-down so it can test whether a dependency recovered?",
      choices: [
        "Half-open, letting a trial request through",
        "Permanently closed",
        "Locked, rejecting all requests forever",
        "Retrying with no limit"
      ],
      answer: 0,
      explain: "Open rejects calls fast, half-open allows a trial, success closes the circuit and failure opens it again."
    },
    {
      kind: "concept",
      q: "Which statement about HTTP/3 is correct?",
      choices: [
        "It runs over QUIC on UDP, so a lost packet stalls only its own stream",
        "It runs over plain TCP and removes encryption",
        "It is the same as HTTP/2 with a new name",
        "It cannot use TLS"
      ],
      answer: 0,
      explain: "HTTP/3 uses QUIC (UDP-based, with TLS 1.3 built in) and per-stream loss recovery. HTTP/2 multiplexes over one TCP connection, where one lost packet can stall all streams."
    },
    {
      kind: "bug",
      q: "A developer commits an API key to Git, then deletes it in the next commit. What is the right response?",
      choices: [
        "Treat it as leaked: rotate the key, since history still contains it",
        "Nothing; the deletion removed it",
        "Make the repository private and keep using the key",
        "Base64-encode it and recommit"
      ],
      answer: 0,
      explain: "Version history keeps old content and copies may already exist. Revoke and replace the secret; removing history is secondary to rotation."
    },
    {
      kind: "concept",
      q: "In a major incident, what should the first priority be?",
      choices: [
        "Mitigate user impact, for example by rolling back, before finding the full root cause",
        "Write the postmortem",
        "Identify who made the mistake",
        "Rewrite the failing service"
      ],
      answer: 0,
      explain: "Stop the harm first (rollback, flag flip, failover, shed load), then investigate. Postmortems are blameless and happen after recovery."
    }
  ],
  cards: [
    { id: "container-def", front: "What is a container, in one sentence?", back: "A process (or group) on the shared host kernel, with namespaces limiting what it sees, cgroups limiting what it uses, and a layered image as its filesystem." },
    { id: "ns-vs-cg", front: "Namespaces vs cgroups?", back: "Namespaces isolate visibility (PIDs, network, mounts, users). Cgroups limit and account resources (CPU, memory, I/O)." },
    { id: "vm-vs-container", front: "Container vs VM?", back: "VM: emulated hardware and its own kernel, stronger isolation, heavier. Container: shared kernel, light and fast, weaker isolation boundary." },
    { id: "image-tag-digest", front: "Image tag vs digest?", back: "A tag is a movable label; a digest (sha256 of content) always names exactly the same image." },
    { id: "docker-cache", front: "How does Docker layer caching shape a Dockerfile?", back: "A layer is reused only if it and all earlier layers are unchanged, so put rarely changing steps (dependency install) before frequently changing ones (source copy)." },
    { id: "multistage", front: "Why multi-stage builds?", back: "Build in one stage with compilers and tools, copy only the results into a small final stage: smaller image, smaller attack surface." },
    { id: "cmd-exec-form", front: "Why prefer exec form for CMD?", back: "A JSON list runs your program directly as the main process so it receives stop signals; shell form wraps it in a shell that may not forward them." },
    { id: "k8s-reconcile", front: "What is Kubernetes' core idea?", back: "Declarative desired state: you describe what you want and controllers continuously reconcile the actual state toward it." },
    { id: "pod-def", front: "What is a pod?", back: "The smallest deployable unit: one or more containers sharing a network address and volumes, scheduled together. Pods are ephemeral." },
    { id: "deploy-service", front: "Deployment vs Service?", back: "A Deployment keeps N identical pods running and does rolling updates. A Service gives a stable address in front of changing pods, selected by labels." },
    { id: "request-limit", front: "Resource request vs limit?", back: "Request: reserved for scheduling. Limit: runtime cap. Over memory limit, the container is killed; over CPU limit, it is throttled." },
    { id: "probes", front: "Liveness vs readiness vs startup probe?", back: "Liveness failing restarts the container. Readiness failing removes the pod from traffic. Startup delays the other two for slow starters." },
    { id: "secret-b64", front: "Is a Kubernetes Secret encrypted by default?", back: "No, it is base64-encoded, which is encoding. Add access control and encryption at rest." },
    { id: "iac-def", front: "Why infrastructure as code?", back: "Reviewable, repeatable, versioned infrastructure; avoids hand-made snowflakes and untracked drift. Read the plan before applying." },
    { id: "drift", front: "What is configuration drift?", back: "The real environment diverges from the code, usually through manual changes. Detect with a plan, then revert or capture in code." },
    { id: "cd-vs-cd", front: "Continuous delivery vs continuous deployment?", back: "Delivery: every passing change is ready to release on demand. Deployment: every passing change is released automatically." },
    { id: "build-once", front: "Build once, deploy everywhere: why?", back: "You then run in production the exact artifact you tested. Environment differences belong in configuration, not in the build." },
    { id: "rolling-bg-canary", front: "Rolling vs blue-green vs canary?", back: "Rolling: replace instances gradually. Blue-green: two environments, flip the router, fast rollback, double capacity. Canary: small slice of real traffic first, ramp on healthy metrics." },
    { id: "expand-contract", front: "Expand and contract for schema changes?", back: "Add the new column compatible with old code, deploy code using both, migrate data, remove the old column later." },
    { id: "feature-flag", front: "What do feature flags give you?", back: "They separate deploy from release: gradual rollout and instant rollback by a flag flip. Remove stale flags to avoid test-matrix debt." },
    { id: "object-store", front: "Object storage in a sentence?", back: "Durable, cheap blob storage by key over HTTP; whole-object replace, no in-place edits or real directories, higher latency than disk." },
    { id: "queue-alo", front: "Why must queue consumers be idempotent?", back: "Most queues deliver at least once, so duplicates happen; the handler must produce the same effect when run again." },
    { id: "cold-start", front: "What is a serverless cold start?", back: "Extra latency when the platform must create a new function instance and load the runtime and code. Mitigate with smaller packages or reserved capacity." },
    { id: "three-signals", front: "Logs vs metrics vs traces?", back: "Logs: detail of single events. Metrics: cheap aggregated numbers for alerts. Traces: one request's path across services as timed spans." },
    { id: "slo-budget", front: "SLI, SLO, SLA, error budget?", back: "SLI: measured ratio of good events. SLO: target for it. SLA: contract with consequences. Error budget: 100 percent minus the SLO." },
    { id: "nines-math", front: "Downtime allowed by 99.9 percent over 30 days?", back: "About 43.2 minutes. 99.99 percent allows about 4.3 minutes." },
    { id: "backoff-jitter", front: "Retry best practice?", back: "Exponential backoff with a cap and random jitter, bounded attempts, only retry errors that can succeed later, watch for retries stacking across layers." },
    { id: "breaker-states", front: "Circuit breaker states?", back: "Closed (normal), open (fail fast during cool-down), half-open (trial request decides whether to close or reopen)." },
    { id: "idem-key", front: "What is an idempotency key?", back: "A client-supplied unique id; the server stores the result under it and returns that result for repeats. The check-and-store must be atomic." },
    { id: "dns-ttl", front: "What does DNS TTL control?", back: "How long resolvers may cache a record. Low TTL speeds changes but adds query load; caches mean failover is slow and uneven." },
    { id: "http-versions", front: "HTTP/1.1 vs 2 vs 3?", back: "1.1: one request per connection at a time. 2: multiplexed streams over one TCP connection. 3: QUIC over UDP, per-stream loss recovery, faster setup." },
    { id: "least-priv", front: "What is least privilege?", back: "Grant only the access needed, for only as long as needed, so a leaked credential or exploit has a small blast radius." },
    { id: "secret-rotation", front: "A secret was committed to Git. What now?", back: "Treat it as leaked: rotate it (issue new, revoke old). Deleting it from a later commit does not remove it from history." },
    { id: "supply-chain", front: "Basic supply chain defenses?", back: "Pin and lock dependencies, scan images and packages, use minimal base images, produce an SBOM, sign artifacts, protect the pipeline." },
    { id: "egress-cost", front: "A common surprise cloud cost?", back: "Data transfer: leaving the cloud or crossing regions or zones is usually charged, while ingress often is not. Check each provider's pricing." },
    { id: "incident-order", front: "Order of an incident response?", back: "Detect, triage, mitigate first (rollback, flag, failover), communicate, resolve, then learn with a blameless postmortem and owned action items." }
  ],
  related: { label: "Networking", href: "#/cs/networking", note: "DNS, TCP, TLS and HTTP fundamentals that this track builds on." }
});
