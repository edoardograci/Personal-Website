exports.handler = async (event, context) => {
  try {
    // Fetch the HTML from the Framer app
    const response = await fetch("https://charismatic-everyone-653587.framer.app/");
    let html = await response.text();

    // Remove the noindex meta tag
    html = html.replace(/<meta\s+name=["']robots["']\s+content=["']noindex["']\s*\/?>/gi, "");

    // Remove the Framer analytics script
    html = html.replace(/<script\s+async\s+src="https:\/\/events\.framer\.com\/script".*?<\/script>/gi, "");

    // Return the modified HTML with headers
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "X-Robots-Tag": "index, follow",
      },
      body: html,
    };
  } catch (error) {
    // Return a JSON error response
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching or modifying HTML" }),
    };
  }
};
