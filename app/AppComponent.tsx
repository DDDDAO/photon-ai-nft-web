'use client'
import React from 'react';
import {TonConnectUIProvider} from '@tonconnect/ui-react';

export default function AppComponent({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <TonConnectUIProvider manifestUrl="http://localhost:3001/tonconnect-manifest.json">
            {children}
        </TonConnectUIProvider>
    )
}