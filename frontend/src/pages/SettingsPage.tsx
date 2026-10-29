import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import {
  User,
  Shield,
  Server,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code,
  Layers,
  Activity,
  Terminal,
  Key,
  Globe,
  Zap,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge, Badge } from '../components/common/Badge';
import { PageHeader } from '../components/common/PageHeader';
import { UserAvatar } from '../components/common/UserAvatar';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'system';
  const [copied, setCopied] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Live backend health check via summary query
  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  const handleCopyEnv = () => {
    const envText = `# EstateFlow CRM Production Environment Configuration
DB_HOST=your-mysql-host.rds.amazonaws.com
DB_PORT=3306
DB_NAME=estatecrm_db
DB_USERNAME=estatecrm_admin
DB_PASSWORD=your_strong_db_password
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=https://estatecrm.vercel.app,http://localhost:5173
PORT=8080`;
    navigator.clipboard.writeText(envText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEndpoint = (path: string) => {
    navigator.clipboard.writeText(`http://localhost:8080${path}`);
    setCopiedEndpoint(path);
    setTimeout(() => setCopiedEndpoint(null), 1500);
  };

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/dashboard/summary', desc: 'Aggregated KPI metrics (leads, stages, revenue, inventory)', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/dashboard/analytics', desc: 'Funnel stages, source share, monthly bookings & team performance', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/leads', desc: 'Query lead records with multi-criteria filters, search, and pagination', auth: 'Bearer' },
    { method: 'POST', path: '/api/v1/leads', desc: 'Ingest prospective buyer lead inquiry', auth: 'Bearer' },
    { method: 'PUT', path: '/api/v1/leads/{id}/stage', desc: 'Advance or regress lead lifecycle stage', auth: 'Bearer' },
    { method: 'POST', path: '/api/v1/bookings', desc: 'Reserve property unit under pessimistic concurrency lock (HTTP 409 safe)', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/bookings', desc: 'Retrieve reservation agreements and transaction audit records', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/units', desc: 'Inventory catalog filtered by project, tower, type, and status', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/projects', desc: 'Master developments and architectural tower hierarchies', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/follow-ups', desc: 'Scheduled client appointments and overdue consultation tasks', auth: 'Bearer' },
    { method: 'GET', path: '/api/v1/employees', desc: 'Corporate staff roster and role permissions (Admin only)', auth: 'Admin' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Settings & System Administration"
        description="Inspect backend architecture, review REST API endpoints, monitor pessimistic concurrency safeguards, and manage credentials."
        breadcrumbs={[{ label: 'Settings' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Check Health
          </Button>
        }
      />

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setSearchParams({ tab: 'system' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'system'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>System Health & Config</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'api' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'api'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>API & Integrations</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Identity & Profile</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'concurrency' })}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'concurrency'
              ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/60'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Concurrency Architecture</span>
        </button>
      </div>

      {/* Tab 1: System Health & Environment */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">REST Backend</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Spring Boot</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Port 8080 Active
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Relational DB</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">MySQL 8.0 RDS</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Flyway V3 Applied
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Locking Strategy</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Pessimistic Write</span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> SELECT FOR UPDATE
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Active Dataset</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {summary ? `${summary.totalLeads} Leads / ${summary.totalAvailableUnits} Avail. Units` : 'Enriched Seed'}
                </span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold block flex items-center gap-1 mt-0.5">
                  <Activity className="w-3 h-3" /> Real-time Metrics
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Microservice Specifications */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Microservice Architecture & Runtime Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Lock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Transactional Pessimistic Locking</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Enforces exclusive row-level write locks (<code>SELECT ... FOR UPDATE</code>) inside an atomic <code>@Transactional(isolation = Isolation.READ_COMMITTED)</code> boundary. Simultaneous booking attempts throw <code>HTTP 409 Conflict</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Flyway Migration Versioning</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Database schema versioning managed via Flyway. <code>V1__init_schema.sql</code>, <code>V2__seed_demo_data.sql</code>, and <code>V3__expanded_business_data.sql</code> establish indexes and foreign key constraints.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Stateless JWT Authentication</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  HMAC-SHA256 authenticated bearer tokens validated on every request by Spring Security's <code>JwtAuthenticationFilter</code>. RBAC restrictions protect administrative APIs.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>OpenAPI v3 Documentation</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Interactive OpenAPI documentation and Swagger UI auto-generated under <code>/swagger-ui.html</code> and <code>/api/v1/api-docs</code> for automated client SDK compilation.
                </p>
              </div>
            </div>
          </div>

          {/* Production Environment Variables Template */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Production Deployment Configuration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Environment variables template for Docker, AWS ECS, or cloud VM hosting</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyEnv}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy .env Template'}
              </Button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-200 text-xs rounded-xl font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`# EstateFlow CRM Production Environment Configuration
DB_HOST=your-mysql-host.rds.amazonaws.com
DB_PORT=3306
DB_NAME=estatecrm_db
DB_USERNAME=estatecrm_admin
DB_PASSWORD=your_strong_db_password
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=https://estatecrm.vercel.app,http://localhost:5173
PORT=8080`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: API & Integrations */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">REST API & Developer Swagger UI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Access interactive Swagger documentation to test live API operations directly against the Spring Boot daemon.
              </p>
            </div>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Launch Swagger UI
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Core REST Endpoints Catalog</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">All requests require <code>Authorization: Bearer &lt;token&gt;</code></p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {apiEndpoints.map((ep, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        ep.method === 'GET'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          : ep.method === 'POST'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div>
                      <code className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">{ep.path}</code>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ep.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{ep.auth}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyEndpoint(ep.path)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Copy Endpoint URL"
                    >
                      {copiedEndpoint === ep.path ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Identity & Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Authenticated Identity & Session
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <UserAvatar name={user?.name || 'User'} size="lg" showStatus isOnline />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{user?.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>
              <StatusBadge status={user?.role || 'SALES_EMPLOYEE'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">User ID</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{user?.id}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{user?.phone || 'Not configured'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Account State</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active & Authorized
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Token Security</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">HMAC-SHA256 JWT (Bearer Auth)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Concurrency Architecture */}
      {activeTab === 'concurrency' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pessimistic Concurrency Locking Specification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                EstateFlow solves high-demand unit booking conflicts using database-level row locks, guaranteeing no double-bookings occur even when multiple agents submit reservations within the same millisecond.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Booking Intent</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Sales agent confirms step 4 of the Reservation Wizard. Client dispatches <code>POST /api/v1/bookings</code> with <code>unitId</code> and earnest deposit.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Exclusive Lock</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Spring executes <code>PropertyUnitRepository.findByIdForUpdate()</code> with <code>@Lock(LockModeType.PESSIMISTIC_WRITE)</code> triggering MySQL <code>SELECT ... FOR UPDATE</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Conflict Guard</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  If unit is already <code>BOOKED</code> or <code>SOLD</code>, backend immediately rolls back and throws <code>ConflictException</code> with <code>HTTP 409 Conflict</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  4
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Atomic Commit</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Unit status updates to <code>BOOKED</code>, booking contract record inserts, and the transaction commits atomically, releasing the row lock.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
