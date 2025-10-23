interface PostmarkTemplateData {
  [key: string]: string | number | boolean | PostmarkTemplateData | { [key: string]: any }
}

export async function sendTemplateEmail(
  templateAlias: string,
  to: string,
  templateData: PostmarkTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.POSTMARK_API_KEY

  if (!apiKey) {
    console.error("POSTMARK_API_KEY is not configured")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email/withTemplate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": apiKey,
      },
      body: JSON.stringify({
        From: "info@lastrada-eg.com",
        To: to,
        TemplateAlias: templateAlias,
        TemplateModel: templateData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Postmark API error:", errorData)
      return { success: false, error: errorData.Message || "Failed to send email" }
    }

    const data = await response.json()
    return { success: true, messageId: data.MessageID }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
