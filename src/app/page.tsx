'use client'

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
import { Plus, Minus, X } from "lucide-react";
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
import jsYaml from 'js-yaml';
import { ScrollArea } from "@/components/ui/scroll-area";

const productSchema = z.object({
  code: z.string().min(1, { message: "Product code is required." }),
  name: z.string().min(1, { message: "Product name is required." }),
  price: z.number().min(0, { message: "Price must be a positive number." }),
});

type ProductSchemaType = z.infer<typeof productSchema>;

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState("");

  const form = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      price: 0,
    },
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/users.yaml');
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
      setUsername('');
      setPassword('');
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
    if (!sellerName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter the seller name.",
      });
      return;
    }

    if (!selectedBuyer) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a buyer.",
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

    const messageText = `
*Seller:* ${sellerName}
*Buyer:* ${selectedBuyer}
*Items:*
${cart.map(item => `- ${item.code} (x${item.quantity})`).join('\n')}
*Total Price:* $${totalPrice.toFixed(2)}
*Order Notes:* ${orderNotes}
`;

    const whatsappURL = `https://wa.me/+584129997266?text=${encodeURIComponent(messageText)}`;
    window.location.href = whatsappURL;
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
      const updatedProducts = products.map((product) =>
        product.code === selectedProduct.code ? { ...values, price: Number(values.price) } : product
      );
      setProducts(updatedProducts);
      toast({ title: "Product updated successfully!" });
    } else {
      setProducts([...products, { ...values, price: Number(values.price) }]);
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
      <div className="flex flex-col items-center justify-center h-screen">
        <Toaster />
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Seller Login</CardTitle>
            <CardDescription>Enter your credentials to log in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleLogin}>
              Log In
            </Button>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Products
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleOpenProductForm}>
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <ul>
            {products.map((product) => (
              <li key={product.code} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-muted-foreground">Code: {product.code}</div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4">${product.price.toFixed(2)}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => addToCart(product)}
                  >
                    <Plus className="h-4 w-4" />
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
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div>Your cart is empty.</div>
          ) : (
            <div>
              <ul>
                {cart.map((item) => (
                  <li key={item.code} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      {item.name}
                      <div className="ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => adjustQuantity(item.code, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold mx-1">x{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => adjustQuantity(item.code, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      ${(item.price * item.quantity).toFixed(2)}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => adjustQuantity(item.code, -item.quantity)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-4">
                <div>Total: ${cart
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}</div>
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Details &amp; WhatsApp Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="sellerName">Seller Name</Label>
              <Input
                id="sellerName"
                placeholder="Enter seller name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="buyerSelect">Select Buyer</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger id="buyerSelect">
                  <SelectValue placeholder="Select a buyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="Peter Jones">Peter Jones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="orderNotes">Order Notes</Label>
              <Textarea
                id="orderNotes"
                placeholder="Enter any order notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleWhatsAppExport}>
              Export to WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {isEditingProduct ? "Edit Product" : "Add Product"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
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
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product code" {...field} />
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
                      <Input placeholder="Enter product name" {...field} />
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
                      <Input type="number" placeholder="Enter price" {...field} />
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
