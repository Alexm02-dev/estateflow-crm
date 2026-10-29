import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Plus,
  Home,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [floors, setFloors] = useState<number>(10);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProjectById(projectId),
    enabled: !isNaN(projectId),
  });

  const addBuildingMutation = useMutation({
    mutationFn: (data: { name: string; floors: number }) =>
      projectsApi.addBuilding(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsAddBuildingOpen(false);
      setBuildingName('');
      setFloors(10);
    },
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Project not found</h3>
        <Link to="/projects">
          <Button variant="secondary" size="sm" className="mt-3">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <Breadcrumbs
        items={[
          { label: 'Projects', path: '/projects' },
          { label: project.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{project.code} • {project.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddBuildingOpen(true)}
            >
              Add Building/Tower
            </Button>
          )}

          <Link to={`/units?projectId=${project.id}`}>
            <Button variant="primary" size="sm" icon={<Home className="w-4 h-4" />}>
              View Inventory Units
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="purple">{project.propertyType}</Badge>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{project.address}, {project.city}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          {project.description || 'Comprehensive property specifications and residential floor layouts.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Towers / Blocks</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">{project.buildings?.length || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Total Unit Capacity</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">{project.totalUnits} Units</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Units Available</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{project.availableUnits ?? 0} Available</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Occupancy / Booked</span>
            <span className="text-base font-bold text-purple-700 dark:text-purple-300 mt-0.5 block">
              {project.totalUnits ? Math.round(((project.totalUnits - (project.availableUnits ?? 0)) / project.totalUnits) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Buildings & Towers Sub-list */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Towers & Building Inventory</h2>
          {isAdmin && (
            <button
              onClick={() => setIsAddBuildingOpen(true)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              + Add Tower
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {project.buildings && project.buildings.length > 0 ? (
            project.buildings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{b.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.floors} Floors total</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      {b.availableUnits} Available
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      {b.totalUnits} Units Total
                    </span>
                  </div>

                  <Link to={`/units?buildingId=${b.id}`}>
                    <Button variant="outline" size="sm">
                      View Units
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">No buildings created yet for this project.</p>
          )}
        </div>
      </div>

      {/* Add Building Modal */}
      <Modal
        isOpen={isAddBuildingOpen}
        onClose={() => setIsAddBuildingOpen(false)}
        title="Add Building / Tower"
        description={`Add a new tower to ${project.name}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (buildingName.trim() && floors > 0) {
              addBuildingMutation.mutate({ name: buildingName.trim(), floors });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Building / Tower Name *</label>
            <input
              type="text"
              required
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. Tower C (South Wing)"
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of Floors *</label>
            <input
              type="number"
              min="1"
              max="150"
              required
              value={floors}
              onChange={(e) => setFloors(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddBuildingOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={addBuildingMutation.isPending}>
              Save Building
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
