// frontend/src/api.js
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a separate axios instance for auth (no /api prefix)
export const authAxios = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- News API ----------
export const newsAPI = {
  getAll: (params) => api.get('/news/', { params }),
  getFeatured: () => api.get('/news/featured'),
  getById: (id) => api.get(`/news/${id}`),
  search: (query) => api.get('/news/search', { params: { q: query } }),
  filterByDate: (month, year) => api.get('/news/filter', { params: { month, year } }),
  getYears: () => api.get('/news/years'),
  create: (data) => api.post('/admin/news', data),
  update: (id, data) => api.put(`/admin/news/${id}`, data),
  delete: (id) => api.delete(`/admin/news/${id}`),
};

// ---------- Media API ----------
export const mediaAPI = {
  getVideos: (params) => api.get('/media/videos', { params }),
  getVideo: (id) => api.get(`/media/videos/${id}`),
  searchVideos: (query) => api.get('/media/videos/search', { params: { q: query } }),
  createVideo: (data) => api.post('/media/videos', data),
  deleteVideo: (id) => api.delete(`/media/videos/${id}`),
  getGalleries: (params) => api.get('/media/galleries', { params }),
  getGallery: (id) => api.get(`/media/galleries/${id}`),
  searchGalleries: (query) => api.get('/media/galleries/search', { params: { q: query } }),
  createGallery: (data) => api.post('/media/galleries', data),
  addGalleryImage: (galleryId, data) => api.post(`/media/galleries/${galleryId}/images`, data),
  deleteGallery: (id) => api.delete(`/media/galleries/${id}`),
  deleteGalleryImage: (galleryId, imageId) => api.delete(`/media/galleries/${galleryId}/images/${imageId}`),
};

// ---------- Matches API ----------
export const matchesAPI = {
  getAll: (params) => api.get('/matches/', { params }),
  getLatest: () => api.get('/matches/latest'),
  getUpcoming: () => api.get('/matches/upcoming'),
  getById: (id) => api.get(`/matches/${id}`),
  // FIXED: send data in JSON body, not as query params
  updateScore: (id, homeScore, awayScore, status) =>
    api.patch(`/matches/${id}/score`, { home_score: homeScore, away_score: awayScore, status }),
  updateStatus: (id, status) =>
    api.patch(`/matches/${id}/score`, { status }),
  create: (data) => api.post('/admin/matches', data),
  update: (id, data) => api.put(`/admin/matches/${id}`, data),
  delete: (id) => api.delete(`/admin/matches/${id}`),
  getByReferee: (refereeId) => api.get(`/matches/referee/${refereeId}`),
};

// ---------- Teams API ----------
export const teamsAPI = {
  getAll: () => api.get('/teams/'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/admin/teams', data),
  update: (id, data) => api.put(`/admin/teams/${id}`, data),
  delete: (id) => api.delete(`/admin/teams/${id}`),
};

// ---------- Players API ----------
export const playersAPI = {
  getAll: (params) => api.get('/players/', { params }),
  getTopScorers: () => api.get('/players/top-scorers'),
  create: (data) => api.post('/admin/players', data),
  update: (id, data) => api.put(`/admin/players/${id}`, data),
  delete: (id) => api.delete(`/admin/players/${id}`),
};

// ---------- League Table API ----------
export const tableAPI = {
  getTable: (season) => api.get('/league-table/', { params: { season } }),
  getSeasons: () => api.get('/league-table/seasons'),
};

// ---------- Authentication API ----------
export const authAPI = {
  login: async (email, password) => {
    return authAxios.post('/api/ticketing/auth/login', { email, password });
  },
  register: (userData) => authAxios.post('/api/ticketing/auth/register', userData),
  // NEW — Google sign-in. Frontend sends the id_token from GIS.
  googleLogin: (idToken) => authAxios.post('/api/auth/google', { id_token: idToken }),
};

// ---------- Match Events API ----------
export const matchEventsAPI = {
  create: (data) => api.post('/match-events/', data),
  getByMatch: (matchId) => api.get(`/match-events/match/${matchId}`),
  delete: (id) => api.delete(`/match-events/${id}`),
};

// ---------- User Management API ----------
export const usersAPI = {
  getAll: () => api.get('/admin/users'),
  create: (data) => api.post('/admin/users', data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  getMe: () => api.get('/users/me'),
};

// ---------- Bulk Import API ----------
export const bulkImportAPI = {
  importTeams: (formData) =>
    api.post('/bulk-import/teams', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importPlayers: (formData) =>
    api.post('/bulk-import/players', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  importMatches: (formData) =>
    api.post('/bulk-import/matches', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ---------- Reports API ----------
export const reportsAPI = {
  create: (data) => api.post('/reports/match-reports', data),
  update: (id, data) => api.put(`/reports/match-reports/${id}`, data),
  getByMatch: (matchId) => api.get(`/reports/match-reports/match/${matchId}`),
};

// ---------- Leagues API ----------
export const leaguesAPI = {
  getAll: (params) => api.get('/leagues/', { params }),
  getById: (id) => api.get(`/leagues/${id}`),
  getStandings: (leagueId, season) => api.get(`/leagues/${leagueId}/standings`, { params: { season } }),
  // FIXED: send season in JSON body, not query param
  applyPromotionRelegation: (season) => api.post('/leagues/promotion-relegation/apply', { season }),
};

// ---------- National Teams API ----------
export const nationalTeamsAPI = {
  getAll: (params) => api.get('/national-teams/', { params }),
  getById: (id) => api.get(`/national-teams/${id}`),
  getFixtures: (teamId) => api.get(`/national-teams/${teamId}/fixtures`),
  getTournaments: (teamId) => api.get(`/national-teams/${teamId}/tournaments`),
  getAllTournaments: (params) => api.get('/national-teams/tournaments', { params }),
  createFixture: (teamId, data) => api.post(`/national-teams/${teamId}/fixtures`, data),
  updateResult: (fixtureId, data) => api.patch(`/national-teams/fixtures/${fixtureId}`, data),
};

// ---------- Cups API ----------
export const cupsAPI = {
  getAll: (params) => api.get('/cups/', { params }),
  getById: (id) => api.get(`/cups/${id}`),
  getSeasons: (cupId) => api.get(`/cups/${cupId}/seasons`),
  getMatches: (seasonId) => api.get(`/cups/seasons/${seasonId}/matches`),
  addMatch: (seasonId, data) => api.post(`/cups/seasons/${seasonId}/matches`, data),
  updateMatchResult: (matchId, data) => api.patch(`/cups/matches/${matchId}`, data),
  getContinentalQualifications: (season) => api.get('/cups/continental-qualifications', { params: { season } }),
  // FIXED: send season in JSON body, not query param
  applyContinentalQualifications: (season) => api.post('/cups/continental-qualifications/apply', { season }),
};

// ---------- Competitions API (public) ----------
export const competitionsAPI = {
  getAll: (params) => api.get('/competitions/', { params }),
  getById: (id, params) => api.get(`/competitions/${id}`, { params }),
  getSeasons: () => api.get('/competitions/seasons'),
  getStandings: (competitionId, season) => api.get(`/competitions/${competitionId}/standings`, { params: { season } }),
};

// ---------- Competition Management API (admin) ----------
export const competitionManagementAPI = {
  getCompetitions: (params) => api.get('/competitions-management/competitions', { params }),
  getCompetition: (id) => api.get(`/competitions-management/competitions/${id}`),
  createCompetition: (data) => api.post('/competitions-management/competitions', data),
  updateCompetition: (id, data) => api.put(`/competitions-management/competitions/${id}`, data),
  deleteCompetition: (id) => api.delete(`/competitions-management/competitions/${id}`),
  getSeasons: (competitionId) => api.get(`/competitions-management/competitions/${competitionId}/seasons`),
  createSeason: (competitionId, data) => api.post(`/competitions-management/competitions/${competitionId}/seasons`, data),
  updateSeason: (seasonId, data) => api.put(`/competitions-management/seasons/${seasonId}`, data),
  deleteSeason: (seasonId) => api.delete(`/competitions-management/seasons/${seasonId}`),
  getStages: (seasonId) => api.get(`/competitions-management/seasons/${seasonId}/stages`),
  createStage: (seasonId, data) => api.post(`/competitions-management/seasons/${seasonId}/stages`, data),
  updateStage: (stageId, data) => api.put(`/competitions-management/stages/${stageId}`, data),
  deleteStage: (stageId) => api.delete(`/competitions-management/stages/${stageId}`),
  getGroups: (stageId) => api.get(`/competitions-management/stages/${stageId}/groups`),
  createGroup: (stageId, data) => api.post(`/competitions-management/stages/${stageId}/groups`, data),
  updateGroup: (groupId, data) => api.put(`/competitions-management/groups/${groupId}`, data),
  deleteGroup: (groupId) => api.delete(`/competitions-management/groups/${groupId}`),
  getMatches: (seasonId) => api.get(`/competitions-management/seasons/${seasonId}/matches`),
  createMatch: (stageId, data) => api.post(`/competitions-management/stages/${stageId}/matches`, data),
  updateMatch: (matchId, data) => api.put(`/competitions-management/matches/${matchId}`, data),
  deleteMatch: (matchId) => api.delete(`/competitions-management/matches/${matchId}`),
  getGroupStandings: (groupId) => api.get(`/competitions-management/groups/${groupId}/standings`),
  getSeasonStandings: (seasonId) => api.get(`/competitions-management/seasons/${seasonId}/standings`),
  createQualificationRule: (data) => api.post('/competitions-management/qualification-rules', data),
  updateQualificationRule: (ruleId, data) => api.put(`/competitions-management/qualification-rules/${ruleId}`, data),
  deleteQualificationRule: (ruleId) => api.delete(`/competitions-management/qualification-rules/${ruleId}`),
  getQualificationRules: (stageId) => api.get(`/competitions-management/stages/${stageId}/qualification-rules`),
  createFriendly: (data) => api.post('/competitions-management/friendlies', data),
};

// ---------- Shop API ----------
export const shopAPI = {
  getCategories: () => api.get('/shop/categories'),
  getProducts: (params) => api.get('/shop/products', { params }),
  getProduct: (id) => api.get(`/shop/products/${id}`),
  getCart: () => api.get('/shop/cart'),
  addToCart: (data) => api.post('/shop/cart/add', data),
  updateCartItem: (itemId, quantity) => api.put(`/shop/cart/update/${itemId}`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/shop/cart/remove/${itemId}`),
  getOrder: (id) => api.get(`/shop/orders/${id}`),
  checkout: (data) => api.post('/shop/checkout', data),
  initiatePayment: (data) => api.post('/shop/payment/initiate', data),
  checkPaymentStatus: (depositId) => api.get(`/shop/payment/status/${depositId}`),
  getPaymentProviders: () => api.get('/shop/payment/providers'),
};

// ---------- Public National Teams API ----------
export const nationalTeamsPublicAPI = {
  getAll: (params) => api.get('/national-teams/', { params }),
  getById: (id) => api.get(`/national-teams/${id}`),
};

// ---------- Public Clubs API ----------
export const clubsAPI = {
  getAll: (params) => api.get('/clubs/', { params }),
  getById: (id) => api.get(`/clubs/${id}`),
};


// ---------- Public Content API ----------
export const contentAPI = {
  getHeroSlides: () => api.get('/content/hero-slides'),
  getPartners: () => api.get('/content/partners'),
  getGovernanceMembers: (params) => api.get('/content/governance-members', { params }),
  getPageByPath: (path) => api.get('/content/pages/by-path', { params: { path } }),
};

// ---------- Admin Content API ----------
export const adminContentAPI = {
  // Hero
  listHero: () => api.get('/content/admin/hero-slides'),
  createHero: (data) => api.post('/content/admin/hero-slides', data),
  updateHero: (id, data) => api.put(`/content/admin/hero-slides/${id}`, data),
  deleteHero: (id) => api.delete(`/content/admin/hero-slides/${id}`),

  // Partners
  listPartners: () => api.get('/content/admin/partners'),
  createPartner: (data) => api.post('/content/admin/partners', data),
  updatePartner: (id, data) => api.put(`/content/admin/partners/${id}`, data),
  deletePartner: (id) => api.delete(`/content/admin/partners/${id}`),

  // Governance
  listMembers: () => api.get('/content/admin/governance-members'),
  createMember: (data) => api.post('/content/admin/governance-members', data),
  updateMember: (id, data) => api.put(`/content/admin/governance-members/${id}`, data),
  deleteMember: (id) => api.delete(`/content/admin/governance-members/${id}`),

  // Pages
  listPages: () => api.get('/content/admin/pages'),
  createPage: (data) => api.post('/content/admin/pages', data),
  updatePage: (id, data) => api.put(`/content/admin/pages/${id}`, data),
  deletePage: (id) => api.delete(`/content/admin/pages/${id}`),

  // Navigation tree
  listNavTree: () => api.get('/content/admin/nav-items'),
  createNavItem: (data) => api.post('/content/admin/nav-items', data),
  updateNavItem: (id, data) => api.put(`/content/admin/nav-items/${id}`, data),
  deleteNavItem: (id) => api.delete(`/content/admin/nav-items/${id}`),
  seedNavDefaults: () => api.post('/content/admin/seed-nav-defaults'),

  // Footer sections + links
  listFooterSections: () => api.get('/content/admin/footer-sections'),
  createFooterSection: (data) => api.post('/content/admin/footer-sections', data),
  updateFooterSection: (id, data) => api.put(`/content/admin/footer-sections/${id}`, data),
  deleteFooterSection: (id) => api.delete(`/content/admin/footer-sections/${id}`),

  createFooterLink: (data) => api.post('/content/admin/footer-links', data),
  updateFooterLink: (id, data) => api.put(`/content/admin/footer-links/${id}`, data),
  deleteFooterLink: (id) => api.delete(`/content/admin/footer-links/${id}`),
  seedFooterDefaults: () => api.post('/content/admin/seed-footer-defaults'),
};

export const publicContentAPI = {
  getNavTree: () => api.get('/content/nav-tree'),
  getFooter: () => api.get('/content/footer'),
  // you likely already have getHeroSlides / getPartners / getGovernanceMembers / getPageByPath here
};

// ---------- E-commerce: Vendor API ----------
export const vendorAPI = {
  register: (data) => api.post('/ecommerce/vendor/register', data),
  getMe: () => api.get('/ecommerce/vendor/me'),
  updateProfile: (data) => api.put('/ecommerce/vendor/me', data),
  getStats: () => api.get('/ecommerce/vendor/stats'),

  // Adverts
  listAdverts: () => api.get('/ecommerce/vendor/adverts'),
  getAdvert: (id) => api.get(`/ecommerce/vendor/adverts/${id}`),
  createAdvert: (data) => api.post('/ecommerce/vendor/adverts', data),
  updateAdvert: (id, data) => api.put(`/ecommerce/vendor/adverts/${id}`, data),
  deleteAdvert: (id) => api.delete(`/ecommerce/vendor/adverts/${id}`),

  // Media
  addMedia: (advertId, data) => api.post(`/ecommerce/vendor/adverts/${advertId}/media`, data),
  deleteMedia: (advertId, mediaId) => api.delete(`/ecommerce/vendor/adverts/${advertId}/media/${mediaId}`),
  uploadVideo: (formData) => api.post('/ecommerce/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Advert lifecycle
  submitAdvert: (id) => api.post(`/ecommerce/vendor/adverts/${id}/submit`),
  pauseAdvert: (id) => api.post(`/ecommerce/vendor/adverts/${id}/pause`),
  requestMatchAttachment: (id, matchId) =>
    api.post(`/ecommerce/vendor/adverts/${id}/attach-match`, { match_id: matchId }),
  payListingFee: (id) => api.post(`/ecommerce/vendor/adverts/${id}/pay-listing-fee`),
  getFeeStatus: (id) => api.get(`/ecommerce/vendor/adverts/${id}/fee-status`),

  // Orders
  listOrders: (status) => api.get('/ecommerce/vendor/orders', { params: status ? { status } : {} }),
  getOrder: (id) => api.get(`/ecommerce/vendor/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/ecommerce/vendor/orders/${id}/status`, data),

  // Shared pickers
  getMatchesForAttachment: () => api.get('/ecommerce/matches-for-attachment'),
};

// ---------- E-commerce: Admin API ----------
export const ecommerceAdminAPI = {
  // Vendors
  listVendors: (status) => api.get('/ecommerce/admin/vendors', { params: status ? { status } : {} }),
  getVendor: (id) => api.get(`/ecommerce/admin/vendors/${id}`),
  approveVendor: (id) => api.post(`/ecommerce/admin/vendors/${id}/approve`),
  rejectVendor: (id, reason) => api.post(`/ecommerce/admin/vendors/${id}/reject`, { reason }),
  suspendVendor: (id) => api.post(`/ecommerce/admin/vendors/${id}/suspend`),
  unsuspendVendor: (id) => api.post(`/ecommerce/admin/vendors/${id}/unsuspend`),

  // Adverts
  listAdverts: (status) => api.get('/ecommerce/admin/adverts', { params: status ? { status } : {} }),
  getAdvert: (id) => api.get(`/ecommerce/admin/adverts/${id}`),
  approveAdvert: (id) => api.post(`/ecommerce/admin/adverts/${id}/approve`),
  rejectAdvert: (id, reason) => api.post(`/ecommerce/admin/adverts/${id}/reject`, { reason }),
  pauseAdvert: (id) => api.post(`/ecommerce/admin/adverts/${id}/pause`),
  attachAdvertToMatch: (id, matchId) =>
    api.post(`/ecommerce/admin/adverts/${id}/attach-match`, { match_id: matchId }),
  removeAttachment: (advertId, attachId) =>
    api.delete(`/ecommerce/admin/adverts/${advertId}/attachments/${attachId}`),

  // Categories
  listCategories: () => api.get('/ecommerce/admin/categories'),
  createCategory: (data) => api.post('/ecommerce/admin/categories', data),
  updateCategory: (id, data) => api.put(`/ecommerce/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/ecommerce/admin/categories/${id}`),

  // Orders
  listOrders: (status) => api.get('/ecommerce/admin/orders', { params: status ? { status } : {} }),

  // Settings
  getSettings: () => api.get('/ecommerce/admin/settings'),
  updateSettings: (data) => api.put('/ecommerce/admin/settings', data),

  // Seed
  seedDefaults: () => api.post('/ecommerce/admin/seed-defaults'),
};

// ---------- E-commerce: Public API ----------
export const ecommercePublicAPI = {
  listAdverts: (params) => api.get('/ecommerce/adverts', { params }),
  getAdvert: (id) => api.get(`/ecommerce/adverts/${id}`),
  getMatchAdverts: (matchId) => api.get(`/ecommerce/matches/${matchId}/adverts`),
  listCategories: () => api.get('/ecommerce/categories'),
  listVendors: (params) => api.get('/ecommerce/vendors', { params }),
  getVendor: (id) => api.get(`/ecommerce/vendors/${id}`),
  getPublicSettings: () => api.get('/ecommerce/settings/public'),

  checkout: (data) => api.post('/ecommerce/checkout', data),
  getOrder: (orderNumber) => api.get(`/ecommerce/orders/${orderNumber}`),
  listMyOrders: () => api.get('/ecommerce/orders'),
  confirmReceipt: (orderNumber) => api.put(`/ecommerce/orders/${orderNumber}/confirm-receipt`),

  getPaymentProviders: () => api.get('/ecommerce/payment/providers'),
  initiatePayment: (data) => api.post('/ecommerce/payment/initiate', data),
  checkPaymentStatus: (depositId) => api.get(`/ecommerce/payment/deposit/${depositId}/check`),
};


export const adminAPI = {
  listRoles: () => api.get('/admin/roles'),
  listUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUserRoles: (id, data) => api.put(`/admin/users/${id}/roles`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createRole: (data) => api.post('/admin/roles', data),
  updateRole: (id, data) => api.put(`/admin/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
};

export const mediaDashboardAPI = {
  getStats: () => api.get('/media/dashboard/stats'),
  getPublishingTrend: (days = 30) =>
    api.get('/media/dashboard/publishing-trend', { params: { days } }),
};

export default api;