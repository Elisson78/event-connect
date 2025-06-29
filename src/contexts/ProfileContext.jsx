import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ProfileContext = createContext({ profile: null, loading: true, refetchProfile: async () => {} });

export const ProfileProvider = ({ children }) => {
    const { user, loading: authLoading, fetchUserDetails } = useAuth();

    const refetchProfile = useCallback(async () => {
        if (user) {
            await fetchUserDetails(user);
        }
    }, [user, fetchUserDetails]);

    const value = useMemo(() => ({
        profile: user,
        loading: authLoading,
        refetchProfile
    }), [user, authLoading, refetchProfile]);

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};