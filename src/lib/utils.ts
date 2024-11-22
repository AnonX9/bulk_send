import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const validatePhoneNumber = (phone: string): { isValid: boolean; operator: string } => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  const orangePattern = /^6(9\d{7}|5[5-9]\d{6})$/;
  const mtnPattern = /^6(7[678]\d{6}|50\d{6})$/;
  const nexttelPattern = /^66\d{7}$/;
  const camtelPattern = /^2\d{8}$/;

  if (orangePattern.test(cleanPhone)) return { isValid: true, operator: 'Orange' };
  if (mtnPattern.test(cleanPhone)) return { isValid: true, operator: 'MTN' };
  if (nexttelPattern.test(cleanPhone)) return { isValid: true, operator: 'Nexttel' };
  if (camtelPattern.test(cleanPhone)) return { isValid: true, operator: 'Camtel' };

  return { isValid: false, operator: 'Unknown' };
};
