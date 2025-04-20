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
import jsYaml from 'js-yaml';

const productSchema = z.object({
  code: z.string().min(1, { message: "Product code is required." }),
  name: z.string().min(1, { message: "Product name is required." }),
  price: z.number().min(0, { message: "Price must be a positive number." }),
});

type ProductSchemaType = z.infer<typeof productSchema>;

// Define the type for user credentials
interface User {
  username: string;
  password?: string;
}

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const form = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      price: 0,
    },
  });

  useEffect(() => {
    // Load user credentials from the YAML file
    const loadUsers = async () => {
      try {
        const response = await fetch('/users.yaml'); // Path to your YAML file
        const yamlText = await response.text();
        const userData = jsYaml.load(yamlText) as User[];
        if (Array.isArray(userData)) {
          setUsers(userData);
        } else {
          console.error('YAML data is not an array:', userData);
          toast({
            variant: 'destructive',
            title: 'Failed to load users',
            description: 'Invalid user data format in YAML file.',
          });
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load users',
          description: 'Could not load user credentials from YAML file.',
        });
      }
    };

    loadUsers();
  }, []);


  const handleLogin = async () => {
    // Validate credentials against the YAML data
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setIsLoggedIn(true);
      toast({ title: "Logged in successfully!" });
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password.",
      });
    }
  };

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
      setProducts([...products, {...values, price: Number(values.price)}]);
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
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Seller Login</CardTitle>
            <CardDescription>Enter your credentials to log in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin}>Log In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <div className="flex justify-between items-center mb-4">
        <CardTitle>DoortoDoor POS</CardTitle>
        <Button onClick={handleLogout}>Log Out</Button>
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
          <ul>
            {products.map((product) => (
              <li key={product.code} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {product.code}</p>
                </div>
                <div className="flex items-center">
                  <span className="mr-4">${product.price.toFixed(2)}</span>
                  <Button variant="outline" size="sm" onClick={() => addToCart(product)}>
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
              <ul>
                {cart.map((item) => (
                  <li key={item.code} className="flex justify-between items-center py-2 border-b">
                    <div>
                      {item.name}
                      <span className="mx-4">x{item.quantity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                      <Button size="icon" onClick={() => adjustQuantity(item.code, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => adjustQuantity(item.code, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={() => adjustQuantity(item.code, -item.quantity)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="font-semibold">
                Total: $
                {cart
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}
              </div>
              <Button onClick={clearCart}>Clear Cart</Button>
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
            <div className="flex flex-col space-y-2">
              <Label htmlFor="sellerName">Seller Name</Label>
              <Input
                id="sellerName"
                placeholder="Enter seller name"
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Select Buyer</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a buyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="peter">Peter Jones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="orderNotes">Order Notes</Label>
              <Textarea
                id="orderNotes"
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
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
                    <FormLabel>Product Name</FormLabel>
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
                      <Input placeholder="Product Price" type="number" {...field} />
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
