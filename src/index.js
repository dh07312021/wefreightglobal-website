import { SMTPClient } from 'emailjs';

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

				// Gmail SMTP configuration (using environment variables)
				// Ensure you have set GMAIL_USER and GMAIL_PASS using 'wrangler secret put'
				const client = new SMTPClient({
					user: env.GMAIL_USER,
					password: env.GMAIL_PASS,
					host: 'smtp.gmail.com',
					ssl: true,
				});

				await client.sendAsync({
					text: emailBody,
					from: `WeFreight Website <${env.GMAIL_USER}>`,
					to: 'quote@wefreightglobal.com',
					subject: formTitle + (data.name ? ` from ${data.name}` : ""),
				});

				return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			} catch (err) {
				console.error("Gmail SMTP Error:", err);
				return new Response(JSON.stringify({ success: false, error: err.message }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// Otherwise, serve the static assets from the public directory
		return env.ASSETS.fetch(request);
	},
};
