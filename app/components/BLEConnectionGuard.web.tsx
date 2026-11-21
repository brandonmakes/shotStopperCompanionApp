// Web-specific BLEConnectionGuard - skips native BLE initialization
import React from 'react';
import { BLEConnectionProvider } from '../contexts/BLEConnectionContext';

interface BLEConnectionGuardProps {
    children: React.ReactNode;
}

// On web, just render children immediately with mock BLE context
export default function BLEConnectionGuard({ children }: BLEConnectionGuardProps) {
    return (
        <BLEConnectionProvider>
            {children}
        </BLEConnectionProvider>
    );
}
