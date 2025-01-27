exports.handler = async (event, context) => {
  try {
    // Decode path to handle special characters
    const path = decodeURI(event.path);
    const framerUrl = `https://charismatic-everyone-653587.framer.app${path}`;

    const response = await fetch(framerUrl);

    // Handle Framer 404s
    if (response.status === 404) {
      return { statusCode: 404, body: 'Not Found' };
    }

    let html = await response.text();

    // Remove noindex meta tag and Framer analytics
    html = html
      .replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "")
      .replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: html,
    };
  } catch (error) {
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
