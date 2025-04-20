import * as XLSX from 'xlsx';

/**
 * Represents a product with its code, name, and price.
 */
export interface Product {
  /**
   * The unique code of the product.
   */
  code: string;
  /**
   * The name of the product.
   */
  name: string;
  /**
   * The price of the product.
   */
  price: number;
}

/**
 * Asynchronously parses an Excel (.xlsx) file and extracts product data.
 *
 * @param file The Excel file to parse.
 * @returns A promise that resolves to an array of Product objects.
 */
export async function parseExcelFile(file: File): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const products: Product[] = [];
        let i = 2; // Start from the second row (index 1) to skip headers
        while (worksheet[`A${i}`] && worksheet[`B${i}`] && worksheet[`H${i}`]) {
          const code = worksheet[`A${i}`].v;
          const name = worksheet[`B${i}`].v;
          const price = parseFloat(worksheet[`H${i}`].v);

          if (typeof code === 'string' && typeof name === 'string' && typeof price === 'number' && !isNaN(price)) {
            products.push({ code, name, price });
          } else {
            console.warn(`Invalid data found in row ${i}. Skipping.`);
          }

          i++;
        }

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}
