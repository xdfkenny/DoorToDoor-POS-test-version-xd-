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
import { Plus, Minus, X, Edit, Trash } from "lucide-react";
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
  DialogFooter,
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

    // Mock invoice link, replace with actual invoice generation and link
    const invoiceLink = "https://example.com/invoice123.json";

   const messageText = `
*Seller:* ${sellerName}
*Buyer:* ${selectedBuyer}
*Items:*
${cart.map(item => `- ${item.code} (x${item.quantity})`).join('\n')}
*Total Price:* $${totalPrice.toFixed(2)}
*Invoice Link:* ${invoiceLink}
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
      // Update existing product
      const updatedProducts = products.map((product) =>
        product.code === selectedProduct.code ? { ...values, price: Number(values.price) } : product
      );
      setProducts(updatedProducts);
      toast({ title: "Product updated successfully!" });
    } else {
      // Add new product
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
      
        
          
            Seller Login
            
              Enter your credentials to log in.
            
          
          
            
              
                Username
                
                  
                  
                
              
              
                Password
                
                  
                  
                
              
              
                Log In
              
            
          
        
      
    );
  }

  return (
    
      
        
          DoortoDoor POS
          
            Log Out
          
        
      

      
        
          Import Products from Excel
          
            Upload your .xlsx file to import products.
          
        
        
          
        
      

      
        
          
            
              Products
            
            
              Add Product
            
          
          
            
              {products.map((product) => (
                
                  
                    
                      {product.name}
                    
                    
                      Code: {product.code}
                    
                  
                  
                    ${product.price.toFixed(2)}
                    
                      Add to Cart
                    
                    
                      
                         
                      
                    
                    
                      
                         
                      
                    
                  
                
              ))}
            
          
        
      

      
        
          Cart
          
        
        
          {cart.length === 0 ? (
            
              Your cart is empty.
            
          ) : (
            
              
                
                  {cart.map((item) => (
                    
                      
                        
                          {item.name}
                        
                        
                          
                             
                          
                          x{item.quantity}
                          
                             
                          
                        
                      
                      
                        ${(item.price * item.quantity).toFixed(2)}
                        
                           
                        
                      
                    
                  ))}
                
                
                  
                    Total: ${cart
                      .reduce((sum, item) => sum + item.price * item.quantity, 0)
                      .toFixed(2)}
                  
                  
                    Clear Cart
                  
                
              
            
          )}
        
      

      
        
          Order Details &amp; WhatsApp Export
          
        
        
          
            
              
                Seller Name
                
                  
                  
                
              
              
                Select Buyer
                
                  
                    Select a buyer
                  
                  
                    
                      John Doe
                    
                    
                      Jane Smith
                    
                    
                      Peter Jones
                    
                  
                
              
              
                Order Notes
                
                  
                  
                
              
              
                Export to WhatsApp
              
            
          
        
      

      
        
        
          
            {isEditingProduct ? "Edit Product" : "Add Product"}
            
              {isEditingProduct
                ? "Edit the product details."
                : "Enter the details for the new product."}
            
          
          
            
              
                
                  Product Code
                  
                    
                      
                    
                  
                  
                
              
              
                
                  Product Name
                  
                    
                      
                    
                  
                  
                
              
              
                
                  Price
                  
                    
                      
                    
                  
                  
                
              
              
                
                  
                    {isEditingProduct ? "Update Product" : "Add Product"}
                  
                
              
            
          
        
      
    
  );
}


