async function handleEmailNotification(data) {
  console.log("Received RabbitMQ message:", data);

  const { ownerWalletAddress, deed, time } = data;

  if (!ownerWalletAddress || !deed) {
    console.warn("Skipping message, missing ownerWalletAddress or deed:", data);
    return;
  }

  const recipientEmail = await getEmailFromWallet(ownerWalletAddress);
  console.log(`Fetched email for wallet: `, recipientEmail);
  if (!recipientEmail) {
    console.warn(`No email found for wallet ${ownerWalletAddress}`);
    return;
  }

  console.log(`Sending email to ${recipientEmail} for deed notification.`);

  const subject = "New Deed Sent for Registration";
  const message = `A new deed has been created for wallet: ${ownerWalletAddress} at ${time}`;
  const html = `
    <h2>New Deed Registered!</h2>
    <p><strong>Wallet:</strong> ${ownerWalletAddress}</p>
    <p><strong>Survey Plan:</strong> ${deed.surveyPlanNumber || "N/A"}</p>
    <p><strong>Created At:</strong> ${time ? new Date(time).toLocaleString() : "N/A"}</p>
  `;

  try {
    await sendEmail({ to: recipientEmail, subject, text: message, html });
    console.log(`Email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }
}
