exports.handler = async (event, context) => {
  try {
    // Handle root path and special characters
    const rawPath = event.path === "/.netlify/functions/rewrite-html" ? "/" : event.path;
    const decodedPath = decodeURI(rawPath);
    const framerUrl = `https://charismatic-everyone-653587.framer.app${decodedPath}`;

    // Mimic a real browser request (critical for Framer)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    };

    const response = await fetch(framerUrl, { headers });

    // Forward Framer's 404
    if (response.status === 404) {
      return { statusCode: 404, body: 'Not Found' };
    }

    let html = await response.text();

    // Remove Framer's noindex and analytics
    html = html
      .replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "")
      .replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
