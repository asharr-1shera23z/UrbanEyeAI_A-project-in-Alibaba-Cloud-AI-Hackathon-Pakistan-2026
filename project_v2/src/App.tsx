import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IntroAnimation } from '@/components/IntroAnimation';
import { AIBackground } from '@/components/AIBackground';
import { CustomCursor } from '@/components/CustomCursor';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { RequireCitizenAuth, RequireAdminAuth } from '@/components/RequireAuth';
import { CitizenLayout } from '@/layouts/CitizenLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/citizen/HomePage';
import { CitizenLoginPage } from '@/pages/citizen/CitizenLoginPage';
import { CitizenSignupPage } from '@/pages/citizen/CitizenSignupPage';
import { ReportIssuePage } from '@/pages/citizen/ReportIssuePage';
import { TrackReportPage } from '@/pages/citizen/TrackReportPage';
import { IssueMapPage } from '@/pages/citizen/IssueMapPage';
import { SubmittedPage } from '@/pages/citizen/SubmittedPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { GovAccessRequestPage } from '@/pages/admin/GovAccessRequestPage';
import { GovPendingApprovalPage } from '@/pages/admin/GovPendingApprovalPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminComplaintsPage } from '@/pages/admin/AdminComplaintsPage';
import { AdminComplaintDetailsPage } from '@/pages/admin/AdminComplaintDetailsPage';
import { AdminMapPage } from '@/pages/admin/AdminMapPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';

function App() {
  const [introDone, setIntroDone] = useState(() => {
    return sessionStorage.getItem('urbaneye-intro-seen') === 'true';
  });

  return (
    <AuthProvider>
      <LanguageProvider>
      <ToastProvider>
        <AIBackground />
        <CustomCursor />
        {!introDone && (
          <IntroAnimation
            onComplete={() => {
              sessionStorage.setItem('urbaneye-intro-seen', 'true');
              setIntroDone(true);
            }}
          />
        )}
        <BrowserRouter>
          <Routes>
            {/* Citizen Portal */}
            <Route path="/citizen/login" element={<CitizenLoginPage />} />
            <Route path="/citizen/signup" element={<CitizenSignupPage />} />
            <Route element={<CitizenLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/report"
                element={
                  <RequireCitizenAuth>
                    <ReportIssuePage />
                  </RequireCitizenAuth>
                }
              />
              <Route
                path="/track"
                element={
                  <RequireCitizenAuth>
                    <TrackReportPage />
                  </RequireCitizenAuth>
                }
              />
              <Route
                path="/track/:ticketId"
                element={
                  <RequireCitizenAuth>
                    <TrackReportPage />
                  </RequireCitizenAuth>
                }
              />
              <Route
                path="/map"
                element={
                  <RequireCitizenAuth>
                    <IssueMapPage />
                  </RequireCitizenAuth>
                }
              />
              <Route
                path="/submitted/:ticketId"
                element={
                  <RequireCitizenAuth>
                    <SubmittedPage />
                  </RequireCitizenAuth>
                }
              />
            </Route>

            {/* Government Officer / Admin Portal */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/request-access" element={<GovAccessRequestPage />} />
            <Route path="/admin/pending-approval" element={<GovPendingApprovalPage />} />
            <Route
              element={
                <RequireAdminAuth>
                  <AdminLayout />
                </RequireAdminAuth>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
              <Route path="/admin/complaints/:ticketId" element={<AdminComplaintDetailsPage />} />
              <Route path="/admin/map" element={<AdminMapPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
