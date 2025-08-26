export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    let payload;
    try { payload = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
    const { name, email, subject, message } = payload || {};
    if (!name || !email || !subject || !message) return new Response("Missing fields", { status: 400 });

    const issue = {
      title: subject,
      body: `**From:** ${name} <${email}>\n\n${message}`,
      labels: ["status: new"]
    };

    const ghRes = await fetch(`${env.GITHUB_API}/repos/${env.GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "linear-desk-worker"
      },
      body: JSON.stringify(issue)
    });

    const data = await ghRes.json();
    if (!ghRes.ok) return new Response(JSON.stringify(data), { status: ghRes.status });

    return new Response(JSON.stringify({ ok: true, issue_number: data.number, issue_url: data.html_url }), { status: 200 });
  }
}
