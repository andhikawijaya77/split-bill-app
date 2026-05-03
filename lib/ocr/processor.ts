import Tesseract from 'tesseract.js';

export interface OCRItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OCRResult {
  items: OCRItem[];
  taxRate?: number;
  serviceRate?: number;
  total?: number;
  rawText: string;
}

/**
 * Process image with Tesseract.js OCR
 */
export async function processImageWithTesseract(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress * 100);
      }
    },
  });

  const { data } = await worker.recognize(imageFile);
  await worker.terminate();

  return data.text;
}

/**
 * Parse OCR text to extract receipt items
 * 
 * This uses heuristics to identify:
 * - Item names (text at start of line)
 * - Quantities (numbers followed by 'x' or before item name)
 * - Prices (numbers with currency symbols or at end of line)
 * - Tax/service rates (lines containing 'tax', 'ppn', 'service', 'pb1')
 */
export function parseReceiptText(text: string): OCRResult {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const items: OCRItem[] = [];
  let taxRate: number | undefined;
  let serviceRate: number | undefined;
  let total: number | undefined;

  // Common patterns
  const pricePattern = /\b(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\b/g;
  const quantityPattern = /(\d+)\s*x/i;
  const taxPattern = /(tax|ppn|pajak).*?(\d+)%/i;
  const servicePattern = /(service|pb1|layanan).*?(\d+)%/i;
  const totalPattern = /(total|grand total|amount|jumlah)/i;

  for (const line of lines) {
    // Skip empty or very short lines
    if (line.length < 3) continue;

    // Check for tax rate
    const taxMatch = line.match(taxPattern);
    if (taxMatch) {
      taxRate = parseFloat(taxMatch[2]) / 100;
      continue;
    }

    // Check for service rate
    const serviceMatch = line.match(servicePattern);
    if (serviceMatch) {
      serviceRate = parseFloat(serviceMatch[2]) / 100;
      continue;
    }

    // Check for total
    if (totalPattern.test(line)) {
      const prices = extractPrices(line);
      if (prices.length > 0) {
        total = prices[prices.length - 1];
      }
      continue;
    }

    // Try to extract item
    const item = extractItem(line);
    if (item) {
      items.push(item);
    }
  }

  return {
    items,
    taxRate,
    serviceRate,
    total,
    rawText: text,
  };
}

/**
 * Extract prices from a line of text
 */
function extractPrices(text: string): number[] {
  const pricePattern = /\b(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\b/g;
  const matches = text.matchAll(pricePattern);
  
  const prices: number[] = [];
  for (const match of matches) {
    const priceStr = match[1].replace(/[,.\s]/g, '');
    const price = parseFloat(priceStr);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  }
  
  return prices;
}

/**
 * Extract item from a line of text
 * 
 * Expected formats:
 * - "Nasi Goreng 2 25000"
 * - "2x Ayam Bakar @ 35000"
 * - "Es Teh 3000"
 * - "Rendang 1 30000 30000"
 */
function extractItem(line: string): OCRItem | null {
  // Remove common noise characters
  const cleaned = line.replace(/[|_\-=]/g, ' ').trim();
  
  // Extract prices (numbers that look like prices)
  const prices = extractPrices(cleaned);
  if (prices.length === 0) return null;

  // Extract quantity
  const qtyMatch = cleaned.match(/(\d+)\s*x/i);
  let quantity = 1;
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1]);
  } else {
    // Try to find standalone number at start
    const leadingNum = cleaned.match(/^(\d+)\s+/);
    if (leadingNum && parseInt(leadingNum[1]) < 100) {
      quantity = parseInt(leadingNum[1]);
    }
  }

  // Price is usually the last number, or second-to-last if there's a total
  let unitPrice = prices[prices.length - 1];
  
  // If we have multiple prices and quantity > 1, second-to-last is likely unit price
  if (prices.length > 1 && quantity > 1) {
    unitPrice = prices[prices.length - 2];
  }

  // Divide by quantity if price seems to be total
  if (prices.length === 1 && quantity > 1) {
    // Check if price is divisible by quantity
    if (unitPrice % quantity === 0) {
      unitPrice = unitPrice / quantity;
    }
  }

  // Extract item name (everything before the prices/numbers)
  let name = cleaned;
  
  // Remove quantity prefix
  name = name.replace(/^\d+\s*x?\s*/i, '');
  
  // Remove price numbers
  for (const price of prices) {
    name = name.replace(price.toString(), '');
  }
  
  // Remove @ symbol and remaining numbers
  name = name.replace(/@/g, '').replace(/\d+/g, '').trim();
  
  // Clean up extra spaces
  name = name.replace(/\s+/g, ' ').trim();

  // Validate
  if (!name || name.length < 2) return null;
  if (unitPrice <= 0 || unitPrice > 10000000) return null; // Sanity check
  if (quantity <= 0 || quantity > 100) return null;

  return {
    name,
    quantity,
    unitPrice,
  };
}

/**
 * Validate and clean OCR results
 */
export function validateOCRResult(result: OCRResult): OCRResult {
  // Remove duplicate items (by name)
  const uniqueItems = result.items.reduce((acc, item) => {
    const existing = acc.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    if (!existing) {
      acc.push(item);
    }
    return acc;
  }, [] as OCRItem[]);

  // Remove items with suspicious names (too short, all numbers, etc.)
  const validItems = uniqueItems.filter(item => {
    if (item.name.length < 2) return false;
    if (/^\d+$/.test(item.name)) return false; // All numbers
    if (!/[a-zA-Z]/.test(item.name)) return false; // No letters
    return true;
  });

  return {
    ...result,
    items: validItems,
  };
}
