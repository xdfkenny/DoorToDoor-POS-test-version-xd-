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
  items: { name: string; quantity: number }[];
  /**
   * The total price of the order.
   */
  totalPrice: number;
  /**
   * A link to the JSON invoice.
   */
  invoiceLink: string;
}

/**
 * Asynchronously composes and sends a WhatsApp message with order details.
 *
 * @param message The WhatsAppMessage object containing order information.
 * @returns A promise that resolves to a boolean indicating whether the message was sent successfully.
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<boolean> {
  // TODO: Implement this by calling the wa.me API.

  console.log(message);
  return true;
}
