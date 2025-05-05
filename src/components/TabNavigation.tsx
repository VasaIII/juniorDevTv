'use client';

import React from 'react';

export type Tab = 'shows' | 'favorites' | 'about';

interface TabNavigationProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    favoriteCount: number; // Pass count for display
}

export default function TabNavigation({ activeTab, setActiveTab, favoriteCount }: TabNavigationProps) {
    
    // Style function remains internal or could be imported from a shared styles file
    const tabButtonStyle = (tabName: Tab) => ({
        padding: '10px 15px', 
        border: 'none',
        background: activeTab === tabName ? '#007bff' : '#eee',
        color: activeTab === tabName ? 'white' : 'black',
        cursor: 'pointer',
        marginRight: '5px',
        borderRadius: '5px 5px 0 0',
        fontWeight: activeTab === tabName ? 'bold' : 'normal' as 'bold' | 'normal'
    });

    return (
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #ccc' }}>
           <button style={tabButtonStyle('shows')} onClick={() => setActiveTab('shows')}>
            Shows
          </button>
          <button style={tabButtonStyle('favorites')} onClick={() => setActiveTab('favorites')}>
            Favorites {favoriteCount > 0 ? `(${favoriteCount})` : ''}
          </button>
          <button style={tabButtonStyle('about')} onClick={() => setActiveTab('about')}>
            About
          </button>
        </div>
    );
} 