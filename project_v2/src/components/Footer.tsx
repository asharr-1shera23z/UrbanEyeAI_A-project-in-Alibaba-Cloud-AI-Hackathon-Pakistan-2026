import { Link } from 'react-router-dom';
import { LogoFull } from './Logo';

export function Footer() {
  return (
    <footer className="relative bg-slate-100 text-slate-600 mt-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoFull size={36} />
            </div>
            <p className="text-sm max-w-md leading-relaxed text-slate-600">
              AI-powered intelligence for better cities. UrbanEye AI helps citizens report
              infrastructure problems and helps authorities respond faster.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-3">Citizen Portal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/citizen/login" className="text-slate-600 hover:text-slate-900 transition-colors">Citizen Login</Link></li>
              <li><Link to="/report" className="text-slate-600 hover:text-slate-900 transition-colors">Report an Issue</Link></li>
              <li><Link to="/track" className="text-slate-600 hover:text-slate-900 transition-colors">Track a Report</Link></li>
              <li><Link to="/map" className="text-slate-600 hover:text-slate-900 transition-colors">Issue Map</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-3">Operations</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin/login" className="text-slate-600 hover:text-slate-900 transition-colors">Admin Login</Link></li>
              <li><Link to="/admin/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link></li>
              <li><Link to="/admin/analytics" className="text-slate-600 hover:text-slate-900 transition-colors">Analytics</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 UrbanEye AI. All rights reserved.</p>
          <p className="text-xs text-slate-500">See the problem. Understand it. Fix it.</p>
        </div>
      </div>
    </footer>
  );
}
