export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Handle the form submission API
		if (url.pathname === "/api/submit" && request.method === "POST") {
			try {
				const formData = await request.formData();
				const data = Object.fromEntries(formData.entries());

				// Identify form type (Quote or Contact)
				const isQuote = data.pickup !== undefined;
				const formTitle = isQuote ? "New Freight Quote Request" : "New Contact Message";

				// Construct plain text email body
				let emailBody = `${formTitle}\n`;
				emailBody += "=".repeat(formTitle.length) + "\n\n";

				for (const [key, value] of Object.entries(data)) {
					const label = key.charAt(0).toUpperCase() + key.slice(1);
					emailBody += `${label}: ${value}\n`;
				}

				emailBody += "\n---\nSent from WeFreightGlobal Website";

				// MailChannels integration (requires your domain DNS/SPF/DKIM to be set up)
				const sendRequest = new Request("https://api.mailchannels.net/tx/v1/send", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						personalizations: [{
							to: [{ email: "dh07312021@gmail.com", name: "WeFreightGlobal Quote Team" }],
						}],
						from: { email: "no-reply@wefreightglobal.com", name: "WeFreight Website" },
						subject: formTitle + (data.name ? ` from ${data.name}` : ""),
						content: [{ type: "text/plain", value: emailBody }],
					}),
				});

				const response = await fetch(sendRequest);

				if (response.ok) {
					return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				} else {
					const errorText = await response.text();
					return new Response(JSON.stringify({ success: false, error: errorText }), {
						status: response.status,
						headers: { "Content-Type": "application/json" },
					});
				}
			} catch (err) {
				return new Response(JSON.stringify({ success: false, error: err.message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// Otherwise, serve the static assets from the public directory
		// The Assets-only Worker will handle this automatically if we don't return a response
		// or if we use the default fallback.
		return env.ASSETS.fetch(request);
	},
};
