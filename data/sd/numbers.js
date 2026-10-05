/* System design: "numbers every engineer should know" (OR.sd.numbers). approx: true marks rounded rules of thumb. */
(function () {
  var OR = (window.OR = window.OR || {}), SD = (OR.sd = OR.sd || {});
  SD.numbers = SD.numbers || [];
  SD.numbers.push(
    { group: 'Latency', note: 'Order-of-magnitude figures in the tradition of Jeff Dean\'s well-known list. Modern hardware is faster in places, so use the ratios, not the digits.', col: 'Operation', rows: [
      { name: 'L1 cache reference', value: '~1 ns', approx: true },
      { name: 'Main memory (RAM) reference', value: '~100 ns', approx: true, note: '100 times slower than L1.' },
      { name: 'Compress 1 KB with a fast codec (Snappy, LZ4)', value: '~2 to 5 µs', approx: true },
      { name: 'Send 1 KB over a 1 Gbps link', value: '~10 µs', approx: true, note: 'Transfer time only, not the round trip.' },
      { name: 'Random 4 KB read from an NVMe SSD', value: '~20 to 100 µs', approx: true, note: 'Older SATA SSD figures are several times higher.' },
      { name: 'Read 1 MB sequentially from RAM', value: '~50 µs', approx: true },
      { name: 'Round trip inside one data center', value: '~0.5 ms', approx: true, note: 'Between zones in one region: about 1 to 2 ms.' },
      { name: 'Read 1 MB sequentially from SSD', value: '~0.3 to 1 ms', approx: true },
      { name: 'Disk seek (spinning disk)', value: '~5 to 10 ms', approx: true },
      { name: 'Read 1 MB sequentially from spinning disk', value: '~5 to 20 ms', approx: true },
      { name: 'Round trip across continents (for example US to Europe)', value: '~100 to 150 ms', approx: true, note: 'Set by the speed of light in fiber; no software fixes it.' }
    ] },
    { group: 'Time and powers of two', col: 'Quantity', rows: [
      { name: 'Seconds in a day', value: '86,400', note: 'Round to 10^5 for estimates.' },
      { name: 'Seconds in a month', value: '~2.6 million', approx: true, note: '30 days: 2.592 million.' },
      { name: 'Seconds in a year', value: '~31.5 million', approx: true, note: '3.15 x 10^7.' },
      { name: '2^10', value: '1,024', note: 'About a thousand: a kilobyte.' },
      { name: '2^20', value: '~1.05 million', approx: true, note: 'About a million: a megabyte.' },
      { name: '2^30', value: '~1.07 billion', approx: true, note: 'About a billion: a gigabyte.' },
      { name: '2^40', value: '~1.1 trillion', approx: true, note: 'A terabyte.' },
      { name: '62^7 (seven base62 characters)', value: '~3.5 trillion', note: '3,521,614,606,208 exactly.' }
    ] },
    { group: 'Availability', note: 'Downtime allowed per year, from the percent of time the system is up (365-day year).', col: 'Availability', rows: [
      { name: '99% ("two nines")', value: '3.65 days a year', note: 'About 7.2 hours a month.' },
      { name: '99.9% ("three nines")', value: '8.76 hours a year', note: 'About 43 minutes a month.' },
      { name: '99.99% ("four nines")', value: '52.6 minutes a year', note: 'About 4.4 minutes a month.' },
      { name: '99.999% ("five nines")', value: '5.26 minutes a year', note: 'About 26 seconds a month.' }
    ] },
    { group: 'Throughput and capacity of one node', note: 'Wide ranges on purpose. They depend on the work per request, hardware, and configuration. Measure before you rely on one.', col: 'Component', rows: [
      { name: '1 Gbps network link', value: '~125 MB/s', approx: true, note: '10 Gbps is about 1.25 GB/s.' },
      { name: 'Spinning disk, sequential', value: '~100 to 200 MB/s', approx: true },
      { name: 'NVMe SSD, sequential', value: '~1 to 7 GB/s', approx: true },
      { name: 'Application server, simple request', value: '~1K to 10K req/s', approx: true, note: 'Much lower when each request does real work or calls other services.' },
      { name: 'Redis or Memcached, simple get/set', value: '~100K ops/s', approx: true, note: 'Per instance, small values, one network hop. Pipelining goes higher.' },
      { name: 'Relational database, indexed point reads', value: '~5K to 50K/s', approx: true, note: 'Writes are lower, often 1K to 10K a second on one primary.' },
      { name: 'Kafka broker', value: '~100s of MB/s', approx: true, note: 'Aggregate across partitions, with batching and sequential disk.' },
      { name: 'Typical large server RAM', value: '~64 to 512 GB', approx: true }
    ] },
    { group: 'Sizes of common things', col: 'Item', rows: [
      { name: 'ASCII character', value: '1 byte', note: 'UTF-8 uses 1 to 4 bytes per character.' },
      { name: 'Integer (64-bit) or timestamp', value: '8 bytes' },
      { name: 'UUID', value: '16 bytes', note: '36 characters as text.' },
      { name: 'Short text post (about 280 characters)', value: '~300 bytes', approx: true },
      { name: 'Typical database row with metadata', value: '~0.5 to 1 KB', approx: true },
      { name: 'Compressed photo (web size)', value: '~200 KB to 2 MB', approx: true },
      { name: '1 minute of video at 5 Mbps', value: '~37 MB', approx: true, note: 'Bitrate x seconds / 8.' }
    ] }
  );
})();
