'use client';

import React from 'react';

export default function AboutTabContent() {
    // Basic styles (can be moved to CSS later)
    const containerStyle: React.CSSProperties = {
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        color: '#333',
    };
    const headingStyle: React.CSSProperties = {
        color: '#007bff',
        marginBottom: '25px',
    };
    const paragraphStyle: React.CSSProperties = {
        fontSize: '1.1em',
        color: '#555',
        marginBottom: '20px',
        lineHeight: 1.6,
    };

    return (
        <div style={containerStyle}>
            <h2 style={headingStyle}>About This Project</h2>
            <p style={paragraphStyle}>
                Well, this was an adventure... Let&#39;s just say some roads were less traveled (for good reason).
            </p>
            <p style={paragraphStyle}>
                Previous attempts to maintain character and engineering integrity failed !
            </p>
        </div>
    );
} 