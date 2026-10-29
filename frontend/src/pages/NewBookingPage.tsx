import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leadsApi';
import { projectsApi } from '../api/projectsApi';
import { unitsApi } from '../api/unitsApi';
import { bookingsApi } from '../api/bookingsApi';
import { useToast } from '../context/ToastContext';
import { Lead, PropertyUnit, Booking, UnitType } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Phone,
  Mail,
  User,
  RotateCcw,
  Sparkles,
  Search,
  SlidersHorizontal,
  Layers,
  FileCheck,
  Info,
  Percent,
  Hash,
  Lock,
  Tag,
  Building2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { WizardStepper } from '../components/wizard/WizardStepper';
import { WizardNavigation } from '../components/wizard/WizardNavigation';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { LoadingState } from '../components/common/LoadingState';

const DEPOSIT_PRESETS = [
  { label: '5%', pct: 0.05 },
  { label: '10% (Std)', pct: 0.10 },
  { label: '15%', pct: 0.15 },
  { label: '20%', pct: 0.20 },
  { label: '50%', pct: 0.50 },
];

const STIPULATION_TEMPLATES = [
  'Standard 10% token deposit received. Final payment due at deed registration.',
  'Contingent on formal mortgage pre-approval within 14 calendar days.',
  'Includes private covered parking bay and ground-floor storage locker.',
  'Early possession agreement subject to earnest escrow clearance.',
];

export const NewBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedLeadId = searchParams.get('leadId');
  const preselectedUnitId = searchParams.get('unitId');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Wizard Step State (1: Select Buyer, 2: Select Unit, 3: Terms & Deposit, 4: Review & Confirm)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State (Persisted across all steps)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [bookingAmount, setBookingAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_WIRE');
  const [notes, setNotes] = useState<string>('');

  // Step 2 Inventory Filters & Search State
  const [unitSearch, setUnitSearch] = useState<string>('');
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>('');
  const [unitFloorFilter, setUnitFloorFilter] = useState<string>('');
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>('ALL');
  const [unitSort, setUnitSort] = useState<'unitNumber' | 'priceAsc' | 'priceDesc' | 'areaDesc'>('unitNumber');

  // Result & Error State
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ['eligible-leads'],
    queryFn: () => leadsApi.getLeads({ size: 100 }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  // Fetch inventory units for selected project / tower
  const { data: rawUnits, isLoading: isUnitsLoading } = useQuery({
    queryKey: ['wizard-units', { selectedProjectId, selectedBuildingId }],
    queryFn: () =>
      unitsApi.getUnits({
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
        buildingId: selectedBuildingId ? Number(selectedBuildingId) : undefined,
      }),
  });

  // Filtered & Sorted Units
  const filteredUnits = useMemo(() => {
    if (!rawUnits) return [];
    return rawUnits
      .filter((unit) => {
        // Status filter
        if (unitStatusFilter !== 'ALL' && unit.status !== unitStatusFilter) {
          return false;
        }
        // Unit type filter
        if (unitTypeFilter && unit.unitType !== unitTypeFilter) {
          return false;
        }
        // Floor range filter
        if (unitFloorFilter === 'low' && (unit.floor < 1 || unit.floor > 5)) {
          return false;
        }
        if (unitFloorFilter === 'mid' && (unit.floor < 6 || unit.floor > 15)) {
          return false;
        }
        if (unitFloorFilter === 'high' && unit.floor < 16) {
          return false;
        }
        // Search query (unit number, tower name, project name)
        if (unitSearch.trim()) {
          const q = unitSearch.toLowerCase().trim();
          const matchNumber = unit.unitNumber.toLowerCase().includes(q);
          const matchBuilding = unit.buildingName?.toLowerCase().includes(q) || false;
          const matchProject = unit.projectName?.toLowerCase().includes(q) || false;
          if (!matchNumber && !matchBuilding && !matchProject) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (unitSort === 'priceAsc') return a.price - b.price;
        if (unitSort === 'priceDesc') return b.price - a.price;
        if (unitSort === 'areaDesc') return b.areaSqft - a.areaSqft;
        return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
      });
  }, [rawUnits, unitSearch, unitTypeFilter, unitFloorFilter, unitStatusFilter, unitSort]);

  // Pre-fill lead if leadId passed in URL parameters
  useEffect(() => {
    if (preselectedLeadId && leadsData?.content) {
      const foundLead = leadsData.content.find((l) => l.id === Number(preselectedLeadId));
      if (foundLead) {
        setSelectedLead(foundLead);
        if (foundLead.interestedProjectId) {
          setSelectedProjectId(String(foundLead.interestedProjectId));
        }
      }
    }
  }, [preselectedLeadId, leadsData]);

  // Pre-fill unit if unitId passed in URL parameters
  useEffect(() => {
    if (preselectedUnitId && rawUnits) {
      const foundUnit = rawUnits.find((u) => u.id === Number(preselectedUnitId));
      if (foundUnit && foundUnit.status === 'AVAILABLE') {
        setSelectedUnit(foundUnit);
        setAgreedPrice(foundUnit.price);
        setBookingAmount(Math.round(foundUnit.price * 0.1));
        if (foundUnit.projectId) setSelectedProjectId(String(foundUnit.projectId));
        if (foundUnit.buildingId) setSelectedBuildingId(String(foundUnit.buildingId));
      }
    }
  }, [preselectedUnitId, rawUnits]);

  // Handle unit selection with availability guard
  const handleSelectUnit = (unit: PropertyUnit) => {
    if (unit.status !== 'AVAILABLE') {
      toast.error(
        'Unit Unavailable',
        `Unit #${unit.unitNumber} is currently ${unit.status.toLowerCase()} and cannot be reserved.`
      );
      return;
    }
    setSelectedUnit(unit);
    setAgreedPrice(unit.price);
    setBookingAmount(Math.round(unit.price * 0.1)); // Default 10% earnest deposit
  };

  // Booking Mutation with Pessimistic Concurrency Protection
  const bookingMutation = useMutation({
    mutationFn: (data: any) => bookingsApi.createBooking(data),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setBookingSuccess(booking);
      setErrorMessage(null);
      toast.success(
        'Reservation Successful!',
        `Unit #${booking.unitNumber} reserved under reference ${booking.bookingReference}`
      );
    },
    onError: (err: any) => {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'An error occurred while creating booking.';
      if (status === 409) {
        const errorText = `CONCURRENCY CONFLICT (HTTP 409): ${msg}`;
        setErrorMessage(errorText);
        toast.error('Reservation Conflict', 'This unit has just been locked by another agent.');
      } else {
        setErrorMessage(msg);
        toast.error('Booking Failed', msg);
      }
    },
  });

  const handleConfirmBooking = () => {
    if (!selectedLead || !selectedUnit) return;
    setErrorMessage(null);

    bookingMutation.mutate({
      leadId: selectedLead.id,
      unitId: selectedUnit.id,
      agreedPrice,
      bookingAmount,
      paymentMethod,
      notes: notes.trim(),
    });
  };

  const formatCurrency = (val: number | undefined) => {
    if (!val && val !== 0) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Financial calculations
  const listPrice = selectedUnit?.price || 0;
  const priceAdjustment = agreedPrice - listPrice;
  const priceAdjustmentPct = listPrice > 0 ? (priceAdjustment / listPrice) * 100 : 0;
  const depositPct = agreedPrice > 0 ? (bookingAmount / agreedPrice) * 100 : 0;
  const balanceDue = Math.max(0, agreedPrice - bookingAmount);
  const pricePerSqft =
    selectedUnit && selectedUnit.areaSqft > 0 ? Math.round(agreedPrice / selectedUnit.areaSqft) : 0;

  // Filter out leads already in BOOKED or LOST stage for reservations
  const eligibleLeads = leadsData?.content?.filter((l) => l.stage !== 'BOOKED' && l.stage !== 'LOST') || [];

  // Success Screen
  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-50 dark:ring-emerald-900/40">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Transaction Executed & Locked
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reservation Successfully Recorded!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Database pessimistic write locks verified zero collision. The property unit has been converted to Booked status and buyer agreement registered.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md text-left max-w-md mx-auto space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-slate-500 dark:text-slate-400">Booking Reference:</span>
            <span className="font-bold font-mono text-sm text-brand-600 dark:text-brand-400">{bookingSuccess.bookingReference}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-slate-500 dark:text-slate-400">Buyer Customer:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{bookingSuccess.customerName}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-slate-500 dark:text-slate-400">Property Unit:</span>
            <span className="font-semibold text-slate-900 dark:text-white">Unit #{bookingSuccess.unitNumber}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-slate-500 dark:text-slate-400">Agreed Price:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(bookingSuccess.agreedPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Token Deposit:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(bookingSuccess.bookingAmount)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link to={`/bookings/${bookingSuccess.id}`}>
            <Button variant="primary" size="md">
              View Formal Agreement
            </Button>
          </Link>
          <Link to="/bookings">
            <Button variant="outline" size="md">
              Return to Bookings List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <Breadcrumbs
        items={[
          { label: 'Bookings', path: '/bookings' },
          { label: 'Unit Reservation Wizard' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/bookings"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors"
          title="Return to bookings"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Unit Booking & Reservation Wizard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pessimistic locking workflow ensuring zero double-booking collisions
          </p>
        </div>
      </div>

      {/* 4-Step Progress Stepper */}
      <WizardStepper
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step === 1) setCurrentStep(1);
          if (step === 2 && selectedLead) setCurrentStep(2);
          if (step === 3 && selectedLead && selectedUnit) setCurrentStep(3);
        }}
      />

      {/* Persistent Selected Buyer Context Card (Steps 2, 3, 4) */}
      {selectedLead && currentStep > 1 && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-brand-200/80 dark:border-brand-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedLead.fullName}</span>
                <span className="font-mono text-[10px] text-slate-400">{selectedLead.leadCode}</span>
                <LeadStatusBadge status={selectedLead.stage} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedLead.phone}
                </span>
                {selectedLead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {selectedLead.email}
                  </span>
                )}
                {selectedLead.budget && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Budget: {formatCurrency(selectedLead.budget)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline decoration-brand-300 hover:decoration-brand-700 self-start sm:self-center"
          >
            Change Buyer &rarr;
          </button>
        </div>
      )}

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-rose-900 dark:text-rose-100">Booking Execution Blocked</h4>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Select Eligible Customer / Lead */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 1: Choose Eligible Buyer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click a buyer row or its checkbox to select. Hover over details for rich inspection.
            </p>
          </div>

          <LeadTable
            leads={eligibleLeads}
            selectedLead={selectedLead}
            onSelectLead={(lead) => {
              setSelectedLead(lead);
              if (lead.interestedProjectId) {
                setSelectedProjectId(String(lead.interestedProjectId));
              }
            }}
            onProceedToNext={(lead) => {
              setSelectedLead(lead);
              if (lead.interestedProjectId) {
                setSelectedProjectId(String(lead.interestedProjectId));
              }
              setCurrentStep(2);
            }}
            isLoading={isLeadsLoading}
            error={leadsError as Error}
            onRetry={refetchLeads}
          />

          <WizardNavigation
            canBack={false}
            canContinue={Boolean(selectedLead)}
            continueLabel="Continue to Unit Selection"
            validationWarning={
              !selectedLead ? 'Please select a buyer lead from the list above to proceed.' : null
            }
            onContinue={() => {
              if (selectedLead) {
                setCurrentStep(2);
              }
            }}
          />
        </div>
      )}

      {/* STEP 2: Select Property Project and Available Unit */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 2: Select Property Unit</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Filter inventory by project, tower, floor, or type to reserve for{' '}
                <strong className="text-slate-800 dark:text-slate-200">{selectedLead?.fullName}</strong>.
              </p>
            </div>
            {selectedUnit && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Selected: Unit #{selectedUnit.unitNumber}</span>
              </div>
            )}
          </div>

          {/* Filter Bar Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            {/* Project Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedBuildingId('');
                  setSelectedUnit(null);
                }}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Projects</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Tower Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tower / Building
              </label>
              <select
                value={selectedBuildingId}
                onChange={(e) => {
                  setSelectedBuildingId(e.target.value);
                  setSelectedUnit(null);
                }}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Towers</option>
                {projects
                  ?.find((p) => String(p.id) === selectedProjectId)
                  ?.buildings?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Unit Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Unit Type
              </label>
              <select
                value={unitTypeFilter}
                onChange={(e) => setUnitTypeFilter(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Unit Types</option>
                <option value="STUDIO">Studio</option>
                <option value="ONE_BHK">1 BHK</option>
                <option value="TWO_BHK">2 BHK</option>
                <option value="THREE_BHK">3 BHK</option>
                <option value="FOUR_BHK">4 BHK</option>
                <option value="PENTHOUSE">Penthouse</option>
                <option value="COMMERCIAL_SPACE">Commercial</option>
              </select>
            </div>

            {/* Floor Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Floor Elevation
              </label>
              <select
                value={unitFloorFilter}
                onChange={(e) => setUnitFloorFilter(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Floors</option>
                <option value="low">Low Floor (1 - 5)</option>
                <option value="mid">Mid Floor (6 - 15)</option>
                <option value="high">High Floor (16+)</option>
              </select>
            </div>
          </div>

          {/* Search, Status Pill Filters & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Search unit #, tower, or project..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'All Units' },
                { id: 'AVAILABLE', label: 'Available Only' },
                { id: 'RESERVED', label: 'Reserved' },
                { id: 'BOOKED', label: 'Booked' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setUnitStatusFilter(pill.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    unitStatusFilter === pill.id
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={unitSort}
                onChange={(e) => setUnitSort(e.target.value as any)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="unitNumber">Unit Number</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="areaDesc">Area: Largest Sqft</option>
              </select>
            </div>
          </div>

          {/* Units Inventory Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Showing {filteredUnits.length} of {rawUnits?.length || 0} Units
              </span>
              <span className="text-[11px] italic">
                Only Available units can be selected for reservation
              </span>
            </div>

            {isUnitsLoading ? (
              <LoadingState message="Fetching property inventory..." size="md" />
            ) : filteredUnits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredUnits.map((unit) => {
                  const isSelected = selectedUnit?.id === unit.id;
                  const isAvailable = unit.status === 'AVAILABLE';
                  const isReserved = unit.status === 'RESERVED';
                  const isBooked = unit.status === 'BOOKED';

                  return (
                    <div
                      key={unit.id}
                      onClick={() => handleSelectUnit(unit)}
                      className={`p-4 rounded-xl border text-xs transition-all duration-200 flex flex-col justify-between gap-3 relative select-none ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/60 ring-2 ring-brand-500/30 shadow-md cursor-pointer'
                          : isAvailable
                          ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Top Row: Unit # & Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            Unit #{unit.unitNumber}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {isAvailable && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            Available
                          </span>
                        )}
                        {isReserved && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            Reserved
                          </span>
                        )}
                        {isBooked && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                            Sold / Booked
                          </span>
                        )}
                      </div>

                      {/* Specs */}
                      <div className="text-slate-600 dark:text-slate-300 space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{unit.projectName} • {unit.buildingName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {unit.unitType.replace(/_/g, ' ')}
                          </span>
                          <span>•</span>
                          <span>Floor {unit.floor}</span>
                          <span>•</span>
                          <span>{unit.areaSqft.toLocaleString()} sqft</span>
                        </div>
                      </div>

                      {/* Pricing Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Listing Price
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(unit.price)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ${Math.round(unit.price / (unit.areaSqft || 1))}/sqft
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                No property units match the selected filters. Try clearing some filter options.
              </div>
            )}
          </div>

          <WizardNavigation
            onBack={() => setCurrentStep(1)}
            canContinue={Boolean(selectedUnit && selectedUnit.status === 'AVAILABLE')}
            continueLabel="Set Terms & Pricing"
            validationWarning={!selectedUnit ? 'Please select an available property unit to continue.' : null}
            onContinue={() => {
              if (selectedUnit && selectedUnit.status === 'AVAILABLE') {
                setCurrentStep(3);
              }
            }}
          />
        </div>
      )}

      {/* STEP 3: Agreed Pricing and Deposit Terms */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 3: Agreed Price & Token Deposit</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unit #{selectedUnit?.unitNumber} ({selectedUnit?.buildingName}) • Base List Price: {formatCurrency(listPrice)}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {selectedUnit?.unitType.replace(/_/g, ' ')} • {selectedUnit?.areaSqft} sqft
            </div>
          </div>

          {/* Pricing Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Agreed Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Agreed Selling Price (USD) <span className="text-rose-500">*</span></span>
                {priceAdjustment !== 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      priceAdjustment < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {priceAdjustment < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(priceAdjustment))} ({priceAdjustmentPct.toFixed(1)}%)
                  </span>
                )}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  step="500"
                  value={agreedPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setAgreedPrice(newPrice);
                    // Maintain proportional deposit if reasonable
                    if (depositPct > 0) {
                      setBookingAmount(Math.round((newPrice * depositPct) / 100));
                    }
                  }}
                  className="w-full text-sm font-bold pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Token Deposit / Booking Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Token Deposit / Earnest Amount <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {depositPct.toFixed(1)}% of selling price
                </span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  max={agreedPrice}
                  step="500"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-emerald-700 dark:text-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Deposit Quick Presets */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Presets:</span>
                {DEPOSIT_PRESETS.map((p) => {
                  const presetValue = Math.round(agreedPrice * p.pct);
                  const isActive = bookingAmount === presetValue;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setBookingAmount(presetValue)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.label} ({formatCurrency(presetValue)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="BANK_WIRE">Bank Wire Transfer</option>
                <option value="CHEQUE">Cashier's Cheque / Demand Draft</option>
                <option value="ONLINE_CARD">Online Credit/Debit Card</option>
                <option value="ESCROW">Escrow Deposit Trust</option>
              </select>
            </div>

            {/* Remaining Settlement Balance */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Remaining Settlement Balance Due
              </label>
              <div className="w-full text-sm font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white flex items-center justify-between">
                <span>{formatCurrency(balanceDue)}</span>
                <span className="text-[10px] text-slate-400 font-normal uppercase">Due at Deed Signing</span>
              </div>
            </div>
          </div>

          {/* Live Financial Breakdown Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-2">
              Financial Breakdown & Closing Terms
            </h4>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Base Listing Price</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(listPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Negotiated Price Adjustment</span>
              <span
                className={`font-mono font-semibold ${
                  priceAdjustment < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : priceAdjustment > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500'
                }`}
              >
                {priceAdjustment < 0
                  ? `-${formatCurrency(Math.abs(priceAdjustment))} (Discount)`
                  : priceAdjustment > 0
                  ? `+${formatCurrency(priceAdjustment)} (Premium)`
                  : 'Full List Price ($0 Adjustment)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Agreed Selling Price</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(agreedPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Immediate Token Deposit ({depositPct.toFixed(1)}%)</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(bookingAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Final Balance Due at Closing</span>
              <span className="font-mono text-sm">{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          {/* Stipulations and Contract Notes with quick insert buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Special Stipulations & Contract Notes
              </label>
              <span className="text-[10px] text-slate-400">Click a template below to auto-fill</span>
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {STIPULATION_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setNotes((prev) => (prev ? `${prev}\n${tmpl}` : tmpl))
                  }
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                >
                  + {tmpl.substring(0, 45)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any special provisions, financing conditions, parking stipulations, or deed registration dates..."
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          <WizardNavigation
            onBack={() => setCurrentStep(2)}
            canContinue={agreedPrice > 0 && bookingAmount >= 0 && bookingAmount <= agreedPrice}
            continueLabel="Review Summary & Confirm"
            validationWarning={
              agreedPrice <= 0
                ? 'Agreed selling price must be greater than 0.'
                : bookingAmount > agreedPrice
                ? 'Token deposit cannot exceed the agreed selling price.'
                : null
            }
            onContinue={() => setCurrentStep(4)}
          />
        </div>
      )}

      {/* STEP 4: Review and Execute Concurrency-Safe Booking */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 4: Enterprise Contract Review & Submission</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verify buyer specifications, unit parameters, and financial terms before acquiring exclusive row-level lock.
            </p>
          </div>

          {/* Master Contract Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Buyer Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Buyer Customer Profile
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLead?.fullName}</p>
              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {selectedLead?.phone}
              </p>
              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {selectedLead?.email || 'No email registered'}
              </p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-mono text-slate-400">{selectedLead?.leadCode}</span>
                {selectedLead && <LeadStatusBadge status={selectedLead.stage} size="sm" />}
              </div>
              {selectedLead?.budget && (
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  Buyer Budget: {formatCurrency(selectedLead.budget)}
                </p>
              )}
            </div>

            {/* Property Unit Specs */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Inventory Unit Specifications
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Unit #{selectedUnit?.unitNumber}</p>
              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {selectedUnit?.projectName} • {selectedUnit?.buildingName}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {selectedUnit?.unitType.replace(/_/g, ' ')} • Floor {selectedUnit?.floor} •{' '}
                {selectedUnit?.areaSqft.toLocaleString()} sqft
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Unit Valuation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${pricePerSqft}/sqft</span>
              </div>
            </div>
          </div>

          {/* Pricing Summary Banner */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">
                Agreed Selling Price:{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(agreedPrice)}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-300 block mt-0.5">
                Immediate Token Deposit:{' '}
                <strong className="text-emerald-800 dark:text-emerald-300 font-bold">{formatCurrency(bookingAmount)}</strong> (
                {paymentMethod.replace(/_/g, ' ')})
              </span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                Closing Balance Due
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>

          {/* Special Stipulations Review */}
          {notes && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs">
              <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block mb-1">
                Special Stipulations / Clauses:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          {/* Pessimistic Concurrency Guarantee Alert */}
          <div className="p-3.5 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 rounded-xl text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block text-brand-950 dark:text-brand-100 font-bold">
                Pessimistic Concurrency Lock Protection Active:
              </strong>
              <p className="leading-relaxed text-[11px] text-brand-800 dark:text-brand-300">
                Upon clicking Confirm, the unit row in MySQL is locked exclusively via <code>SELECT ... FOR UPDATE</code>. If any other agent simultaneously attempts to book Unit #{selectedUnit?.unitNumber}, their transaction will be safely prevented and alerted with HTTP 409 Conflict.
              </p>
            </div>
          </div>

          <WizardNavigation
            onBack={() => setCurrentStep(3)}
            isSubmitting={bookingMutation.isPending}
            isFinalStep
            continueLabel="Confirm & Execute Booking"
            onContinue={handleConfirmBooking}
          />
        </div>
      )}
    </div>
  );
};
