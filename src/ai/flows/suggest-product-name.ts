// src/ai/flows/suggest-product-name.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting product names and descriptions
 * based on the product code and imported Excel data.
 *
 * - suggestProductName - A function that handles the product name suggestion process.
 * - SuggestProductNameInput - The input type for the suggestProductName function.
 * - SuggestProductNameOutput - The return type for the suggestProductName function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {Product} from '@/services/excel';

const SuggestProductNameInputSchema = z.object({
  productCode: z.string().describe('The code of the product.'),
  productData: z.array(z.any()).describe('Array of product data from excel.ts.'),
});
export type SuggestProductNameInput = z.infer<typeof SuggestProductNameInputSchema>;

const SuggestProductNameOutputSchema = z.object({
  suggestedName: z.string().describe('The suggested product name.'),
  suggestedDescription: z.string().describe('The suggested product description.'),
});
export type SuggestProductNameOutput = z.infer<typeof SuggestProductNameOutputSchema>;

export async function suggestProductName(input: SuggestProductNameInput): Promise<SuggestProductNameOutput> {
  return suggestProductNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductNamePrompt',
  input: {
    schema: z.object({
      productCode: z.string().describe('The code of the product.'),
      productData: z.array(z.any()).describe('Array of product data from excel.ts.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedName: z.string().describe('The suggested product name.'),
      suggestedDescription: z.string().describe('The suggested product description.'),
    }),
  },
  prompt: `Given the product code and existing product data, suggest an improved product name and description.

Product Code: {{{productCode}}}

Existing Product Data:
{{#each productData}}
  - Code: {{{code}}}, Name: {{{name}}}, Price: {{{price}}}
{{/each}}

Suggest a product name and description that is more descriptive and appealing.
`, // Modified prompt to use Handlebars each helper
});

const suggestProductNameFlow = ai.defineFlow<
  typeof SuggestProductNameInputSchema,
  typeof SuggestProductNameOutputSchema
>({
  name: 'suggestProductNameFlow',
  inputSchema: SuggestProductNameInputSchema,
  outputSchema: SuggestProductNameOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
