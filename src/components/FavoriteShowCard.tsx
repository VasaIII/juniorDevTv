'use client';

import React from 'react';
import { Show } from '@/lib/tvmaze'; // Assuming Show type is exported from here

interface FavoriteShowCardProps {
    show: Show;
}

export default function FavoriteShowCard({ show }: FavoriteShowCardProps) {
    return (
        <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            {show.image?.medium && (
                <img src={show.image.medium} alt={show.name} style={{ marginRight: '15px', width: '60px', height: 'auto' }}/>
            )}
            <div style={{ flexGrow: 1 }}>
                <strong style={{ fontSize: '1.1em' }}>{show.name}</strong>
                {show.network?.name && <span style={{ fontSize: '0.9em', color: '#555' }}> ({show.network.name})</span>}
                <br />
                {show.genres?.length > 0 && <span style={{ fontSize: '0.9em' }}>Genres: {show.genres.join(', ')}<br/></span>}
                {show.status && <span style={{ fontSize: '0.9em' }}>Status: {show.status}<br/></span>}
                {show.summary && (
                    <p style={{ fontSize: '0.9em', color: '#555', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: show.summary.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' }} />
                )}
                {show.officialSite && 
                    <a href={show.officialSite} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.9em'}}>Official Site</a>
                }
            </div>
        </li>
    );
} 