import { useRouter } from 'expo-router';
import React from 'react';

export default function Results() {
    const router = useRouter();

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <button
                onClick={() => router.replace('/(tabs)/menu')}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                }}
            >
                ←
            </button>
            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px' }}>
                Working on it...
            </div>
        </div>
    );
}