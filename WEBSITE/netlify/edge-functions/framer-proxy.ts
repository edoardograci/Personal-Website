exports.handler = async (request) => {
  try {
    // Preserve original URL components
    const host = request.headers.host || "edoardograci.com";
    const fullUrl = new URL(request.url, `https://${host}`);
    
    // Remove EXACT proxy path prefix (matches your netlify.toml)
    const basePath = "/.netlify/edge-functions/framer-proxy";
    const originalPath = fullUrl.pathname.startsWith(basePath)
      ? fullUrl.pathname.slice(basePath.length)
      : fullUrl.pathname;

    // Construct PROPER Framer URL with query params
    const framerBase = "https://charismatic-everyone-653587.framer.app";
    const framerUrl = new URL(originalPath + fullUrl.search, framerBase);

    // Essential headers to avoid 404s
    const headers = new Headers({
      "Host": framerBase.replace("https://", ""),
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Referer": "https://edoardograci.com/"
    });

    // Proxy request with proper path handling
    const response = await fetch(framerUrl, {
      headers,
      redirect: "follow",
      method: request.method,
      body: request.body
    });

    // Pass through non-HTML responses directly
    if (!response.headers.get("content-type")?.includes("text/html")) {
      return response;
    }

    // Process HTML
    let html = await response.text();
    html = html
      .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
      .replace(/<script[^>]*events\.framer\.com[^>]*><\/script>/gi, '')
      .replace(/<title>[^<]*<\/title>/gi, '<title>Edoardo Graci - Product Designer</title>')
      .replace(/<meta property="og:title"[^>]*>/gi, '<meta property="og:title" content="Edoardo Graci - Product Designer"/>')
      .replace(/<meta name="description"[^>]*>/gi, '<meta name="description" content="Product designer with a focus on digital products and user experience."/>');

    return new Response(html, {
      status: response.status,
      headers: {
        "Content-Type": "text/html",
        "X-Robots-Tag": "index, follow",
        ...Object.fromEntries(response.headers)
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
