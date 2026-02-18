// hooks/use-device-detection.ts
'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
    type: DeviceType;
    orientation: Orientation;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    screenWidth: number;
    screenHeight: number;
}

// Breakpoints following iOS Human Interface Guidelines
const BREAKPOINTS = {
    mobile: 768,     // < 768px
    tablet: 1024,    // 768px - 1024px
    desktop: 1024,   // > 1024px
};

export function useDeviceDetection(): DeviceInfo {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
        // SSR-safe initial state
        if (typeof window === 'undefined') {
            return {
                type: 'desktop',
                orientation: 'landscape',
                isMobile: false,
                isTablet: false,
                isDesktop: true,
                isTouchDevice: false,
                screenWidth: 1920,
                screenHeight: 1080,
            };
        }

        return detectDevice();
    });

    useEffect(() => {
        // Initial detection
        setDeviceInfo(detectDevice());

        // Listen for resize and orientation changes
        const handleResize = () => {
            setDeviceInfo(detectDevice());
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return deviceInfo;
}

function detectDevice(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect device type based on screen width
    let type: DeviceType;
    if (width < BREAKPOINTS.mobile) {
        type = 'mobile';
    } else if (width < BREAKPOINTS.desktop) {
        type = 'tablet';
    } else {
        type = 'desktop';
    }

    // Detect orientation
    const orientation: Orientation = width > height ? 'landscape' : 'portrait';

    // Detect touch capability
    const isTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - IE11 compatibility
        navigator.msMaxTouchPoints > 0;

    return {
        type,
        orientation,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
    };
}

// Utility hook for conditional rendering based on device type
export function useIsMobile(): boolean {
    const { isMobile } = useDeviceDetection();
    return isMobile;
}

export function useIsTablet(): boolean {
    const { isTablet } = useDeviceDetection();
    return isTablet;
}

export function useIsDesktop(): boolean {
    const { isDesktop } = useDeviceDetection();
    return isDesktop;
}

export function useIsTouchDevice(): boolean {
    const { isTouchDevice } = useDeviceDetection();
    return isTouchDevice;
}
