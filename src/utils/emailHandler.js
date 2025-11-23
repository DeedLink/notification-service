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

export async function handleEmailNotification(data) {
  console.log("Processing RabbitMQ message:", JSON.stringify(data, null, 2));

  const { ownerWalletAddress, deed, time } = data;
  if (!ownerWalletAddress || !deed) {
    console.warn("Skipping message, missing ownerWalletAddress or deed:", JSON.stringify(data, null, 2));
    console.warn("Data structure:", { 
      hasOwnerWalletAddress: !!ownerWalletAddress, 
      hasDeed: !!deed,
      dataKeys: Object.keys(data || {})
    });
    return;
  }

  // Ensure deed is a plain object (handle Mongoose documents that might have been sent)
  const deedObject = deed && typeof deed === 'object' ? (deed.toObject ? deed.toObject() : deed) : deed;
  
  console.log(`Fetching email for wallet address: ${ownerWalletAddress}`);
  const recipientEmail = await getEmailFromWallet(ownerWalletAddress);
  if (!recipientEmail) {
    console.warn(`No email found for wallet ${ownerWalletAddress} - email lookup failed`);
    console.warn("This might indicate the user service is not available or the wallet address is not registered");
    return;
  }
  console.log(`Found email for wallet ${ownerWalletAddress}: ${recipientEmail}`);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === 'string') {
      return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    }
    return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  // Format owners list
  const formatOwners = (owners) => {
    if (!owners || !Array.isArray(owners) || owners.length === 0) return "N/A";
    return owners.map((owner, index) => 
      `${index + 1}. ${owner.address} (${owner.share}% share)`
    ).join('<br>');
  };

  // Format location points
  const formatLocation = (location) => {
    if (!location || !Array.isArray(location) || location.length === 0) return "N/A";
    return location.map((point, index) => 
      `Point ${index + 1}: Lat ${point.latitude}, Long ${point.longitude}`
    ).join('<br>');
  };

  // Format boundaries
  const formatBoundaries = (sides) => {
    if (!sides) return "N/A";
    const parts = [];
    if (sides.North) parts.push(`North: ${sides.North}`);
    if (sides.South) parts.push(`South: ${sides.South}`);
    if (sides.East) parts.push(`East: ${sides.East}`);
    if (sides.West) parts.push(`West: ${sides.West}`);
    return parts.length > 0 ? parts.join('<br>') : "N/A";
  };

  const subject = "New Deed Registration Confirmation - DeedLink";
  
  const message = `Dear ${deedObject.ownerFullName || 'User'},

Your deed has been successfully registered in the DeedLink system.

Deed Number: ${deedObject.deedNumber || "N/A"}
Deed Type: ${deedObject.deedType?.deedType || "N/A"}
Registration Date: ${formatDate(deedObject.registrationDate)}
Registered At: ${formatDate(time)}

Owner Information:
- Full Name: ${deedObject.ownerFullName || "N/A"}
- NIC: ${deedObject.ownerNIC || "N/A"}
- Wallet Address: ${ownerWalletAddress}
- Phone: ${deedObject.ownerPhone || "N/A"}
- Address: ${deedObject.ownerAddress || "N/A"}

Land Details:
- Land Address: ${deedObject.landAddress || "N/A"}
- Land Title Number: ${deedObject.landTitleNumber || "N/A"}
- Land Area: ${deedObject.landArea || "N/A"} ${deedObject.landSizeUnit || ""}
- Land Type: ${deedObject.landType || "N/A"}
- District: ${deedObject.district || "N/A"}
- Division: ${deedObject.division || "N/A"}

Survey Information:
- Survey Plan Number: ${deedObject.surveyPlanNumber || "N/A"}

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
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #555; display: inline-block; width: 180px; }
        .info-value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 4px; }
        .badge { display: inline-block; background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-left: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Deed Registration Confirmed</h1>
          <p>Your deed has been successfully registered in DeedLink</p>
        </div>
        
        <div class="content">
          <div class="highlight">
            <strong>Deed Number:</strong> ${deedObject.deedNumber || "N/A"}
            ${deedObject.tokenId ? `<span class="badge">Token ID: ${deedObject.tokenId}</span>` : ''}
          </div>

          <div class="section">
            <div class="section-title">📋 Deed Information</div>
            <div class="info-row">
              <span class="info-label">Deed Type:</span>
              <span class="info-value">${deedObject.deedType?.deedType || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration Date:</span>
              <span class="info-value">${formatDate(deedObject.registrationDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registered At:</span>
              <span class="info-value">${formatDate(time)}</span>
            </div>
            ${deedObject.tokenId ? `
            <div class="info-row">
              <span class="info-label">Token ID:</span>
              <span class="info-value">${deedObject.tokenId}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">👤 Owner Information</div>
            <div class="info-row">
              <span class="info-label">Full Name:</span>
              <span class="info-value">${deedObject.ownerFullName || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NIC Number:</span>
              <span class="info-value">${deedObject.ownerNIC || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Wallet Address:</span>
              <span class="info-value">${ownerWalletAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${deedObject.ownerPhone || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span class="info-value">${deedObject.ownerAddress || "N/A"}</span>
            </div>
          </div>

          ${deedObject.owners && deedObject.owners.length > 0 ? `
          <div class="section">
            <div class="section-title">👥 Ownership Details</div>
            ${deedObject.owners.map((owner, index) => `
              <div class="info-row">
                <span class="info-label">Owner ${index + 1}:</span>
                <span class="info-value">${owner.address} <strong>(${owner.share}% share)</strong></span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">🏞️ Land Details</div>
            <div class="info-row">
              <span class="info-label">Land Address:</span>
              <span class="info-value">${deedObject.landAddress || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Land Title Number:</span>
              <span class="info-value">${deedObject.landTitleNumber || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Land Area:</span>
              <span class="info-value">${deedObject.landArea || "N/A"} ${deedObject.landSizeUnit || ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Land Type:</span>
              <span class="info-value">${deedObject.landType || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">District:</span>
              <span class="info-value">${deedObject.district || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Division:</span>
              <span class="info-value">${deedObject.division || "N/A"}</span>
            </div>
          </div>

          ${deedObject.surveyPlanNumber ? `
          <div class="section">
            <div class="section-title">📐 Survey Information</div>
            <div class="info-row">
              <span class="info-label">Survey Plan Number:</span>
              <span class="info-value">${deedObject.surveyPlanNumber}</span>
            </div>
          </div>
          ` : ''}

          ${deedObject.boundaries ? `
          <div class="section">
            <div class="section-title">🗺️ Boundaries</div>
            <div class="info-row">
              <span class="info-value">${deedObject.boundaries}</span>
            </div>
          </div>
          ` : ''}

          ${deedObject.sides ? `
          <div class="section">
            <div class="section-title">🧭 Boundary Sides</div>
            ${formatBoundaries(deedObject.sides).split('<br>').map(side => `
              <div class="info-row">
                <span class="info-value">${side}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${deedObject.location && deedObject.location.length > 0 ? `
          <div class="section">
            <div class="section-title">📍 Location Coordinates</div>
            ${formatLocation(deedObject.location).split('<br>').map(point => `
              <div class="info-row">
                <span class="info-value">${point}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${deedObject.surveyAssigned || deedObject.notaryAssigned || deedObject.ivslAssigned ? `
          <div class="section">
            <div class="section-title">✅ Verification Status</div>
            ${deedObject.surveyAssigned ? `
              <div class="info-row">
                <span class="info-label">Survey Assigned:</span>
                <span class="info-value">${deedObject.surveyAssigned} ${deedObject.surveySignature ? '✅ Signed' : '⏳ Pending'}</span>
              </div>
            ` : ''}
            ${deedObject.notaryAssigned ? `
              <div class="info-row">
                <span class="info-label">Notary Assigned:</span>
                <span class="info-value">${deedObject.notaryAssigned} ${deedObject.notarySignature ? '✅ Signed' : '⏳ Pending'}</span>
              </div>
            ` : ''}
            ${deedObject.ivslAssigned ? `
              <div class="info-row">
                <span class="info-label">IVSL Assigned:</span>
                <span class="info-value">${deedObject.ivslAssigned} ${deedObject.ivslSignature ? '✅ Signed' : '⏳ Pending'}</span>
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Thank you for using <strong>DeedLink</strong> - Secure Land Registration System</p>
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
        console.error("Final error details:", error);
        // Don't throw - we've exhausted retries, acknowledge message to prevent infinite retry
        // In production, consider sending to a dead letter queue instead
      }
    }
  }
  
  // If we reach here, all retries failed but we're not throwing
  // This allows the message to be acknowledged (preventing infinite retries)
  // but logs that email sending ultimately failed
  console.error(`Email sending failed after ${maxRetries} attempts for ${recipientEmail}`);
}
