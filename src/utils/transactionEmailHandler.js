import sendEmail from "../services/emailService.js";
import axios from "axios";

const { USER_SERVICE_URL, INTERNAL_ACCESS_KEY } = process.env;

export async function getEmailFromWallet(walletAddress) {
  if (!walletAddress) return null;
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/email/${walletAddress}`, {
      headers: { "x-internal-key": INTERNAL_ACCESS_KEY },
    });
    return response.data.email;
  } catch (error) {
    console.error(`Failed to fetch email for wallet ${walletAddress}:`, error.response?.data || error.message);
    return null;
  }
}

export async function handleTransactionNotification(data) {
  console.log("Processing transaction RabbitMQ message:", JSON.stringify(data, null, 2));

  const { buyerWalletAddress, sellerWalletAddress, transaction, transactionType, time } = data;
  
  if (!buyerWalletAddress || !transaction) {
    console.warn("Skipping message, missing buyerWalletAddress or transaction:", JSON.stringify(data, null, 2));
    console.warn("Data structure:", { 
      hasBuyerWalletAddress: !!buyerWalletAddress, 
      hasTransaction: !!transaction,
      dataKeys: Object.keys(data || {})
    });
    return;
  }

  // Ensure transaction is a plain object
  const transactionObject = transaction && typeof transaction === 'object' ? (transaction.toObject ? transaction.toObject() : transaction) : transaction;
  
  console.log(`Fetching email for buyer wallet address: ${buyerWalletAddress}`);
  const recipientEmail = await getEmailFromWallet(buyerWalletAddress);
  if (!recipientEmail) {
    console.warn(`No email found for buyer wallet ${buyerWalletAddress} - email lookup failed`);
    console.warn("This might indicate the user service is not available or the wallet address is not registered");
    return;
  }
  console.log(`Found email for buyer wallet ${buyerWalletAddress}: ${recipientEmail}`);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === 'string') {
      return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    }
    return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  // Format transaction type
  const formatTransactionType = (type) => {
    const typeMap = {
      "escrow_sale": "Escrow Sale",
      "sale_transfer": "Sale Transfer",
      "direct_transfer": "Direct Transfer",
      "gift": "Gift",
      "open_market": "Open Market",
      "closed": "Closed",
      "init": "Initialization"
    };
    return typeMap[type] || type;
  };

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      "pending": "⏳ Pending",
      "completed": "✅ Completed",
      "failed": "❌ Failed",
      "init": "🔄 Initialized"
    };
    return statusMap[status] || status;
  };

  const isEscrow = transactionType === "escrow_sale";
  const subject = isEscrow 
    ? "🔒 New Escrow Transaction Started - DeedLink"
    : "💰 New Transaction Started - DeedLink";
  
  const message = `Dear Buyer,

A new ${formatTransactionType(transactionType)} transaction has been started.

Transaction Details:
- Transaction ID: ${transactionObject._id || "N/A"}
- Type: ${formatTransactionType(transactionType)}
- Status: ${formatStatus(transactionObject.status || "pending")}
- Amount: ${transactionObject.amount || "N/A"} (Share: ${transactionObject.share || 100}%)
- Deed ID: ${transactionObject.deedId || "N/A"}
- Started At: ${formatDate(time)}

${isEscrow ? `
IMPORTANT: This is an Escrow transaction. Your funds are held securely until the transaction is completed.
` : ''}

Thank you for using DeedLink!
`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isEscrow ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section-title { color: ${isEscrow ? '#f5576c' : '#4facfe'}; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid ${isEscrow ? '#f5576c' : '#4facfe'}; padding-bottom: 10px; }
        .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #555; display: inline-block; width: 180px; }
        .info-value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background: ${isEscrow ? '#fff3cd' : '#e7f3ff'}; padding: 15px; border-left: 4px solid ${isEscrow ? '#ffc107' : '#2196F3'}; margin: 15px 0; border-radius: 4px; }
        .badge { display: inline-block; background: ${isEscrow ? '#f5576c' : '#4facfe'}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-left: 10px; }
        .escrow-notice { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isEscrow ? '🔒 Escrow Transaction Started' : '💰 Transaction Started'}</h1>
          <p>A new transaction has been initiated in DeedLink</p>
        </div>
        
        <div class="content">
          ${isEscrow ? `
          <div class="escrow-notice">
            <h3>⚠️ Escrow Transaction Notice</h3>
            <p><strong>Your funds are held securely in escrow</strong> until the transaction is completed. 
            The funds will only be released to the seller once all conditions are met and the transaction is finalized.</p>
          </div>
          ` : ''}

          <div class="highlight">
            <strong>Transaction ID:</strong> ${transactionObject._id || "N/A"}
            <span class="badge">${formatTransactionType(transactionType)}</span>
          </div>

          <div class="section">
            <div class="section-title">📋 Transaction Information</div>
            <div class="info-row">
              <span class="info-label">Transaction Type:</span>
              <span class="info-value">${formatTransactionType(transactionType)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${formatStatus(transactionObject.status || "pending")}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Amount:</span>
              <span class="info-value">${transactionObject.amount || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Share:</span>
              <span class="info-value">${transactionObject.share || 100}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">Started At:</span>
              <span class="info-value">${formatDate(time)}</span>
            </div>
            ${transactionObject.date ? `
            <div class="info-row">
              <span class="info-label">Transaction Date:</span>
              <span class="info-value">${formatDate(transactionObject.date)}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">👥 Parties</div>
            <div class="info-row">
              <span class="info-label">Buyer (You):</span>
              <span class="info-value">${buyerWalletAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Seller:</span>
              <span class="info-value">${sellerWalletAddress || "N/A"}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📄 Deed Information</div>
            <div class="info-row">
              <span class="info-label">Deed ID:</span>
              <span class="info-value">${transactionObject.deedId || "N/A"}</span>
            </div>
            ${transactionObject.description ? `
            <div class="info-row">
              <span class="info-label">Description:</span>
              <span class="info-value">${transactionObject.description}</span>
            </div>
            ` : ''}
          </div>

          ${transactionObject.hash ? `
          <div class="section">
            <div class="section-title">🔗 Blockchain Information</div>
            <div class="info-row">
              <span class="info-label">Transaction Hash:</span>
              <span class="info-value">${transactionObject.hash}</span>
            </div>
            ${transactionObject.blockchain_identification ? `
            <div class="info-row">
              <span class="info-label">Blockchain ID:</span>
              <span class="info-value">${transactionObject.blockchain_identification}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${isEscrow ? `
          <div class="section">
            <div class="section-title">🔒 Escrow Details</div>
            <p>This transaction is protected by escrow. Your payment is securely held and will only be released when:</p>
            <ul>
              <li>All transaction conditions are met</li>
              <li>The deed transfer is verified</li>
              <li>The transaction is marked as completed</li>
            </ul>
            <p><strong>You will receive another notification when the transaction is completed.</strong></p>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Thank you for using <strong>DeedLink</strong> - Secure Land Transaction System</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt}: Sending transaction email to ${recipientEmail}...`);
      await sendEmail({ to: recipientEmail, subject, text: message, html });
      console.log(`Transaction email sent successfully to ${recipientEmail}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`All ${maxRetries} attempts failed for ${recipientEmail}`);
        console.error("Final error details:", error);
      }
    }
  }
  
  console.error(`Transaction email sending failed after ${maxRetries} attempts for ${recipientEmail}`);
}

