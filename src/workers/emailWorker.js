async function handleEmailNotification(data) {
  console.log("Received RabbitMQ message:", data);

  const { ownerWalletAddress, deed, time } = data;

  if (!ownerWalletAddress || !deed) {
    console.warn("Skipping message, missing ownerWalletAddress or deed:", data);
    return;
  }

  const recipientEmail = await getEmailFromWallet(ownerWalletAddress);
  if (!recipientEmail) {
    console.warn(`No email found for wallet ${ownerWalletAddress}`);
    return;
  }

  const subject = "New Deed Sent for Registration";
  const message = `A new deed has been created for wallet: ${ownerWalletAddress} at ${time}`;
  const html = `
    <h2>New Deed Registered!</h2>
    <p><strong>Wallet:</strong> ${ownerWalletAddress}</p>
    <p><strong>Survey Plan:</strong> ${deed.surveyPlanNumber || "N/A"}</p>
    <p><strong>Created At:</strong> ${
      time ? new Date(time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "N/A"
    }</p>
  `;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Sending email to ${recipientEmail}...`);
      await sendEmail({ to: recipientEmail, subject, text: message, html });
      console.log(`Email sent successfully to ${recipientEmail}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`All ${maxRetries} attempts failed for ${recipientEmail}`);
      }
    }
  }
}
