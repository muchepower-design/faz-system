import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const TableRow = ({ entry, position, previousPosition }) => {
  const getPositionChange = () => {
    if (!previousPosition) return null;
    if (position < previousPosition) return <FaArrowUp className="text-faz-green" />;
    if (position > previousPosition) return <FaArrowDown className="text-faz-red" />;
    return null;
  };

  const getPositionIcon = () => {
    if (position === 1) return <FaTrophy className="text-yellow-500" />;
    if (position === 2) return <FaTrophy className="text-gray-400" />;
    if (position === 3) return <FaTrophy className="text-amber-600" />;
    return null;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.03 }}
      className="border-b border-white/10 hover:bg-white/5 transition-colors group"
    >
      <td className="py-4 px-4 font-bold">
        <div className="flex items-center gap-2">
          {getPositionIcon()}
          <span>{position}</span>
          <span className="text-xs ml-1">{getPositionChange()}</span>
        </div>
      </td>
      <td className="py-4 px-4 font-semibold group-hover:text-faz-orange transition-colors">
        {entry.team?.name || entry.team_name}
      </td>
      <td className="py-4 px-4 text-center">{entry.played}</td>
      <td className="py-4 px-4 text-center text-faz-green">{entry.won}</td>
      <td className="py-4 px-4 text-center text-gray-400">{entry.drawn}</td>
      <td className="py-4 px-4 text-center text-faz-red">{entry.lost}</td>
      <td className="py-4 px-4 text-center">{entry.goals_for}</td>
      <td className="py-4 px-4 text-center">{entry.goals_against}</td>
      <td className="py-4 px-4 text-center font-semibold">
        {entry.goals_for - entry.goals_against}
      </td>
      <td className="py-4 px-4 text-center font-bold text-faz-orange text-xl">
        {entry.points}
      </td>
    </motion.tr>
  );
};

export default TableRow;