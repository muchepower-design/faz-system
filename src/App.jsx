import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Public pages (existing)
import Home from './pages/Home';
import News from './pages/News';
import Matches from './pages/Matches';
import LeagueTable from './pages/LeagueTable';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Login from './pages/Login';
import About from './pages/About';
import Governance from './pages/Governance';
import Contact from './pages/Contact';

// New mega‑menu pages
import Competitions from './pages/Competitions';
import CompetitionDetail from './pages/CompetitionDetail'; // Public competition detail
import NationalTeams from './pages/NationalTeams';
import Futsal from './pages/Futsal';
import Shop from './pages/Shop';
import AboutFAZ from './pages/AboutFAZ';
import Media from './pages/Media';
import Development from './pages/Development';
import PageDetail from './pages/PageDetail';

// Role‑based dashboards
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import MatchCommissionerDashboard from './pages/MatchCommissionerDashboard';
import MediaOfficerDashboard from './pages/MediaOfficerDashboard';
import ClubRepDashboard from './pages/ClubRepDashboard';
import RefereeDashboard from './pages/RefereeDashboard';
import ViewerDashboard from './pages/ViewerDashboard';

import Leagues from './pages/Leagues';
import LeagueStandings from './pages/LeagueStandings';
import NationalTeamDetail from './pages/NationalTeamDetail';
import PromotionRelegation from './pages/PromotionRelegation';

import CupCompetitions from './pages/CupCompetitions';
import CupDetail from './pages/CupDetail';

import NewsDetail from './pages/NewsDetail';
import MediaVideos from './pages/MediaVideos';
import MediaGalleries from './pages/MediaGalleries';
import MediaAccreditation from './pages/MediaAccreditation';
import AccreditationAdmin from './pages/admin/accreditation/AccreditationAdmin';
import GalleryDetail from './pages/GalleryDetail';

import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import { CartProvider } from './context/CartContext';

// Admin competition management components (renamed to avoid conflict)
import CompetitionsDashboard from './pages/admin/competitions/CompetitionsDashboard';
import AdminCompetitionDetail from './pages/admin/competitions/CompetitionDetail'; // Renamed
import SeasonDetail from './pages/admin/competitions/SeasonDetail';
import Friendlies from './pages/admin/competitions/Friendlies';

//import NationalTeams from './pages/NationalTeams';
import Clubs from './pages/Clubs';

import ContentManager from './pages/admin/content/ContentManager';

import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import AdminEcommerce from './pages/admin/ecommerce/AdminEcommerce';
import FinanceDashboard from './pages/finance/FinanceDashboard';


import FanDashboard from './pages/FanDashboard';
import FazAdminDashboard from './pages/FazAdminDashboard';
import AuditLog from './pages/admin/AuditLog';

import VendorRedirect from './pages/vendor/VendorRedirect';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  {/* ===== Public routes ===== */}
                  <Route path="/" element={<Home />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/league-table" element={<LeagueTable />} />
                  <Route path="/teams" element={<Teams />} />
                  <Route path="/players" element={<Players />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/governance" element={<Governance />} />
                  <Route path="/contact" element={<Contact />} />

                  {/* ===== Club routes ===== */}
                  <Route path="/clubs" element={<Clubs />} />

                  {/* ===== Mega‑menu routes ===== */}
                  <Route path="/competitions" element={<Competitions />} />
                  <Route path="/competitions/:competitionId" element={<CompetitionDetail />} />

                  {/* National Teams */}
                  <Route path="/national-teams" element={<NationalTeams />} />
                  <Route path="/national-teams/men/:team" element={<PageDetail />} />
                  <Route path="/national-teams/women/:team" element={<PageDetail />} />
                  <Route path="/national-teams/competitions/:comp" element={<PageDetail />} />

                  {/* Futsal */}
                  <Route path="/futsal" element={<Futsal />} />
                  <Route path="/futsal/:slug" element={<PageDetail />} />

                  {/* Shop */}
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:category" element={<PageDetail />} />

                  {/* About FAZ */}
                  <Route path="/about/:slug" element={<PageDetail />} />
                  <Route path="/staff" element={<PageDetail />} />
                  <Route path="/committees" element={<PageDetail />} />
                  <Route path="/partners" element={<PageDetail />} />

                  {/* Governance */}
                  <Route path="/governance/:slug" element={<PageDetail />} />

                  {/* Media */}
                  <Route path="/media" element={<Media />} />
                  <Route path="/media/:slug" element={<PageDetail />} />

                  {/* Development */}
                  <Route path="/development" element={<Development />} />
                  <Route path="/development/:slug" element={<PageDetail />} />

                  {/* Documents */}
                  <Route path="/documents" element={<PageDetail />} />
                  <Route path="/documents/:slug" element={<PageDetail />} />

                  {/* ===== Protected role‑based dashboards ===== */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
  path="/admin/content"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'faz_admin']}>
      <ContentManager />
    </ProtectedRoute>
  }
/>

                  {/* Admin competition management */}
                  <Route
                    path="/admin/competitions"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <CompetitionsDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/competitions/:competitionId"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <AdminCompetitionDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/competitions/:competitionId/seasons/:seasonId"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <SeasonDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/friendlies"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <Friendlies />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/commissioner/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['match_commissioner']}>
                        <MatchCommissionerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/media/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['media_officer']}>
                        <MediaOfficerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/club/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['club_rep']}>
                        <ClubRepDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/referee/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['referee']}>
                        <RefereeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['viewer', 'customer', 'vendor']}>
                        <ViewerDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fan portal */}
<Route
  path="/fan/dashboard"
  element={
    <ProtectedRoute allowedRoles={['viewer', 'customer', 'vendor']}>
      <FanDashboard />
    </ProtectedRoute>
  }
/>

{/* FAZ Admin portal */}
<Route
  path="/faz-admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['faz_admin', 'super_admin']}>
      <FazAdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/audit-log"
  element={
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'faz_admin']}>
      <AuditLog />
    </ProtectedRoute>
  }
/>

<Route
  path="/vendor/dashboard"
  element={
    <ProtectedRoute allowedRoles={['vendor', 'admin', 'super_admin', 'faz_admin']}>
      <VendorRedirect />
    </ProtectedRoute>
  }
/>

                  {/* Leagues */}
                  <Route path="/leagues" element={<Leagues />} />
                  <Route path="/leagues/:leagueId" element={<LeagueStandings />} />

                  {/* Cups */}
                  <Route path="/cups" element={<CupCompetitions />} />
                  <Route path="/cups/:cupId" element={<CupDetail />} />

                  {/* News */}
                  <Route path="/news/:id" element={<NewsDetail />} />

                  {/* Media sub‑pages */}
                  <Route path="/media/videos" element={<MediaVideos />} />
                  <Route path="/media/galleries" element={<MediaGalleries />} />
                  <Route path="/media/galleries/:id" element={<GalleryDetail />} />
                  {/*
                  <Route path="/media/accreditation" element={<MediaAccreditation />} />
                  */}
                  <Route
  path="/media/accreditation"
  element={
    <ProtectedRoute allowedRoles={['media_officer', 'admin', 'super_admin', 'faz_admin']}>
      <AccreditationAdmin />
    </ProtectedRoute>
  }
/>
                  

                  {/* Cart & Orders */}
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/shop/confirmation/:id" element={<OrderConfirmation />} />

                  {/* Promotion/Relegation (admin only) */}
                  <Route
                    path="/admin/promotion-relegation"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <PromotionRelegation />
                      </ProtectedRoute>
                    }
                  />

                  {/* National Team Detail */}
                  <Route path="/national-teams/:teamId" element={<NationalTeamDetail />} />


                  {/* ===== E-commerce vendor portal ===== */}
<Route path="/vendor/register" element={<VendorRegister />} />
<Route
  path="/vendor/dashboard"
  element={
    <ProtectedRoute allowedRoles={['vendor', 'admin', 'super_admin', 'customer']}>
      <VendorDashboard />
    </ProtectedRoute>
  }
/>

{/* ===== E-commerce admin ===== */}
<Route
  path="/admin/ecommerce"
  element={
    <ProtectedRoute allowedRoles={['admin', 'super_admin', 'faz_admin']}>
      <AdminEcommerce />
    </ProtectedRoute>
  }
/>

<Route
  path="/finance/dashboard"
  element={
    <ProtectedRoute allowedRoles={['finance_officer', 'admin', 'super_admin', 'faz_admin']}>
      <FinanceDashboard />
    </ProtectedRoute>
  }
/>

                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;