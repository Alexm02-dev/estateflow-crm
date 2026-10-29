import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { unitsApi } from '../api/unitsApi';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PropertyUnit, UnitStatus, UnitType } from '../types';
import {
  Home,
  Plus,
  DollarSign,
  Maximize2,
  Building,
  Key,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageHeader } from '../components/common/PageHeader';
import { FilterToolbar, ActiveFilter } from '../components/common/FilterToolbar';
import { DataTable, Column } from '../components/common/DataTable';
import { DataTableToolbar } from '../components/common/DataTableToolbar';
import { RecordDetailDrawer } from '../components/common/RecordDetailDrawer';
import { exportToCsv } from '../utils/csvExport';

export const UnitsInventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const selectedProjectId = searchParams.get('projectId') || '';
  const selectedBuildingId = searchParams.get('buildingId') || '';
  const urlStatus = searchParams.get('status') || '';
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus);
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Synchronize state when URL search params change
  React.useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setSelectedStatus(statusParam);
  }, [searchParams]);

  // Row selection
  const [selectedUnitIds, setSelectedUnitIds] = useState<(number | string)[]>([]);

  // Modals & Drawers
  const [activeUnitDrawer, setActiveUnitDrawer] = useState<PropertyUnit | null>(null);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>('AVAILABLE');
  const [deleteTarget, setDeleteTarget] = useState<PropertyUnit | null>(null);

  // Add unit form state
  const [modalBuildingId, setModalBuildingId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('TWO_BHK');
  const [floor, setFloor] = useState<number>(1);
  const [areaSqft, setAreaSqft] = useState<number>(1200);
  const [price, setPrice] = useState<number>(450000);

  // Queries
  const { data: units, isLoading, error } = useQuery({
    queryKey: ['units', { selectedProjectId, selectedBuildingId, selectedType, selectedStatus, maxPrice }],
    queryFn: () =>
      unitsApi.getUnits({
        projectId: selectedProjectId ? Number(selectedProjectId) : undefined,
        buildingId: selectedBuildingId ? Number(selectedBuildingId) : undefined,
        unitType: selectedType || undefined,
        status: selectedStatus || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: projectsApi.getProjects,
  });

  // Mutations
  const createUnitMutation = useMutation({
    mutationFn: (data: any) => unitsApi.createUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit created successfully');
      setIsAddUnitOpen(false);
      setUnitNumber('');
      setPrice(450000);
    },
    onError: (err: any) => {
      toast.error('Failed to create unit', err.response?.data?.message || err.message);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ unitIds, status }: { unitIds: number[]; status: string }) =>
      unitsApi.bulkUpdateStatus(unitIds, status),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Bulk Status Update', `Updated status for ${count} unit(s)`);
      setSelectedUnitIds([]);
      setShowBulkStatusModal(false);
    },
    onError: (err: any) => {
      toast.error('Bulk status update failed', err.response?.data?.message || err.message);
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: (id: number) => unitsApi.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit removed from inventory');
      setDeleteTarget(null);
      if (activeUnitDrawer?.id === deleteTarget?.id) {
        setActiveUnitDrawer(null);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to delete unit', err.response?.data?.message || err.message);
    },
  });

  const formatCurrency = (val: number | undefined) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportCsv = (selectedOnly: boolean) => {
    const listToExport = selectedOnly
      ? (units || []).filter((u) => selectedUnitIds.includes(u.id))
      : units || [];

    if (listToExport.length === 0) {
      toast.warning('No units available to export');
      return;
    }

    exportToCsv(
      selectedOnly ? 'selected-units' : 'units-inventory',
      listToExport as any[],
      [
        { key: 'unitNumber', label: 'Unit Number' },
        { key: 'projectName', label: 'Project' },
        { key: 'buildingName', label: 'Building' },
        { key: 'unitType', label: 'Unit Type' },
        { key: 'floor', label: 'Floor' },
        { key: 'areaSqft', label: 'Area (Sqft)' },
        { key: 'price', label: 'Price (USD)' },
        { key: 'status', label: 'Status' },
      ]
    );

    toast.info(`Exported ${listToExport.length} unit(s) to CSV`);
  };

  const activeFilters: ActiveFilter[] = [];
  if (selectedProjectId) {
    const proj = projects?.find((p) => p.id === Number(selectedProjectId));
    activeFilters.push({ key: 'projectId', label: 'Project', value: proj?.name || selectedProjectId });
  }
  if (selectedType) {
    activeFilters.push({ key: 'type', label: 'Type', value: selectedType.replace('_', ' ') });
  }
  if (selectedStatus) {
    activeFilters.push({ key: 'status', label: 'Status', value: selectedStatus });
  }
  if (maxPrice) {
    activeFilters.push({ key: 'maxPrice', label: 'Max Price', value: `$${Number(maxPrice).toLocaleString()}` });
  }

  const handleRemoveFilter = (key: string) => {
    if (key === 'projectId') {
      searchParams.delete('projectId');
      searchParams.delete('buildingId');
      setSearchParams(searchParams);
    }
    if (key === 'type') setSelectedType('');
    if (key === 'status') setSelectedStatus('');
    if (key === 'maxPrice') setMaxPrice('');
  };

  const handleClearAll = () => {
    setSearchParams({});
    setSelectedType('');
    setSelectedStatus('');
    setMaxPrice('');
  };

  const columns: Column<PropertyUnit>[] = [
    {
      key: 'unitNumber',
      header: 'Unit Identifier',
      render: (unit) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">#{unit.unitNumber}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {unit.buildingName} • Floor {unit.floor}
          </span>
        </div>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (unit) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {unit.projectName}
        </span>
      ),
    },
    {
      key: 'unitType',
      header: 'Configuration',
      render: (unit) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {unit.unitType.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'areaSqft',
      header: 'Area',
      render: (unit) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {unit.areaSqft.toLocaleString()} sqft
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (unit) => (
        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          {formatCurrency(unit.price)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Inventory Status',
      render: (unit) => <StatusBadge status={unit.status} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (unit) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setActiveUnitDrawer(unit)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Inspect Unit"
            aria-label="Inspect unit"
          >
            <Eye className="w-4 h-4" />
          </button>
          {unit.status === 'AVAILABLE' && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/new?unitId=${unit.id}`)}
              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
              title="Book this Unit"
              aria-label="Book this unit"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDeleteTarget(unit)}
              disabled={unit.status === 'BOOKED'}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={unit.status === 'BOOKED' ? 'Booked unit cannot be deleted' : 'Delete Unit'}
              aria-label="Delete unit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Header */}
      <PageHeader
        title="Units Inventory"
        description="Filter, inspect, book, and administer real estate property units and floors."
        breadcrumbs={[{ label: 'Units' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCsv(false)}
            >
              Export Inventory (CSV)
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddUnitOpen(true)}
              >
                Add Property Unit
              </Button>
            )}
          </>
        }
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        totalResults={units?.length}
      >
        <select
          value={selectedProjectId}
          onChange={(e) => {
            if (e.target.value) {
              setSearchParams({ projectId: e.target.value });
            } else {
              setSearchParams({});
            }
          }}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Project"
        >
          <option value="">All Projects</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Type"
        >
          <option value="">All Configurations</option>
          <option value="STUDIO">Studio</option>
          <option value="ONE_BHK">1 BHK</option>
          <option value="TWO_BHK">2 BHK</option>
          <option value="THREE_BHK">3 BHK</option>
          <option value="PENTHOUSE">Penthouse</option>
          <option value="VILLA">Villa</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          aria-label="Filter by Status"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="BOOKED">Booked</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>

        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max Price (USD)..."
          className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 w-full"
          aria-label="Filter by Max Price"
        />
      </FilterToolbar>

      {/* Bulk Action Toolbar */}
      <DataTableToolbar
        selectedCount={selectedUnitIds.length}
        totalCount={units?.length}
        onClearSelection={() => setSelectedUnitIds([])}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => handleExportCsv(true)}
            >
              Export Selected
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                icon={<Layers className="w-3.5 h-3.5" />}
                onClick={() => setShowBulkStatusModal(true)}
              >
                Change Status
              </Button>
            )}
          </>
        }
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={units || []}
        isLoading={isLoading}
        emptyTitle="No property units found"
        emptyDescription="No property units match the selected filters."
        selectable
        selectedIds={selectedUnitIds}
        onSelectionChange={setSelectedUnitIds}
        isRowSelectable={(unit) => unit.status !== 'BOOKED' || !isAdmin}
        onRowClick={(unit) => setActiveUnitDrawer(unit)}
        highlightRowId={activeUnitDrawer?.id}
        totalElements={units?.length || 0}
      />

      {/* Slide-out Record Detail Inspection Drawer */}
      <RecordDetailDrawer
        isOpen={!!activeUnitDrawer}
        onClose={() => setActiveUnitDrawer(null)}
        title={activeUnitDrawer ? `Unit #${activeUnitDrawer.unitNumber}` : 'Unit Details'}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{activeUnitDrawer?.buildingName}</span>
            {activeUnitDrawer && <StatusBadge status={activeUnitDrawer.status} />}
          </div>
        }
        footer={
          activeUnitDrawer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveUnitDrawer(null)}
              >
                Close
              </Button>
              {activeUnitDrawer.status === 'AVAILABLE' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Key className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/bookings/new?unitId=${activeUnitDrawer.id}`)}
                >
                  Create Booking for Unit
                </Button>
              )}
            </>
          )
        }
      >
        {activeUnitDrawer && (
          <div className="space-y-6 text-sm">
            {/* Price Highlight */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Listing Valuation
                </span>
                <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200 block mt-0.5">
                  {formatCurrency(activeUnitDrawer.price)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  ${Math.round(activeUnitDrawer.price / activeUnitDrawer.areaSqft)} / sqft
                </span>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                    Configuration
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {activeUnitDrawer.unitType.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                    Floor Level
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    Floor {activeUnitDrawer.floor}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                    Total Area
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {activeUnitDrawer.areaSqft.toLocaleString()} sqft
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                    Project
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                    {activeUnitDrawer.projectName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </RecordDetailDrawer>

      {/* Bulk Status Update Modal */}
      <Modal
        isOpen={showBulkStatusModal}
        onClose={() => setShowBulkStatusModal(false)}
        title={`Update Inventory Status for ${selectedUnitIds.length} Unit(s)`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Set the inventory status for the <strong className="text-slate-800 dark:text-slate-100">{selectedUnitIds.length}</strong> selected unit(s).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Status
            </label>
            <select
              value={bulkTargetStatus}
              onChange={(e) => setBulkTargetStatus(e.target.value)}
              className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="UNAVAILABLE">Unavailable / Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkStatusModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={bulkStatusMutation.isPending}
              isLoading={bulkStatusMutation.isPending}
              onClick={() => {
                bulkStatusMutation.mutate({
                  unitIds: selectedUnitIds.map(Number),
                  status: bulkTargetStatus,
                });
              }}
            >
              Confirm Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Unit Modal (Admin) */}
      <Modal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        title="Add Property Unit to Building"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!modalBuildingId || !unitNumber.trim()) {
              toast.error('Validation Error', 'Building and unit number are required.');
              return;
            }
            createUnitMutation.mutate({
              buildingId: Number(modalBuildingId),
              unitNumber: unitNumber.trim(),
              unitType,
              floor,
              areaSqft,
              price,
              status: 'AVAILABLE',
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Building <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={modalBuildingId}
              onChange={(e) => setModalBuildingId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">Select building...</option>
              {projects?.map((proj) =>
                proj.buildings?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {proj.name} — {b.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. 501"
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Floor Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as UnitType)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              >
                <option value="STUDIO">Studio</option>
                <option value="ONE_BHK">1 BHK</option>
                <option value="TWO_BHK">2 BHK</option>
                <option value="THREE_BHK">3 BHK</option>
                <option value="PENTHOUSE">Penthouse</option>
                <option value="VILLA">Villa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Area (Sq.ft) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={100}
                value={areaSqft}
                onChange={(e) => setAreaSqft(Number(e.target.value))}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Base Price (USD) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1000}
              step={1000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddUnitOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createUnitMutation.isPending}
            >
              Create Unit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Property Unit"
        message={`Are you sure you want to delete Unit #${deleteTarget?.unitNumber} from inventory? This cannot be undone.`}
        confirmLabel="Delete Unit"
        variant="danger"
        isLoading={deleteUnitMutation.isPending}
        onConfirm={() => deleteTarget && deleteUnitMutation.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
