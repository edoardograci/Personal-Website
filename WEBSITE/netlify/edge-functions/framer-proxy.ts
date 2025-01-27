exports.handler = async (event, context) => {
  try {
    const requestUrl = new URL(event.rawUrl);
    const path = requestUrl.pathname;

    // Construct the Framer URL
    const framerUrl = `https://charismatic-everyone-653587.framer.app${path}${requestUrl.search}`;

    // Clone original request headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(event.headers)) {
      headers.set(key, value);
    }

    // Override headers for Framer bot detection
    headers.set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");
    headers.set("Referer", "https://edoardograci.com/");

    // Fetch the response from Framer
    const response = await fetch(framerUrl, { headers });

    if (response.status === 404) {
      return {
        statusCode: 404,
        body: "Not Found",
      };
    }

    // Modify the response HTML
    let html = await response.text();
    html = html
      .replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "")
      .replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "X-Robots-Tag": "index, follow",
      },
      body: html,
    };
  } catch (error) {
    console.error("Error in proxy:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
