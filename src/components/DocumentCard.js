import React from 'react';
import { ExternalLink, Calendar, Edit, Eye, EyeOff } from 'lucide-react';

const DocumentCard = ({ 
  document, 
  isAdmin = false, 
  onEdit = null, 
  onToggleVisibility = null 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow relative">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onToggleVisibility?.(document.id, document.visible)}
            className={`p-1 rounded transition-colors ${
              document.visible 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
            title={document.visible ? 'Hide from team' : 'Show to team'}
          >
            {document.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit?.(document)}
            className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
            title="Edit document"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document Content */}
      <div className={isAdmin ? 'pr-16' : ''}>
        <h3 className="font-semibold text-gray-900 mb-2">{document.title}</h3>
        
        <div className="flex items-center justify-between mb-3">
          <a
            href={document.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Document</span>
          </a>
          
          {isAdmin && (
            <span className={`text-xs px-2 py-1 rounded ${
              document.visible 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {document.visible ? 'Visible' : 'Hidden'}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-100 pt-2 space-y-1">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Added: {formatDate(document.createdAt)}</span>
          </div>
          
          {document.updatedAt !== document.createdAt && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>Updated: {formatDate(document.updatedAt)}</span>
            </div>
          )}
          
          <div className="text-xs text-gray-400">
            Category: {document.category}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;