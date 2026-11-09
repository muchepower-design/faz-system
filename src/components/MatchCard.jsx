// frontend/src/components/MatchCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaMapMarker, FaTrophy, FaTicketAlt } from 'react-icons/fa';
import {
  canBuyTickets,
  formatMatchDate,
  getScoreText,
  getStatusColor,
  getTeamName,
  getTicketUrl,
  resolveStatus,
} from '../utils/matchUtils';

const MatchCard = ({ match, index = 0 }) => {
  const status = resolveStatus(match);
  const ticketUrl = getTicketUrl(match);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.08 }}
      className="glass p-6 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-sm">
          <FaTrophy className="text-faz-orange" />
          <span>{match.competition}</span>
        </div>
        <div className={`text-sm font-semibold ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="flex-1 text-right">
          <h3 className="text-xl font-bold">{getTeamName(match, 'home')}</h3>
        </div>
        <div className="text-3xl font-bold gradient-text whitespace-nowrap">
          {getScoreText(match)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{getTeamName(match, 'away')}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-300 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <FaCalendar className="text-faz-green" />
          <span>{formatMatchDate(match.match_date, 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaMapMarker className="text-faz-orange" />
          <span>{match.venue || 'Venue TBC'}</span>
        </div>
      </div>

      {canBuyTickets(match) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-gradient-to-r from-faz-green to-faz-orange text-white font-semibold
                       hover:opacity-90 transition"
          >
            <FaTicketAlt />
            Buy Match Tickets
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default MatchCard;