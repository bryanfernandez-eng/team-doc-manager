import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { LogOut, ExternalLink, FileText, Calendar, Users, Briefcase } from 'lucide-react';

const TeamView = ({ onLogout }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Daily Standups',
    'Other',
    'Backlog Grooming Meeting',
    'Sprint Planning Meeting',
    'Sprint Review Planning Meeting'
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Daily Standups':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'Backlog Grooming Meeting':
      case 'Sprint Planning Meeting':
      case 'Sprint Review Planning Meeting':
        return <Users className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'documents'),
      where('visible', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDocuments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = documents.filter(doc => doc.category === category);
    return acc;
  }, {});

  const totalDocuments = documents.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FIU Capstone Team</h1>
                <p className="text-gray-600">Document Hub - {totalDocuments} documents available</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2 transition duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {categories.map(category => (
            <div key={category} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center space-x-3">
                {getCategoryIcon(category)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{category}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {groupedDocuments[category]?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Documents by Category */}
        {categories.map(category => {
          const categoryDocs = groupedDocuments[category];
          
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                {getCategoryIcon(category)}
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {categoryDocs?.length || 0}
                </span>
              </div>
              
              {categoryDocs?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryDocs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex-1">{doc.title}</h3>
                        {getCategoryIcon(category)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <a
                          href={doc.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Document</span>
                        </a>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Added: {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                        {doc.updatedAt !== doc.createdAt && (
                          <p className="text-xs text-gray-500">
                            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500">
                    Documents in this category will appear here when they're added.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {totalDocuments === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No documents available</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your team documents will appear here once they're added by the admin. 
              Check back soon for updates!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamView;