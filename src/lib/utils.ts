import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validatePhoneNumber = (phone: string): { isValid: boolean; operator: string; formattedPhone: string } => {
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove leading 237 if present
  if (cleanPhone.startsWith('237')) {
    cleanPhone = cleanPhone.slice(3);
  }

  const orangePattern = /((65[5-9][0-9]{6}$)|(69[0-9]{7}$)|(68[5-9][0-9]{6}$))/;
  const mtnPattern = /((65[0-4][0-9]{6}$)|(67[0-9]{7}$)|(680[0-9]{6}$)|(68[1-4][0-9]{6}$))/;
  const nexttelPattern = /^66\d{7}$/;
  const camtelPattern = /^2\d{8}$/;

  let operator = 'Unknown';
  let isValid = false;

  if (orangePattern.test(cleanPhone)) {
    isValid = true;
    operator = 'Orange';
  } else if (mtnPattern.test(cleanPhone)) {
    isValid = true;
    operator = 'MTN';
  } else if (nexttelPattern.test(cleanPhone)) {
    isValid = true;
    operator = 'Nexttel';
  } else if (camtelPattern.test(cleanPhone)) {
    isValid = true;
    operator = 'Camtel';
  }

  // Add 237 prefix to valid numbers
  const formattedPhone = isValid ? `${cleanPhone}` : cleanPhone;

  return { isValid, operator, formattedPhone };
};

