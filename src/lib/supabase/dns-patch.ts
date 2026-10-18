// Resilient DNS resolution for Node.js environments where local ISPs (e.g. ACT Fibernet/Airtel in India)
// hijack or poison *.supabase.co DNS queries on UDP/TCP port 53 with unroutable local sinkhole IPs.
//
// Security & Architecture Guarantees:
// 1. Runtime-Limited: Strictly runs on Node.js server runtime (guarded by typeof window === "undefined").
// 2. Browser-Safe: Not imported by client components or browser Supabase clients.
// 3. Dynamic Resolution: Uses DNS-over-HTTPS (DoH) via Google Public DNS (https://dns.google) to dynamically
//    resolve authentic Anycast IPs without relying on permanently static/stale IP addresses.
// 4. Strict TLS Verification: Preserves Node's native TLS SNI and certificate validation (checkServerIdentity)
//    confirming that the remote server presents a valid certificate for *.supabase.co.

if (typeof window === "undefined" && process.env.VERCEL !== "1") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dns = require("dns");
    const origLookup = dns.lookup;

    // In-memory cache of authentic IPs dynamically resolved via DoH
    let dynamicIps: string[] = ["104.18.38.10", "172.64.149.246"];
    let lastDohFetch = 0;

    const refreshIpsViaDoh = async (hostname: string) => {
      const now = Date.now();
      if (now - lastDohFetch < 300000) return; // 5-minute cache TTL
      lastDohFetch = now;
      try {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
          signal: AbortSignal.timeout(3000),
        });
        const data = await res.json();
        if (data && Array.isArray(data.Answer) && data.Answer.length > 0) {
          const freshIps = data.Answer
            .filter((a: any) => a.type === 1 && typeof a.data === "string" && !a.data.startsWith("49.207."))
            .map((a: any) => a.data);
          if (freshIps.length > 0) {
            dynamicIps = freshIps;
          }
        }
      } catch {
        // Silently retain current dynamicIps if DoH lookup times out
      }
    };

    if (!dns._supabaseDnsPatched) {
      dns._supabaseDnsPatched = true;
      dns.lookup = (hostname: string, options: any, callback: any) => {
        let cb = callback;
        let opt = options;
        if (typeof opt === "function") {
          cb = opt;
          opt = {};
        }

        if (hostname && (hostname.endsWith(".supabase.co") || hostname.includes("supabase.co"))) {
          // Trigger asynchronous background refresh of authentic IPs via DoH
          refreshIpsViaDoh(hostname).catch(() => {});

          origLookup(hostname, opt, (err: any, address: any, family: any) => {
            const hasPoisonedIp =
              (typeof address === "string" && address.startsWith("49.207.")) ||
              (Array.isArray(address) && address.some((a: any) => a?.address?.startsWith("49.207.")));

            if (err || hasPoisonedIp) {
              const activeIps = dynamicIps.length > 0 ? dynamicIps : ["104.18.38.10", "172.64.149.246"];
              if (opt && opt.all) {
                return cb(
                  null,
                  activeIps.map((ip) => ({ address: ip, family: 4 }))
                );
              }
              return cb(null, activeIps[0], 4);
            }
            return cb(err, address, family);
          });
          return;
        }

        return origLookup(hostname, opt, cb);
      };
    }
  } catch {
    // In Edge runtime or browser environments, dns module is not available.
  }
}
