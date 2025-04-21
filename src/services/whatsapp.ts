/**
 * Represents a structured message for WhatsApp, including seller and buyer names, a list of items, and the total price.
 */
export interface WhatsAppMessage {
  /**
   * The name of the seller.
   */
  sellerName: string;
  /**
   * The name of the buyer.
   */
  buyerName: string;
  /**
   * A list of items in the order, each with a name and quantity.
   */
  items: { code: string; quantity: number }[];
  /**
   * The total price of the order.
   */
  totalPrice: number;
  /**
   * A link to the JSON invoice.
   */
  invoiceLink: string;
   /**
   * Additional notes for the order.
   */
  orderNotes: string;
}

/**
 * Asynchronously composes and sends a WhatsApp message with order details.
 *
 * @param message The WhatsAppMessage object containing order information.
 * @returns A promise that resolves to a boolean indicating whether the message was sent successfully.
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<boolean> {
  const phoneNumber = "+584129997266";
  const orderDetails = `
*Seller:* ${message.sellerName}
*Buyer:* ${message.buyerName}
*Items:*
${message.items.map(item => `- ${item.code} (x${item.quantity})`).join('\n')}
*Total Price:* $${message.totalPrice.toFixed(2)}
*Invoice Link:* ${message.invoiceLink}
*Order Notes:* ${message.orderNotes}
  `;

  const encodedMessage = encodeURIComponent(orderDetails);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  window.location.href = whatsappURL; // Redirect to WhatsApp

  console.log(message);
  return true;
}


