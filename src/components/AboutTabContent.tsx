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
    const listStyle: React.CSSProperties = {
        listStyle: 'none',
        padding: 0,
        marginTop: '15px',
        fontSize: '1em',
    };
    const listItemStyle: React.CSSProperties = {
        marginBottom: '10px',
        color: '#777',
    };
    const emojiStyle: React.CSSProperties = {
        marginRight: '10px',
        fontSize: '1.2em',
    };

    return (
        <div style={containerStyle}>
            <h2 style={headingStyle}>About This Project</h2>
            <p style={paragraphStyle}>
                Well, this was an adventure... Let&#39;s just say some roads were less traveled (for good reason).
            </p>
            <p style={paragraphStyle}>
                Previous failed attempts to maintain character and engineering integrity included:
            </p>
            <ul style={listStyle}>
                <li style={listItemStyle}>
                    <span style={emojiStyle}>🧱</span> persist in using Assembler instead of Basic <span style={{color: 'red', fontWeight: 'bold'}}>(Epic Fail)</span>
                </li>
                <li style={listItemStyle}>
                    <span style={emojiStyle}>🖱️</span> don't use new Windows GUI, use DOS Visual Pascal instead <span style={{color: 'orange', fontWeight: 'bold'}}>(Nope)</span>
                </li>
                <li style={listItemStyle}>
                    <span style={emojiStyle}>😵‍💫</span> C is real deal, C++ is for wimps <span style={{color: 'brown', fontWeight: 'bold'}}>(Abandon Ship!)</span>
                </li>
            </ul>
            <p style={paragraphStyle}>
                {'Lesson learned!'} <span style={{fontSize: '1.5em'}}>😅</span>
            </p>
        </div>
    );
} 