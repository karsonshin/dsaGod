(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'sec-2026-09-citrix-netscaler-zero-days',
      area: 'Security',
      date: '2026-09-27',
      title: 'CISA flags actively exploited Citrix NetScaler flaws',
      source: 'CISA (US cyber agency)',
      url: 'https://www.cisa.gov/news-events/alerts/2026/09/27/critical-zero-day-vulnerabilities-exploited-citrix-netscaler-adc-gateway',
      summary: 'CISA published an alert on a group of ten vulnerabilities in Citrix NetScaler ADC and Gateway. Two of them, CVE-2026-88771 and CVE-2026-88772, were added to its exploited-vulnerabilities catalog on 27 September, and CISA says each can allow remote code execution. A later addition covers a SAML-related denial of service. CISA advises patching quickly, but first checking for signs of compromise and preserving evidence, then restoring a clean backup and rotating secrets. The alert does not list affected versions.',
      why: 'Internet-facing gateways are prime targets, and the advice shows that incident response is more than applying a patch.',
      terms: [['KEV catalog', 'CISA\'s public list of vulnerabilities known to be exploited in real attacks.'], ['Remote code execution', 'A flaw that lets an attacker run their own code on a machine from afar.'], ['Indicators of compromise', 'Traces such as files, logs or addresses that suggest a system was breached.']],
      interview: 'Ties to defence in depth and to secrets management: after a suspected breach you rotate keys and certificates, not just patch.'
    },
    {
      id: 'sec-2026-09-linux-kernel-kev',
      area: 'Security',
      date: '2026-09-19',
      title: 'Three Linux kernel bugs added to the exploited list',
      source: 'The Hacker News',
      url: 'https://thehackernews.com/2026/09/cisa-flags-three-linux-kernel.html',
      summary: 'CISA added three Linux kernel flaws to its known-exploited catalog on 18 September, citing evidence of active exploitation. All three need local access: a TLS receive-path check error, an out-of-bounds write in the ebtables networking code, and a race condition on cryptographic sockets. Red Hat updated its advisories to note exploitation. The article gives no details on how the attacks work, and it flags that one severity score looks unusually high for a local flaw and should be checked against official databases.',
      why: 'Local privilege flaws matter on shared servers, containers and CI runners, where untrusted code already runs.',
      terms: [['Privilege escalation', 'Gaining more rights on a system than you were given.'], ['Race condition', 'A bug where the result depends on the timing of concurrent operations.'], ['CVSS', 'A 0-10 score describing how severe a vulnerability is.']],
      interview: 'A race condition on a shared resource is the same class of problem as unsynchronised threads in concurrency questions.'
    },
    {
      id: 'sec-2026-09-chrome-v8-zero-day',
      area: 'Security',
      date: '2026-09-04',
      title: 'Chrome patches its sixth exploited zero-day of 2026',
      source: 'Security Affairs',
      url: 'https://securityaffairs.com/198405/security/google-fixes-the-sixth-actively-exploited-chrome-zero-day-of-2026.html',
      summary: 'Google released Chrome 152 security updates fixing 12 vulnerabilities, including CVE-2026-85046, a type confusion bug in the V8 JavaScript engine. Google says an exploit exists in the wild. A crafted web page could let an attacker run code inside the browser sandbox. The flaw was reported on 4 August by an outside researcher. Google has not shared attack details or named an actor, and the rollout is gradual, so some users may not be updated yet.',
      why: 'Your code runs in browsers and Electron apps built on V8, so keeping them updated is part of shipping safely.',
      terms: [['Zero-day', 'A flaw that attackers exploit before or as a fix becomes available.'], ['Type confusion', 'A memory-safety bug where code treats data as the wrong type.'], ['Sandbox', 'A restricted environment that limits what code can touch.']],
      interview: 'Illustrates why memory-safe languages and process isolation come up when discussing browser and OS design.'
    },
    {
      id: 'sec-2026-09-kev-ai-gateway-litellm',
      area: 'Security',
      date: '2026-09-03',
      title: 'Exploited-flaw list adds an AI gateway and workflow tools',
      source: 'The Hacker News',
      url: 'https://thehackernews.com/2026/09/cisa-adds-seven-exploited-flaws-as.html',
      summary: 'On 2 September CISA added seven flaws to its exploited list, covering SonicWall SMA 1000, Sangoma Switchvox, JFrog Artifactory, Starlette, Kestra and the LiteLLM AI gateway. The LiteLLM entry is an authentication flaw on its MCP endpoint. The article, a contributed piece, cites other firms reporting a chain of Starlette and LiteLLM bugs used by ransomware-linked actors and for cryptominer delivery; those claims are secondhand. Federal deadlines were 5 and 16 September.',
      why: 'AI infrastructure and web frameworks are now routine attack targets, so treat them like any other exposed service.',
      terms: [['MCP', 'Model Context Protocol, a standard for connecting AI agents to tools and data.'], ['Auth bypass', 'A flaw that lets someone act without proper login or permission.'], ['Request smuggling', 'Sending ambiguous HTTP requests so different components parse them differently.']],
      interview: 'Authentication versus authorization, and why default-open endpoints on internal services are risky.'
    },
    {
      id: 'sec-2026-08-chaindrop-npm-worm',
      area: 'Security',
      date: '2026-08-04',
      title: 'Microsoft analyses a self-spreading npm credential worm',
      source: 'Microsoft Security Blog',
      url: 'https://www.microsoft.com/en-us/security/blog/2026/08/04/chaindrop-supply-chain-compromise-anatomy-self-propagating-worm/',
      summary: 'Microsoft Threat Intelligence reports a Mini Shai-Hulud variant that affected over 400 npm packages from unrelated publishers, including keyv. The payload runs in an install hook, steals developer and CI credentials, and uses stolen npm tokens to republish other packages with bumped versions. Initial access is inferred, not confirmed, to be stolen maintainer credentials. Microsoft says provenance alone does not prove a package is safe, and advises rotating credentials from a clean system and pinning known-good versions.',
      why: 'Every npm install trusts many strangers, so your CI tokens and lockfile habits are part of your security.',
      terms: [['Supply chain attack', 'Compromising software by tampering with something it depends on.'], ['Lifecycle hook', 'A script npm runs automatically during package install.'], ['Provenance', 'Signed metadata about where and how a package was built.']],
      interview: 'Links to dependency management, least-privilege tokens, and reproducible builds.'
    },
    {
      id: 'sec-2026-10-google-pqc-tls-default',
      area: 'Security',
      date: '2026-10-09',
      title: 'Google Cloud load balancers move to hybrid post-quantum TLS by default',
      source: 'Google Cloud documentation',
      url: 'https://docs.cloud.google.com/load-balancing/docs/post-quantum-tls',
      summary: 'Google documents that it will begin enabling the hybrid X25519MLKEM768 key exchange by default on its load balancers from October 2026. Customers can set the option to deferred to postpone this until October 2027, after which it is always on. It applies only to client-to-load-balancer connections, and only when the client supports TLS 1.3 and that algorithm. The page presents it as protection against recorded traffic being decrypted later, not as a fix for certificates.',
      why: 'Post-quantum migration is moving from planning to default settings you may meet in production.',
      terms: [['ML-KEM', 'A NIST-standardised key exchange designed to resist quantum computers.'], ['Hybrid key exchange', 'Combining a classical and a post-quantum method so both must be broken.'], ['Harvest now, decrypt later', 'Recording encrypted traffic today to decrypt once quantum computers exist.']],
      interview: 'Key exchange versus signatures, and the trade-off of larger handshakes versus future-proofing.'
    },
    {
      id: 'sec-2026-09-uk-one-login-passkeys',
      area: 'Security',
      date: '2026-09-14',
      title: 'UK government opens passkeys to GOV.UK One Login users',
      source: 'GOV.UK (UK government)',
      url: 'https://www.gov.uk/government/news/millions-of-people-to-benefit-from-simpler-more-secure-way-to-sign-in-to-government-services',
      summary: 'The UK government is rolling out passkeys across GOV.UK One Login, which it says serves more than 23 million users. Over 300,000 people switched during a trial, and nearly one in ten daily sign-ins now use passkeys. The government claims they are up to eight times faster than password plus code and resist phishing because they are tied to a device and site. Passkeys are optional and passwords remain, and the release gives no methodology for its figures.',
      why: 'Passkeys are becoming a normal login option you will be asked to implement and support.',
      terms: [['Passkey', 'A login credential based on a key pair stored on your device, unlocked by biometrics or a PIN.'], ['Phishing-resistant', 'Cannot be handed to a fake site because the credential is bound to the real domain.'], ['Public-key cryptography', 'Uses a public key to verify and a private key to sign.']],
      interview: 'Shows asymmetric cryptography in practice: the server stores only a public key, so a database leak exposes no secrets.'
    },
    {
      id: 'sec-2026-09-manus-agent-prompt-injection',
      area: 'Security',
      date: '2026-09-25',
      title: 'Researchers show an email could hijack the Manus AI agent',
      source: 'OODA Loop security brief',
      url: 'https://oodaloop.com/briefs/cyber/prompt-injection-vulnerability-hits-4b-agentic-ai-platform-manus-ai/',
      summary: 'This brief reports that Salt Labs found an indirect prompt injection flaw in the Manus agent that allowed remote code execution through an incoming email. The product blocked plain execution requests, but the researchers got past that filter with JavaScript obfuscation. The brief does not say whether the issue is fixed, give affected versions or a CVE, and calls the company valuation a reported target. It is a short news item based on the researchers\' disclosure.',
      why: 'Any agent that reads untrusted content and can run tools is a security boundary you must design for.',
      terms: [['Prompt injection', 'Hiding instructions in content so an AI model follows them as if from the user.'], ['Obfuscation', 'Disguising code or text so filters do not recognise it.'], ['Least privilege', 'Giving a system only the access it needs.']],
      interview: 'Mirrors injection flaws like SQL injection: mixing data and instructions, and why allow-lists and sandboxing beat keyword filters.'
    },
    {
      id: 'sec-2026-09-cisa-2015-extension',
      area: 'Security',
      date: '2026-09-01',
      title: 'Stopgap bill extends US cyber threat-sharing law to December',
      source: 'Nextgov/FCW news',
      url: 'https://www.nextgov.com/policy/2026/09/stopgap-funding-bill-temporarily-extends-key-cyber-info-sharing-law/415756/',
      summary: 'A continuing resolution approved by the House would extend the Cybersecurity Information Sharing Act of 2015 to 11 December, before its end-of-September expiry. The law gives companies liability protection when they voluntarily share threat information with agencies such as CISA. The article says the president was expected to sign soon but had not yet. The extension is temporary, and efforts at a longer reauthorization have stalled, partly over objections from one senator.',
      why: 'Policy shapes how companies report breaches and share threat data, which affects security teams you may join.',
      terms: [['Liability protection', 'Legal shielding from lawsuits for actions taken in good faith.'], ['Threat intelligence', 'Information about attackers, tools and indicators used to defend systems.'], ['Continuing resolution', 'A temporary US funding measure that keeps government running.']],
      interview: 'A reminder that incident disclosure and data sharing have legal and privacy trade-offs, a common point in security design discussions.'
    }
  );
})();
