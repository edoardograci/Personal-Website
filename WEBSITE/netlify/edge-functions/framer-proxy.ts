exports.handler = async (request: any) => {
  try {
    // Construct the full URL manually
    const host = request.headers["host"] || "edoardograci.com";
    const fullUrl = `https://${host}${request.url || ""}`;
    const url = new URL(fullUrl);

    // Remove Edge Function prefix from the path
    const path = url.pathname.replace("/.netlify/functions/framer-proxy", "");

    // Construct Framer URL
    const framerUrl = `https://charismatic-everyone-653587.framer.app${path}`;

    // Override headers to bypass Framer's bot detection
    const headers = new Headers();
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );
    headers.set("Referer", "https://edoardograci.com/");

    // Fetch Framer's page
    const response = await fetch(framerUrl, { headers });

    // Handle 404s
    if (response.status === 404) {
      return new Response("Not Found", { status: 404 });
    }

    // Get HTML and modify it
    let html = await response.text();
    html = html
      .replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "")
      .replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    // Return modified HTML with original URL intact
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Error in framer-proxy:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
