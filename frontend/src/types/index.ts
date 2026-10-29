export type Role = 'ADMIN' | 'SALES_EMPLOYEE';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export type ProjectStatus = 'PLANNED' | 'UNDER_CONSTRUCTION' | 'READY_TO_MOVE' | 'COMPLETED';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE' | 'VILLA';

export interface Building {
  id: number;
  projectId: number;
  projectName?: string;
  name: string;
  floors: number;
  totalUnits?: number;
  availableUnits?: number;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  status: ProjectStatus;
  propertyType: PropertyType;
  startDate?: string;
  completionDate?: string;
  buildings?: Building[];
  totalUnits?: number;
  availableUnits?: number;
  createdAt?: string;
}

export type UnitType = 'STUDIO' | 'ONE_BHK' | 'TWO_BHK' | 'THREE_BHK' | 'FOUR_BHK' | 'PENTHOUSE' | 'COMMERCIAL_SPACE';
export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'UNAVAILABLE';

export interface PropertyUnit {
  id: number;
  buildingId: number;
  buildingName?: string;
  projectId?: number;
  projectName?: string;
  unitNumber: string;
  unitType: UnitType;
  floor: number;
  areaSqft: number;
  price: number;
  status: UnitStatus;
  version?: number;
  createdAt?: string;
}

export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'WALK_IN' | 'SOCIAL_MEDIA' | 'CALL_IN' | 'CAMPAIGN' | 'BROKER' | 'OTHER';
export type LeadStage = 'NEW' | 'CONTACTED' | 'SITE_VISIT' | 'INTERESTED' | 'NEGOTIATION' | 'BOOKED' | 'LOST';

export interface Lead {
  id: number;
  leadCode: string;
  fullName: string;
  phone: string;
  email?: string;
  leadSource: LeadSource;
  interestedProjectId?: number;
  interestedProjectName?: string;
  budget?: number;
  assignedToId?: number;
  assignedToName?: string;
  stage: LeadStage;
  nextFollowUpDate?: string;
  notes?: string;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'BOOKING';

export interface LeadActivity {
  id: number;
  leadId: number;
  userId?: number;
  userName?: string;
  type: ActivityType;
  description: string;
  createdAt: string;
}

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface FollowUp {
  id: number;
  leadId: number;
  leadCode?: string;
  leadName?: string;
  leadPhone?: string;
  assignedToId?: number;
  assignedToName?: string;
  scheduledAt: string;
  status: FollowUpStatus;
  notes?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  overdue?: boolean;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: number;
  bookingReference: string;
  leadId: number;
  leadCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  unitId: number;
  unitNumber?: string;
  unitType?: UnitType;
  buildingId?: number;
  buildingName?: string;
  projectId?: number;
  projectName?: string;
  bookedById: number;
  bookedByName?: string;
  bookingDate: string;
  agreedPrice: number;
  bookingAmount: number;
  paymentMethod?: string;
  status: BookingStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledByName?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  siteVisitsScheduled: number;
  negotiationLeads: number;
  successfulBookings: number;
  lostLeads: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  totalAvailableUnits: number;
  totalBookingRevenue: number;
}

export interface MonthlyBooking {
  month: string;
  count: number;
  revenue: number;
}

export interface EmployeePerformance {
  employeeId: number;
  name: string;
  email: string;
  assignedLeads: number;
  bookedCount: number;
  totalRevenue: number;
}

export interface DashboardAnalytics {
  leadsByStage: Record<string, number>;
  leadsBySource: Record<string, number>;
  monthlyBookings: MonthlyBooking[];
  recentLeads: Lead[];
  upcomingFollowUps: FollowUp[];
  recentBookings: Booking[];
  employeePerformance: EmployeePerformance[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
