"use client";

import { useState } from "react";
import { parseExcelFile, Product } from "@/services/excel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X } from "lucide-react";
import { sendWhatsAppMessage } from "@/services/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { suggestProductName } from "@/ai/flows/suggest-product-name";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<
    (Product & { quantity: number; notes: string })[]
  >([]);
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsedProducts = await parseExcelFile(file);
      setProducts(parsedProducts);
      toast({
        title: "Products imported successfully!",
        description: `${parsedProducts.length} products have been imported.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to import products",
        description: "Please check the file format and try again.",
      });
    }
  };

  const addToCart = (product: Product) => {
    const existingProductIndex = cart.findIndex((item) => item.code === product.code);

    if (existingProductIndex > -1) {
      const newCart = [...cart];
      newCart[existingProductIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, quantity: 1, notes: "" }]);
    }
  };

  const adjustQuantity = (productCode: string, change: number) => {
    const newCart = cart.map((item) =>
      item.code === productCode ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    );
    setCart(newCart.filter((item) => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleWhatsAppExport = async () => {
    if (!sellerName || !buyerName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both seller and buyer names.",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Cart is empty",
        description: "Add products to the cart before exporting.",
      });
      return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Mock invoice link, replace with actual invoice generation and link
    const invoiceLink = "https://example.com/invoice123.json";

    const message = {
      sellerName,
      buyerName,
      items: cart.map((item) => ({ name: item.name, quantity: item.quantity })),
      totalPrice,
      invoiceLink,
    };

    try {
      await sendWhatsAppMessage(message);
      toast({
        title: "WhatsApp message sent!",
        description: "Order details have been sent to WhatsApp.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send WhatsApp message",
        description: "Please check your WhatsApp configuration and try again.",
      });
    }
  };

  const handleAiSuggestion = async (product: Product) => {
    try {
      const aiSuggestion = await suggestProductName({
        productCode: product.code,
        productData: products,
      });

      toast({
        title: "AI Suggestion",
        description: `Suggested Name: ${aiSuggestion.suggestedName}, Suggested Description: ${aiSuggestion.suggestedDescription}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Failed to get AI suggestion for this product.",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Import Products from Excel</CardTitle>
          <CardDescription>Upload your .xlsx file to import products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Add products to your cart.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.code} className="shadow-sm">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Code: {product.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between p-2">
                    <span>${product.price.toFixed(2)}</span>
                    <Button size="sm" onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAiSuggestion(product)}
                    >
                      Suggest Name
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
            <CardDescription>Review and export your cart.</CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.code} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="icon" onClick={() => adjustQuantity(item.code, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => adjustQuantity(item.code, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                      <Button size="icon" variant="destructive" onClick={() => adjustQuantity(item.code, -item.quantity)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="font-bold">
                  Total: $
                  {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={clearCart} className="mt-4">
              Clear Cart
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Order Details &amp; WhatsApp Export</CardTitle>
          <CardDescription>
            Enter order details and export the cart via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Seller Name"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
            />
            <Select onValueChange={setBuyerName} defaultValue={buyerName}>
              <SelectTrigger>
                <SelectValue placeholder="Select Buyer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="John Doe">John Doe</SelectItem>
                <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                <SelectItem value="Peter Jones">Peter Jones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Order Notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
          <Button onClick={handleWhatsAppExport} className="bg-brick-orange text-black">
            Export to WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
