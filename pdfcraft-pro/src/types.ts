export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium' | 'business';
  dailyTaskCount: number;
  storageUsed: number; // in bytes
  createdAt: string;
}

export interface FileRecord {
  id: string;
  userId: string | null; // null for guest mode
  originalName: string;
  fileType: string;
  fileSize: number;
  toolUsed: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  pageCount?: number;
  createdAt: string;
  expiresAt: string;
}

export interface TaskRecord {
  id: string;
  userId: string | null;
  toolName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  createdAt: string;
}

export interface PDFTool {
  id: string;
  name: string;
  description: string;
  category: 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit' | 'security' | 'ai';
  iconName: string;
  path: string;
  isPremium?: boolean;
}

export interface PricingPlan {
  id: 'free' | 'premium' | 'business';
  name: string;
  price: string;
  period: string;
  features: string[];
  limitations: string[];
}
