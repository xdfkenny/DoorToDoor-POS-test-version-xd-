import * as XLSX from 'xlsx';

/**
 * Represents product data read from an Excel file.
 */
export interface Product {
  /**
   * The unique code of the product.
   */
  code: string;
  /**
   * The name or description of the product.
   */
  name: string;
  /**
   * The price of the product.
   */
  price: number;
}

/**
 * Asynchronously parses an Excel file and extracts product data.
 *
 * @param file The Excel file to parse.
 * @returns A promise that resolves to an array of Product objects.
 */
export async function parseExcelFile(file: File): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: 'binary' });

        // Assuming the first sheet is the one with product data
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert the worksheet to JSON
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawData || rawData.length < 2) {
          reject(new Error('Excel file is empty or missing data.'));
          return;
        }

        // Attempt to auto-detect column mappings (Code, Name, Price)
        const headerRow = rawData[0] as string[];
        const codeIndex = findColumnIndex(headerRow, ['code', 'product code']);
        const nameIndex = findColumnIndex(headerRow, ['name', 'product name']);
        const priceIndex = findColumnIndex(headerRow, ['price', 'product price', 'product price']);

        if (codeIndex === -1 || nameIndex === -1 || priceIndex === -1) {
          reject(new Error('Required columns (Code, Name, Price) not found or improperly labeled.'));
          return;
        }

        const products: Product[] = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (row.length > 0) {
            const code = row[codeIndex];
            const name = row[nameIndex];
            const price = row[priceIndex];

            if (code === undefined) {
              reject(new Error(`Code is missing in row ${i + 1}`));
              return;
            }
            if (name === undefined) {
              reject(new Error(`Name is missing in row ${i + 1}`));
              return;
            }
             if (price === undefined) {
              reject(new Error(`Price is missing in row ${i + 1}`));
              return;
            }

            const product: Product = {
              code: String(code || '').trim(),
              name: String(name || '').trim(),
              price: Number(price || 0), // Default to 0 if price is missing
            };
            products.push(product);
          }
        }

        resolve(products);
      } catch (error: any) {
        reject(new Error(`Error parsing Excel file: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`Error reading file: ${error}`));
    };

    reader.readAsBinaryString(file);
  });
}

function findColumnIndex(headerRow: string[], keywords: string[]): number {
  const lowerCaseHeaders = headerRow.map(header => header.toLowerCase());
  for (const keyword of keywords) {
    const index = lowerCaseHeaders.findIndex(header => header.includes(keyword));
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}
