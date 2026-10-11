(function () {
  var OR = (window.OR = window.OR || {}); OR.tech = OR.tech || { items: [] };
  OR.tech.items.push(
    {
      id: 'hw-2026-10-nvhbm-base-die',
      area: 'Hardware and chips',
      date: '2026-10-09',
      title: 'NVIDIA NVHBM pushes memory makers to outsource HBM base dies',
      source: 'TrendForce News',
      url: 'https://www.trendforce.com/news/2026/10/09/news-nvidias-nvhbm-reshapes-memory-makers-base-die-strategies-as-micron-samsung-turn-to-external-foundries/',
      summary: 'NVIDIA announced NVHBM in August 2026, a high-bandwidth memory design that moves the memory controller into the stack base die. NVIDIA claims up to 30% more bandwidth and 15% less power than standard HBM4E. Press reports say Micron will source base dies externally and Samsung is moving to a dual in-house or TSMC approach. Most details come from unnamed industry sources and vendor claims, not confirmed.',
      why: 'AI training and inference speed is often limited by memory bandwidth, so memory architecture shapes what models are practical to run and what they cost.',
      terms: [['HBM', 'High-bandwidth memory: DRAM dies stacked vertically and placed right beside a processor for very high bandwidth.'], ['Base die', 'The logic chip at the bottom of an HBM stack that connects the memory layers to the processor.'], ['Memory controller', 'Hardware that schedules reads and writes to memory.']],
      interview: 'Illustrates the memory-wall idea behind caching and locality: compute is cheap, moving data is the bottleneck.'
    },
    {
      id: 'hw-2026-10-tsmc-q3-revenue',
      area: 'Hardware and chips',
      date: '2026-10-08',
      title: 'TSMC posts record third-quarter revenue on AI demand',
      source: 'TrendForce News',
      url: 'https://www.trendforce.com/news/2026/10/08/news-tsmc-q3-revenue-beats-forecasts-at-record-nt1-49-trillion-net-profit-seen-surging-64/',
      summary: 'TSMC reported Q3 2026 revenue of about NT$1.49 trillion (roughly US$46.7 billion), up 50% year over year and above its own guidance range. September revenue was NT$511.86 billion. Net profit forecasts of about NT$740.8 billion are analyst estimates; TSMC reports earnings on October 15. Analysts expect Q4 growth from NVIDIA Vera Rubin and 2nm demand, which is an outlook rather than company guidance.',
      why: 'One foundry fabricates most leading AI chips, so its numbers are a gauge of how much compute capacity the industry can actually buy.',
      terms: [['Foundry', 'A company that manufactures chips designed by other firms.'], ['Guidance', 'A forecast a company gives for its own coming results.'], ['2nm', 'A marketing name for a leading-edge chip manufacturing process generation.']],
      interview: 'A single supplier on the critical path is a single point of failure, the same concept as in system design.'
    },
    {
      id: 'hw-2026-10-surface-rtx-spark',
      area: 'Hardware and chips',
      date: '2026-10-08',
      title: 'Microsoft shows on-PC AI with NVIDIA RTX Spark as memory costs rise',
      source: 'TrendForce News',
      url: 'https://www.trendforce.com/news/2026/10/08/news-microsoft-expands-local-ai-push-with-nvidia-rtx-spark-surface-ultra-priced-up-to-5899-as-memory-costs-rise/',
      summary: 'At an October 7 event Microsoft launched the Surface Laptop Ultra with NVIDIA RTX Spark, starting at $2,599 and reaching $5,899 with 128 GB memory. NVIDIA says RTX Spark supports up to 128 GB unified memory and local models up to 120B parameters. Microsoft describes a hybrid design that keeps heavy tasks in the cloud. The article links higher prices to a memory shortage; the specs are NVIDIA claims.',
      why: 'Running models on-device changes latency, privacy and cost trade-offs you will face when designing AI features.',
      terms: [['Unified memory', 'One memory pool shared by CPU and GPU instead of separate copies.'], ['Parameters', 'The learned numbers in a model; more usually means more memory needed.'], ['Edge/local inference', 'Running a trained model on the user device rather than a server.']],
      interview: 'Edge versus cloud compute is a classic latency, cost and privacy trade-off in system design.'
    },
    {
      id: 'hw-2026-10-toshiba-hdd',
      area: 'Hardware and chips',
      date: '2026-10-02',
      title: 'Toshiba plans to double AI data-centre hard drive capacity',
      source: 'TrendForce News',
      url: 'https://www.trendforce.com/news/2026/10/02/news-toshiba-to-double-ai-data-center-hdd-capacity-by-fy2027-with-380m-expansion-as-ai-storage-demand-surges/',
      summary: 'Citing a Nikkei report, the article says Toshiba will invest about 60 billion yen (roughly US$380 million) to double production capacity for data-centre HDDs within fiscal 2027, its first major HDD investment in about five years. It targets 65TB-class drives in 2030. Seagate and Western Digital have reportedly allocated most near-term nearline supply. Figures are secondary reporting, and capacity and density numbers are targets.',
      why: 'Bulk storage cost and supply still decide how much data an AI or backend system can retain cheaply.',
      terms: [['Nearline HDD', 'High-capacity disks used for large, less frequently accessed data in data centres.'], ['Capacity', 'Maximum units a factory can produce in a period.']],
      interview: 'Storage tiers (SSD versus HDD) map to hot, warm and cold data, a common cost-versus-latency design choice.'
    },
    {
      id: 'hw-2026-09-asml-high-na-euv',
      area: 'Hardware and chips',
      date: '2026-09-08',
      title: 'ASML and chipmakers outline High-NA EUV and 12-inch mask plans',
      source: 'TrendForce News',
      url: 'https://www.trendforce.com/news/2026/09/08/news-asml-expands-high-na-euv-push-with-tsmc-samsung-and-intel-12-inch-photomask-pilot-line-set-for-2031/',
      summary: 'TSMC says it targets high-volume High-NA EUV manufacturing from 2030. ASML, TSMC, Samsung and Intel aim for a 12-inch photomask pilot line by 2031, which TSMC says could enable 12-inch High-NA production by 2033. ASML says Intel has processed over one million wafers with High-NA tools, starting with 18A. These dates are roadmap targets, and the Intel figure is ASML\'s own statement.',
      why: 'Lithography limits decide how fast chips can keep shrinking, which affects the hardware your software will run on.',
      terms: [['EUV', 'Extreme ultraviolet lithography: light with a very short wavelength used to print tiny chip features.'], ['High-NA', 'EUV tools with a larger numerical aperture for finer resolution.'], ['Photomask', 'The stencil that carries a chip pattern during printing.']],
      interview: 'Moore\'s law slowing is why concurrency and algorithmic efficiency matter: hardware will not make slow code fast for free.'
    },
    {
      id: 'hw-2026-09-cowos-l-packaging',
      area: 'Hardware and chips',
      date: '2026-09-18',
      title: 'TrendForce expects CoWoS-L to stay the main AI chip packaging',
      source: 'TrendForce press centre',
      url: 'https://www.trendforce.com/presscenter/news/20260918-13241.html',
      summary: 'TrendForce expects TSMC\'s CoWoS-L to remain the mainstream AI chip packaging through 2028, even as Intel pushes EMIB-T. Larger AI packages with more HBM are straining silicon interposers. It forecasts NVIDIA high-end GPU shipments up about 30% in 2026, and says AMD is promoting MI400/MI450 from the second half. TSMC packaging capacity is constrained, which raises interest in EMIB. These are analyst forecasts.',
      why: 'Advanced packaging, not just the chip itself, is now a bottleneck for how many AI accelerators exist.',
      terms: [['Advanced packaging', 'Joining several chips and memory stacks into one module.'], ['Interposer', 'A thin layer under chips that carries the wiring between them.'], ['ASIC', 'A chip built for one specific job, such as Google TPUs.']],
      interview: 'Bottleneck analysis: throughput is set by the slowest stage, so a pipeline is limited by its narrowest component.'
    },
    {
      id: 'hw-2026-08-liquid-cooling-forecast',
      area: 'Hardware and chips',
      date: '2026-08-17',
      title: 'Liquid cooling forecast to cover 53% of AI chips in 2026',
      source: 'TrendForce press centre',
      url: 'https://www.trendforce.com/presscenter/news/20260817-13183.html',
      summary: 'TrendForce projects liquid cooling penetration for AI chips rising from about 33% in 2025 to 53% in 2026 and nearing 60% in 2027. It cites chip power above 1 kW and rack-scale servers drawing hundreds of kilowatts. Google is said to use liquid cooling in over 80% of its AI servers. NVIDIA moved to a one-piece Rubin heat spreader after substrate warpage. All penetration figures are forecasts.',
      why: 'Power and heat now limit data-centre size, so efficiency work such as lower-precision models and batching has real cost value.',
      terms: [['TDP', 'Thermal design power: heat a chip is designed to dissipate.'], ['Cold plate', 'A metal plate on a chip with liquid flowing through it to carry heat away.'], ['Rack-scale', 'Designing a whole rack as one integrated computer.']],
      interview: 'Capacity planning: physical limits like power and cooling are constraints just like CPU or network in scaling discussions.'
    },
    {
      id: 'hw-2026-09-quantinuum-helix',
      area: 'Hardware and chips',
      date: '2026-09-09',
      title: 'Quantinuum demonstrates Helix error-correction code on Helios',
      source: 'Quantum Computing Report',
      url: 'https://quantumcomputingreport.com/quantinuum-demonstrates-helix-quantum-error-correction-architecture-on-helios-hardware/',
      summary: 'Quantinuum reports running its Helix error-correction architecture on its 98-qubit Helios machine. It cites a logical memory error of 4.6e-5 per logical qubit per cycle and a code needing 3.5 times fewer qubits than a comparable surface code. A 1.9e-5 figure uses postselection. Hardware reaching 1e-6 to 1e-8 error rates is a simulation-based projection, and the report relies on the company\'s own paper, not independent verification.',
      why: 'Useful quantum computers depend on error correction, so this shows how close real machines are to practical use.',
      terms: [['Logical qubit', 'A more reliable qubit built from many error-prone physical qubits.'], ['Error correction', 'Encoding information redundantly so errors can be detected and fixed.'], ['Postselection', 'Discarding runs that look bad, which can flatter results.']],
      interview: 'Redundancy for fault tolerance, like replication or checksums, trades extra resources for reliability.'
    },
    {
      id: 'hw-2026-09-infleqtion-logical-qubits',
      area: 'Hardware and chips',
      date: '2026-09-24',
      title: 'Infleqtion reports 30 entangled logical qubits on neutral atoms',
      source: 'Quantum Computing Report',
      url: 'https://quantumcomputingreport.com/infleqtion-achieves-30-entangled-logical-qubits-on-sqale-neutral-atom-quantum-processor/',
      summary: 'Infleqtion says its Sqale neutral-atom processor entangled 30 logical qubits encoded in 80 physical atoms, announced at Quantum World Congress 2026. The test was a sampling circuit, and the "1,000x" figure compares against random noise rather than giving a logical error rate. Atom-loss post-processing reportedly quadrupled successful runs. The roadmap targets 100 logical qubits by 2028. These are company claims without independent verification.',
      why: 'It shows how quantum progress is measured, and why headline qubit counts can mislead without error rates.',
      terms: [['Neutral-atom', 'Qubits made from individual atoms held in place by lasers.'], ['Entanglement', 'A quantum link in which qubits share a joint state.'], ['Sampling task', 'A benchmark that checks output statistics rather than a useful answer.']],
      interview: 'Benchmarks can be gamed or narrow, so ask what is measured, as with latency percentiles versus averages.'
    },
    {
      id: 'hw-2026-09-quantum-machines-nvqlink',
      area: 'Hardware and chips',
      date: '2026-09-14',
      title: 'Quantum Machines runs a CUDA-Q program across QPU and GPUs via NVQLink',
      source: 'Quantum Computing Report',
      url: 'https://quantumcomputingreport.com/quantum-machines-demonstrates-live-end-to-end-cuda-q-program-execution-via-nvidia-nvqlink/amp/',
      summary: 'Quantum Machines showed a CUDA-Q program running end to end across a quantum processor, classical GPUs and its pulse controller, linked by NVIDIA NVQLink, at IEEE Quantum Week 2026. Readout data goes to GPU nodes and back within microsecond-scale windows, aimed at real-time error-correction feedback. The report gives no latency numbers, qubit counts, error rates or hardware type, and summarises a vendor announcement.',
      why: 'Quantum machines will likely be accelerators attached to classical systems, so integration software matters as much as qubits.',
      terms: [['QPU', 'Quantum processing unit, the quantum chip.'], ['CUDA-Q', 'NVIDIA programming platform for hybrid quantum and GPU programs.'], ['Feedback loop', 'Measuring results and acting on them quickly during a computation.']],
      interview: 'Tail latency in a tight control loop echoes real-time system constraints and why interconnect latency matters.'
    }
  );
})();
