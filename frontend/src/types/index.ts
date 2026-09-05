export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'SALES' | 'PRODUCTION' | 'ACCOUNTANT' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  avatar?: string;
  is_active: boolean;
  is_staff: boolean;
  customer_profile?: {
    id: string;
    address?: string;
    city?: string;
    company_name?: string;
    tin_number?: string;
  };
  employee_profile?: {
    id: string;
    department?: string;
    job_title?: string;
    skills?: string;
  };
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
  product_count?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  category_name: string;
  description: string;
  material: string;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  dimensions_unit: string;
  starting_price: number;
  unit: string;
  is_featured: boolean;
  is_active: boolean;
  stock_status: 'IN_STOCK' | 'MADE_TO_ORDER' | 'OUT_OF_STOCK';
  is_customizable: boolean;
  images: Array<{ id: string; image: string; is_primary: boolean; caption?: string }>;
  primary_image?: string;
  created_at: string;
}

export interface Service {
  id: string;
  category: string;
  category_name: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  starting_price?: number;
  price_unit: string;
  turnaround_time: string;
  is_active: boolean;
  image?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  services?: Service[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: 'METAL' | 'WOOD' | 'FURNITURE' | 'DOORS' | 'WINDOWS' | 'CUSTOM';
  description: string;
  client_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'OFFICE' | 'SPECIAL';
  materials_used: string;
  completion_date?: string;
  is_featured: boolean;
  is_published: boolean;
  images: Array<{ id: string; image: string; image_type: 'REGULAR' | 'BEFORE' | 'AFTER'; caption?: string }>;
  primary_image?: string;
  created_at: string;
}

export type QuoteStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'PRICE_PROPOSED' 
  | 'CUSTOMER_ACCEPTED' 
  | 'CUSTOMER_REJECTED' 
  | 'EXPIRED' 
  | 'CONVERTED_TO_ORDER';

export interface Quote {
  id: string;
  quote_number: string;
  customer: User;
  project_title: string;
  service_type: string;
  description: string;
  material_preference?: string;
  width_cm?: number;
  height_cm?: number;
  length_cm?: number;
  quantity: number;
  preferred_completion_date?: string;
  installation_required: boolean;
  delivery_required: boolean;
  delivery_address?: string;
  status: QuoteStatus;
  materials_cost: number;
  labor_cost: number;
  transportation_cost: number;
  installation_cost: number;
  additional_charges: number;
  discount: number;
  subtotal: number;
  total_amount: number;
  expiration_date?: string;
  workshop_notes?: string;
  customer_notes?: string;
  items: Array<{ id: string; description: string; quantity: number; unit_cost: number; total_cost: number }>;
  attachments: Array<{ id: string; file: string; file_name: string }>;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'DELIVERY'
  | 'INSTALLATION'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Order {
  id: string;
  order_number: string;
  quote?: string;
  customer: User;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  delivery_address?: string;
  delivery_city?: string;
  expected_delivery_date?: string;
  notes?: string;
  items: Array<{ id: string; item_title: string; description?: string; quantity: number; unit_price: number; total_price: number }>;
  production_job?: {
    id: string;
    job_code: string;
    stage: string;
    progress_percentage: number;
    priority: string;
  };
  created_at: string;
  updated_at: string;
}

export type ProductionStage =
  | 'ORDER_CONFIRMED'
  | 'MATERIAL_PREP'
  | 'CUTTING'
  | 'FABRICATION'
  | 'ASSEMBLY'
  | 'FINISHING'
  | 'QUALITY_INSPECTION'
  | 'READY_FOR_DELIVERY'
  | 'INSTALLATION'
  | 'COMPLETED';

export interface ProductionJob {
  id: string;
  job_code: string;
  order: string;
  order_number: string;
  customer_name: string;
  stage: ProductionStage;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  progress_percentage: number;
  supervisor?: User;
  start_date?: string;
  expected_completion?: string;
  actual_completion?: string;
  notes?: string;
  tasks: Array<{ id: string; title: string; stage: string; assigned_to_name?: string; is_completed: boolean; notes?: string }>;
  logs: Array<{ id: string; previous_stage: string; new_stage: string; progress_percentage: number; updated_by_name?: string; notes?: string; image?: string; created_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_cost: number;
  supplier?: string;
  supplier_name?: string;
  location: string;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address: string;
  materials_supplied: string;
  notes?: string;
  is_active: boolean;
  material_count: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order: string;
  order_number: string;
  customer: User;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issue_date: string;
  due_date: string;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  order: string;
  order_number: string;
  customer: User;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference?: string;
  status: string;
  payment_date: string;
  receipt_attachment?: string;
  recorded_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  description: string;
  receipt_attachment?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer: User;
  subject: string;
  status: string;
  last_message_at: string;
  unread_count: number;
  messages: Array<{ id: string; sender: User; content: string; attachment?: string; is_read: boolean; is_me: boolean; created_at: string }>;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface WorkshopSettings {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  telegram: string;
  address: string;
  address_amharic: string;
  working_hours: string;
  currency: string;
  vat_percentage: number;
  quote_validity_days: number;
  logo?: string;
}
