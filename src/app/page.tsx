"use client";

import { useState, useEffect } from "react";
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
import { Plus, Minus, X, Edit, Trash } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";

const productSchema = z.object({
  code: z.string().min(1, { message: "Product code is required." }),
  name: z.string().min(1, { message: "Product name is required." }),
  price: z.number().min(0, { message: "Price must be a positive number." }),
});

type ProductSchemaType = z.infer<typeof productSchema>;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<
    (Product & { quantity: number; notes: string })[]
  >([]);
  const [buyerName, setBuyerName] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Seller Login State
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      price: 0,
    },
  });

  useEffect(() => {
    // Simulate login for demonstration
    setIsLoggedIn(true);
  }, []);

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
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        variant: "destructive",
        title: "Failed to import products",
        description: error.message || "Please check the file format and try again.",
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

  const handleOpenProductForm = () => {
    setIsEditingProduct(false);
    setSelectedProduct(null);
    form.reset();
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditingProduct(true);
    setSelectedProduct(product);
    form.setValue("code", product.code);
    form.setValue("name", product.name);
    form.setValue("price", product.price);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productCode: string) => {
    setProducts(products.filter((product) => product.code !== productCode));
    toast({ title: "Product deleted successfully!" });
  };

  const onSubmit = (values: ProductSchemaType) => {
    if (isEditingProduct && selectedProduct) {
      // Update existing product
      const updatedProducts = products.map((product) =>
        product.code === selectedProduct.code ? { ...values } : product
      );
      setProducts(updatedProducts);
      toast({ title: "Product updated successfully!" });
    } else {
      // Add new product
      setProducts([...products, values]);
      toast({ title: "Product added successfully!" });
    }
    setShowProductForm(false);
    form.reset();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({ title: "Logged out successfully!" });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Seller Login</CardTitle>
            <CardDescription>Enter your credentials to log in.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Replace with actual login form */}
            <Button>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-background text-foreground">
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <CardTitle>DoortoDoor POS</CardTitle>
        <Button variant="outline" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Import Products from Excel</CardTitle>
          <CardDescription>Upload your .xlsx file to import products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            <Button onClick={handleOpenProductForm}>Add Product</Button>
          </div>
          <CardDescription>Add products to your cart.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-none p-0">
            {products.map((product) => (
              <li key={product.code} className="mb-2 p-2 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    {product.name}
                    <p className="text-sm text-muted-foreground">Code: {product.code}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">${product.price.toFixed(2)}</span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(product.code)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Cart</CardTitle>
          <CardDescription>Review and export your cart.</CardDescription>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div>
              <ul className="list-none p-0">
                {cart.map((item) => (
                  <li key={item.code} className="mb-2 p-2 border rounded-md flex justify-between items-center">
                    <div>
                      {item.name} x {item.quantity}
                    </div>
                    <div>
                      <Button size="icon" variant="ghost" onClick={() => adjustQuantity(item.code, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => adjustQuantity(item.code, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                      <Button size="icon" variant="ghost" onClick={() => adjustQuantity(item.code, -item.quantity)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="font-bold">
                Total: $
                {cart
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}
              </div>
              <Button onClick={clearCart} className="mt-4">
                Clear Cart
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Details &amp; WhatsApp Export</CardTitle>
          <CardDescription>Enter order details and export the cart via WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="seller-name">Seller Name</Label>
              <Input
                id="seller-name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-name">Select Buyer</Label>
              <Select>
                <SelectTrigger id="buyer-name">
                  <SelectValue placeholder="Select a buyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john-doe">John Doe</SelectItem>
                  <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  <SelectItem value="peter-jones">Peter Jones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-notes">Order Notes</Label>
              <Textarea
                id="order-notes"
                placeholder="Additional notes for the order"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleWhatsAppExport}>Export to WhatsApp</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {isEditingProduct
                ? "Edit the product details."
                : "Enter the details for the new product."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Product Price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">{isEditingProduct ? "Update Product" : "Add Product"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
