import React, { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export function useSubscription() {
    return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }) {
    // Default to false (Free Tier) for testing the upgrade flow
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking entitlement (e.g., from RevenueCat or Stripe)
        const checkSubscription = async () => {
            // For now, we simulate a delay and default to Free
            // In a real app, we'd check an API or localStorage cache
            const hasPro = localStorage.getItem('is_pro_user') === 'true';
            setIsPro(hasPro);
            setLoading(false);
        };

        checkSubscription();
    }, []);

    const upgradeToPro = () => {
        setIsPro(true);
        localStorage.setItem('is_pro_user', 'true');
    };

    const downgradeToFree = () => {
        setIsPro(false);
        localStorage.setItem('is_pro_user', 'false');
    };

    return (
        <SubscriptionContext.Provider value={{ isPro, loading, upgradeToPro, downgradeToFree }}>
            {children}
        </SubscriptionContext.Provider>
    );
}
